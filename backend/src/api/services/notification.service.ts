import pool from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateUUID } from '../utils/uuid.util';

export interface NotificationType {
    id: number;
    name: string;
    description: string;
}

export interface Notification {
    id: number;
    uuid: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    metadata: any;
    sender_id: number | null;
    sender_name: string;
    sender_avatar: string | null;
    user_id: number;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    expires_at: string | null;
}

export interface CreateNotificationPayload {
    type: string;
    title: string;
    message: string;
    action_url?: string;
    metadata?: any;
    sender_id?: number;
    user_ids: number[];
    expires_at?: Date;
}

export interface UserNotificationSettings {
    id: number;
    user_id: number;
    type_id: number;
    type_name: string;
    is_enabled: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
}

/**
 * Lấy tất cả thông báo của user (có phân trang)
 */
export const getUserNotifications = async (
    userId: number, 
    page: number = 1, 
    limit: number = 20,
    includeRead: boolean = true
): Promise<{ notifications: Notification[], total: number, unread_count: number }> => {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = ?';
    const queryParams: any[] = [userId];
    
    if (!includeRead) {
        whereClause += ' AND is_read = FALSE';
    }
    
    // Query để lấy notifications với phân trang
    const notificationsQuery = `
        SELECT * FROM user_notifications_view
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;
    
    // Query đếm tổng số
    const totalQuery = `
        SELECT COUNT(*) as total FROM user_notifications_view
        ${whereClause}
    `;
    
    // Query đếm số chưa đọc
    const unreadQuery = `
        SELECT COUNT(*) as unread_count FROM user_notifications_view
        WHERE user_id = ? AND is_read = FALSE
    `;
    
    try {
        const [notificationsResult] = await pool.query<(Notification & RowDataPacket)[]>(
            notificationsQuery, 
            [...queryParams, limit, offset]
        );
        
        const [totalResult] = await pool.query<RowDataPacket[]>(
            totalQuery, 
            queryParams
        );
        
        const [unreadResult] = await pool.query<RowDataPacket[]>(
            unreadQuery, 
            [userId]
        );
        
        return {
            notifications: notificationsResult,
            total: totalResult[0].total,
            unread_count: unreadResult[0].unread_count
        };
    } catch (error) {
        throw new Error(`Failed to get user notifications: ${error}`);
    }
};

/**
 * Tạo thông báo mới cho nhiều users
 */
export const createNotification = async (payload: CreateNotificationPayload): Promise<number> => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. Lấy type_id từ type_name
        const [typeResult] = await connection.query<RowDataPacket[]>(
            'SELECT id FROM notification_types WHERE type_name = ?',
            [payload.type]
        );
        
        if (typeResult.length === 0) {
            throw new Error('Invalid notification type');
        }
        
        const typeId = typeResult[0].id;
        
        // 2. Tạo notification
        const metadataJson = payload.metadata ? JSON.stringify(payload.metadata) : null;
        const [notificationResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO notifications (type_id, title, content, metadata, action_url, sender_id, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                typeId,
                payload.title,
                payload.message,
                metadataJson,
                payload.action_url || null,
                payload.sender_id || null,
                payload.expires_at || null
            ]
        );
        
        const notificationId = notificationResult.insertId;
        
        // 3. Thêm recipients
        if (payload.user_ids && payload.user_ids.length > 0) {
            const recipientValues = payload.user_ids.map(userId => [notificationId, userId]);
            await connection.query(
                'INSERT INTO notification_recipients (notification_id, user_id) VALUES ?',
                [recipientValues]
            );
        }
        
        await connection.commit();
        return notificationId;
    } catch (error) {
        await connection.rollback();
        throw new Error(`Failed to create notification: ${error}`);
    } finally {
        connection.release();
    }
};

/**
 * Đánh dấu thông báo đã đọc
 */
export const markNotificationAsRead = async (notificationId: number, userId: number): Promise<void> => {
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE notification_recipients 
             SET is_read = TRUE, read_at = NOW() 
             WHERE notification_id = ? AND user_id = ? AND is_read = FALSE`,
            [notificationId, userId]
        );
        
        if (result.affectedRows === 0) {
            throw new Error('Notification not found or already read');
        }
    } catch (error) {
        throw new Error(`Failed to mark notification as read: ${error}`);
    }
};

/**
 * Đánh dấu tất cả thông báo của user đã đọc
 */
