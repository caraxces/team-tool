import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getTasksByProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const tasks = await taskService.getTasksByProjectId(projectId);
    res.status(200).json({ status: 'success', data: { tasks } });
  } catch (err) {
    next(err);
  }
};

export const createTaskHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const task = await taskService.createTask(req.body, userId);
    res.status(201).json({ status: 'success', data: { task } });
  } catch (err) {
    next(err);
  }
};

export const updateTaskHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const task = await taskService.updateTask(taskId, req.body);
    res.status(200).json({ status: 'success', data: { task } });
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatusHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const { status } = req.body;
        const task = await taskService.updateTaskStatus(taskId, status);
        res.status(200).json({ status: 'success', data: { task } });
    } catch (err) {
        next(err);
    }
};

export async function deleteTaskHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const taskId = parseInt(req.params.id, 10);
    const userId = req.user!.id; // Get user ID from authenticated request

    try {
        const success = await taskService.deleteTask(taskId, userId);
        if (!success) {
            return res.status(404).json({ success: false, message: 'Task not found or you do not have permission to delete it.' });
        }
        res.status(200).json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export const getAllTasksHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
};

export const getMyTasksHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const tasks = await taskService.getMyTasks(userId);
    res.status(200).json({
      status: 'success',
      data: {
        tasks,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export async function getTaskCsvTemplateHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const csvHeader = '"title","description","project_uuid","assignee_email","due_date","priority","status"';
        const csvExample = '"My New Task","Detailed description here","project-uuid-123","member@example.com","2024-12-31","high","todo"';
        const csvContent = `${csvHeader}\n${csvExample}`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks-template.csv');
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
}

export async function importTasksFromCsvHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const fileContent = req.file.buffer.toString('utf8');
        const reporterId = req.user.id;

        const result = await taskService.importTasksFromCsv(fileContent, reporterId);

        res.status(201).json({
            success: true,
            message: `CSV processed. ${result.successful} tasks created, ${result.failed} failed.`,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export const getTaskStatsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const stats = await taskService.getTaskStatsForUser(userId);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
}; 