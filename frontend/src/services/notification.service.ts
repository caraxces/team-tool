import api from './api';

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

export interface NotificationSettings {
    id: number;
    user_id: number;
    type_id: number;
    type_name: string;
    is_enabled: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
}

export interface NotificationType {
    id: number;
    name: string;
    description: string;
}

export interface GetNotificationsResponse {
    notifications: Notification[];
    pagination: {
        current_page: number;
        total_pages: number;
        total_count: number;
        limit: number;
    };
    unread_count: number;
}

// Lấy danh sách thông báo
export const getNotifications = async (
    page: number = 1,
    limit: number = 20,
    includeRead: boolean = true
): Promise<GetNotificationsResponse> => {
    const response = await api.get('/notifications', {
        params: {
            page,
            limit,
            include_read: includeRead
        }
    });
    return response.data.data;
};

// Lấy số thông báo chưa đọc
export const getUnreadCount = async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.unread_count;
};

// Đánh dấu thông báo đã đọc
export const markAsRead = async (notificationId: number): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = async (): Promise<void> => {
    await api.put('/notifications/read-all');
};

export const getUnreadMessageCounts = async (): Promise<Record<number, number>> => {
    const response = await api.get('/notifications/unread-counts/by-sender');
    return response.data.data;
};

export const markMessagesFromSenderAsRead = async (senderId: number): Promise<void> => {
    await api.post(`/notifications/mark-as-read/by-sender/${senderId}`);
};

// Xóa thông báo
export const deleteNotification = async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
};

// Tạo thông báo mới (chỉ admin)
export const createNotification = async (data: {
    type: string;
    title: string;
    message: string;
    action_url?: string;
    metadata?: any;
    user_ids: number[];
    expires_at?: string;
}): Promise<{ notification_id: number }> => {
    const response = await api.post('/notifications', data);
    return response.data.data;
};

// Lấy cài đặt thông báo
export const getNotificationSettings = async (): Promise<NotificationSettings[]> => {
    const response = await api.get('/notifications/settings');
    return response.data.data.settings;
};

// Cập nhật cài đặt thông báo
export const updateNotificationSettings = async (
    typeId: number,
    settings: {
        is_enabled?: boolean;
        email_enabled?: boolean;
        push_enabled?: boolean;
    }
): Promise<void> => {
    await api.patch(`/notifications/settings/${typeId}`, settings);
};

// Lấy danh sách loại thông báo
export const getNotificationTypes = async (): Promise<NotificationType[]> => {
    const response = await api.get('/notifications/types');
    return response.data.data.types;
};

// Hook để polling thông báo mới (có thể dùng với React Query)
export const pollNotifications = async (): Promise<{
    notifications: Notification[];
    unread_count: number;
}> => {
    const [notificationsResponse, unreadResponse] = await Promise.all([
        getNotifications(1, 10, false), // Chỉ lấy 10 thông báo chưa đọc mới nhất
        getUnreadCount()
    ]);
    
    return {
        notifications: notificationsResponse.notifications,
        unread_count: unreadResponse
    };
}; 