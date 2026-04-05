import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { SURAHS, calcTotalHizbProgress } from '../../utils/quranData';
import { exportProgressReportPDF } from '../../utils/pdfExport';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const ParentReports = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const children = useMemo(() => {
    return storage.getAll(KEYS.USERS).filter(u => user?.childrenIds?.includes(u.id));
  }, [user]);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];
  const childClass = selectedChild ? storage.findOne(KEYS.CLASSES, c => c.studentIds?.includes(selectedChild.id)) : null;
  const childTeacher = childClass ? storage.findOne(KEYS.USERS, u => u.id === childClass.teacherId) : null;

  const stats = useMemo(() => {
    if (!selectedChild) return null;

    const allAttend = storage.getAll(KEYS.ATTENDANCE).filter(a => {
      const d = new Date(a.date);
      return a.studentId === selectedChild.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    const allMemo = storage.getAll(KEYS.MEMORIZATION).filter(m => {
      const d = new Date(m.date);
      return m.studentId === selectedChild.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    const allMemoTotal = storage.getAll(KEYS.MEMORIZATION).filter(m => m.studentId === selectedChild.id);

    const total = allAttend.length;
    const present = allAttend.filter(a => a.status === 'present').length;
    const hizbMonth = calcTotalHizbProgress(allMemo);
    const hizbTotal = calcTotalHizbProgress(allMemoTotal);

    // Yearly trend
    const yearlyMemo = storage.getAll(KEYS.MEMORIZATION).filter(m => {
      const d = new Date(m.date);
      return m.studentId === selectedChild.id && d.getFullYear() === selectedYear;
    });
    const monthlyProgress = MONTHS.map(m => {
      const mMemo = yearlyMemo.filter(memo => new Date(memo.date).getMonth() + 1 === m);
      return { month: m, hizb: calcTotalHizbProgress(mMemo) };
    });

    // Teacher notes
    const teacherNote = childTeacher ? storage.findOne(KEYS.MONTHLY_NOTES, n =>
      n.teacherId === childTeacher.id && n.classId === childClass?.id &&
      n.month === selectedMonth && n.year === selectedYear
    ) : null;

    return {
      attendance: { total, present, absent: total - present, rate: total ? Math.round((present / total) * 100) : 0 },
      hizbMonth, hizbTotal, monthlyProgress, teacherNote: teacherNote?.notes,
    };
  }, [selectedChild, selectedMonth, selectedYear, childClass, childTeacher]);

  const isEndOfMonth = new Date().getDate() >= 25;

  const schoolInfo = storage.get('tatabu_school_info', {});

  const handleExport = () => {
    if (!isEndOfMonth) return;
    if (!selectedChild || !stats) return;
    exportProgressReportPDF({
      child: selectedChild,
      attendanceStats: stats.attendance,
      memoProgress: stats.hizbTotal,
      teacherNotes: stats.teacherNote,
      classN: childClass?.name,
      period: `${t(`month.${selectedMonth}`)} ${selectedYear}`,
      schoolName: schoolInfo.name,
      country: schoolInfo.country,
      region: schoolInfo.region,
      teacherName: childTeacher ? (childTeacher.nameAr || childTeacher.name) : undefined,
    });
  };

  const maxHizb = stats?.monthlyProgress ? Math.max(...stats.monthlyProgress.map(m => m.hizb), 0.1) : 1;

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="page-title">{t('reports.title')}</h1></div>
        <button onClick={handleExport} disabled={!isEndOfMonth} className="btn-secondary disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {t('reports.exportPDF')}
        </button>
      </div>

      {/* Child + Period selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">{t('parent.dashboard.selectChild')}</label>
            <div className="flex flex-wrap gap-2">
              {children.map(c => (
                <button key={c.id} onClick={() => setSelectedChildId(c.id)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${selectedChild?.id === c.id ? 'border-brand-green-600 bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-700' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                  {c.nameAr || c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('common.month')}</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="select w-36">
              {MONTHS.map(m => <option key={m} value={m}>{t(`month.${m}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('reports.academicSeason')}</label>
            <input type="number" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="input w-28" min="2020" max="2030" />
          </div>
        </div>
      </div>

      {selectedChild && stats && (
        <>
          {/* Attendance summary */}
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('reports.attendanceDiscipline')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t('attendance.total'), value: stats.attendance.total, color: 'bg-blue-600' },
                { label: t('attend.present'), value: stats.attendance.present, color: 'bg-brand-green-600' },
                { label: t('attend.absent'), value: stats.attendance.absent, color: 'bg-red-500' },
                { label: t('attendance.rate'), value: `${stats.attendance.rate}%`, color: stats.attendance.rate >= 80 ? 'bg-brand-green-600' : 'bg-brand-gold-500' },
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-xl ${s.color} text-white text-center`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('reports.childProgress')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-brand-gold-50 dark:bg-brand-gold-900/20">
                <p className="text-sm text-brand-gold-700 dark:text-brand-gold-400">{t(`month.${selectedMonth}`)} {t('quran.hizb')}</p>
                <p className="text-3xl font-bold text-brand-gold-600">{stats.hizbMonth.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-green-50 dark:bg-brand-green-900/20">
                <p className="text-sm text-brand-green-700 dark:text-brand-green-400">{t('memo.totalProgress')}</p>
                <p className="text-3xl font-bold text-brand-green-600">{stats.hizbTotal.toFixed(2)}</p>
                <p className="text-xs text-brand-green-600/60">/ 60 {t('quran.hizb')}</p>
              </div>
            </div>
          </div>

          {/* Yearly chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('reports.yearlyProgress')} {selectedYear}</h3>
            <div className="flex items-end gap-1 h-32">
              {stats.monthlyProgress.map(mp => (
                <div key={mp.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${mp.month === selectedMonth ? 'bg-brand-gold-500' : 'bg-brand-green-500/60 dark:bg-brand-green-900/60'}`}
                    style={{ height: `${Math.max((mp.hizb / maxHizb) * 100, 4)}%` }}
                  />
                  <span className={`text-[10px] ${mp.month === selectedMonth ? 'font-bold text-brand-gold-600' : 'text-[var(--color-text-muted)]'}`}>
                    {t(`month.${mp.month}`).slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher notes */}
          {stats.teacherNote && (
            <div className="card p-5">
              <h3 className="font-semibold text-[var(--color-text)] mb-3">{t('reports.teacherNotes')}</h3>
              {childTeacher && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{(childTeacher.nameAr || childTeacher.name || '?').charAt(0)}</div>
                  <span className="text-sm font-medium">{childTeacher.nameAr || childTeacher.name}</span>
                </div>
              )}
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                {stats.teacherNote}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentReports;
