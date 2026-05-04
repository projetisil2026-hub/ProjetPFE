import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { calcTotalHizbProgress } from '../../utils/quranData';

const ParentDashboard = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { users, classes, memorization, loadAll } = useData();
  const navigate = useNavigate();
  const [selectedChildId, setSelectedChildId] = useState('');

  useEffect(() => { loadAll(); }, [loadAll]);

  const children = useMemo(() => {
    return users.filter(u => user?.childrenIds?.includes(u.id));
  }, [users, user]);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];

  const childData = useMemo(() => {
    if (!selectedChild) return null;
    const myClass = classes.find(c => c.studentIds?.includes(selectedChild.id));
    const teacher = myClass ? users.find(u => u.id === myClass.teacherId) : null;
    const memos = memorization.filter(m => m.studentId === selectedChild.id);
    const hizbProgress = calcTotalHizbProgress(memos);
    return { myClass, teacher, hizbProgress };
  }, [selectedChild, classes, users, memorization]);

  const parentName = lang === 'ar' ? (user?.nameAr || user?.name) : (user?.nameEn || user?.name);
  const childName = (child) => lang === 'ar' ? (child?.nameAr || child?.name) : (child?.nameEn || child?.name);
  const teacherName = lang === 'ar'
    ? (childData?.teacher?.nameAr || childData?.teacher?.name)
    : (childData?.teacher?.nameEn || childData?.teacher?.name);

  const pct = childData ? Math.min((childData.hizbProgress / 60) * 100, 100) : 0;

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-gold-500 via-amber-600 to-amber-800 p-6 text-white shadow-lg animate-fade-in-up">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute -top-8 -right-8 w-56 h-56" fill="currentColor" viewBox="0 0 200 200"><circle cx="150" cy="50" r="80"/></svg>
          <svg className="absolute -bottom-10 -left-6 w-44 h-44" fill="currentColor" viewBox="0 0 200 200"><circle cx="50" cy="150" r="60"/></svg>
        </div>
        <div className="relative">
          <p className="text-amber-200 text-sm font-medium mb-1">{t('parent.dashboard.title')}</p>
          <h1 className="text-2xl sm:text-3xl font-bold">{parentName}</h1>
          <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {children.length} {t('parents.children').toLowerCase()}
          </span>
        </div>
      </div>

      {children.length === 0 && (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <p className="text-[var(--color-text-muted)]">{t('common.noData')}</p>
        </div>
      )}

      {children.length > 0 && (
        <>
          {/* Child selector */}
          <div className="card p-5 animate-fade-in-up delay-75">
            <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">{t('parent.dashboard.selectChild')}</p>
            <div className="flex flex-wrap gap-3">
              {children.map(child => {
                const isSelected = selectedChild?.id === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand-gold-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm'
                        : 'border-[var(--color-border)] hover:border-amber-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${isSelected ? 'bg-brand-gold-500' : 'bg-[var(--color-text-muted)]'}`}>
                      {(childName(child) || '?').charAt(0)}
                    </div>
                    <div className="text-start">
                      <p className={`font-semibold text-sm ${isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--color-text)]'}`}>
                        {childName(child)}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{t('common.age')}: {child.age}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedChild && childData && (
            <>
              {/* Hizb progress */}
              <div
                className="card p-5 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 group animate-fade-in-up delay-150"
                onClick={() => navigate('/parent/memorization')}
              >
                <h3 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </span>
                  {t('student.dashboard.hizbProgress')} — {childName(selectedChild)}
                  <svg className="w-3.5 h-3.5 ms-auto text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </h3>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" strokeWidth="10" className="text-[var(--color-border)]"/>
                      <circle cx="48" cy="48" r="38" fill="none" stroke="#16a34a" strokeWidth="10"
                        strokeDasharray={`${(pct / 100) * 238.76} 238.76`} strokeLinecap="round" className="transition-all duration-700"/>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-brand-green-600">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--color-text-muted)]">{t('memo.progress')}</span>
                      <span className="font-bold text-brand-green-600">{childData.hizbProgress.toFixed(1)} / 60 {t('quran.hizb')}</span>
                    </div>
                    <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div className="hizb-progress h-full transition-all duration-700 rounded-full" style={{ width: `${pct}%` }}/>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">= {(childData.hizbProgress / 2).toFixed(1)} {t('quran.juz')} {t('common.from')} 30</p>
                  </div>
                </div>
              </div>

              {/* Class & Teacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up delay-225">
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>
                    </span>
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('nav.classes')}</p>
                  </div>
                  {childData.myClass ? (
                    <div className="space-y-1.5">
                      <p className="text-xl font-bold text-[var(--color-text)]">{childData.myClass.name}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {childData.myClass.sessionsPerWeek} {t('teacher.dashboard.sessions').toLowerCase()}/wk
                      </p>
                      {childData.myClass.schedule?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {childData.myClass.schedule.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                              <span className="font-semibold text-purple-600 dark:text-purple-400">{t(`day.${s.day}`)}</span>
                              <span>
                                {s.timeType === 'prayer' ? t(`prayer.${s.prayerRef}`) : `${s.startTime} – ${s.endTime}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : <p className="text-[var(--color-text-muted)] text-sm">—</p>}
                </div>

                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </span>
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('common.teacher')}</p>
                  </div>
                  {childData.teacher ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(teacherName || 'T').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{teacherName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{t('role.teacher')}</p>
                      </div>
                    </div>
                  ) : <p className="text-[var(--color-text-muted)] text-sm">—</p>}
                </div>
              </div>

              {/* Schedule */}
              {childData.myClass?.schedule?.length > 0 && (
                <div className="card p-5 animate-fade-in-up delay-300">
                  <h3 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </span>
                    {t('parent.dashboard.childSchedule')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {childData.myClass.schedule.map((s, i) => (
                      <div key={i} className="p-3.5 rounded-xl border-2 border-teal-100 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-900/10">
                        <p className="font-bold text-teal-700 dark:text-teal-400 text-sm">{t(`day.${s.day}`)}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {s.timeType === 'prayer' ? t(`prayer.${s.prayerRef}`) : `${s.startTime} – ${s.endTime}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
