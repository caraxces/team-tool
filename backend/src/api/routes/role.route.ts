import { Router } from 'express';
import { getRolesHandler } from '../controllers/role.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// @route   GET /api/roles
// @desc    Get all available roles
// @access  Protected
router.get('/', protect, getRolesHandler);

export default router; 