import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('[Notifications] load failed:', err.message);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId, loadNotifications]);

  const sendNotification = useCallback(async (message, senderName) => {
    try {
      const res = await notificationsAPI.create(message, senderName);
      setNotifications(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error('[Notifications] create failed:', err.message);
    }
  }, []);

  const markAsRead = useCallback(async (notifId) => {
    if (!userId) return;
    try {
      await notificationsAPI.markRead(notifId);
      setNotifications(prev => prev.map(n => {
        if (n.id !== notifId) return n;
        const readBy = Array.isArray(n.readBy) ? n.readBy : [];
        if (readBy.includes(userId)) return n;
        return { ...n, readBy: [...readBy, userId] };
      }));
    } catch (err) {
      console.error('[Notifications] markRead failed:', err.message);
    }
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => {
        const readBy = Array.isArray(n.readBy) ? n.readBy : [];
        if (readBy.includes(userId)) return n;
        return { ...n, readBy: [...readBy, userId] };
      }));
    } catch (err) {
      console.error('[Notifications] markAllRead failed:', err.message);
    }
  }, [userId]);

  const unreadCount = notifications.filter(n => {
    const readBy = Array.isArray(n.readBy) ? n.readBy : [];
    return userId && !readBy.includes(userId);
  }).length;

  return (
    <NotificationContext.Provider value={{
      notifications, sendNotification, markAsRead, markAllRead,
      unreadCount, reload: loadNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
