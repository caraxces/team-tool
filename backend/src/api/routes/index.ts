import { Router } from 'express';
import authRoutes from './auth.route';
import projectRoutes from './project.route';
import taskRoutes from './task.route';
import teamRoutes from './team.route';
import userRoutes from './user.route';
import knowledgeRoutes from './knowledge.route';
import attendanceRoutes from './attendance.route';
import chatRoutes from './chat.route';
import workLocationRoutes from './work-location.route';
import roleRoutes from './role.route';
import settingsRoutes from './settings.route';
import quizRoutes from './quiz.route';
import templateRoutes from './template.route';
import meetingRoutes from './meeting.route';
import notificationRoutes from './notification.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/teams', teamRoutes);
router.use('/tasks', taskRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/chat', chatRoutes);
router.use('/work-locations', workLocationRoutes);
router.use('/roles', roleRoutes);
router.use('/settings', settingsRoutes);
router.use('/quizzes', quizRoutes);
router.use('/templates', templateRoutes);
router.use('/meetings', meetingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/requests', require('./request.route').default);

export default router; 