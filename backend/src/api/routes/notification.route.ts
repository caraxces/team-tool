import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

// Áp dụng middleware `protect` cho tất cả các route bên dưới
router.use(protect);

// Routes cho Notifications
router.get('/', notificationController.getUserNotificationsHandler);
router.get('/unread-count', notificationController.getUnreadCountHandler);
router.put('/read-all', notificationController.markAllNotificationsAsReadHandler);
router.put('/:id/read', notificationController.markNotificationAsReadHandler);
router.delete('/:id', notificationController.deleteNotificationHandler);

// Routes cho Notification Settings
router.get('/settings', notificationController.getUserNotificationSettingsHandler);
router.put('/settings', notificationController.updateNotificationSettingsHandler); // Giả sử client gửi toàn bộ object settings
router.get('/types', notificationController.getNotificationTypesHandler);

// Routes cho Chat-related Notifications
router.get('/unread-counts/by-sender', notificationController.getUnreadMessageCounts);
router.post('/mark-as-read/by-sender/:senderId', notificationController.markSenderMessagesAsRead);

export default router;