"use client"

import { useState, useEffect } from 'react';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'; 
import { Notification } from 'Types/types'; 

export function useNotifications(userEcommerce_id?: string) {

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const apiClient = setupAPIClientEcommerce();

    const fetchNotifications = async () => {
        try {
            if (!userEcommerce_id) return;

            const response = await apiClient.get(`/user/userEcommerce/notifications?userEcommerce_id=${userEcommerce_id}`);
            const fetchedNotifications = response.data.slice(0, 20);
            setNotifications(fetchedNotifications);
            setHasUnread(fetchedNotifications.some((notification: { read: any; }) => !notification.read));
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        }
    };

    const checkForNewNotifications = async () => {
        try {
            if (!userEcommerce_id) return;

            const response = await apiClient.get(`/user/userEcommerce/notifications?userEcommerce_id=${userEcommerce_id}`);
            const newNotifications = response.data.slice(0, 20);
            setNotifications(newNotifications);
        } catch (error) {
            console.error("Erro ao verificar novas notificações:", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await apiClient.put(`/user/notifications/userEcommerce/mark-read?notificationUserEcommerce_id=${id}`);
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id ? { ...notification, read: true } : notification
                )
            );
            setHasUnread(notifications.some(n => n.id !== id && !n.read));
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            if (!userEcommerce_id) return;

            await apiClient.put(`/user/notifications/userEcommerce/mark-all-read?userEcommerce_id=${userEcommerce_id}`);
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );
            setHasUnread(false);
        } catch (error) {
            console.error("Erro ao marcar todas como lidas:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            checkForNewNotifications();
        }, 20000);

        return () => clearInterval(interval);
    }, [userEcommerce_id]);

    useEffect(() => {
        setHasUnread(notifications.some(notification => !notification.read));
    }, [notifications]);

    return {
        notifications,
        hasUnread,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    };
}