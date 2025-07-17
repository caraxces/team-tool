import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as settingsService from '../services/settings.service';

export const saveGA4SettingsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Assuming teamId is part of the URL or body, for this example we get it from authenticated user's context
        // In a real app, you'd probably select a team first. Let's assume a 'current_team_id' on user for now.
        // This should be adapted based on your actual team management logic.
        const teamId = req.body.team_id; // Or from a different source
        if (!teamId) {
            return res.status(400).json({ message: 'Team ID is required.' });
        }
        
        let service_account_credentials_json;

        if (req.file) { // If a file is uploaded
            service_account_credentials_json = req.file.buffer.toString('utf8');
        } else if (req.body.service_account_credentials_json) { // Or if raw JSON is passed
             service_account_credentials_json = req.body.service_account_credentials_json;
        } else {
            return res.status(400).json({ message: 'Service account credentials are required (either as a file or JSON string).' });
        }

        const settings: settingsService.GA4SettingsInput = {
            team_id: parseInt(teamId, 10),
            ga4_property_id: req.body.ga4_property_id,
            measurement_id: req.body.measurement_id,
            api_secret: req.body.api_secret,
            service_account_credentials_json
        };

        await settingsService.saveGA4Settings(settings);

        res.status(200).json({ success: true, message: 'GA4 settings saved successfully.' });
    } catch (error) {
        next(error);
    }
};

export const getGA4SettingsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const teamId = req.query.team_id;
        if (!teamId) {
            return res.status(400).json({ message: 'Team ID is required.' });
        }
        
        const settings = await settingsService.getGA4Settings(parseInt(teamId as string, 10));

        if (!settings) {
            return res.status(404).json({ success: false, message: 'GA4 settings not found for this team.' });
        }

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
}; 