import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { storage, KEYS } from '../../utils/storage';
import { generateId, hashPassword } from '../../utils/auth';
import { formatGregorian } from '../../utils/hijriDate';
import Modal from '../../components/common/Modal';

const StatCard = ({ icon, label, value, color, onClick }) => (
  <div className="stat-card" onClick={onClick}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
    </div>
    <svg className="w-5 h-5 text-[var(--color-text-muted)] ms-auto rtl-flip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { sendNotification } = useNotifications();

  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreateYear, setShowCreateYear] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [toast, setToast] = useState(null);

  // Account form
  const [accountForm, setAccountForm] = useState({ role: 'teacher', name: '', email: '', password: '', gender: 'male', age: '', parentId: '' });
  // Year form
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Stats
  const stats = useMemo(() => {
    const users = storage.getAll(KEYS.USERS);
    const classes = storage.getAll(KEYS.CLASSES);
    const attendance = storage.getAll(KEYS.ATTENDANCE);
    const today = new Date().toISOString().split('T')[0];

    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');

    const todayAttend = attendance.filter(a => a.date === today);
    const todayPresent = todayAttend.filter(a => a.status === 'present').length;
    const attendRate = todayAttend.length > 0 ? Math.round((todayPresent / todayAttend.length) * 100) : 0;

    // Today's classes
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = dayNames[new Date().getDay()];
    const todayClasses = classes.filter(c => c.schedule?.some(s => s.day === todayDay));

    return {
      totalStudents: students.length,
      activeTeachers: teachers.length,
      totalClasses: classes.length,
      todayClasses: todayClasses.length,
      attendRate,
      todayClassList: todayClasses,
    };
  }, []);

  const academicYears = storage.getAll(KEYS.ACADEMIC_YEARS);
  const parents = storage.getAll(KEYS.USERS).filter(u => u.role === 'parent');

  const handleCreateAccount = (e) => {
    e.preventDefault();
    const newUser = {
      id: generateId(),
      name: accountForm.name,
      email: accountForm.email,
      password: hashPassword(accountForm.password),
      role: accountForm.role,
      gender: accountForm.gender,
      age: parseInt(accountForm.age) || 0,
      createdAt: new Date().toISOString(),
      ...(accountForm.role === 'student' ? { parentId: accountForm.parentId, childrenIds: undefined } : {}),
    };

    // If student, link to parent
    if (accountForm.role === 'student' && accountForm.parentId) {
      const parent = storage.findOne(KEYS.USERS, u => u.id === accountForm.parentId);
      if (parent) {
        storage.update(KEYS.USERS, parent.id, {
          childrenIds: [...(parent.childrenIds || []), newUser.id],
        });
      }
    }

    storage.add(KEYS.USERS, newUser);
    setShowCreateAccount(false);
    setAccountForm({ role: 'teacher', name: '', email: '', password: '', gender: 'male', age: '', parentId: '' });
    showToast(t('common.created'));
  };

  const handleCreateYear = (e) => {
    e.preventDefault();
    const year = {
      id: generateId(),
      name: yearForm.name,
      startDate: yearForm.startDate,
      endDate: yearForm.endDate,
      isActive: false,
      createdAt: new Date().toISOString(),
    };
    storage.add(KEYS.ACADEMIC_YEARS, year);
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
    sendNotification(notifMsg, user?.name);
    setNotifMsg('');
    setShowNotifModal(false);
    showToast(t('common.success'));
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 ${document.documentElement.dir === 'rtl' ? 'left-4' : 'right-4'} z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-brand-green-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">{t('admin.dashboard.title')}</h1>
        <p className="page-subtitle">{formatGregorian(new Date())}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          label={t('admin.dashboard.totalStudents')}
          value={stats.totalStudents}
          color="bg-brand-green-600"
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          label={t('admin.dashboard.activeTeachers')}
          value={stats.activeTeachers}
          color="bg-blue-600"
          onClick={() => navigate('/admin/teachers')}
        />
        <StatCard
          icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          label={t('admin.dashboard.totalClasses')}
          value={stats.totalClasses}
          color="bg-purple-600"
          onClick={() => navigate('/admin/classes')}
        />
      </div>

      {/* Today info row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green-500" />
            {t('admin.dashboard.todayClasses')} ({stats.todayClasses})
          </h3>
          {stats.todayClassList.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {stats.todayClassList.map(cls => {
                const teacher = storage.findOne(KEYS.USERS, u => u.id === cls.teacherId);
                return (
                  <div key={cls.id} className="flex items-center justify-between p-2 rounded-lg bg-brand-green-50 dark:bg-brand-green-900/20">
                    <span className="text-sm font-medium text-brand-green-700 dark:text-brand-green-400">{cls.name}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{teacher?.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-gold-500" />
            {t('admin.dashboard.attendanceRate')}
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-[var(--color-border)]" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#16a34a" strokeWidth="8"
                  strokeDasharray={`${(stats.attendRate / 100) * 201} 201`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-brand-green-600">
                {stats.attendRate}%
              </span>
            </div>
            <div className="text-sm text-[var(--color-text-muted)]">
              <p>{t('attendance.rate')}</p>
              <p className="font-semibold text-[var(--color-text)] text-lg mt-1">{stats.attendRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('admin.dashboard.quickActions')}</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowCreateAccount(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            {t('admin.dashboard.createAccount')}
          </button>
          <button onClick={() => setShowCreateYear(true)} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t('year.create')}
          </button>
          <button onClick={() => setShowNotifModal(true)} className="btn-ghost border border-[var(--color-border)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {t('admin.dashboard.sendNotification')}
          </button>
        </div>
      </div>

      {/* Academic Years */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('admin.dashboard.academicYears')}</h3>
        {academicYears.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('year.noYears')}</p>
        ) : (
          <div className="space-y-2">
            {academicYears.map(y => (
              <div key={y.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:border-brand-green-300 transition-colors">
                <div className="flex items-center gap-3">
                  {y.isActive && (
                    <span className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">
                      {t('year.active')}
                    </span>
                  )}
                  <span className="font-medium text-[var(--color-text)]">{y.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{y.startDate} → {y.endDate}</span>
                </div>
                <div className="flex gap-2">
                  {!y.isActive && (
                    <button onClick={() => handleSetActive(y.id)} className="text-xs text-brand-green-600 hover:underline">
                      {t('year.setActive')}
                    </button>
                  )}
                  <button onClick={() => handleDeleteYear(y.id)} className="text-xs text-red-500 hover:underline">
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      <Modal isOpen={showCreateAccount} onClose={() => setShowCreateAccount(false)} title={t('account.create')} size="md"
        footer={
          <>
            <button onClick={() => setShowCreateAccount(false)} className="btn-ghost">{t('common.cancel')}</button>
            <button form="create-account-form" type="submit" className="btn-primary">{t('common.save')}</button>
          </>
        }
      >
        <form id="create-account-form" onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="label">{t('account.role')}</label>
            <select value={accountForm.role} onChange={e => setAccountForm({...accountForm, role: e.target.value})} className="select">
              <option value="teacher">{t('role.teacher')}</option>
              <option value="student">{t('role.student')}</option>
              <option value="parent">{t('role.parent')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('account.name')}</label>
            <input type="text" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="input" required />
          </div>
          <div>
            <label className="label">{t('account.email')}</label>
            <input type="email" value={accountForm.email} onChange={e => setAccountForm({...accountForm, email: e.target.value})} className="input" required />
          </div>
          <div>
            <label className="label">{t('account.password')}</label>
            <input type="password" value={accountForm.password} onChange={e => setAccountForm({...accountForm, password: e.target.value})} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('common.gender')}</label>
              <select value={accountForm.gender} onChange={e => setAccountForm({...accountForm, gender: e.target.value})} className="select">
                <option value="male">{t('gender.male')}</option>
                <option value="female">{t('gender.female')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('common.age')}</label>
              <input type="number" min="5" max="100" value={accountForm.age} onChange={e => setAccountForm({...accountForm, age: e.target.value})} className="input" />
            </div>
          </div>
          {accountForm.role === 'student' && (
            <div>
              <label className="label">{t('account.parent')}</label>
              <select value={accountForm.parentId} onChange={e => setAccountForm({...accountForm, parentId: e.target.value})} className="select">
                <option value="">{t('common.select')}</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </form>
      </Modal>

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
            <input type="text" value={yearForm.name} onChange={e => setYearForm({...yearForm, name: e.target.value})} className="input" placeholder="2024-2025" required />
          </div>
          <div>
            <label className="label">{t('year.startDate')}</label>
            <input type="date" value={yearForm.startDate} onChange={e => setYearForm({...yearForm, startDate: e.target.value})} className="input" required />
          </div>
          <div>
            <label className="label">{t('year.endDate')}</label>
            <input type="date" value={yearForm.endDate} onChange={e => setYearForm({...yearForm, endDate: e.target.value})} className="input" required />
          </div>
        </form>
      </Modal>

      {/* Notification Modal */}
      <Modal isOpen={showNotifModal} onClose={() => setShowNotifModal(false)} title={t('notif.send')} size="sm"
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
            <textarea
              value={notifMsg}
              onChange={e => setNotifMsg(e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder={t('notif.message')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
