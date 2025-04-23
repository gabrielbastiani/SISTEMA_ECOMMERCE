import moment from 'moment';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { NotificationIcon } from './notificationIcon'; 
import { Notification } from 'Types/types';

interface NotificationDropdownProps {
    notifications: Notification[];
    hasUnread: boolean;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

export const NotificationDropdown = ({
    notifications,
    hasUnread,
    onMarkAsRead,
    onMarkAllAsRead,
}: NotificationDropdownProps) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative">
            <FiBell
                size={24}
                className="text-[#FFFFFF] cursor-pointer"
                onClick={() => setShowNotifications(!showNotifications)}
            />
            {hasUnread && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
            )}
            {showNotifications && (
                <div
                    ref={notificationRef}
                    className="absolute top-14 right-6 bg-gray-800 text-[#FFFFFF] rounded-md w-80 shadow-lg p-4 z-10"
                >
                    <div className="flex justify-between mb-2">
                        <h2 className="font-semibold">Notificações</h2>
                        <button
                            className="text-sm text-red-500 hover:underline"
                            onClick={onMarkAllAsRead}
                        >
                            Marcar todas como lidas
                        </button>
                    </div>
                    <ul className="max-h-64 overflow-y-auto">
                        {notifications.map((notification, index) => (
                            <li
                                key={notification.id}
                                className={`p-3 flex items-center justify-between rounded ${notification.read ? "text-gray-500" : "text-[#FFFFFF]"}
                            ${index !== notifications.length - 1 ? "border-b border-gray-700" : ""} 
                            hover:bg-gray-700`}
                            >
                                <button
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="w-full flex justify-between items-center"
                                >
                                    <span className="flex items-center space-x-2">
                                        <NotificationIcon type={notification.type} />
                                        <span>{notification.message}</span>
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {moment(notification.created_at).format('DD-MM-YYYY HH:mm')}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 text-center">
                        <Link href="/central_notifications" passHref>
                            <button className="bg-backgroundButton text-[#FFFFFF] hover:underline text-sm p-3 rounded">
                                Ver todas as notificações
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};