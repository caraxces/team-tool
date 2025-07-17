import { Request, Response, NextFunction } from 'express';
import * as roleService from '../services/role.service';

export const getRolesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await roleService.getRoles();
        res.status(200).json({
            success: true,
            data: roles,
        });
    } catch (error) {
        next(error);
    }
}; 