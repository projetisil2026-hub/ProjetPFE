import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { calcTotalHizbProgress } from '../../utils/quranData';
import { ConfirmModal } from '../../components/common/Modal';

const AdminStudents = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [hizbFrom, setHizbFrom] = useState('');
  const [hizbTo, setHizbTo] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const classes = storage.getAll(KEYS.CLASSES);
  const memoRecords = storage.getAll(KEYS.MEMORIZATION);

  const students = useMemo(() => {
    let all = storage.getAll(KEYS.USERS).filter(u => u.role === 'student');

    if (search) all = all.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    if (filterGender) all = all.filter(s => s.gender === filterGender);
    if (filterAge) all = all.filter(s => s.age === parseInt(filterAge));
    if (filterClass) {
      const cls = classes.find(c => c.id === filterClass);
      if (cls) all = all.filter(s => cls.studentIds?.includes(s.id));
    }

    return all.map(s => {
      const studentClass = classes.find(c => c.studentIds?.includes(s.id));
      const studentMemo = memoRecords.filter(m => m.studentId === s.id);
      const hizbProgress = calcTotalHizbProgress(studentMemo);
      const parent = storage.findOne(KEYS.USERS, u => u.id === s.parentId);
      return { ...s, class: studentClass, hizbProgress, parent };
    }).filter(s => {
      if (hizbFrom && s.hizbProgress < parseFloat(hizbFrom)) return false;
      if (hizbTo && s.hizbProgress > parseFloat(hizbTo)) return false;
      return true;
    });
  }, [search, filterClass, filterGender, filterAge, hizbFrom, hizbTo, memoRecords]);

  const handleDelete = (id) => {
    storage.delete(KEYS.USERS, id);
    showToast(t('common.deleted'));
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>
      )}

      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('students.title')}</h1>
          <p className="page-subtitle">{students.length} {t('role.student')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('students.search')} className="input" />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('common.class')}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('common.gender')}</option>
            <option value="male">{t('gender.male')}</option>
            <option value="female">{t('gender.female')}</option>
          </select>
          <input type="number" value={filterAge} onChange={e => setFilterAge(e.target.value)} placeholder={t('students.filterAge')} className="input" min="5" max="25" />
          <div className="flex gap-1">
            <input type="number" value={hizbFrom} onChange={e => setHizbFrom(e.target.value)} placeholder="Hizb ≥" className="input" min="0" max="60" />
            <input type="number" value={hizbTo} onChange={e => setHizbTo(e.target.value)} placeholder="Hizb ≤" className="input" min="0" max="60" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('common.class')}</th>
              <th className="table-th">{t('common.gender')}</th>
              <th className="table-th">{t('common.age')}</th>
              <th className="table-th">{t('common.parent')}</th>
              <th className="table-th">{t('students.progress')}</th>
              <th className="table-th">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={7} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('common.noData')}</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="table-row">
                <td className="table-td font-medium">{s.name}</td>
                <td className="table-td">
                  {s.class ? (
                    <span className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">{s.class.name}</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)] text-xs">—</span>
                  )}
                </td>
                <td className="table-td">
                  <span className={`badge ${s.gender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                    {t(`gender.${s.gender}`)}
                  </span>
                </td>
                <td className="table-td">{s.age}</td>
                <td className="table-td text-sm text-[var(--color-text-muted)]">{s.parent?.name || '—'}</td>
                <td className="table-td">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div className="hizb-progress h-full" style={{ width: `${Math.min((s.hizbProgress / 60) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-brand-green-600 whitespace-nowrap">{s.hizbProgress.toFixed(1)} / 60</span>
                  </div>
                </td>
                <td className="table-td">
                  <button onClick={() => setDeleteId(s.id)} className="text-red-500 hover:text-red-700 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
    </div>
  );
};

export default AdminStudents;
