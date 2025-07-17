import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as userService from '../services/user.service';
import * as teamService from '../services/team.service';

export const getMeHandler = (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated.' });
    } else {
        res.status(200).json({ success: true, data: { user: req.user }});
    }
};

export const getAllUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

export const updateUserRoleHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userIdToUpdate = parseInt(req.params.userId, 10);
        const { roleId } = req.body;

        if (!roleId) {
            return res.status(400).json({ message: 'Role ID is required.' });
        }
        
        await userService.updateUserRole(userIdToUpdate, roleId);
        
        // No need to check for return value, service throws on error
        const updatedUser = await userService.findUserById(userIdToUpdate);

        res.status(200).json({
            success: true,
            message: 'User role updated successfully.',
            data: { user: updatedUser }
        });
    } catch (error) {
        next(error);
    }
};

export const getUsersByProjectIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.projectId, 10);
        const users = await userService.getUsersByProjectId(projectId);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

export const updateMyProfileHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const { fullName } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!fullName || typeof fullName !== 'string') {
            return res.status(400).json({ message: 'Full name is required and must be a string.' });
        }
        
        await userService.updateMyProfile(userId, { fullName });

        // No need to check for return value, service throws on error
        const updatedUser = await userService.findUserById(userId);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        next(error);
    }
};

export const getUserTeamsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const teams = await teamService.getTeamsByUserId(userId);
        res.status(200).json({ success: true, data: { teams } });
    } catch (error) {
        next(error);
    }
}; 

export const uploadAvatarHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const avatarUrl = `/public/uploads/avatars/${req.file.filename}`;

        const updatedUser = await userService.updateAvatar(userId, avatarUrl);

        res.status(200).json({ success: true, data: { user: updatedUser } });
    } catch (error) {
        next(error);
    }
}; 