export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
    try {
        await pool.query<ResultSetHeader>(
            `UPDATE notification_recipients nr
             JOIN notifications n ON nr.notification_id = n.id
             SET nr.is_read = TRUE, nr.read_at = NOW() 
             WHERE nr.user_id = ? AND nr.is_read = FALSE
             AND (n.expires_at IS NULL OR n.expires_at > NOW())`,
            [userId]
        );
    } catch (error) {
        throw new Error(`Failed to mark all notifications as read: ${error}`);
    }
};

/**
 * Xóa thông báo (soft delete - chỉ xóa khỏi recipient)
 */
export const deleteUserNotification = async (notificationId: number, userId: number): Promise<void> => {
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `DELETE FROM notification_recipients 
             WHERE notification_id = ? AND user_id = ?`,
            [notificationId, userId]
        );
        
        if (result.affectedRows === 0) {
            throw new Error('Notification not found');
        }
    } catch (error) {
        throw new Error(`Failed to delete notification: ${error}`);
    }
};

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
    try {
        const [result] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as count
             FROM notification_recipients nr
             JOIN notifications n ON nr.notification_id = n.id
             WHERE nr.user_id = ? 
             AND nr.is_read = FALSE
             AND (n.expires_at IS NULL OR n.expires_at > NOW())`,
            [userId]
        );
        
        return result[0].count || 0;
    } catch (error) {
        throw new Error(`Failed to get unread notification count: ${error}`);
    }
};

/**
 * Lấy cài đặt thông báo của user
 */
export const getUserNotificationSettings = async (userId: number): Promise<UserNotificationSettings[]> => {
    try {
        const [result] = await pool.query<(UserNotificationSettings & RowDataPacket)[]>(
            `SELECT uns.*, nt.name as type_name
             FROM user_notification_settings uns
             JOIN notification_types nt ON uns.type_id = nt.id
             WHERE uns.user_id = ?
             ORDER BY nt.name`,
            [userId]
        );
        
        return result;
    } catch (error) {
        throw new Error(`Failed to get user notification settings: ${error}`);
    }
};

/**
 * Cập nhật cài đặt thông báo của user
 */
export const updateUserNotificationSettings = async (
    userId: number, 
    typeId: number, 
    settings: { is_enabled?: boolean, email_enabled?: boolean, push_enabled?: boolean }
): Promise<void> => {
    try {
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        
        if (settings.is_enabled !== undefined) {
            updateFields.push('is_enabled = ?');
            updateValues.push(settings.is_enabled);
        }
        
        if (settings.email_enabled !== undefined) {
            updateFields.push('email_enabled = ?');
            updateValues.push(settings.email_enabled);
        }
        
        if (settings.push_enabled !== undefined) {
            updateFields.push('push_enabled = ?');
            updateValues.push(settings.push_enabled);
        }
        
        if (updateFields.length === 0) {
            throw new Error('No settings to update');
        }
        
        updateValues.push(userId, typeId);
        
        await pool.query<ResultSetHeader>(
            `INSERT INTO user_notification_settings (user_id, type_id, is_enabled, email_enabled, push_enabled)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE ${updateFields.join(', ')}`,
            [userId, typeId, settings.is_enabled ?? true, settings.email_enabled ?? false, settings.push_enabled ?? true]
        );
    } catch (error) {
        throw new Error(`Failed to update notification settings: ${error}`);
    }
};

/**
 * Lấy tất cả loại thông báo
 */
export const getNotificationTypes = async (): Promise<NotificationType[]> => {
    try {
        const [result] = await pool.query<(NotificationType & RowDataPacket)[]>(
            'SELECT * FROM notification_types ORDER BY name'
        );
        
        return result;
    } catch (error) {
        throw new Error(`Failed to get notification types: ${error}`);
    }
};

/**
 * Helper functions để tạo thông báo cụ thể
 */

// Thông báo tin nhắn mới
export const createMessageNotification = async (
    senderId: number,
    senderName: string,
    recipientIds: number[],
    conversationId: number,
    messageContent: string
): Promise<number> => {
    return createNotification({
        type: 'message',
        title: `Tin nhắn từ ${senderName}`,
        message: messageContent,
        action_url: `/team?chatWith=${senderId}&conversationId=${conversationId}`,
        metadata: { conversation_id: conversationId, sender_id: senderId },
        sender_id: senderId,
        user_ids: recipientIds
    });
};

// Thông báo mention
export const createMentionNotification = async (
    senderId: number,
    mentionedUserIds: number[],
    conversationId: number,
    messageContent: string
): Promise<number> => {
    return createNotification({
        type: 'mention',
        title: 'Bạn được nhắc đến',
        message: `Bạn được nhắc đến trong tin nhắn: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`,
        action_url: `/team`,
        metadata: { conversation_id: conversationId },
        sender_id: senderId,
        user_ids: mentionedUserIds
    });
};

// Thông báo task được giao
export const createTaskAssignedNotification = async (
    assignerId: number,
    assigneeIds: number[],
    taskId: number,
    taskTitle: string
): Promise<number> => {
    return createNotification({
        type: 'task_assigned',
        title: 'Công việc mới',
        message: `Bạn được giao công việc: "${taskTitle}"`,
        action_url: `/tasks/${taskId}`,
        metadata: { task_id: taskId },
        sender_id: assignerId,
        user_ids: assigneeIds
    });
};

// Thông báo project được giao cho team
export const createProjectAssignedNotification = async (
    assignerId: number,
    teamMemberIds: number[],
    projectId: number,
    projectName: string
): Promise<number> => {
    return createNotification({
        type: 'project_assigned',
        title: 'Dự án mới',
        message: `Team bạn được giao dự án: "${projectName}"`,
        action_url: `/projects/${projectId}`,
        metadata: { project_id: projectId },
        sender_id: assignerId,
        user_ids: teamMemberIds
    });
};

// Thông báo quiz được giao
export const createQuizAssignedNotification = async (
    assignerId: number,
    assigneeIds: number[],
    quizId: number,
    quizTitle: string
): Promise<number> => {
    return createNotification({
        type: 'quiz_assigned',
        title: 'Bài kiểm tra mới',
        message: `Bạn được giao bài kiểm tra: "${quizTitle}"`,
        action_url: `/quiz/${quizId}`,
        metadata: { quiz_id: quizId },
        sender_id: assignerId,
        user_ids: assigneeIds
    });
};

// Thông báo được thêm vào team
export const createTeamAddedNotification = async (
    adderId: number,
    newMemberIds: number[],
    teamId: number,
    teamName: string
): Promise<number> => {
    return createNotification({
        type: 'team_added',
        title: 'Thêm vào nhóm',
        message: `Bạn đã được thêm vào nhóm: "${teamName}"`,
        action_url: `/teams/${teamId}`,
        metadata: { team_id: teamId },
        sender_id: adderId,
        user_ids: newMemberIds
    });
};

// Thông báo mời họp
export const createMeetingInvitedNotification = async (
    organizerId: number,
    participantIds: number[],
    meetingId: number,
    meetingTitle: string
): Promise<number> => {
    return createNotification({
        type: 'meeting_invited',
        title: 'Lời mời tham gia cuộc họp',
        message: `Bạn được mời tham gia cuộc họp: "${meetingTitle}"`,
        action_url: `/calendar?meetingId=${meetingId}`,
        metadata: { meeting_id: meetingId },
        sender_id: organizerId,
        user_ids: participantIds
    });
}; 

/**
 * Lấy số lượng tin nhắn chưa đọc cho một user, gom nhóm theo người gửi
 */
export const getUnreadMessageCountsBySender = async (userId: number): Promise<Record<number, number>> => {
    const query = `
        SELECT n.sender_id, COUNT(*) as unread_count
        FROM notifications n
        JOIN notification_recipients nr ON n.id = nr.notification_id
        JOIN notification_types nt ON n.type_id = nt.id
        WHERE nr.user_id = ?
          AND nr.is_read = FALSE
          AND nt.type_name = 'message'
          AND n.sender_id IS NOT NULL
        GROUP BY n.sender_id;
    `;
    try {
        const [rows] = await pool.query<RowDataPacket[]>(query, [userId]);
        const counts: Record<number, number> = {};
        for (const row of rows) {
            counts[row.sender_id] = row.unread_count;
        }
        return counts;
    } catch (error) {
        console.error('Failed to get unread message counts by sender:', error);
        throw error;
    }
};

/**
 * Đánh dấu tất cả tin nhắn từ một người gửi cụ thể là đã đọc
 */
export const markMessagesAsReadFromSender = async (recipientId: number, senderId: number): Promise<void> => {
    const query = `
        UPDATE notification_recipients nr
        JOIN notifications n ON nr.notification_id = n.id
        JOIN notification_types nt ON n.type_id = nt.id
        SET nr.is_read = TRUE, nr.read_at = NOW()
        WHERE nr.user_id = ?
          AND n.sender_id = ?
          AND nt.type_name = 'message'
          AND nr.is_read = FALSE;
    `;
    try {
        await pool.query(query, [recipientId, senderId]);
    } catch (error) {
        console.error('Failed to mark messages as read from sender:', error);
        throw error;
    }
}; 