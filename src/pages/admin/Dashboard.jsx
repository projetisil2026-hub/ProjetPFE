import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { storage, KEYS } from '../../utils/storage';
import { formatGregorian, formatHijri } from '../../utils/hijriDate';
import { generateId } from '../../utils/auth';
import Modal from '../../components/common/Modal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { sendNotification } = useNotifications();

  const [showCreateYear, setShowCreateYear] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [notifSearch, setNotifSearch] = useState('');
  const [notifRoleFilter, setNotifRoleFilter] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [toast, setToast] = useState(null);
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const today = new Date();

  const stats = useMemo(() => {
    const users = storage.getAll(KEYS.USERS);
    const classes = storage.getAll(KEYS.CLASSES);
    const attendance = storage.getAll(KEYS.ATTENDANCE);
    const todayStr = today.toISOString().split('T')[0];

    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const parents = users.filter(u => u.role === 'parent');

    const todayAttend = attendance.filter(a => a.date === todayStr);
    const todayPresent = todayAttend.filter(a => a.status === 'present').length;
    const attendRate = todayAttend.length > 0 ? Math.round((todayPresent / todayAttend.length) * 100) : 0;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = dayNames[today.getDay()];
    const todayClasses = classes.filter(c => c.schedule?.some(s => s.day === todayDay));

    return { totalStudents: students.length, activeTeachers: teachers.length, totalClasses: classes.length, totalParents: parents.length, todayClasses: todayClasses.length, attendRate, todayClassList: todayClasses };
  }, []);

  const academicYears = storage.getAll(KEYS.ACADEMIC_YEARS);
  const activeYear = academicYears.find(y => y.isActive);

  const allUsers = useMemo(() => storage.getAll(KEYS.USERS).filter(u => u.id !== user?.id), [user]);

  const filteredUsersForNotif = useMemo(() => {
    let filtered = allUsers;
    if (notifRoleFilter) filtered = filtered.filter(u => u.role === notifRoleFilter);
    if (notifSearch) filtered = filtered.filter(u =>
      (u.nameAr || u.name || '').toLowerCase().includes(notifSearch.toLowerCase()) ||
      (u.nameEn || '').toLowerCase().includes(notifSearch.toLowerCase())
    );
    return filtered;
  }, [allUsers, notifSearch, notifRoleFilter]);

  const toggleRecipient = (uid) => {
    setSelectedRecipients(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const handleCreateYear = (e) => {
    e.preventDefault();
    storage.add(KEYS.ACADEMIC_YEARS, {
      id: generateId(),
      name: yearForm.name,
      startDate: yearForm.startDate,
      endDate: yearForm.endDate,
      isActive: false,
      createdAt: new Date().toISOString(),
    });
    setShowCreateYear(false);
    setYearForm({ name: '', startDate: '', endDate: '' });
    showToast(t('common.created'));
  };

  const handleSetActive = (yearId) => {
    const years = storage.getAll(KEYS.ACADEMIC_YEARS);
    years.forEach(y => storage.update(KEYS.ACADEMIC_YEARS, y.id, { isActive: y.id === yearId }));
    showToast(t('common.updated'));
  };

  const handleDeleteYear = (yearId) => {
    storage.delete(KEYS.ACADEMIC_YEARS, yearId);
    showToast(t('common.deleted'));
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!notifMsg.trim()) return;
    sendNotification(notifMsg, user?.name, sendToAll ? null : selectedRecipients);
    setNotifMsg('');
    setSelectedRecipients([]);
    setSendToAll(true);
    setNotifSearch('');
    setNotifRoleFilter('');
    setShowNotifModal(false);
    showToast(t('common.success'));
  };

  const statCards = [
    {
      label: t('admin.dashboard.totalStudents'),
      value: stats.totalStudents,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      gradient: 'from-brand-green-500 to-brand-green-700',
      bg: 'bg-brand-green-50 dark:bg-brand-green-900/20',
      text: 'text-brand-green-700 dark:text-brand-green-400',
      onClick: () => navigate('/admin/students'),
    },
    {
      label: t('admin.dashboard.activeTeachers'),
      value: stats.activeTeachers,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      gradient: 'from-blue-500 to-blue-700',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      onClick: () => navigate('/admin/teachers'),
    },
    {
      label: t('admin.dashboard.totalClasses'),
      value: stats.totalClasses,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      gradient: 'from-purple-500 to-purple-700',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-400',
      onClick: () => navigate('/admin/classes'),
    },
    {
      label: t('admin.dashboard.todayClasses'),
      value: stats.todayClasses,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      gradient: 'from-amber-500 to-amber-700',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-400',
      onClick: () => navigate('/admin/attendance'),
    },
    {
      label: t('admin.dashboard.attendanceRate'),
      value: `${stats.attendRate}%`,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      gradient: 'from-teal-500 to-teal-700',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      text: 'text-teal-700 dark:text-teal-400',
      onClick: () => navigate('/admin/reports'),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 ${lang === 'ar' ? 'left-4' : 'right-4'} z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-brand-green-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green-600 via-brand-green-700 to-brand-green-900 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute -top-8 -right-8 w-64 h-64 text-white" fill="currentColor" viewBox="0 0 200 200">
            <circle cx="150" cy="50" r="80" />
          </svg>
          <svg className="absolute -bottom-12 -left-8 w-48 h-48 text-white" fill="currentColor" viewBox="0 0 200 200">
            <circle cx="50" cy="150" r="60" />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-brand-green-200 text-sm font-medium mb-1">{t('admin.dashboard.title')}</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{lang === 'ar' ? (user?.nameAr || user?.name) : (user?.nameEn || user?.name)}</h1>
            {activeYear && (
              <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green-300" />
                {activeYear.name}
              </span>
            )}
          </div>
          <div className="text-end">
            <p className="text-brand-green-100 font-semibold">{formatHijri(today, lang)}</p>
            <p className="text-brand-green-300 text-sm mt-0.5">{formatGregorian(today, lang)}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          <button key={i} onClick={card.onClick} className="card p-4 flex flex-col gap-3 hover:scale-[1.03] hover:shadow-md transition-all duration-200 text-start group">
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.text} flex items-center justify-center`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{card.value}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-snug">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Today classes + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's classes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </span>
              {t('admin.dashboard.todayClasses')}
            </h3>
            <span className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">
              {stats.todayClasses}
            </span>
          </div>
          {stats.todayClassList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)]">
              <svg className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.todayClassList.map(cls => {
                const teacher = storage.findOne(KEYS.USERS, u => u.id === cls.teacherId);
                return (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-xl bg-brand-green-50 dark:bg-brand-green-900/20 hover:bg-brand-green-100 dark:hover:bg-brand-green-900/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-brand-green-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-brand-green-800 dark:text-brand-green-300">{cls.name}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {lang === 'ar' ? (teacher?.nameAr || teacher?.name) : (teacher?.nameEn || teacher?.name)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance ring */}
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </span>
            {t('admin.dashboard.attendanceRate')}
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" strokeWidth="10" className="text-[var(--color-border)]" />
                <circle cx="48" cy="48" r="38" fill="none" stroke="#16a34a" strokeWidth="10"
                  strokeDasharray={`${(stats.attendRate / 100) * 238.76} 238.76`} strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-brand-green-600">
                {stats.attendRate}%
              </span>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{t('attendance.present')}</span>
                <span className="font-semibold text-brand-green-600">{stats.attendRate}%</span>
              </div>
              <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-brand-green-500 rounded-full transition-all duration-700" style={{ width: `${stats.attendRate}%` }} />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{t('admin.dashboard.todayClasses')}: {stats.todayClasses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('admin.dashboard.quickActions')}</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowCreateYear(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {t('year.create')}
          </button>
          <button onClick={() => setShowNotifModal(true)} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {t('admin.dashboard.sendNotification')}
          </button>
          <button onClick={() => navigate('/admin/students')} className="btn-ghost border border-[var(--color-border)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            {t('students.add')}
          </button>
          <button onClick={() => navigate('/admin/teachers')} className="btn-ghost border border-[var(--color-border)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            {t('teachers.add')}
          </button>
        </div>
      </div>

      {/* Academic Years */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </span>
          {t('admin.dashboard.academicYears')}
        </h3>
        {academicYears.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">{t('year.noYears')}</p>
        ) : (
          <div className="space-y-2">
            {academicYears.map(y => (
              <div key={y.id} className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${y.isActive ? 'border-brand-green-400 bg-brand-green-50 dark:bg-brand-green-900/20' : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]/30'}`}>
                <div className="flex items-center gap-3">
                  {y.isActive ? (
                    <span className="w-2 h-2 rounded-full bg-brand-green-500 flex-shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-border)] flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-[var(--color-text)] text-sm">{y.name}</span>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{y.startDate} → {y.endDate}</p>
                  </div>
                  {y.isActive && (
                    <span className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">
                      {t('year.active')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!y.isActive && (
                    <button onClick={() => handleSetActive(y.id)} className="text-xs text-brand-green-600 hover:text-brand-green-800 font-medium px-2.5 py-1 rounded-lg hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 transition-colors">
                      {t('year.setActive')}
                    </button>
                  )}
                  <button onClick={() => handleDeleteYear(y.id)} className="text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Year Modal */}
      <Modal isOpen={showCreateYear} onClose={() => setShowCreateYear(false)} title={t('year.create')} size="sm"
        footer={
          <>
            <button onClick={() => setShowCreateYear(false)} className="btn-ghost">{t('common.cancel')}</button>
            <button form="create-year-form" type="submit" className="btn-primary">{t('common.save')}</button>
          </>
        }
      >
        <form id="create-year-form" onSubmit={handleCreateYear} className="space-y-4">
          <div>
            <label className="label">{t('year.name')}</label>
            <input type="text" value={yearForm.name} onChange={e => setYearForm({ ...yearForm, name: e.target.value })} className="input" placeholder="2024-2025" required />
          </div>
          <div>
            <label className="label">{t('year.startDate')}</label>
            <input type="date" value={yearForm.startDate} onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">{t('year.endDate')}</label>
            <input type="date" value={yearForm.endDate} onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })} className="input" required />
          </div>
        </form>
      </Modal>

      {/* Notification Modal */}
      <Modal isOpen={showNotifModal} onClose={() => setShowNotifModal(false)} title={t('notif.send')} size="md"
        footer={
          <>
            <button onClick={() => setShowNotifModal(false)} className="btn-ghost">{t('common.cancel')}</button>
            <button onClick={handleSendNotification} className="btn-primary">{t('common.send')}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t('notif.message')}</label>
            <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} className="input min-h-[80px] resize-none" placeholder={t('notif.message')} />
          </div>
          <div>
            <label className="label">{t('notif.recipients')}</label>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={sendToAll} onChange={e => setSendToAll(e.target.checked)} className="w-4 h-4 accent-brand-green-600" />
              <span className="text-sm text-[var(--color-text)]">{t('notif.sendToAll')}</span>
            </label>
            {!sendToAll && (
              <div className="space-y-2">
                <select value={notifRoleFilter} onChange={e => { setNotifRoleFilter(e.target.value); setSelectedRecipients([]); }} className="select text-sm">
                  <option value="">{t('notif.allRoles')}</option>
                  <option value="student">{t('role.student')}</option>
                  <option value="teacher">{t('role.teacher')}</option>
                  <option value="parent">{t('role.parent')}</option>
                </select>
                <input type="text" value={notifSearch} onChange={e => setNotifSearch(e.target.value)} placeholder={t('notif.searchUser')} className="input text-sm" />
                <div className="max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
                  {filteredUsersForNotif.length === 0 ? (
                    <p className="text-sm text-center text-[var(--color-text-muted)] py-4">{t('common.noData')}</p>
                  ) : filteredUsersForNotif.map(u => (
                    <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-brand-green-50 dark:hover:bg-brand-green-900/10">
                      <input type="checkbox" checked={selectedRecipients.includes(u.id)} onChange={() => toggleRecipient(u.id)} className="w-4 h-4 accent-brand-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">{u.nameAr || u.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{t(`role.${u.role}`)}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedRecipients.length > 0 && (
                  <p className="text-xs text-brand-green-600 font-medium">{selectedRecipients.length} {t('notif.recipients')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
