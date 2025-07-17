import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import { RowDataPacket } from 'mysql2';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role_id: number;
    };
}

// Helper function to check if a user is the PIC of a project
const isProjectPIC = async (userId: number, projectId: number): Promise<boolean> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT pic_id FROM projects WHERE id = ?',
        [projectId]
    );
    return rows.length > 0 && rows[0].pic_id === userId;
};


/**
 * Middleware to check if the user has permission to edit a project.
 * Admins (role 1) can edit any project.
 * Managers and PICs (roles 2, 4) can only edit projects they are the PIC of.
 */
export const canEditProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const projectId = parseInt(req.params.id, 10);

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (isNaN(projectId)) {
            return res.status(400).json({ message: 'Invalid project ID' });
        }

        // Admin has universal edit rights
        if (user.role_id === 1) {
            return next();
        }

        // Roles 2 and 4 can edit if they are the PIC
        if (user.role_id === 2 || user.role_id === 4) {
            const isPIC = await isProjectPIC(user.id, projectId);
            if (isPIC) {
                return next();
            }
        }
        
        // If none of the above, access is denied
        return res.status(403).json({ message: 'You do not have permission to modify this project' });

    } catch (error) {
        console.error("Error in canEditProject middleware:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Middleware to check if the user can edit project *details*.
 * Admins (role 1) can edit any project details.
 * Managers (role 2) can only edit details for projects they are the PIC of.
 * Role 4 and others CANNOT edit details.
 */
export const canEditProjectDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const projectId = parseInt(req.params.id, 10);

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (isNaN(projectId)) {
            return res.status(400).json({ message: 'Invalid project ID' });
        }

        // Admin has universal edit rights
        if (user.role_id === 1) {
            return next();
        }
        
        // Role 2 and 4 can edit if they are the PIC
        if (user.role_id === 2 || user.role_id === 4) {
             const isPIC = await isProjectPIC(user.id, projectId);
            if (isPIC) {
                return next();
            }
        }

        // If none of the above, access is denied
        return res.status(403).json({ message: 'You do not have permission to modify these project details' });

    } catch (error) {
        console.error("Error in canEditProjectDetails middleware:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}; 