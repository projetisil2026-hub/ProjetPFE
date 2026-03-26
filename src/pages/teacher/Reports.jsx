import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { calcTotalHizbProgress } from '../../utils/quranData';
import { exportMemorizationPDF, exportAttendancePDF } from '../../utils/pdfExport';
import { generateId } from '../../utils/auth';
import { SURAHS } from '../../utils/quranData';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const TeacherReports = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const myClasses = useMemo(() => storage.getAll(KEYS.CLASSES).filter(c => c.teacherId === user?.id), [user]);
  const allUsers = storage.getAll(KEYS.USERS);
  const activeClass = myClasses.find(c => c.id === selectedClass) || myClasses[0];

  useMemo(() => {
    if (!selectedClass && myClasses[0]) setSelectedClass(myClasses[0].id);
  }, [myClasses, selectedClass]);

  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return allUsers.filter(u => activeClass.studentIds?.includes(u.id));
  }, [activeClass, allUsers]);

  const stats = useMemo(() => {
    if (!activeClass) return null;
    const allAttend = storage.getAll(KEYS.ATTENDANCE).filter(a => {
      const d = new Date(a.date);
      return a.classId === activeClass.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    const allMemo = storage.getAll(KEYS.MEMORIZATION).filter(m => {
      const d = new Date(m.date);
      return m.classId === activeClass.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });

    const studentStats = classStudents.map(s => {
      const sAttend = allAttend.filter(a => a.studentId === s.id);
      const sMemo = allMemo.filter(m => m.studentId === s.id);
      const hizb = calcTotalHizbProgress(sMemo);
      const rate = sAttend.length > 0 ? Math.round((sAttend.filter(a => a.status === 'present').length / sAttend.length) * 100) : 0;
      return { ...s, attendance: rate, hizbProgress: hizb, memoCount: sMemo.length };
    }).sort((a, b) => b.hizbProgress - a.hizbProgress);

    return { studentStats, totalAttend: allAttend, totalMemo: allMemo };
  }, [activeClass, classStudents, selectedMonth, selectedYear]);

  // Load existing notes
  const existingNote = storage.findOne(KEYS.MONTHLY_NOTES, n =>
    n.teacherId === user?.id && n.classId === activeClass?.id &&
    n.month === selectedMonth && n.year === selectedYear
  );

  const handleSaveNotes = () => {
    if (!activeClass) return;
    if (existingNote) {
      storage.update(KEYS.MONTHLY_NOTES, existingNote.id, { notes });
    } else {
      storage.add(KEYS.MONTHLY_NOTES, {
        id: generateId(),
        teacherId: user.id,
        classId: activeClass.id,
        month: selectedMonth,
        year: selectedYear,
        notes,
        createdAt: new Date().toISOString(),
      });
    }
    showToast(t('common.success'));
  };

  // Check if current date is end of month
  const now = new Date();
  const isEndOfMonth = now.getDate() >= 25;

  const handleExportPDF = () => {
    if (!isEndOfMonth) { showToast(t('reports.endOfMonth')); return; }
    if (!activeClass || !stats) return;

    const allMemo = storage.getAll(KEYS.MEMORIZATION).filter(m => {
      const d = new Date(m.date);
      return m.classId === activeClass.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });

    stats.studentStats.forEach(s => {
      const sMemo = allMemo.filter(m => m.studentId === s.id);
      const records = sMemo.map(m => {
        const surah = SURAHS.find(su => su.id === m.surahId);
        return { ...m, surahName: lang === 'ar' ? surah?.nameAr : surah?.nameEn };
      });
      exportMemorizationPDF({
        title: `${t('memo.title')} - ${t(`month.${selectedMonth}`)} ${selectedYear}`,
        studentName: s.name,
        classN: activeClass.name,
        records,
        totalHizb: s.hizbProgress,
        lang,
      });
    });
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>}

      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="page-title">{t('reports.title')}</h1></div>
        <button onClick={handleExportPDF} disabled={!isEndOfMonth} className="btn-secondary disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {t('reports.exportPDF')}
          {!isEndOfMonth && <span className="text-xs opacity-75 ms-1">(end of month)</span>}
        </button>
      </div>

      {/* Period selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">{t('common.class')}</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="select w-48">
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('common.month')}</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="select w-36">
              {MONTHS.map(m => <option key={m} value={m}>{t(`month.${m}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('common.year')}</label>
            <input type="number" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="input w-28" min="2020" max="2030" />
          </div>
        </div>
      </div>

      {/* Student stats */}
      {stats && (
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--color-text)] mb-4">
            {activeClass?.name} — {t(`month.${selectedMonth}`)} {selectedYear}
          </h3>
          <div className="space-y-3">
            {stats.studentStats.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)]">
                <span className="w-7 h-7 rounded-lg bg-brand-gold-100 dark:bg-brand-gold-900/30 text-brand-gold-700 dark:text-brand-gold-400 flex items-center justify-center text-xs font-bold">
                  #{idx + 1}
                </span>
                <span className="flex-1 font-medium text-[var(--color-text)]">{s.name}</span>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-[var(--color-text-muted)]">{t('attendance.rate')}</p>
                    <p className={`font-semibold ${s.attendance >= 80 ? 'text-brand-green-600' : 'text-red-500'}`}>{s.attendance}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--color-text-muted)]">{t('quran.hizb')}</p>
                    <p className="font-semibold text-brand-gold-600">{s.hizbProgress.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--color-text-muted)]">{t('memo.title')}</p>
                    <p className="font-semibold text-blue-600">{s.memoCount}</p>
                  </div>
                </div>
              </div>
            ))}
            {stats.studentStats.length === 0 && (
              <p className="text-center text-[var(--color-text-muted)] py-4">{t('common.noData')}</p>
            )}
          </div>
        </div>
      )}

      {/* Monthly Notes */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">{t('reports.monthlyNotes')}</h3>
        <textarea
          value={notes || existingNote?.notes || ''}
          onChange={e => setNotes(e.target.value)}
          className="input min-h-[120px] resize-none"
          placeholder={t('reports.addNotes')}
        />
        <div className="flex justify-end mt-3">
          <button onClick={handleSaveNotes} className="btn-primary">{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
