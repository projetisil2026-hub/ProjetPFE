import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { calcTotalHizbProgress } from '../../utils/quranData';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedYearId, setSelectedYearId] = useState('');

  const academicYears = storage.getAll(KEYS.ACADEMIC_YEARS);
  const activeYear = academicYears.find(y => y.isActive);
  const displayYear = selectedYearId ? academicYears.find(y => y.id === selectedYearId) : activeYear;

  const myClass = useMemo(() => {
    const classes = storage.getAll(KEYS.CLASSES);
    return classes.find(c => c.studentIds?.includes(user?.id));
  }, [user]);

  const myTeacher = useMemo(() => {
    if (!myClass) return null;
    return storage.findOne(KEYS.USERS, u => u.id === myClass.teacherId);
  }, [myClass]);

  const hizbProgress = useMemo(() => {
    const memos = storage.getAll(KEYS.MEMORIZATION).filter(m => {
      if (m.studentId !== user?.id) return false;
      if (displayYear && m.academicYearId !== displayYear.id) return false;
      return true;
    });
    return calcTotalHizbProgress(memos);
  }, [user, displayYear]);

  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('student.dashboard.title')}</h1>
          <p className="page-subtitle">{user?.name}</p>
        </div>
        <div>
          <label className="label">{t('student.dashboard.selectYear')}</label>
          <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)} className="select w-44">
            <option value="">{t('year.active')}</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
      </div>

      {/* Progress card */}
      <div className="card p-6">
        <h3 className="font-semibold text-[var(--color-text)] mb-5">{t('student.dashboard.hizbProgress')}</h3>
        <div className="flex items-center gap-6">
          {/* Circle progress */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-[var(--color-border)]" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#16a34a" strokeWidth="10"
                strokeDasharray={`${(Math.min(hizbProgress, 60) / 60) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-brand-green-600">{hizbProgress.toFixed(1)}</span>
              <span className="text-xs text-[var(--color-text-muted)]">/ 60 {t('quran.hizb')}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--color-text-muted)]">{t('memo.progress')}</span>
                <span className="font-semibold text-brand-green-600">{Math.round((hizbProgress / 60) * 100)}%</span>
              </div>
              <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="hizb-progress h-full transition-all duration-500" style={{ width: `${Math.min((hizbProgress / 60) * 100, 100)}%` }} />
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              {hizbProgress.toFixed(2)} {t('quran.hizb')} {t('common.from')} 60 {t('common.total').toLowerCase()}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              = {(hizbProgress / 2).toFixed(2)} {t('quran.juz')} {t('common.from')} 30
            </p>
          </div>
        </div>
      </div>

      {/* Class & Teacher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{t('student.dashboard.myClass')}</p>
          {myClass ? (
            <div>
              <p className="text-xl font-bold text-brand-green-600">{myClass.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{myClass.sessionsPerWeek} sessions/week</p>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)]">—</p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{t('student.dashboard.myTeacher')}</p>
          {myTeacher ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">{myTeacher.name.charAt(0)}</div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">{myTeacher.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t('role.teacher')}</p>
              </div>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)]">—</p>
          )}
        </div>
      </div>

      {/* Schedule */}
      {myClass && (
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('student.dashboard.schedule')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {myClass.schedule?.map((s, i) => (
              <div key={i} className="p-3 rounded-xl border border-[var(--color-border)] hover:border-brand-green-300 transition-colors">
                <p className="font-semibold text-brand-green-600">{t(`day.${s.day}`)}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
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
