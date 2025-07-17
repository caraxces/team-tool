'use client';

import { useRouter } from 'next/navigation';
import { Notification } from '@/services/notification.service';
import { Briefcase, MessageSquare, BrainCircuit, CheckSquare, Users, X, Eye, UserIcon } from 'lucide-react';
import { markAsRead, markAllAsRead } from '@/services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface NotificationDropdownProps {
    notifications: Notification[];
    isLoading: boolean;
    onDismiss: (id: string) => void;
}

const typeMap: Record<string, { icon: any, color: string }> = {
    project_assigned: { icon: Briefcase, color: 'text-blue-400' },
    task_assigned: { icon: CheckSquare, color: 'text-green-400' },
    team_added: { icon: Users, color: 'text-cyan-400' },
    knowledge: { icon: BrainCircuit, color: 'text-purple-400' },
    message: { icon: MessageSquare, color: 'text-orange-400' },
    mention: { icon: MessageSquare, color: 'text-red-400' },
    quiz_assigned: { icon: BrainCircuit, color: 'text-yellow-400' },
    meeting_reminder: { icon: Users, color: 'text-indigo-400' },
    task_updated: { icon: CheckSquare, color: 'text-gray-400' },
    project_updated: { icon: Briefcase, color: 'text-gray-400' },
};

export const NotificationDropdown = ({ notifications, isLoading, onDismiss }: NotificationDropdownProps) => {
    const router = useRouter();

    const handleNotificationClick = async (notification: Notification) => {
        try {
            // Mark as read if it's not already
            if (!notification.is_read) {
                await markAsRead(notification.id);
            }
            
            // Navigate to action URL if available
            if (notification.action_url) {
                router.push(notification.action_url);
            }
            
            // Trigger a refresh to update the UI
            onDismiss('refresh');
        } catch (error) {
            toast.error("Could not open notification.");
            console.error('Failed to handle notification click:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            // Trigger refresh by calling onDismiss with refresh signal
            onDismiss('refresh');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <div className="absolute right-0 pt-2 z-40 w-80">
            <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg border border-white/10 dark:border-gray-700/60 rounded-md shadow-2xl">
                <div className="p-3 border-b border-gray-200/80 dark:border-gray-700/60 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Thông báo</h3>
                    {notifications.length > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center space-x-1"
                        >
                            <Eye className="h-3 w-3" />
                            <span>Đọc tất cả</span>
                        </button>
                    )}
                </div>
                <div className="py-1 max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">Đang tải...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Bạn không có thông báo mới.</div>
                    ) : (
                        <>
                            {notifications.map(notif => {
                                const notificationType = typeMap[notif.type] || typeMap['message'];
                                const { icon: Icon, color } = notificationType;
                                
                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full text-left relative group block ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''} hover:bg-gray-200/60 dark:hover:bg-gray-700/80 transition-colors`}
                                    >
                                        <div
                                            className="w-full flex items-start px-4 py-3 text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            {/* Avatar or Icon */}
                                            <div className="flex-shrink-0 mr-3">
                                                {notif.sender_avatar ? (
                                                    <img
                                                        src={notif.sender_avatar}
                                                        alt={notif.sender_name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : notif.sender_name ? (
                                                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                                        <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                                    </div>
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700`}>
                                                        <Icon className={`w-4 h-4 ${color}`} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                                            {notif.message}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                                            </p>
                                                            {!notif.is_read && (
                                                                <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
                <div className="p-2 border-t border-gray-200/80 dark:border-gray-700/60 text-center">
                    <button
                        onClick={() => router.push('/notifications')}
                        className="text-sm text-blue-500 hover:underline"
                    >
                        Xem tất cả
                    </button>
                </div>
            </div>
        </div>
    );
}; 