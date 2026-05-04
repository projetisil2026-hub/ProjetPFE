import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { formatHijri } from '../../utils/hijriDate';

const AdminAttendance = () => {
  const { t, lang } = useLanguage();
  const { users, classes, attendance, loadAll } = useData();
  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadAll(); }, [loadAll]);

  const records = useMemo(() => {
    let all = attendance;
    if (filterClass) all = all.filter(a => a.classId === filterClass);
    if (filterDate) all = all.filter(a => a.date === filterDate);
    return all.map(a => {
      const student = users.find(u => u.id === a.studentId);
      const cls = classes.find(c => c.id === a.classId);
      return { ...a, studentName: student?.nameAr || student?.name || '?', className: cls?.name || '?' };
    }).filter(a => !search || a.studentName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, users, classes, filterClass, filterDate, search]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = total - present;
    return { total, present, absent, rate: total ? Math.round((present / total) * 100) : 0 };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('attendance.title')}</h1>
        <p className="page-subtitle">{records.length} {t('common.total').toLowerCase()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t('attend.present'), value: stats.present, color: 'bg-brand-green-600' },
          { label: t('attend.absent'), value: stats.absent, color: 'bg-red-500' },
          { label: t('attendance.rate'), value: `${stats.rate}%`, color: 'bg-brand-gold-500' },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white font-bold text-lg`}>{s.value}</div>
            <span className="text-sm text-[var(--color-text-muted)]">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('attendance.search')} className="input" />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('common.class')}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input" />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('common.class')}</th>
              <th className="table-th">{t('attendance.date')}</th>
              <th className="table-th">{t('attendance.hijriDate')}</th>
              <th className="table-th">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={5} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('attendance.noRecords')}</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="table-row">
                <td className="table-td font-medium">{r.studentName}</td>
                <td className="table-td text-[var(--color-text-muted)]">{r.className}</td>
                <td className="table-td">{r.date}</td>
                <td className="table-td text-[var(--color-text-muted)] text-xs">{formatHijri(r.date, lang)}</td>
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
    </div>
  );
};

export default AdminAttendance;
