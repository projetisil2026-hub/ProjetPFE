import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import Modal, { ConfirmModal } from '../../components/common/Modal';

const generateUsername = (nameEn) => {
  if (nameEn) return nameEn.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || `parent${Math.floor(Math.random() * 9000) + 1000}`;
  return `parent${Math.floor(Math.random() * 9000) + 1000}`;
};

const AdminParents = () => {
  const { t, lang } = useLanguage();
  const { users, loadAll, addUser, updateUser, removeUser } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const emptyForm = { nameAr: '', nameEn: '', phone: '', username: '', password: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadAll(); }, [loadAll]);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const parents = useMemo(() => {
    let all = users.filter(u => u.role === 'parent');
    if (search) all = all.filter(p =>
      (p.nameAr || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.nameEn || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search)
    );
    const allStudents = users.filter(u => u.role === 'student');
    return all.map(p => ({ ...p, children: allStudents.filter(s => s.parentId === p.id) }));
  }, [users, search]);

  const openAdd = () => { setEditingParent(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (parent) => {
    setEditingParent(parent);
    setForm({ nameAr: parent.nameAr || parent.name || '', nameEn: parent.nameEn || '', phone: parent.phone || '', username: parent.username || parent.email || '', password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const displayName = form.nameAr || form.nameEn;
    try {
      if (editingParent) {
        const updates = { name: displayName, nameAr: form.nameAr, nameEn: form.nameEn, phone: form.phone, username: form.username };
        if (form.password) updates.password = form.password;
        await updateUser(editingParent.id, updates);
        showToast(t('common.updated'));
      } else {
        await addUser({ name: displayName, nameAr: form.nameAr, nameEn: form.nameEn, username: form.username || generateUsername(form.nameEn), phone: form.phone, password: form.password || 'Parent123!', role: 'parent' });
        showToast(t('common.created'));
      }
      setShowModal(false); setForm(emptyForm); setEditingParent(null);
    } catch (err) { showToast(err.message); }
  };

  const handleDelete = async (id) => {
    try { await removeUser(id); showToast(t('common.deleted')); } catch (err) { showToast(err.message); }
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>}

      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('parents.title')}</h1>
          <p className="page-subtitle">{parents.length} {t('role.parent')}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          {t('parents.add')}
        </button>
      </div>

      <div className="card p-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('parents.search')} className="input max-w-xs" />
      </div>

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
              <tr><td colSpan={4} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('common.noData')}</td></tr>
            ) : parents.map(parent => (
              <tr key={parent.id} className="table-row">
                <td className="table-td">
                  <p className="font-medium">{lang === 'ar' ? (parent.nameAr || parent.name) : (parent.nameEn || parent.nameAr || parent.name)}</p>
                  {lang !== 'ar' && parent.nameAr && <p className="text-xs text-[var(--color-text-muted)]">{parent.nameAr}</p>}
                </td>
                <td className="table-td text-[var(--color-text-muted)]">{parent.phone || '—'}</td>
                <td className="table-td">
                  {parent.children.length === 0 ? <span className="text-xs text-[var(--color-text-muted)]">—</span> : (
                    <div className="flex flex-wrap gap-1">
                      {parent.children.map(c => <span key={c.id} className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">{c.nameAr || c.name}</span>)}
                    </div>
                  )}
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(parent)} className="text-blue-500 hover:text-blue-700 p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteId(parent.id)} className="text-red-500 hover:text-red-700 p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingParent ? t('parents.edit') : t('parents.add')} size="sm"
        footer={<><button onClick={() => setShowModal(false)} className="btn-ghost">{t('common.cancel')}</button><button form="parent-form" type="submit" className="btn-primary">{t('common.save')}</button></>}>
        <form id="parent-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('parents.nameAr')}</label><input type="text" value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} className="input" dir="rtl" placeholder="الاسم بالعربية" required={!form.nameEn} /></div>
            <div><label className="label">{t('parents.nameEn')}</label><input type="text" value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} className="input" placeholder="Name in English" /></div>
          </div>
          <div><label className="label">{t('common.phone')}</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" /></div>
          <div><label className="label">{t('auth.password')}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" required={!editingParent} placeholder={editingParent ? '••••••••' : ''} /></div>
        </form>
      </Modal>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
    </div>
  );
};

export default AdminParents;
