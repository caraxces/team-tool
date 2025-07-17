import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as taskService from '../services/task.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getTasksByProjectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = req.params.projectId;
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        const tasks = await taskService.getTasksByProjectId(projectId);
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
};

export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const taskData = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const task = await taskService.createTask(taskData, userId);
        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
};

export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskId = req.params.taskId;
        const status = req.body.status;
        if (!taskId || !status) {
            return res.status(400).json({ message: 'Task ID and status are required' });
        }
        const updatedTask = await taskService.updateTaskStatus(taskId, status);
        res.status(200).json(updatedTask);
    } catch (error) {
        next(error);
    }
};

export const getMyTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            // This should theoretically not be reached if authenticate middleware is working
            return res.status(401).json({ message: 'Authentication required' });
        }
        const tasks = await taskService.getMyTasks(userId);
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
}; 