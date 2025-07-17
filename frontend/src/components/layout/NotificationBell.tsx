'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '@/context/AuthContext';
import { pollNotifications } from '@/services/notification.service';
import type { Notification } from '@/services/notification.service';

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
    const bellRef = useRef<HTMLDivElement>(null);
    const { state: authState } = useAuth();
    const userId = authState.user?.id;

    // Sử dụng React Query để polling notifications với frequency cao hơn
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['notifications', 'poll'],
        queryFn: pollNotifications,
        enabled: !!userId,
        refetchInterval: 10000, // Poll mỗi 10 giây để real-time hơn
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        // Stale time ngắn để luôn fetch fresh data
        staleTime: 5000,
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unread_count || 0;

    // Detect new notifications
    useEffect(() => {
        if (unreadCount > previousUnreadCount && previousUnreadCount > 0) {
            setHasNewNotification(true);
            // Reset the animation after 3 seconds
            const timer = setTimeout(() => {
                setHasNewNotification(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
        setPreviousUnreadCount(unreadCount);
    }, [unreadCount, previousUnreadCount]);

    const handleDismissNotification = async (input: string) => {
        try {
            // Nếu input là 'refresh', chỉ refetch để cập nhật UI
            if (input === 'refresh') {
                refetch();
                return;
            }
            
            // Xử lý việc mark as read riêng lẻ (hiện tại không dùng)
            const notificationId = parseInt(input);
            if (!isNaN(notificationId)) {
                const { markAsRead } = await import('@/services/notification.service');
                await markAsRead(notificationId);
                refetch();
            }
        } catch (error) {
            console.error('Failed to handle notification dismiss:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={bellRef}>
            <button 
                onClick={() => {
                    setIsOpen(!isOpen);
                    setHasNewNotification(false); // Reset animation when clicked
                }}
                className={`relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    hasNewNotification ? 'animate-bounce' : ''
                }`}
            >
                <Bell 
                    size={20} 
                    className={`transition-all duration-300 ${
                        hasNewNotification ? 'text-cyan-500 animate-pulse' : ''
                    }`}
                />
                {unreadCount > 0 && (
                     <span className={`absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900 transition-all duration-300 ${
                         hasNewNotification ? 'animate-ping' : ''
                     }`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                
                {/* Pulse ring effect for new notifications */}
                {hasNewNotification && (
                    <span className="absolute inset-0 rounded-full bg-cyan-400 opacity-20 animate-ping"></span>
                )}
            </button>

            {isOpen && (
                <NotificationDropdown 
                    notifications={notifications} 
                    isLoading={isLoading}
                    onDismiss={handleDismissNotification}
                />
            )}
        </div>
    );
}; 