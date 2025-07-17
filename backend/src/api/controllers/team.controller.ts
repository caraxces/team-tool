import { Response, NextFunction, Request } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as teamService from '../services/team.service';

export const getMyTeamsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const teams = await teamService.getTeamsByUserId(userId);
        res.status(200).json({ success: true, data: { teams } });
    } catch (error) { next(error); }
};

export const createTeamHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { name, description } = req.body;
        const userId = req.user!.id;
        const newTeam = await teamService.createTeam(name, description, userId);
        res.status(201).json({ success: true, data: { team: newTeam } });
    } catch (error) { next(error); }
};

export const getTeamMembersHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { teamId } = req.params;
        const members = await teamService.getTeamMembers(parseInt(teamId));
        res.status(200).json({ success: true, data: { members } });
    } catch (error) { next(error); }
};

export const inviteMemberHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;
        await teamService.inviteMemberToTeam(parseInt(teamId), userId);
        res.status(201).json({ success: true, message: 'Member invited successfully.' });
    } catch (error: any) {
        if (error.message === 'User is already in the team.') {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

export const getMemberCsvTemplateHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const csvHeader = '"email"';
        const csvExample = '"member1@example.com"\n"member2@example.com"';
        const csvContent = `${csvHeader}\n${csvExample}`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=members-template.csv');
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

export const importMembersHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
        
        const { teamId } = req.params;
        const fileContent = req.file.buffer.toString('utf8');
        const result = await teamService.importMembersFromCsv(fileContent, parseInt(teamId));

        res.status(201).json({
            success: true,
            message: `CSV processed. ${result.successful} members invited, ${result.failed} failed.`,
            data: result
        });
    } catch (error) {
        next(error);
    }
}; 