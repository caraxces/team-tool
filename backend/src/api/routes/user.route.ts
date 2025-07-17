import { Router } from 'express';
import {
  getAllUsersHandler,
  getMeHandler,
  getUserTeamsHandler,
  updateUserRoleHandler,
  updateMyProfileHandler,
  uploadAvatarHandler
} from '../controllers/user.controller';
import { 
  requestPasswordChangeHandler, 
  changePasswordHandler 
} from '../controllers/auth.controller'; // Note: putting in auth controller
import { protect, adminOnly } from '../middlewares/auth.middleware';
import { uploadAvatar } from '../middlewares/upload.middleware';

const router = Router();

// This is a protected route, it requires a valid token.
router.get('/me', protect, getMeHandler);
router.patch('/me/profile', protect, updateMyProfileHandler);
router.put('/me/avatar', protect, uploadAvatar.single('avatar'), uploadAvatarHandler);
router.get('/me/teams', protect, getUserTeamsHandler);

// Password change flow
router.post('/me/request-password-change', protect, requestPasswordChangeHandler);
router.post('/me/change-password', protect, changePasswordHandler);


// Allow all authenticated users to get the user list for mentions, assignments etc.
router.get('/', protect, getAllUsersHandler);

// This route is for admins only.
router.put('/:id/role', protect, adminOnly, updateUserRoleHandler);

export default router; 