import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getGA4ReportHandler } from '../controllers/reports.controller';

const router = Router();

// All reports routes are protected
router.use(protect);

router.get('/ga4', getGA4ReportHandler);

export default router; 