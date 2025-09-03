import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Project name is required',
    }).min(3, 'Project name must be at least 3 characters long'),
    description: z.string().optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format, should be YYYY-MM-DD",
    }).optional(),
  }),
}); 