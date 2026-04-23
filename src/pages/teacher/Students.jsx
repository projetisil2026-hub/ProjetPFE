import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { calcTotalHizbProgress } from '../../utils/quranData';

const evalColors = {
  excellent: 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  average: 'bg-brand-gold-100 text-brand-gold-700 dark:bg-brand-gold-900/30 dark:text-brand-gold-400',
  repeat: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TeacherStudents = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterAge, setFilterAge] = useState('');

  const myClasses = useMemo(() => {
    return storage.getAll(KEYS.CLASSES).filter(c => c.teacherId === user?.id);
  }, [user]);

  const allMemo = storage.getAll(KEYS.MEMORIZATION);
  const allUsers = storage.getAll(KEYS.USERS);

  const students = useMemo(() => {
    const classStudentIds = new Set(myClasses.flatMap(c => c.studentIds || []));
    let all = allUsers.filter(u => u.role === 'student' && classStudentIds.has(u.id));

    if (search) all = all.filter(s =>
      (s.nameAr || s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.nameEn || '').toLowerCase().includes(search.toLowerCase())
    );
    if (filterAge) {
      const trimmed = filterAge.trim();
      const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        all = all.filter(s => s.age >= Math.min(min, max) && s.age <= Math.max(min, max));
      } else if (/^\d+$/.test(trimmed)) {
        all = all.filter(s => s.age === parseInt(trimmed));
      }
    }

    return all.map(s => {
      const cls = myClasses.find(c => c.studentIds?.includes(s.id));
      const memos = allMemo.filter(m => m.studentId === s.id);
      const hizbProgress = calcTotalHizbProgress(memos);
      const lastMemo = memos.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return { ...s, class: cls, hizbProgress, lastEvaluation: lastMemo?.evaluation };
    });
  }, [search, filterAge, myClasses, allMemo, allUsers]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('students.title')}</h1>
        <p className="page-subtitle">{students.length} {t('role.student')}</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('students.search')} className="input" />
          <input type="text" value={filterAge} onChange={e => setFilterAge(e.target.value)} placeholder={`${t('students.filterAge')} (e.g. 12 or 12-15)`} className="input" />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('students.class')}</th>
              <th className="table-th">{t('common.age')}</th>
              <th className="table-th">{t('common.gender')}</th>
              <th className="table-th">{t('students.progress')}</th>
              <th className="table-th">{t('memo.evaluation')}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={6} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('common.noData')}</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="table-row">
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {(s.nameAr || s.name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{s.nameAr || s.name}</p>
                      {s.nameEn && <p className="text-xs text-[var(--color-text-muted)]">{s.nameEn}</p>}
                    </div>
                  </div>
                </td>
                <td className="table-td text-[var(--color-text-muted)]">{s.class?.name || '—'}</td>
                <td className="table-td">{s.age}</td>
                <td className="table-td">
                  <span className={`badge ${s.gender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                    {t(`gender.${s.gender}`)}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div className="hizb-progress h-full" style={{ width: `${Math.min((s.hizbProgress / 60) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-brand-green-600 whitespace-nowrap">{s.hizbProgress.toFixed(1)}</span>
                  </div>
                </td>
                <td className="table-td">
                  {s.lastEvaluation && (
                    <span className={`badge ${evalColors[s.lastEvaluation]}`}>{t(`eval.${s.lastEvaluation}`)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherStudents;
