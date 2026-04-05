import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { generateId, hashPassword } from '../../utils/auth';
import Modal, { ConfirmModal } from '../../components/common/Modal';

const generateUsername = (nameEn, nameAr) => {
  if (nameEn) {
    return nameEn.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || `teacher${Math.floor(Math.random() * 9000) + 1000}`;
  }
  return `teacher${Math.floor(Math.random() * 9000) + 1000}`;
};

const AdminTeachers = () => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const emptyForm = { nameAr: '', nameEn: '', username: '', password: '', phone: '', gender: 'male' };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const allClasses = storage.getAll(KEYS.CLASSES);

  const teachers = useMemo(() => {
    let all = storage.getAll(KEYS.USERS).filter(u => u.role === 'teacher');
    if (search) all = all.filter(t =>
      (t.nameAr || t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.nameEn || '').toLowerCase().includes(search.toLowerCase())
    );
    if (filterGender) all = all.filter(t => t.gender === filterGender);
    return all.map(teacher => ({
      ...teacher,
      classes: allClasses.filter(c => c.teacherId === teacher.id),
    }));
  }, [search, filterGender, allClasses]);

  const openAdd = () => {
    setEditingTeacher(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      nameAr: teacher.nameAr || teacher.name || '',
      nameEn: teacher.nameEn || '',
      username: teacher.username || teacher.email || '',
      password: '',
      phone: teacher.phone || '',
      gender: teacher.gender || 'male',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const displayName = form.nameAr || form.nameEn;

    if (editingTeacher) {
      const updates = {
        name: displayName,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        username: form.username,
        phone: form.phone,
        gender: form.gender,
      };
      if (form.password) updates.password = hashPassword(form.password);
      storage.update(KEYS.USERS, editingTeacher.id, updates);
      showToast(t('common.updated'));
    } else {
      const autoUsername = form.username || generateUsername(form.nameEn, form.nameAr);
      const newTeacher = {
        id: generateId(),
        name: displayName,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        username: autoUsername,
        phone: form.phone,
        password: hashPassword(form.password || 'Teacher123!'),
        role: 'teacher',
        gender: form.gender,
        createdAt: new Date().toISOString(),
      };
      storage.add(KEYS.USERS, newTeacher);
      showToast(t('common.created'));
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditingTeacher(null);
  };

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
          <h1 className="page-title">{t('teachers.title')}</h1>
          <p className="page-subtitle">{teachers.length} {t('role.teacher')}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('teachers.add')}
        </button>
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
              <th className="table-th">{t('common.phone')}</th>
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
                      {(teacher.nameAr || teacher.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{lang === 'ar' ? (teacher.nameAr || teacher.name) : (teacher.nameEn || teacher.nameAr || teacher.name)}</p>
                      {lang === 'ar' && teacher.nameEn && <p className="text-xs text-[var(--color-text-muted)]">{teacher.nameEn}</p>}
                      {lang !== 'ar' && teacher.nameAr && <p className="text-xs text-[var(--color-text-muted)]">{teacher.nameAr}</p>}
                    </div>
                  </div>
                </td>
                <td className="table-td text-[var(--color-text-muted)]">{teacher.phone || '—'}</td>
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
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(teacher)} className="text-blue-500 hover:text-blue-700 p-1" title={t('common.edit')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteId(teacher.id)} className="text-red-500 hover:text-red-700 p-1" title={t('common.delete')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTeacher ? t('teachers.edit') : t('teachers.add')}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-ghost">{t('common.cancel')}</button>
            <button form="teacher-form" type="submit" className="btn-primary">{t('common.save')}</button>
          </>
        }
      >
        <form id="teacher-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('teachers.nameAr')}</label>
              <input type="text" value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} className="input" dir="rtl" placeholder="الاسم بالعربية" required={!form.nameEn} />
            </div>
            <div>
              <label className="label">{t('teachers.nameEn')}</label>
              <input type="text" value={form.nameEn} onChange={e => {
                const nameEn = e.target.value;
                const updates = { nameEn };
                if (!editingTeacher) updates.username = generateUsername(nameEn, form.nameAr);
                setForm({...form, ...updates});
              }} className="input" placeholder="Name in English" />
            </div>
          </div>
          <div>
            <label className="label">{t('teachers.username')}</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="input" />
          </div>
          <div>
            <label className="label">{t('teachers.phone')}</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
          </div>
          <div>
            <label className="label">{t('common.gender')}</label>
            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="select">
              <option value="male">{t('gender.male')}</option>
              <option value="female">{t('gender.female')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="input pr-10"
                required={!editingTeacher}
                placeholder={editingTeacher ? '••••••••' : ''}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-[var(--color-text-muted)] hover:text-brand-green-600">
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
    </div>
  );
};

export default AdminTeachers;
