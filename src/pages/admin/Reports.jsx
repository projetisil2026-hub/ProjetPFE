import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { calcTotalHizbProgress } from '../../utils/quranData';
import { exportAdminReportPDF } from '../../utils/pdfExport';
import { ConfirmModal } from '../../components/common/Modal';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const AdminReports = () => {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [rankingScope, setRankingScope] = useState('global');
  const [rankingClass, setRankingClass] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { users, classes, attendance: allAttendance, memorization: allMemo, loadAll } = useData();

  useEffect(() => { loadAll(); }, [loadAll]);

  const classReports = useMemo(() => {
    return classes.map(cls => {
      const teacher = users.find(u => u.id === cls.teacherId);
      const students = users.filter(u => cls.studentIds?.includes(u.id));
      const clsAttend = allAttendance.filter(a => {
        const d = new Date(a.date);
        if (period === 'monthly') return a.classId === cls.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        return a.classId === cls.id && d.getFullYear() === selectedYear;
      });
      const clsMemo = allMemo.filter(m => {
        const d = new Date(m.date);
        if (period === 'monthly') return m.classId === cls.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        return m.classId === cls.id && d.getFullYear() === selectedYear;
      });

      const attendRate = clsAttend.length > 0
        ? Math.round((clsAttend.filter(a => a.status === 'present').length / clsAttend.length) * 100)
        : 0;
      const hizbProgress = calcTotalHizbProgress(clsMemo);

      return {
        id: cls.id,
        className: cls.name,
        teacherAr: teacher?.nameAr || teacher?.name || '—',
        teacherEn: teacher?.nameEn || teacher?.name || '—',
        teacher: teacher?.name || '—',
        students: students.length,
        attendance: attendRate,
        hizbProgress,
      };
    });
  }, [classes, users, allAttendance, allMemo, period, selectedMonth, selectedYear]);

  const monthlyProgress = useMemo(() => {
    return MONTHS.map(m => {
      const mMemo = allMemo.filter(memo => {
        const d = new Date(memo.date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === m;
      });
      return { month: m, hizb: calcTotalHizbProgress(mMemo) };
    });
  }, [allMemo, selectedYear]);

  const weakestClass = useMemo(() => {
    if (!classReports.length) return null;
    return classReports.reduce((min, c) => c.hizbProgress < min.hizbProgress ? c : min, classReports[0]);
  }, [classReports]);

  const studentRanking = useMemo(() => {
    let students = users.filter(u => u.role === 'student');
    if (rankingScope === 'class' && rankingClass) {
      const cls = classes.find(c => c.id === rankingClass);
      if (cls) students = students.filter(s => cls.studentIds?.includes(s.id));
    }

    return students.map(s => {
      const memos = allMemo.filter(m => m.studentId === s.id);
      const attends = allAttendance.filter(a => a.studentId === s.id);
      const hizbProgress = calcTotalHizbProgress(memos);
      const attendRate = attends.length > 0
        ? Math.round((attends.filter(a => a.status === 'present').length / attends.length) * 100)
        : 0;
      const cls = classes.find(c => c.studentIds?.includes(s.id));
      return { ...s, hizbProgress, attendance: attendRate, className: cls?.name || '—' };
    }).sort((a, b) => b.hizbProgress - a.hizbProgress);
  }, [users, allMemo, allAttendance, classes, rankingScope, rankingClass]);

  const handleExport = () => {
    exportAdminReportPDF({
      period: `${period === 'monthly' ? t(`month.${selectedMonth}`) + ' ' : ''}${selectedYear}`,
      classReports,
      rankingData: studentRanking,
    });
  };

  const rankColors = ['text-brand-gold-500', 'text-[var(--color-text-muted)]', 'text-amber-700'];

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('reports.title')}</h1>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {t('reports.exportPDF')}
        </button>
      </div>

      {/* Period selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">{t('reports.period')}</label>
            <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
              {['monthly','yearly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-brand-green-600 text-white' : 'text-[var(--color-text-muted)] hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20'}`}>
                  {t(`reports.${p}`)}
                </button>
              ))}
            </div>
          </div>
          {period === 'monthly' && (
            <div>
              <label className="label">{t('common.month')}</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="select w-36">
                {MONTHS.map(m => <option key={m} value={m}>{t(`month.${m}`)}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{t('common.year')}</label>
            <input type="number" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="input w-28" min="2020" max="2030" />
          </div>
        </div>
      </div>

      {/* Monthly Progress Chart */}
      {(() => {
        const maxHizb = Math.max(...monthlyProgress.map(m => m.hizb), 0.1);
        return (
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('reports.monthlyChart')} {selectedYear}</h3>
            <div className="flex items-end gap-1 h-32">
              {monthlyProgress.map(mp => (
                <div key={mp.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${period === 'monthly' && mp.month === selectedMonth ? 'bg-brand-gold-500' : 'bg-brand-green-500/60 dark:bg-brand-green-900/60'}`}
                    style={{ height: `${Math.max((mp.hizb / maxHizb) * 100, 4)}%` }}
                  />
                  <span className={`text-[10px] ${period === 'monthly' && mp.month === selectedMonth ? 'font-bold text-brand-gold-600' : 'text-[var(--color-text-muted)]'}`}>
                    {t(`month.${mp.month}`).slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Class Comparison */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('reports.classComparison')}</h3>

        {/* Bar chart */}
        <div className="space-y-3 mb-6">
          {classReports.map((cls, i) => (
            <div key={cls.id} className="flex items-center gap-3">
              <span className="text-sm font-medium w-28 truncate text-[var(--color-text)]">{cls.className}</span>
              <div className="flex-1 flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-brand-green-600">{t('attendance.rate')}</span>
                    <span className="text-xs font-semibold">{cls.attendance}%</span>
                  </div>
                  <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green-500 rounded-full" style={{ width: `${cls.attendance}%` }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-brand-gold-600">{t('memo.progress')}</span>
                    <span className="text-xs font-semibold">{cls.hizbProgress.toFixed(1)}</span>
                  </div>
                  <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gold-500 rounded-full" style={{ width: `${Math.min((cls.hizbProgress / 60) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="table-th">{t('classes.name')}</th>
                <th className="table-th">{t('common.teacher')}</th>
                <th className="table-th">{t('nav.students')}</th>
                <th className="table-th">{t('attendance.rate')}</th>
                <th className="table-th">{t('memo.progress')}</th>
              </tr>
            </thead>
            <tbody>
              {classReports.map(cls => (
                <tr key={cls.id} className={`table-row ${weakestClass?.id === cls.id ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  <td className="table-td font-medium">
                    {cls.className}
                    {weakestClass?.id === cls.id && <span className="ms-2 badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{t('reports.weakestClass')}</span>}
                  </td>
                  <td className="table-td text-[var(--color-text-muted)]">{lang === 'ar' ? cls.teacherAr : cls.teacherEn}</td>
                  <td className="table-td">{cls.students}</td>
                  <td className="table-td">
                    <span className={`font-semibold ${cls.attendance >= 80 ? 'text-brand-green-600' : cls.attendance >= 60 ? 'text-brand-gold-600' : 'text-red-500'}`}>
                      {cls.attendance}%
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="font-semibold text-brand-gold-600">{cls.hizbProgress.toFixed(2)}</span>
                    <span className="text-xs text-[var(--color-text-muted)] ms-1">/ 60</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Ranking */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-[var(--color-text)]">{t('reports.studentRanking')}</h3>
          <div className="flex gap-2">
            <button onClick={() => setRankingScope('global')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${rankingScope === 'global' ? 'bg-brand-green-600 text-white' : 'btn-ghost'}`}>
              {t('reports.globalRanking')}
            </button>
            <button onClick={() => setRankingScope('class')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${rankingScope === 'class' ? 'bg-brand-green-600 text-white' : 'btn-ghost'}`}>
              {t('reports.classRanking')}
            </button>
          </div>
        </div>

        {rankingScope === 'class' && (
          <select value={rankingClass} onChange={e => setRankingClass(e.target.value)} className="select max-w-xs mb-4">
            <option value="">{t('common.select')} {t('common.class')}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        <div className="space-y-2">
          {studentRanking.slice(0, 10).map((student, idx) => (
            <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-brand-green-300 transition-colors">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-brand-gold-100 dark:bg-brand-gold-900/30' : 'bg-[var(--color-border)]'} ${rankColors[idx] || 'text-[var(--color-text-muted)]'}`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text)] truncate">{lang === 'ar' ? (student.nameAr || student.name) : (student.nameEn || student.name)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{student.className}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-gold-600">{student.hizbProgress.toFixed(2)} Hizb</p>
                <p className="text-xs text-[var(--color-text-muted)]">{student.attendance}% {t('attendance.rate')}</p>
              </div>
            </div>
          ))}
          {studentRanking.length === 0 && (
            <p className="text-center text-[var(--color-text-muted)] py-6">{t('common.noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
