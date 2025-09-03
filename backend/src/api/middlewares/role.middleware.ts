import { Request, Response, NextFunction } from 'express';

// This middleware checks if the user's role is included in the list of allowed roles.
export const checkRole = (allowedRoles: number[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        const userRole = req.user?.role_id;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to perform this action." });
        }

        next();
    };
}; 