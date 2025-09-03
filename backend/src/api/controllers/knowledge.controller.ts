import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as knowledgeService from '../services/knowledge.service';

export const getAllKnowledgeItemsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }
        const items = await knowledgeService.getAllKnowledgeItems(req.user);
        res.status(200).json({
            status: 'success',
            data: {
                items,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const createKnowledgeItemHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const newItem = await knowledgeService.createKnowledgeItem(req.body, userId);
        res.status(201).json({
            status: 'success',
            data: {
                item: newItem,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const updateKnowledgeItemStatusHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const itemId = parseInt(req.params.id, 10);
        const updatedItem = await knowledgeService.updateKnowledgeItemStatus(itemId, userId);
        res.status(200).json({
            status: 'success',
            data: {
                item: updatedItem,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const deleteKnowledgeItemHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const itemId = parseInt(req.params.id, 10);
        await knowledgeService.deleteKnowledgeItem(itemId, userId);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}; 