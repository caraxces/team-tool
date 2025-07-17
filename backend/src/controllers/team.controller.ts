import { Response, NextFunction } from 'express';
import * as teamService from '../services/team.service';
import { AuthenticatedRequest } from '../api/middlewares/auth.middleware';

/**
 * Lấy danh sách các team của user đã đăng nhập.
 */
export const getUserTeams = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        const teams = await teamService.getTeamsByUserId(userId);
        res.status(200).json({ data: { teams } });
    } catch (error) {
        next(error);
    }
};

/**
 * Lấy danh sách thành viên của một team.
 */
export const getTeamMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { teamId } = req.params;
        if (!teamId) {
            return res.status(400).json({ message: 'Team ID is required.' });
        }
        const members = await teamService.getTeamMembers(parseInt(teamId, 10));
        res.status(200).json({ data: { members } });
    } catch (error) {
        next(error);
    }
};

/**
 * Mời một thành viên mới vào team.
 */
export const inviteMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;

        if (!teamId || !userId) {
            return res.status(400).json({ message: 'Team ID and User ID are required.' });
        }

        // Optional: Add logic to check if the inviting user has permission (e.g., is an admin)

        const result = await teamService.inviteUserToTeam(parseInt(teamId, 10), userId);
        res.status(201).json({ message: 'User invited successfully.', data: result });
    } catch (error: any) {
        if (error.message === 'User is already in this team.') {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Tạo một team mới.
 */
export const createNewTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const { name, description } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Team name is required.' });
        }

        const team = await teamService.createTeam(name, description || null, userId);
        res.status(201).json({ data: { team } });
    } catch (error) {
        next(error);
    }
}; 