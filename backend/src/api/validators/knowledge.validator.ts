import { z } from 'zod';

export const createKnowledgeItemSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    link: z.string().url('Must be a valid URL'),
    description: z.string().optional(),
    assigneeId: z.coerce.number().optional().nullable(),
  }),
}); 