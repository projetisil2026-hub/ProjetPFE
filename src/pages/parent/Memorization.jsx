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

const ParentMemorization = () => {
  const { user } = useAuth();
  const { t, lang, dir } = useLanguage();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const children = useMemo(() => {
    return storage.getAll(KEYS.USERS).filter(u => user?.childrenIds?.includes(u.id));
  }, [user]);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];

  const records = useMemo(() => {
    if (!selectedChild) return [];
    let all = storage.getAll(KEYS.MEMORIZATION).filter(m => m.studentId === selectedChild.id);
    if (dateFrom) all = all.filter(m => m.date >= dateFrom);
    if (dateTo) all = all.filter(m => m.date <= dateTo);
    return all.map(m => {
      const surah = SURAHS.find(s => s.id === m.surahId);
      return { ...m, surahName: lang === 'ar' ? surah?.nameAr : surah?.nameEn };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedChild, dateFrom, dateTo, lang]);

  const totalHizb = useMemo(() => {
    if (!selectedChild) return 0;
    const all = storage.getAll(KEYS.MEMORIZATION).filter(m => m.studentId === selectedChild.id);
    return calcTotalHizbProgress(all);
  }, [selectedChild]);

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">{t('memo.title')}</h1></div>

      {/* Child selector */}
      <div className="card p-4">
        <label className="label">{t('parent.dashboard.selectChild')}</label>
        <div className="flex flex-wrap gap-2">
          {children.map(c => (
            <button key={c.id} onClick={() => setSelectedChildId(c.id)}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedChild?.id === c.id ? 'border-brand-green-600 bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-700' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
              {c.nameAr || c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedChild && (
        <>
          {/* Progress */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">{selectedChild.nameAr || selectedChild.name} — {t('memo.totalProgress')}</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-muted)]">{t('quran.hizb')} {t('memo.progress')}</span>
                  <span className="font-bold text-brand-gold-600">{totalHizb.toFixed(2)} / 60</span>
                </div>
                <div className="h-4 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div className="hizb-progress h-full rounded-full" style={{ width: `${Math.min((totalHizb / 60) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="text-sm">
                <p className="font-bold text-xl text-brand-gold-600">{totalHizb.toFixed(1)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t('quran.hizb')}</p>
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

          {/* Table */}
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
                    <td className="table-td font-medium" style={{ fontFamily: lang === 'ar' ? "'Amiri', serif" : undefined }}>{r.surahName}</td>
                    <td className="table-td">
                      {dir === 'rtl' ? (
                        <>
                          <span className="font-semibold text-brand-green-600">{r.toAyah}</span>
                          <span className="mx-1 text-[var(--color-text-muted)]">←</span>
                          <span className="font-semibold text-brand-green-600">{r.fromAyah}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-brand-green-600">{r.fromAyah}</span>
                          <span className="mx-1 text-[var(--color-text-muted)]">→</span>
                          <span className="font-semibold text-brand-green-600">{r.toAyah}</span>
                        </>
                      )}
                    </td>
                    <td className="table-td">{r.toAyah - r.fromAyah + 1}</td>
                    <td className="table-td">
                      <span className={`badge ${evalColors[r.evaluation]}`}>{t(`eval.${r.evaluation}`)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentMemorization;
