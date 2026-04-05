import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { formatHijri, formatGregorian } from '../../utils/hijriDate';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const ParentAttendance = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYearId, setFilterYearId] = useState('');

  const children = useMemo(() => {
    return storage.getAll(KEYS.USERS).filter(u => user?.childrenIds?.includes(u.id));
  }, [user]);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];
  const academicYears = storage.getAll(KEYS.ACADEMIC_YEARS);

  const records = useMemo(() => {
    if (!selectedChild) return [];
    let all = storage.getAll(KEYS.ATTENDANCE).filter(a => a.studentId === selectedChild.id);
    if (filterYearId) all = all.filter(a => a.academicYearId === filterYearId);
    if (filterMonth) all = all.filter(a => new Date(a.date).getMonth() + 1 === parseInt(filterMonth));
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedChild, filterMonth, filterYearId]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = total - present;
    return { total, present, absent, rate: total ? Math.round((present / total) * 100) : 0 };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">{t('attendance.title')}</h1></div>

      {/* Child selector */}
      <div className="card p-4">
        <label className="label">{t('parent.dashboard.selectChild')}</label>
        <div className="flex flex-wrap gap-2">
          {children.map(c => (
            <button key={c.id} onClick={() => setSelectedChildId(c.id)}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedChild?.id === c.id ? 'border-brand-green-600 bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-700' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-brand-green-300'}`}>
              {c.nameAr || c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedChild && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('attendance.total'), value: stats.total, color: 'bg-blue-600' },
              { label: t('attend.present'), value: stats.present, color: 'bg-brand-green-600' },
              { label: t('attend.absent'), value: stats.absent, color: 'bg-red-500' },
              { label: t('attendance.rate'), value: `${stats.rate}%`, color: stats.rate >= 80 ? 'bg-brand-green-600' : 'bg-brand-gold-500' },
            ].map((s, i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white font-bold text-sm`}>{s.value}</div>
                <span className="text-sm text-[var(--color-text-muted)]">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="select">
                <option value="">{t('attendance.filterMonth')}</option>
                {MONTHS.map(m => <option key={m} value={m}>{t(`month.${m}`)}</option>)}
              </select>
              <select value={filterYearId} onChange={e => setFilterYearId(e.target.value)} className="select">
                <option value="">{t('attendance.filterYear')}</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="table-th">{t('attendance.day')}</th>
                  <th className="table-th">{t('attendance.hijriDate')}</th>
                  <th className="table-th">{t('attendance.date')}</th>
                  <th className="table-th">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={4} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('attendance.noRecords')}</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="table-td font-medium">{t(`day.${DAY_NAMES[new Date(r.date).getDay()]}`)}</td>
                    <td className="table-td font-medium">{formatHijri(r.date, lang)}</td>
                    <td className="table-td text-xs text-[var(--color-text-muted)]">{formatGregorian(r.date, lang)}</td>
                    <td className="table-td">
                      <span className={`badge ${r.status === 'present' ? 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {t(`attend.${r.status}`)}
                      </span>
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

export default ParentAttendance;
