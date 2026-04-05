import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { SURAHS, calcTotalHizbProgress } from '../../utils/quranData';
import { formatHijri, formatGregorian } from '../../utils/hijriDate';

const evalColors = {
  excellent: 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  average: 'bg-brand-gold-100 text-brand-gold-700 dark:bg-brand-gold-900/30 dark:text-brand-gold-400',
  repeat: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const StudentMemorization = () => {
  const { user } = useAuth();
  const { t, lang, dir } = useLanguage();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const myClass = storage.findOne(KEYS.CLASSES, c => c.studentIds?.includes(user?.id));

  const records = useMemo(() => {
    let all = storage.getAll(KEYS.MEMORIZATION).filter(m => m.studentId === user?.id);
    if (dateFrom) all = all.filter(m => m.date >= dateFrom);
    if (dateTo) all = all.filter(m => m.date <= dateTo);
    return all.map(m => {
      const surah = SURAHS.find(s => s.id === m.surahId);
      return { ...m, surahName: lang === 'ar' ? surah?.nameAr : surah?.nameEn };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [user, dateFrom, dateTo, lang]);

  const totalHizb = useMemo(() => {
    const all = storage.getAll(KEYS.MEMORIZATION).filter(m => m.studentId === user?.id);
    return calcTotalHizbProgress(all);
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('memo.title')}</h1>
        {myClass && <p className="page-subtitle">{myClass.name}</p>}
      </div>

      {/* Total progress */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">{t('memo.totalProgress')}</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-[var(--color-border)]" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="10"
                strokeDasharray={`${(Math.min(totalHizb, 60) / 60) * 251} 251`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-brand-gold-600">{totalHizb.toFixed(1)}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Hizb</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--color-text-muted)]">{t('quran.hizb')}</span>
                <span className="font-bold text-brand-gold-600">{totalHizb.toFixed(2)} / 60</span>
              </div>
              <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((totalHizb / 60) * 100, 100)}%`, background: 'linear-gradient(90deg, #16a34a, #f59e0b)' }} />
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{(totalHizb / 2).toFixed(2)} {t('quran.juz')} / 30</p>
          </div>
        </div>
      </div>

      {/* Date filter */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <div>
            <label className="label">{t('common.from')}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{t('common.to')}</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('memo.date')}</th>
              <th className="table-th">{t('memo.surah')}</th>
              <th className="table-th">{t('memo.fromAyah')} / {t('memo.toAyah')}</th>
              <th className="table-th">{t('quran.ayahs')}</th>
              <th className="table-th">{t('memo.evaluation')}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={5} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('memo.noRecords')}</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="table-row">
                <td className="table-td">
                  <div className="font-medium text-sm">{formatHijri(r.date, lang)}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{formatGregorian(r.date, lang)}</div>
                </td>
                <td className="table-td font-medium" style={{ fontFamily: lang === 'ar' ? "'Amiri', serif" : undefined }}>
                  {r.surahName}
                </td>
                <td className="table-td">
                  {dir === 'rtl' ? (
                    <>
                      <span className="font-semibold text-brand-green-600">{r.toAyah}</span>
                      <span className="text-[var(--color-text-muted)] mx-1">←</span>
                      <span className="font-semibold text-brand-green-600">{r.fromAyah}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-brand-green-600">{r.fromAyah}</span>
                      <span className="text-[var(--color-text-muted)] mx-1">→</span>
                      <span className="font-semibold text-brand-green-600">{r.toAyah}</span>
                    </>
                  )}
                </td>
                <td className="table-td font-medium">{r.toAyah - r.fromAyah + 1}</td>
                <td className="table-td">
                  <span className={`badge ${evalColors[r.evaluation]}`}>{t(`eval.${r.evaluation}`)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentMemorization;
