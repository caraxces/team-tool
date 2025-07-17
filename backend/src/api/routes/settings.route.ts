import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { saveGA4SettingsHandler, getGA4SettingsHandler } from '../controllers/settings.controller';
import { uploadJson } from '../middlewares/upload.middleware';

const router = Router();

// All settings routes are protected
router.use(protect);

// Route to get GA4 settings for a specific team
router.get('/ga4', getGA4SettingsHandler);

// Route to save GA4 settings, accepts a JSON file upload for service account credentials
router.post('/ga4', uploadJson.single('service_account_file'), saveGA4SettingsHandler);

export default router; 