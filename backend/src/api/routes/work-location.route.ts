import { Router } from 'express';
import {
    getLocationsHandler,
    createLocationHandler,
    updateLocationHandler,
    deleteLocationHandler
} from '../controllers/work-location.controller';
import { protect, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

// All routes in this file are for admins only
// router.use(protect, adminOnly); // Apply middleware individually instead

router.get('/', protect, adminOnly, getLocationsHandler);
router.post('/', protect, adminOnly, createLocationHandler);
router.put('/:id', protect, adminOnly, updateLocationHandler);
router.delete('/:id', protect, adminOnly, deleteLocationHandler);

export default router; 