import express from 'express';
import * as teamController from '../controllers/team.controller';
import { protect } from '../api/middlewares/auth.middleware';

const router = express.Router();

// Lấy tất cả các team của user hiện tại
router.get('/', protect, teamController.getUserTeams);

// Tạo một team mới
router.post('/', protect, teamController.createNewTeam);

export default router; 