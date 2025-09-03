import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as templateService from '../services/template.service';

export const createTemplateHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const template = await templateService.createTemplate(req.body, userId);
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
};

export const getTemplatesHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const templates = await templateService.getTemplates();
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        next(error);
    }
};

export const getTemplateByIdHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        const template = await templateService.getTemplateById(id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        res.status(200).json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
};

export const updateTemplateHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        const template = await templateService.updateTemplate(id, req.body);
        res.status(200).json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
};

export const deleteTemplateHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        await templateService.deleteTemplate(id);
        res.status(200).json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const generateFromTemplateHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const templateId = parseInt(req.params.id, 10);
        const userId = req.user!.id;
        // We can add validation for the body here using Zod or another validator
        const params = req.body;

        const result = await templateService.generateProjectsFromTemplate(templateId, params, userId);

        res.status(201).json({ success: true, message: 'Projects generated successfully', data: result });
    } catch (error) {
        next(error);
    }
}; 