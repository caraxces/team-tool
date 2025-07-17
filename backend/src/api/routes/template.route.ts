import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import {
    createTemplateHandler,
    deleteTemplateHandler,
    getTemplateByIdHandler,
    getTemplatesHandler,
    updateTemplateHandler,
    generateFromTemplateHandler
} from '../controllers/template.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(protect);

// Route for managers to generate projects from a template
router.post('/:id/generate', checkRole([1, 2, 4]), generateFromTemplateHandler);

// Routes for listing/viewing templates (Admins and Managers)
router.get('/', checkRole([1, 2, 4]), getTemplatesHandler);
router.get('/:id', checkRole([1, 2, 4]), getTemplateByIdHandler);

// Routes for creating, updating, and deleting templates (Admins only)
router.post('/', checkRole([1]), createTemplateHandler);
router.put('/:id', checkRole([1]), updateTemplateHandler);
router.delete('/:id', checkRole([1]), deleteTemplateHandler);

export default router; 