import { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  usersAPI, classesAPI, attendanceAPI, memorizationAPI,
  academicYearsAPI, notificationsAPI,
} from '../services/api';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [memorization, setMemorization] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  // Load all data from backend
  const loadAll = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    try {
      const [u, c, att, mem, ay, notif] = await Promise.all([
        usersAPI.getAll().then(r => r.data),
        classesAPI.getAll().then(r => r.data),
        attendanceAPI.getAll().then(r => r.data),
        memorizationAPI.getAll().then(r => r.data),
        academicYearsAPI.getAll().then(r => r.data),
        notificationsAPI.getAll().then(r => r.data),
      ]);
      setUsers(u);
      setClasses(c);
      setAttendance(att);
      setMemorization(mem);
      setAcademicYears(ay);
      setNotifications(notif);
    } catch (err) {
      console.error('[DataContext] loadAll failed:', err.message);
      // Reset the gate so a successful login can trigger a fresh load
      loadedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async (entity) => {
    try {
      if (!entity || entity === 'users') {
        const r = await usersAPI.getAll();
        setUsers(r.data);
      }
      if (!entity || entity === 'classes') {
        const r = await classesAPI.getAll();
        setClasses(r.data);
      }
      if (!entity || entity === 'attendance') {
        const r = await attendanceAPI.getAll();
        setAttendance(r.data);
      }
      if (!entity || entity === 'memorization') {
        const r = await memorizationAPI.getAll();
        setMemorization(r.data);
      }
      if (!entity || entity === 'academicYears') {
        const r = await academicYearsAPI.getAll();
        setAcademicYears(r.data);
      }
      if (!entity || entity === 'notifications') {
        const r = await notificationsAPI.getAll();
        setNotifications(r.data);
      }
    } catch (err) {
      console.error('[DataContext] reload failed:', err.message);
    }
  }, []);

  const reset = useCallback(() => {
    loadedRef.current = false;
    setUsers([]);
    setClasses([]);
    setAttendance([]);
    setMemorization([]);
    setAcademicYears([]);
    setNotifications([]);
  }, []);

  // --- User actions ---
  const addUser = useCallback(async (data) => {
    const r = await usersAPI.create(data);
    setUsers(prev => [...prev, r.data]);
    return r.data;
  }, []);

  const updateUser = useCallback(async (id, data) => {
    const r = await usersAPI.update(id, data);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...r.data } : u));
    // Also reload classes in case enrollment changed
    if (data.classId !== undefined) {
      const cr = await classesAPI.getAll();
      setClasses(cr.data);
    }
    return r.data;
  }, []);

  const removeUser = useCallback(async (id) => {
    await usersAPI.remove(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    // Reload classes to update studentIds
    const cr = await classesAPI.getAll();
    setClasses(cr.data);
  }, []);

  // --- Class actions ---
  const addClass = useCallback(async (data) => {
    const r = await classesAPI.create(data);
    setClasses(prev => [...prev, r.data]);
    return r.data;
  }, []);

  const updateClass = useCallback(async (id, data) => {
    const r = await classesAPI.update(id, data);
    setClasses(prev => prev.map(c => c.id === id ? r.data : c));
    return r.data;
  }, []);

  const removeClass = useCallback(async (id) => {
    await classesAPI.remove(id);
    setClasses(prev => prev.filter(c => c.id !== id));
  }, []);

  // --- Attendance actions ---
  const saveAttendanceBulk = useCallback(async (classId, date, records, academicYearId) => {
    const r = await attendanceAPI.bulkUpsert({ classId, date, records, academicYearId });
    // Reload attendance
    const ar = await attendanceAPI.getAll();
    setAttendance(ar.data);
    return r.data;
  }, []);

  const removeAttendance = useCallback(async (id) => {
    await attendanceAPI.remove(id);
    setAttendance(prev => prev.filter(a => a.id !== id));
  }, []);

  // --- Memorization actions ---
  const addMemorization = useCallback(async (data) => {
    const r = await memorizationAPI.create(data);
    setMemorization(prev => [...prev, r.data]);
    return r.data;
  }, []);

  const updateMemorization = useCallback(async (id, data) => {
    const r = await memorizationAPI.update(id, data);
    setMemorization(prev => prev.map(m => m.id === id ? { ...m, ...r.data } : m));
    return r.data;
  }, []);

  const removeMemorization = useCallback(async (id) => {
    await memorizationAPI.remove(id);
    setMemorization(prev => prev.filter(m => m.id !== id));
  }, []);

  // --- Academic Year actions ---
  const addAcademicYear = useCallback(async (data) => {
    const r = await academicYearsAPI.create(data);
    if (data.isActive) {
      setAcademicYears(prev => prev.map(y => ({ ...y, isActive: false })).concat(r.data));
    } else {
      setAcademicYears(prev => [...prev, r.data]);
    }
    return r.data;
  }, []);

  const updateAcademicYear = useCallback(async (id, data) => {
    const r = await academicYearsAPI.update(id, data);
    setAcademicYears(prev => {
      const updated = prev.map(y => y.id === id ? r.data : y);
      if (data.isActive) return updated.map(y => ({ ...y, isActive: y.id === id }));
      return updated;
    });
    return r.data;
  }, []);

  const removeAcademicYear = useCallback(async (id) => {
    await academicYearsAPI.remove(id);
    setAcademicYears(prev => prev.filter(y => y.id !== id));
  }, []);

  // --- Notification actions ---
  const reloadNotifications = useCallback(async () => {
    const r = await notificationsAPI.getAll();
    setNotifications(r.data);
  }, []);

  const addNotification = useCallback(async (message, senderName) => {
    const r = await notificationsAPI.create(message, senderName);
    setNotifications(prev => [r.data, ...prev]);
    return r.data;
  }, []);

  const markNotifRead = useCallback(async (id) => {
    await notificationsAPI.markRead(id);
    await reloadNotifications();
  }, [reloadNotifications]);

  const markAllNotifsRead = useCallback(async () => {
    await notificationsAPI.markAllRead();
    await reloadNotifications();
  }, [reloadNotifications]);

  return (
    <DataContext.Provider value={{
      // State
      users,
      classes,
      attendance,
      memorization,
      academicYears,
      notifications,
      loading,
      // Lifecycle
      loadAll,
      reload,
      reset,
      // User actions
      addUser,
      updateUser,
      removeUser,
      // Class actions
      addClass,
      updateClass,
      removeClass,
      // Attendance actions
      saveAttendanceBulk,
      removeAttendance,
      // Memorization actions
      addMemorization,
      updateMemorization,
      removeMemorization,
      // Academic year actions
      addAcademicYear,
      updateAcademicYear,
      removeAcademicYear,
      // Notification actions
      reloadNotifications,
      addNotification,
      markNotifRead,
      markAllNotifsRead,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
