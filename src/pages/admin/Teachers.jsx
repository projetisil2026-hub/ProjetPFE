import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { ConfirmModal } from '../../components/common/Modal';

const AdminTeachers = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const allClasses = storage.getAll(KEYS.CLASSES);

  const teachers = useMemo(() => {
    let all = storage.getAll(KEYS.USERS).filter(u => u.role === 'teacher');
    if (search) all = all.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    if (filterGender) all = all.filter(t => t.gender === filterGender);
    return all.map(teacher => ({
      ...teacher,
      classes: allClasses.filter(c => c.teacherId === teacher.id),
    }));
  }, [search, filterGender, allClasses]);

  const handleDelete = (id) => {
    storage.delete(KEYS.USERS, id);
    showToast(t('common.deleted'));
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>
      )}

      <div className="page-header">
        <h1 className="page-title">{t('teachers.title')}</h1>
        <p className="page-subtitle">{teachers.length} {t('role.teacher')}</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('teachers.search')} className="input" />
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('common.gender')}</option>
            <option value="male">{t('gender.male')}</option>
            <option value="female">{t('gender.female')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('common.email')}</th>
              <th className="table-th">{t('common.gender')}</th>
              <th className="table-th">{t('teachers.classes')}</th>
              <th className="table-th">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan={5} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('common.noData')}</td></tr>
            ) : teachers.map(teacher => (
              <tr key={teacher.id} className="table-row">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{teacher.name}</span>
                  </div>
                </td>
                <td className="table-td text-[var(--color-text-muted)]">{teacher.email}</td>
                <td className="table-td">
                  <span className={`badge ${teacher.gender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                    {t(`gender.${teacher.gender}`)}
                  </span>
                </td>
                <td className="table-td">
                  {teacher.classes.length === 0 ? (
                    <span className="text-xs text-[var(--color-text-muted)]">{t('teachers.noClasses')}</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {teacher.classes.map(c => (
                        <span key={c.id} className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{c.name}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="table-td">
                  <button onClick={() => setDeleteId(teacher.id)} className="text-red-500 hover:text-red-700 p-1">
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

export default AdminTeachers;
