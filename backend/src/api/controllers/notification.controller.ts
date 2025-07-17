import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as notificationService from '../services/notification.service';

/**
 * @route   GET /api/notifications
 * @desc    Lấy danh sách thông báo của user hiện tại
 * @access  Protected
 */
export const getUserNotificationsHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const includeRead = req.query.include_read !== 'false';

        const result = await notificationService.getUserNotifications(
            req.user.id,
            page,
            limit,
            includeRead
        );

        res.status(200).json({
            success: true,
            data: {
                notifications: result.notifications,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(result.total / limit),
                    total_count: result.total,
                    limit: limit
                },
                unread_count: result.unread_count
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Lấy số lượng thông báo chưa đọc
 * @access  Protected
 */
export const getUnreadCountHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        const count = await notificationService.getUnreadNotificationCount(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                unread_count: count
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Đánh dấu thông báo đã đọc
 * @access  Protected
 */
export const markNotificationAsReadHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        const notificationId = parseInt(req.params.id);
        if (isNaN(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        await notificationService.markNotificationAsRead(notificationId, req.user.id);

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or already read'
            });
        }
        next(error);
    }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Đánh dấu tất cả thông báo đã đọc
 * @access  Protected
 */
export const markAllNotificationsAsReadHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        await notificationService.markAllNotificationsAsRead(req.user.id);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Xóa thông báo
 * @access  Protected
 */
export const deleteNotificationHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        const notificationId = parseInt(req.params.id);
        if (isNaN(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        await notificationService.deleteUserNotification(notificationId, req.user.id);

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        next(error);
    }
};

/**
 * @route   POST /api/notifications
 * @desc    Tạo thông báo mới (chỉ admin hoặc system)
 * @access  Protected (Admin only)
 */
export const createNotificationHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        // Chỉ admin mới được tạo thông báo thủ công
        if (req.user.role_id !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Admin role required'
            });
        }

        const {
            type,
            title,
            message,
            action_url,
            metadata,
            user_ids,
            expires_at
        } = req.body;

        // Validation
        if (!type || !title || !message || !user_ids || !Array.isArray(user_ids)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: type, title, message, user_ids'
            });
        }

        const notificationId = await notificationService.createNotification({
            type,
            title,
            message,
            action_url,
            metadata,
            sender_id: req.user.id,
            user_ids,
            expires_at: expires_at ? new Date(expires_at) : undefined
        });

        res.status(201).json({
            success: true,
            data: {
                notification_id: notificationId
            },
            message: 'Notification created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/notifications/settings
 * @desc    Lấy cài đặt thông báo của user
 * @access  Protected
 */
export const getUserNotificationSettingsHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        const settings = await notificationService.getUserNotificationSettings(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                settings
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PATCH /api/notifications/settings/:typeId
 * @desc    Cập nhật cài đặt thông báo
 * @access  Protected
 */
export const updateNotificationSettingsHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        const typeId = parseInt(req.params.typeId);
        if (isNaN(typeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification type ID'
            });
        }

        const { is_enabled, email_enabled, push_enabled } = req.body;

        await notificationService.updateUserNotificationSettings(
            req.user.id,
            typeId,
            { is_enabled, email_enabled, push_enabled }
        );

        res.status(200).json({
            success: true,
            message: 'Notification settings updated'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/notifications/types
 * @desc    Lấy tất cả loại thông báo
 * @access  Protected
 */
export const getNotificationTypesHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User not found' 
            });
        }

        const types = await notificationService.getNotificationTypes();

        res.status(200).json({
            success: true,
            data: {
                types
            }
        });
    } catch (error) {
        next(error);
    }
}; 

export const getUnreadMessageCounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const counts = await notificationService.getUnreadMessageCountsBySender(userId);
        res.status(200).json({
            success: true,
            data: counts
        });
    } catch (error) {
        next(error);
    }
};

export const markSenderMessagesAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const senderId = parseInt(req.params.senderId, 10);
        if (isNaN(senderId)) {
            return res.status(400).json({ success: false, message: 'Invalid sender ID' });
        }
        await notificationService.markMessagesAsReadFromSender(userId, senderId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}; 