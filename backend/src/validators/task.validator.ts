import { z } from 'zod';

const statusEnum = z.enum(['todo', 'in_progress', 'in_review', 'done']);
const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.number(),
    parentTaskId: z.number().optional().nullable(),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    status: statusEnum.default('todo'),
    priority: priorityEnum.default('medium'),
    assigneeId: z.number().optional().nullable(),
    dueDate: z.string().optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assigneeId: z.number().optional().nullable(),
    dueDate: z.string().optional().nullable(),
  }),
});

export const updateTaskStatusSchema = z.object({
    body: z.object({
        status: statusEnum,
    }),
});

// Aliases for backward compatibility
export const createTaskValidator = createTaskSchema;
export const updateTaskStatusValidator = updateTaskStatusSchema;

// Middleware functions for Express
import { Request, Response, NextFunction } from 'express';

export const createTaskValidatorMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        createTaskSchema.parse({ body: req.body });
        next();
    } catch (error) {
        res.status(400).json({ error: 'Validation failed', details: error });
    }
};

export const updateTaskStatusValidatorMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        updateTaskStatusSchema.parse({ body: req.body });
        next();
    } catch (error) {
        res.status(400).json({ error: 'Validation failed', details: error });
    }
}; 