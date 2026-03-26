import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, KEYS } from '../utils/storage';
import { generateId } from '../utils/auth';
import { currentTime } from '../utils/hijriDate';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(() => {
    const all = storage.getAll(KEYS.NOTIFICATIONS);
    setNotifications(all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll every 5 seconds for new notifications (simulates socket)
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const sendNotification = useCallback((message, senderName) => {
    const notif = {
      id: generateId(),
      message,
      senderId: userId,
      senderName: senderName || 'Admin',
      timestamp: new Date().toISOString(),
      time: currentTime(),
      readBy: [],
    };
    storage.add(KEYS.NOTIFICATIONS, notif);
    setNotifications(prev => [notif, ...prev]);

    // Simulate broadcast via storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: KEYS.NOTIFICATIONS,
      newValue: JSON.stringify(storage.getAll(KEYS.NOTIFICATIONS)),
    }));

    return notif;
  }, [userId]);

  const markAsRead = useCallback((notifId) => {
    if (!userId) return;
    const notif = storage.findOne(KEYS.NOTIFICATIONS, n => n.id === notifId);
    if (notif && !notif.readBy.includes(userId)) {
      storage.update(KEYS.NOTIFICATIONS, notifId, {
        readBy: [...notif.readBy, userId],
      });
      loadNotifications();
    }
  }, [userId, loadNotifications]);

  const markAllRead = useCallback(() => {
    if (!userId) return;
    const all = storage.getAll(KEYS.NOTIFICATIONS);
    all.forEach(n => {
      if (!n.readBy.includes(userId)) {
        storage.update(KEYS.NOTIFICATIONS, n.id, { readBy: [...n.readBy, userId] });
      }
    });
    loadNotifications();
  }, [userId, loadNotifications]);

  const unreadCount = notifications.filter(n => userId && !n.readBy.includes(userId)).length;

  // Listen to storage events from other tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === KEYS.NOTIFICATIONS) loadNotifications();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications, sendNotification, markAsRead, markAllRead,
      unreadCount, reload: loadNotifications
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
