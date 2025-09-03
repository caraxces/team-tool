import { Router, Request, Response, NextFunction } from 'express';
import { protect, AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  getAllProjectsHandler,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  getProjectCsvTemplateHandler,
  importProjectsFromCsvHandler,
  getProjectDetailsHandler,
  createOrUpdateProjectDetailsHandler
} from '../controllers/project.controller';
import { canEditProject, canEditProjectDetails } from '../middlewares/project.middleware';
import { getUsersByProjectIdHandler } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createProjectSchema } from '../validators/project.validator';
import pool from '../../config/database';
import { uploadCsv } from '../middlewares/upload.middleware';


const router = Router();

// All project routes will be protected
router.use(protect);

// Route for mention suggestions
router.get('/for-mentions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        // Fetch projects where the user is a member
        const [rows] = await pool.query<any[]>(`
            SELECT p.uuid as id, p.name as display FROM projects p
            JOIN team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = ?
            ORDER BY p.name ASC
        `, [userId]);
        res.status(200).json({ success: true, data: { projects: rows } });
    } catch (error) {
        next(error);
    }
});


router.get('/', getAllProjectsHandler);
router.post('/', validate(createProjectSchema), createProjectHandler);

// Add UPDATE and DELETE routes
router.put('/:id', canEditProject, updateProjectHandler); // We should add validation here later
router.delete('/:id', canEditProject, deleteProjectHandler);

// Project Details routes
router.get('/:id/details', getProjectDetailsHandler);
router.put('/:id/details', canEditProjectDetails, createOrUpdateProjectDetailsHandler);

// Route to get users for a specific project
router.get('/:projectId/users', getUsersByProjectIdHandler);

// CSV Template and Import
router.get('/csv-template', getProjectCsvTemplateHandler);
router.post('/import', uploadCsv.single('file'), importProjectsFromCsvHandler);

export default router; 