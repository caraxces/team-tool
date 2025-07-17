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