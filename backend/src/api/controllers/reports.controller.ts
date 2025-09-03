import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as reportsService from '../services/reports.service';
import { z } from 'zod';

// Zod schema for query parameter validation
const getReportQuerySchema = z.object({
    team_id: z.string().regex(/^\d+$/, { message: "Team ID must be a number." }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Start date must be in YYYY-MM-DD format." }),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "End date must be in YYYY-MM-DD format." }),
});

export const getGA4ReportHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Validate query parameters
        const queryParams = getReportQuerySchema.parse(req.query);
        const { team_id, startDate, endDate } = queryParams;

        const reportData = await reportsService.getGA4Report(parseInt(team_id, 10), startDate, endDate);

        res.status(200).json({ success: true, data: reportData });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Invalid query parameters.', errors: error.errors });
        }
        // Handle specific business logic errors from the service
        if (error.message === 'GA4 settings not configured for this team.') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes('Invalid request') || error.message.includes('Permission denied')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        // For all other errors, pass to the generic error handler
        next(error);
    }
}; 