import { Router, Request, Response, NextFunction } from 'express';
import { protect, AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as taskController from '../controllers/task.controller';
import { validate } from '../middlewares/validate.middleware';
import * as taskValidator from '../validators/task.validator';
import pool from '../../config/database';
import { uploadCsv } from '../middlewares/upload.middleware';

const router = Router();

router.use(protect);

// Route for mention suggestions
router.get('/for-mentions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        // Fetch tasks from projects where the user is a member
        const [rows] = await pool.query<any[]>(`
            SELECT t.uuid as id, CONCAT(t.title, ' (#', t.id, ')') as display FROM tasks t
            INNER JOIN projects p ON t.project_id = p.id
            INNER JOIN team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = ?
            ORDER BY t.title ASC
        `, [userId]);
        res.status(200).json({ success: true, data: { tasks: rows } });
    } catch (error) {
        next(error);
    }
});

router.get('/', taskController.getAllTasksHandler);
router.get('/stats', taskController.getTaskStatsHandler);
router.get('/my-tasks', taskController.getMyTasksHandler);
router.get('/project/:projectId', taskController.getTasksByProjectHandler);
router.post('/', validate(taskValidator.createTaskSchema), taskController.createTaskHandler);
router.put('/:id', validate(taskValidator.updateTaskSchema), taskController.updateTaskHandler);
router.patch('/:id/status', validate(taskValidator.updateTaskStatusSchema), taskController.updateTaskStatusHandler);
router.delete('/:id', taskController.deleteTaskHandler);

// CSV Template and Import
router.get('/csv-template', taskController.getTaskCsvTemplateHandler);
router.post('/import', uploadCsv.single('file'), taskController.importTasksFromCsvHandler);

export default router; 