import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { storage, KEYS } from '../../utils/storage';
import { formatGregorian, formatHijri } from '../../utils/hijriDate';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES_JS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const TeacherDashboard = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const todayDay = DAY_NAMES_JS[today.getDay()];

  const myClasses = useMemo(() => {
    const classes = storage.getAll(KEYS.CLASSES);
    const users = storage.getAll(KEYS.USERS);
    return classes
      .filter(c => c.teacherId === user?.id)
      .map(cls => ({
        ...cls,
        students: users.filter(u => cls.studentIds?.includes(u.id)),
        todaySessions: cls.schedule?.filter(s => s.day === todayDay) || [],
      }));
  }, [user, todayDay]);

  const totalStudents = myClasses.reduce((sum, c) => sum + c.students.length, 0);
  const totalSessions = myClasses.reduce((sum, c) => sum + (c.sessionsPerWeek || 0), 0);
  const todayCount = myClasses.filter(c => c.todaySessions.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute -top-8 -right-8 w-56 h-56" fill="currentColor" viewBox="0 0 200 200"><circle cx="150" cy="50" r="80" /></svg>
          <svg className="absolute -bottom-10 -left-6 w-44 h-44" fill="currentColor" viewBox="0 0 200 200"><circle cx="50" cy="150" r="60" /></svg>
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{t('teacher.dashboard.title')}</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{lang === 'ar' ? (user?.nameAr || user?.name) : (user?.nameEn || user?.name)}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                {myClasses.length} {t('teacher.dashboard.myClasses').toLowerCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                {totalStudents} {t('nav.students').toLowerCase()}
              </span>
            </div>
          </div>
          <div className="text-end">
            <p className="text-blue-100 font-semibold">{formatHijri(today, lang)}</p>
            <p className="text-blue-300 text-sm mt-0.5">{formatGregorian(today, lang)}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <button onClick={() => navigate('/teacher/students')} className="card p-5 flex flex-col gap-3 hover:scale-[1.03] hover:shadow-md transition-all duration-200 text-start">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-text)]">{totalStudents}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('teacher.dashboard.totalStudents')}</p>
          </div>
        </button>
        <div className="card p-5 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-text)]">{totalSessions}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('teacher.dashboard.sessions')}/wk</p>
          </div>
        </div>
        <div className="card p-5 flex flex-col gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-text)]">{todayCount}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('admin.dashboard.todayClasses')}</p>
          </div>
        </div>
      </div>

      {/* Class cards */}
      {myClasses.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
          <p className="text-[var(--color-text-muted)]">{t('common.noData')}</p>
        </div>
      ) : myClasses.map(cls => (
        <div key={cls.id} className="card overflow-hidden">
          {/* Class header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {cls.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text)]">{cls.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{cls.sessionsPerWeek} {t('teacher.dashboard.sessions').toLowerCase()}/wk</p>
              </div>
            </div>
            <div className="flex items-center gap-2">

              <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {cls.students.length} {t('nav.students').toLowerCase()}
              </span>
            </div>
          </div>

          {/* Schedule grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {DAYS.map(d => (
                    <th key={d} className={`px-3 py-2.5 text-center text-xs font-semibold whitespace-nowrap ${d === todayDay ? 'text-brand-green-600 dark:text-brand-green-400' : 'text-[var(--color-text-muted)]'}`}>
                      {t(`day.${d}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {DAYS.map(d => {
                    const session = cls.schedule?.find(s => s.day === d);
                    const isToday = d === todayDay;
                    return (
                      <td key={d} className={`px-3 py-4 text-center transition-colors ${isToday ? 'bg-brand-green-50 dark:bg-brand-green-900/20' : ''}`}>
                        {session ? (
                          session.timeType === 'prayer' ? (
                            <span className="text-xs text-brand-gold-600 dark:text-brand-gold-400 font-medium">{t(`prayer.${session.prayerRef}`)}</span>
                          ) : (
                            <div>
                              <span className="text-xs text-brand-green-600 dark:text-brand-green-400 font-semibold block">{session.startTime}</span>
                              <span className="text-xs text-[var(--color-text-muted)]">{session.endTime}</span>
                            </div>
                          )
                        ) : (
                          <span className="text-[var(--color-border)] text-lg">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherDashboard;
