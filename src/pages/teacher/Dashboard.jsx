import { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { storage, KEYS } from '../../utils/storage';
import { formatGregorian } from '../../utils/hijriDate';

const TeacherDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const myClasses = useMemo(() => {
    const classes = storage.getAll(KEYS.CLASSES);
    const users = storage.getAll(KEYS.USERS);
    return classes
      .filter(c => c.teacherId === user?.id)
      .map(cls => ({
        ...cls,
        students: users.filter(u => cls.studentIds?.includes(u.id)),
      }));
  }, [user]);

  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const todayDay = dayNames[new Date().getDay()];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('teacher.dashboard.title')}</h1>
        <p className="page-subtitle">{formatGregorian(new Date())}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-bold text-xl">
            {myClasses.length}
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{t('teacher.dashboard.myClasses')}</p>
            <p className="text-xl font-bold text-[var(--color-text)]">{myClasses.reduce((sum, c) => sum + c.sessionsPerWeek, 0)} {t('teacher.dashboard.sessions').toLowerCase()}/week</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-gold-500 flex items-center justify-center text-white font-bold text-xl">
            {myClasses.reduce((sum, c) => sum + c.students.length, 0)}
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{t('nav.students')}</p>
            <p className="text-xl font-bold text-[var(--color-text)]">{t('common.total')}</p>
          </div>
        </div>
      </div>

      {/* Each class schedule */}
      {myClasses.length === 0 ? (
        <div className="card p-10 text-center text-[var(--color-text-muted)]">
          {t('common.noData')}
        </div>
      ) : myClasses.map(cls => (
        <div key={cls.id} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">{cls.name}</h3>
            <span className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">
              {cls.students.length} {t('nav.students').toLowerCase()}
            </span>
          </div>

          {/* Schedule table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {DAYS.map(d => (
                    <th key={d} className={`px-3 py-2 text-center text-xs font-semibold ${d === todayDay ? 'text-brand-green-600' : 'text-[var(--color-text-muted)]'}`}>
                      {t(`day.${d}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {DAYS.map(d => {
                    const session = cls.schedule?.find(s => s.day === d);
                    return (
                      <td key={d} className={`px-3 py-3 text-center ${d === todayDay ? 'bg-brand-green-50 dark:bg-brand-green-900/20 rounded-lg' : ''}`}>
                        {session ? (
                          <div>
                            {session.timeType === 'prayer' ? (
                              <span className="text-xs text-brand-gold-600 font-medium">{t(`prayer.${session.prayerRef}`)}</span>
                            ) : (
                              <span className="text-xs text-brand-green-600 font-medium">{session.startTime}–{session.endTime}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--color-border)]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Student list */}
          <div className="mt-4 flex flex-wrap gap-2">
            {cls.students.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm">
                <span className="w-5 h-5 rounded-lg bg-brand-green-600 flex items-center justify-center text-white text-xs font-bold">
                  {s.name.charAt(0)}
                </span>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherDashboard;
