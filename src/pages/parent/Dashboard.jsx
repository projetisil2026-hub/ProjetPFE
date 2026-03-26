import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { calcTotalHizbProgress } from '../../utils/quranData';

const ParentDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedChildId, setSelectedChildId] = useState('');

  const children = useMemo(() => {
    const allUsers = storage.getAll(KEYS.USERS);
    return allUsers.filter(u => user?.childrenIds?.includes(u.id));
  }, [user]);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];

  const childData = useMemo(() => {
    if (!selectedChild) return null;
    const myClass = storage.findOne(KEYS.CLASSES, c => c.studentIds?.includes(selectedChild.id));
    const teacher = myClass ? storage.findOne(KEYS.USERS, u => u.id === myClass.teacherId) : null;
    const memos = storage.getAll(KEYS.MEMORIZATION).filter(m => m.studentId === selectedChild.id);
    const hizbProgress = calcTotalHizbProgress(memos);
    return { myClass, teacher, hizbProgress };
  }, [selectedChild]);

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('parent.dashboard.title')}</h1>
        </div>
      </div>

      {/* Child selector */}
      <div className="card p-5">
        <label className="label">{t('parent.dashboard.selectChild')}</label>
        <div className="flex flex-wrap gap-3">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${(selectedChild?.id === child.id) ? 'border-brand-green-600 bg-brand-green-50 dark:bg-brand-green-900/20' : 'border-[var(--color-border)] hover:border-brand-green-300'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-bold">
                {child.name.charAt(0)}
              </div>
              <div className="text-start">
                <p className="font-semibold text-[var(--color-text)]">{child.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t('common.age')}: {child.age}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedChild && childData && (
        <>
          {/* Class & Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="text-sm text-[var(--color-text-muted)] mb-2">{t('nav.classes')}</p>
              {childData.myClass ? (
                <div>
                  <p className="text-xl font-bold text-brand-green-600">{childData.myClass.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{childData.myClass.sessionsPerWeek} sessions/week</p>
                </div>
              ) : <p className="text-[var(--color-text-muted)]">—</p>}
            </div>
            <div className="card p-5">
              <p className="text-sm text-[var(--color-text-muted)] mb-2">{t('common.teacher')}</p>
              {childData.teacher ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                    {childData.teacher.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-[var(--color-text)]">{childData.teacher.name}</p>
                </div>
              ) : <p className="text-[var(--color-text-muted)]">—</p>}
            </div>
          </div>

          {/* Schedule */}
          {childData.myClass?.schedule?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('parent.dashboard.childSchedule')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {childData.myClass.schedule.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl border border-[var(--color-border)]">
                    <p className="font-semibold text-brand-green-600">{t(`day.${s.day}`)}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {s.timeType === 'prayer' ? t(`prayer.${s.prayerRef}`) : `${s.startTime} – ${s.endTime}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {children.length === 0 && (
        <div className="card p-10 text-center text-[var(--color-text-muted)]">
          {t('common.noData')}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
