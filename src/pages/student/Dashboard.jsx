import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { calcTotalHizbProgress } from '../../utils/quranData';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { users, classes, memorization, academicYears, loadAll } = useData();
  const navigate = useNavigate();
  const [selectedYearId, setSelectedYearId] = useState('');

  useEffect(() => { loadAll(); }, [loadAll]);

  const activeYear = academicYears.find(y => y.isActive);
  const displayYear = selectedYearId
    ? academicYears.find(y => y.id === selectedYearId)
    : activeYear;

  const myClass = useMemo(() => (
    classes.find(c => c.studentIds?.includes(user?.id))
  ), [classes, user]);

  const myTeacher = useMemo(() => {
    if (!myClass) return null;
    return users.find(u => u.id === myClass.teacherId);
  }, [myClass, users]);

  const hizbProgress = useMemo(() => {
    const memos = memorization.filter(m => {
      if (m.studentId !== user?.id) return false;
      if (displayYear && m.academicYearId !== displayYear.id) return false;
      return true;
    });
    return calcTotalHizbProgress(memos);
  }, [user, displayYear, memorization]);

  const pct = Math.min((hizbProgress / 60) * 100, 100);
  const circumference = 2 * Math.PI * 42;
  const displayName = lang === 'ar' ? (user?.nameAr || user?.name) : (user?.nameEn || user?.name);
  const teacherName = lang === 'ar' ? (myTeacher?.nameAr || myTeacher?.name) : (myTeacher?.nameEn || myTeacher?.name);

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green-600 via-brand-green-700 to-brand-green-900 p-6 text-white shadow-lg animate-fade-in-up">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute -top-8 -right-8 w-56 h-56" fill="currentColor" viewBox="0 0 200 200"><circle cx="150" cy="50" r="80"/></svg>
          <svg className="absolute -bottom-10 -left-6 w-44 h-44" fill="currentColor" viewBox="0 0 200 200"><circle cx="50" cy="150" r="60"/></svg>
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-brand-green-200 text-sm font-medium mb-1">{t('student.dashboard.title')}</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
            {myClass && (
              <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>
                {myClass.name}
              </span>
            )}
          </div>
          <div>
            <label className="text-brand-green-200 text-xs font-medium block mb-1">{t('student.dashboard.selectYear')}</label>
            <select
              value={selectedYearId}
              onChange={e => setSelectedYearId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-sm border border-white/30 focus:outline-none focus:border-white backdrop-blur-sm cursor-pointer"
            >
              <option value="" className="text-[var(--color-text)] bg-[var(--color-surface)]">{t('year.active')}</option>
              {academicYears.map(y => (
                <option key={y.id} value={y.id} className="text-[var(--color-text)] bg-[var(--color-surface)]">{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hizb progress */}
      <div
        className="card p-6 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 group animate-fade-in-up delay-75"
        onClick={() => navigate('/student/memorization')}
        title={t('nav.memorization')}
      >
        <h3 className="font-semibold text-[var(--color-text)] mb-5 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </span>
          {t('student.dashboard.hizbProgress')}
          <svg className="w-4 h-4 ms-auto text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </h3>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-[var(--color-border)]"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progress-grad)" strokeWidth="10"
                strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
                strokeLinecap="round" className="transition-all duration-700"/>
              <defs>
                <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#16a34a"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-brand-green-600">{hizbProgress.toFixed(1)}</span>
              <span className="text-xs text-[var(--color-text-muted)]">/ 60</span>
            </div>
          </div>

          <div className="flex-1 min-w-[160px] space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-[var(--color-text-muted)]">{t('memo.progress')}</span>
                <span className="font-bold text-brand-green-600">{Math.round(pct)}%</span>
              </div>
              <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="hizb-progress h-full transition-all duration-700 rounded-full" style={{ width: `${pct}%` }}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-brand-green-50 dark:bg-brand-green-900/20 text-center">
                <p className="text-lg font-bold text-brand-green-600">{hizbProgress.toFixed(1)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t('quran.hizb')}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
                <p className="text-lg font-bold text-amber-600">{(hizbProgress / 2).toFixed(1)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t('quran.juz')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class & Teacher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up delay-150">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>
            </span>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('student.dashboard.myClass')}</p>
          </div>
          {myClass ? (
            <div className="space-y-1.5">
              <p className="text-xl font-bold text-[var(--color-text)]">{myClass.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {myClass.sessionsPerWeek} {t('teacher.dashboard.sessions').toLowerCase()}/wk
              </p>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm">—</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </span>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('student.dashboard.myTeacher')}</p>
          </div>
          {myTeacher ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(teacherName || 'T').charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">{teacherName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t('role.teacher')}</p>
              </div>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm">—</p>
          )}
        </div>
      </div>

      {/* Schedule */}
      {myClass?.schedule?.length > 0 && (
        <div className="card p-5 animate-fade-in-up delay-225">
          <h3 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </span>
            {t('student.dashboard.schedule')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {myClass.schedule.map((s, i) => (
              <div key={i} className="p-3.5 rounded-xl border-2 border-brand-green-100 dark:border-brand-green-900/40 bg-brand-green-50/50 dark:bg-brand-green-900/10">
                <p className="font-bold text-brand-green-700 dark:text-brand-green-400 text-sm">{t(`day.${s.day}`)}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {s.timeType === 'prayer' ? t(`prayer.${s.prayerRef}`) : `${s.startTime} – ${s.endTime}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
