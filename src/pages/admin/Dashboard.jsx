import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { formatGregorian, formatHijri } from '../../utils/hijriDate';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { users, classes, academicYears, loadAll, updateAcademicYear, removeAcademicYear } = useData();
  const [toast, setToast] = useState(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const today = new Date();

  const stats = useMemo(() => {
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    return { totalStudents: students.length, activeTeachers: teachers.length, totalClasses: classes.length };
  }, [users, classes]);

  const activeYear = academicYears.find(y => y.isActive);

  const handleSetActive = async (yearId) => {
    try {
      await updateAcademicYear(yearId, { isActive: true });
      showToast(t('common.updated'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteYear = async (yearId) => {
    try {
      await removeAcademicYear(yearId);
      showToast(t('common.deleted'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const statCards = [
    {
      label: t('admin.dashboard.totalStudents'),
      value: stats.totalStudents,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      bg: 'bg-brand-green-50 dark:bg-brand-green-900/20',
      text: 'text-brand-green-700 dark:text-brand-green-400',
      onClick: () => navigate('/admin/students'),
    },
    {
      label: t('admin.dashboard.activeTeachers'),
      value: stats.activeTeachers,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      onClick: () => navigate('/admin/teachers'),
    },
    {
      label: t('admin.dashboard.totalClasses'),
      value: stats.totalClasses,
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-400',
      onClick: () => navigate('/admin/classes'),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 ${lang === 'ar' ? 'left-4' : 'right-4'} z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-brand-green-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green-600 via-brand-green-700 to-brand-green-900 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute -top-8 -right-8 w-64 h-64 text-white" fill="currentColor" viewBox="0 0 200 200"><circle cx="150" cy="50" r="80" /></svg>
          <svg className="absolute -bottom-12 -left-8 w-48 h-48 text-white" fill="currentColor" viewBox="0 0 200 200"><circle cx="50" cy="150" r="60" /></svg>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          <button key={i} onClick={card.onClick} className="card p-4 flex flex-col gap-3 hover:scale-[1.03] hover:shadow-md transition-all duration-200 text-start">
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.text} flex items-center justify-center`}>{card.icon}</div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{card.value}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-snug">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

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
              <div key={y.id} className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${y.isActive ? 'border-brand-green-400 bg-brand-green-50 dark:bg-brand-green-900/20' : 'border-[var(--color-border)]'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${y.isActive ? 'bg-brand-green-500' : 'bg-[var(--color-border)]'}`} />
                  <div>
                    <span className="font-semibold text-[var(--color-text)] text-sm">{y.name}</span>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{y.startDate} → {y.endDate}</p>
                  </div>
                  {y.isActive && <span className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">{t('year.active')}</span>}
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
    </div>
  );
};

export default AdminDashboard;
