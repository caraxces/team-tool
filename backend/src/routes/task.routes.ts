import express from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createTaskValidatorMiddleware, updateTaskStatusValidatorMiddleware } from '../validators/task.validator';

const router = express.Router();

// Lấy tất cả task của một project
router.get('/project/:projectId', authenticate, taskController.getTasksByProjectId);

// Tạo một task mới
router.post('/', authenticate, createTaskValidatorMiddleware, taskController.createTask);

// Cập nhật trạng thái của một task
router.put('/:taskId/status', authenticate, updateTaskStatusValidatorMiddleware, taskController.updateTaskStatus);

// Lấy tất cả task được gán cho user hiện tại
router.get('/my-tasks', authenticate, taskController.getMyTasks);

export default router; 