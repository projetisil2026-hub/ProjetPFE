import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { SURAHS, getSurahName, calcTotalHizbProgress } from '../../utils/quranData';
import { formatHijri } from '../../utils/hijriDate';

const AdminMemorization = () => {
  const { t, lang, dir } = useLanguage();
  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterSurah, setFilterSurah] = useState('');
  const [search, setSearch] = useState('');

  const classes = storage.getAll(KEYS.CLASSES);
  const users = storage.getAll(KEYS.USERS);

  const records = useMemo(() => {
    let all = storage.getAll(KEYS.MEMORIZATION);
    if (filterClass) all = all.filter(m => m.classId === filterClass);
    if (filterDate) all = all.filter(m => m.date === filterDate);
    if (filterSurah) all = all.filter(m => m.surahId === parseInt(filterSurah));

    return all.map(m => {
      const student = users.find(u => u.id === m.studentId);
      const cls = classes.find(c => c.id === m.classId);
      const surah = SURAHS.find(s => s.id === m.surahId);
      return {
        ...m,
        studentName: lang === 'ar' ? (student?.nameAr || student?.name || '?') : (student?.nameEn || student?.name || '?'),
        className: cls?.name || '?',
        surahName: lang === 'ar' ? surah?.nameAr : surah?.nameEn,
        ayahCount: m.toAyah - m.fromAyah + 1,
      };
    }).filter(m => {
      if (!search) return true;
      const s = users.find(u => u.id === m.studentId);
      const nameAr = s?.nameAr || s?.name || '';
      const nameEn = s?.nameEn || s?.name || '';
      return nameAr.toLowerCase().includes(search.toLowerCase()) ||
             nameEn.toLowerCase().includes(search.toLowerCase());
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filterClass, filterDate, filterSurah, search, users, classes, lang]);

  const evalColors = {
    excellent: 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400',
    good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    average: 'bg-brand-gold-100 text-brand-gold-700 dark:bg-brand-gold-900/30 dark:text-brand-gold-400',
    repeat: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('memo.title')}</h1>
        <p className="page-subtitle">{records.length} {t('common.total').toLowerCase()}</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('memo.search')} className="input" />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('common.class')}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterSurah} onChange={e => setFilterSurah(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('memo.surah')}</option>
            {SURAHS.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.nameAr : s.nameEn}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input" />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('common.class')}</th>
              <th className="table-th">{t('memo.date')}</th>
              <th className="table-th">{t('memo.surah')}</th>
              <th className="table-th">{t('memo.fromAyah')} - {t('memo.toAyah')}</th>
              <th className="table-th">{t('memo.evaluation')}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={6} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('memo.noRecords')}</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="table-row">
                <td className="table-td font-medium">{r.studentName}</td>
                <td className="table-td text-[var(--color-text-muted)]">{r.className}</td>
                <td className="table-td">
                  <div className="text-sm font-medium">{formatHijri(r.date, lang)}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{r.date}</div>
                </td>
                <td className="table-td font-medium" style={{ fontFamily: lang === 'ar' ? "'Amiri', serif" : undefined }}>
                  {r.surahName}
                </td>
                <td className="table-td">
                  {dir === 'rtl' ? (
                    <>
                      <span className="text-brand-green-600 font-medium">{r.toAyah}</span>
                      <span className="text-[var(--color-text-muted)] mx-1">←</span>
                      <span className="text-brand-green-600 font-medium">{r.fromAyah}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-brand-green-600 font-medium">{r.fromAyah}</span>
                      <span className="text-[var(--color-text-muted)] mx-1">→</span>
                      <span className="text-brand-green-600 font-medium">{r.toAyah}</span>
                    </>
                  )}
                  <span className="text-xs text-[var(--color-text-muted)] ms-1">({r.ayahCount})</span>
                </td>
                <td className="table-td">
                  <span className={`badge ${evalColors[r.evaluation] || ''}`}>{t(`eval.${r.evaluation}`)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMemorization;
