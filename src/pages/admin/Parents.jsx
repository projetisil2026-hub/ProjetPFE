import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { generateId, hashPassword } from '../../utils/auth';
import Modal, { ConfirmModal } from '../../components/common/Modal';

const generateUsername = (nameEn) => {
  if (nameEn) {
    return nameEn.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || `parent${Math.floor(Math.random() * 9000) + 1000}`;
  }
  return `parent${Math.floor(Math.random() * 9000) + 1000}`;
};

const AdminParents = () => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const emptyForm = { nameAr: '', nameEn: '', phone: '', username: '', password: '' };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const parents = useMemo(() => {
    let all = storage.getAll(KEYS.USERS).filter(u => u.role === 'parent');
    if (search) all = all.filter(p =>
      (p.nameAr || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.nameEn || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search)
    );
    const allStudents = storage.getAll(KEYS.USERS).filter(u => u.role === 'student');
    return all.map(p => ({
      ...p,
      children: allStudents.filter(s => s.parentId === p.id),
    }));
  }, [search]);

  const openAdd = () => {
    setEditingParent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (parent) => {
    setEditingParent(parent);
    setForm({
      nameAr: parent.nameAr || parent.name || '',
      nameEn: parent.nameEn || '',
      phone: parent.phone || '',
      username: parent.username || parent.email || '',
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const displayName = form.nameAr || form.nameEn;

    if (editingParent) {
      const updates = {
        name: displayName,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        phone: form.phone,
        username: form.username,
      };
      if (form.password) updates.password = hashPassword(form.password);
      storage.update(KEYS.USERS, editingParent.id, updates);
      showToast(t('common.updated'));
    } else {
      const autoUsername = form.username || generateUsername(form.nameEn);
      const newParent = {
        id: generateId(),
        name: displayName,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        phone: form.phone,
        username: autoUsername,
        password: hashPassword(form.password || 'Parent123!'),
        role: 'parent',
        childrenIds: [],
        createdAt: new Date().toISOString(),
      };
      storage.add(KEYS.USERS, newParent);
      showToast(t('common.created'));
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditingParent(null);
  };

  const handleDelete = (id) => {
    // Unlink children
    const students = storage.getAll(KEYS.USERS).filter(u => u.role === 'student' && u.parentId === id);
    students.forEach(s => storage.update(KEYS.USERS, s.id, { parentId: '' }));
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
          <h1 className="page-title">{t('parents.title')}</h1>
          <p className="page-subtitle">{parents.length} {t('nav.parents').toLowerCase()}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('parents.add')}
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('parents.search')}
          className="input max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('common.phone')}</th>
              <th className="table-th">{t('parents.children')}</th>
              <th className="table-th">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {parents.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('common.noData')}</td>
              </tr>
            ) : parents.map(p => (
              <tr key={p.id} className="table-row">
                <td className="table-td">
                  <div>
                    <p className="font-medium">{lang === 'ar' ? (p.nameAr || p.name) : (p.nameEn || p.nameAr || p.name)}</p>
                    {lang === 'ar' && p.nameEn && (
                      <p className="text-xs text-[var(--color-text-muted)]">{p.nameEn}</p>
                    )}
                    {lang !== 'ar' && p.nameAr && (
                      <p className="text-xs text-[var(--color-text-muted)]">{p.nameAr}</p>
                    )}
                  </div>
                </td>
                <td className="table-td text-sm text-[var(--color-text-muted)]">{p.phone || '—'}</td>
                <td className="table-td">
                  {p.children.length === 0 ? (
                    <span className="text-xs text-[var(--color-text-muted)]">{t('parents.noChildren')}</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {p.children.map(child => (
                        <span key={child.id} className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400 text-xs">
                          {lang === 'ar' ? (child.nameAr || child.name) : (child.nameEn || child.nameAr || child.name)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 p-1" title={t('common.edit')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="text-red-500 hover:text-red-700 p-1" title={t('common.delete')}>
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
        title={editingParent ? t('parents.edit') : t('parents.add')}
        size="md"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-ghost">{t('common.cancel')}</button>
            <button form="parent-form" type="submit" className="btn-primary">{t('common.save')}</button>
          </>
        }
      >
        <form id="parent-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('parents.nameAr')}</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={e => setForm({ ...form, nameAr: e.target.value })}
                className="input"
                dir="rtl"
                placeholder="الاسم بالعربية"
                required={!form.nameEn}
              />
            </div>
            <div>
              <label className="label">{t('parents.nameEn')}</label>
              <input
                type="text"
                value={form.nameEn}
                onChange={e => {
                  const nameEn = e.target.value;
                  const updates = { nameEn };
                  if (!editingParent) updates.username = generateUsername(nameEn);
                  setForm({ ...form, ...updates });
                }}
                className="input"
                placeholder="Name in English"
              />
            </div>
          </div>
          <div>
            <label className="label">{t('parents.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t('students.username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="input"
              placeholder={!editingParent ? t('parents.nameEn') + ' →' : ''}
            />
          </div>
          <div>
            <label className="label">
              {editingParent ? `${t('auth.password')} (${t('common.notes')})` : t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input pr-10"
                required={!editingParent}
                placeholder={editingParent ? t('common.notes') : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-[var(--color-text-muted)] hover:text-brand-green-600"
              >
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

export default AdminParents;
