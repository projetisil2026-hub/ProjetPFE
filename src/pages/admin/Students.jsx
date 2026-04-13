import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { calcTotalHizbProgress } from '../../utils/quranData';
import { generateId, hashPassword } from '../../utils/auth';
import Modal, { ConfirmModal } from '../../components/common/Modal';

const generateUsername = (nameEn) => {
  if (nameEn) {
    return nameEn.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || `student${Math.floor(Math.random() * 9000) + 1000}`;
  }
  return `student${Math.floor(Math.random() * 9000) + 1000}`;
};

const AdminStudents = () => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [hizbFrom, setHizbFrom] = useState('');
  const [hizbTo, setHizbTo] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const emptyForm = {
    nameAr: '', nameEn: '', username: '', password: '', phone: '', parentPhone: '',
    gender: 'male', age: '', parentId: '', classId: '', hizbMemorized: '0',
  };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const classes = storage.getAll(KEYS.CLASSES);
  const memoRecords = storage.getAll(KEYS.MEMORIZATION);
  const parents = storage.getAll(KEYS.USERS).filter(u => u.role === 'parent');

  const students = useMemo(() => {
    let all = storage.getAll(KEYS.USERS).filter(u => u.role === 'student');

    if (search) all = all.filter(s =>
      (s.nameAr || s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.nameEn || '').toLowerCase().includes(search.toLowerCase())
    );
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

  const openAdd = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    const studentClass = classes.find(c => c.studentIds?.includes(student.id));
    setForm({
      nameAr: student.nameAr || student.name || '',
      nameEn: student.nameEn || '',
      username: student.username || student.email || '',
      password: '',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      gender: student.gender || 'male',
      age: student.age?.toString() || '',
      parentId: student.parentId || '',
      classId: studentClass?.id || '',
      hizbMemorized: student.hizbMemorized?.toString() || '0',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const displayName = form.nameAr || form.nameEn;

    if (editingStudent) {
      // Edit
      const updates = {
        name: displayName,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        username: form.username,
        phone: form.phone,
        parentPhone: form.parentPhone,
        gender: form.gender,
        age: parseInt(form.age) || 0,
        parentId: form.parentId,
        hizbMemorized: parseFloat(form.hizbMemorized) || 0,
      };
      if (form.password) updates.password = hashPassword(form.password);
      storage.update(KEYS.USERS, editingStudent.id, updates);

      // Update class assignment
      const oldClass = classes.find(c => c.studentIds?.includes(editingStudent.id));
      if (oldClass && oldClass.id !== form.classId) {
        storage.update(KEYS.CLASSES, oldClass.id, {
          studentIds: (oldClass.studentIds || []).filter(id => id !== editingStudent.id),
        });
      }
      if (form.classId && form.classId !== oldClass?.id) {
        const newCls = storage.findOne(KEYS.CLASSES, c => c.id === form.classId);
        if (newCls) {
          storage.update(KEYS.CLASSES, newCls.id, {
            studentIds: [...(newCls.studentIds || []), editingStudent.id],
          });
        }
      }

      // Update parent link
      if (editingStudent.parentId !== form.parentId) {
        if (editingStudent.parentId) {
          const oldParent = storage.findOne(KEYS.USERS, u => u.id === editingStudent.parentId);
          if (oldParent) {
            storage.update(KEYS.USERS, oldParent.id, {
              childrenIds: (oldParent.childrenIds || []).filter(id => id !== editingStudent.id),
            });
          }
        }
        if (form.parentId) {
          const newParent = storage.findOne(KEYS.USERS, u => u.id === form.parentId);
          if (newParent) {
            storage.update(KEYS.USERS, newParent.id, {
              childrenIds: [...(newParent.childrenIds || []), editingStudent.id],
            });
          }
        }
      }

      showToast(t('common.updated'));
    } else {
      // Add
      const autoUsername = form.username || generateUsername(form.nameEn, form.nameAr);
      const newStudent = {
        id: generateId(),
        name: displayName,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        username: autoUsername,
        phone: form.phone,
        parentPhone: form.parentPhone,
        password: hashPassword(form.password || 'Student123!'),
        role: 'student',
        gender: form.gender,
        age: parseInt(form.age) || 0,
        parentId: form.parentId,
        hizbMemorized: parseFloat(form.hizbMemorized) || 0,
        createdAt: new Date().toISOString(),
      };

      if (form.parentId) {
        const parent = storage.findOne(KEYS.USERS, u => u.id === form.parentId);
        if (parent) {
          storage.update(KEYS.USERS, parent.id, {
            childrenIds: [...(parent.childrenIds || []), newStudent.id],
          });
        }
      }

      storage.add(KEYS.USERS, newStudent);

      if (form.classId) {
        const cls = storage.findOne(KEYS.CLASSES, c => c.id === form.classId);
        if (cls) {
          storage.update(KEYS.CLASSES, cls.id, {
            studentIds: [...(cls.studentIds || []), newStudent.id],
          });
        }
      }

      showToast(t('common.created'));
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditingStudent(null);
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
          <h1 className="page-title">{t('students.title')}</h1>
          <p className="page-subtitle">{students.length} {t('role.student')}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('students.add')}
        </button>
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
            <input type="number" value={hizbFrom} onChange={e => setHizbFrom(e.target.value)} placeholder="≥" className="input" min="0" max="60" />
            <input type="number" value={hizbTo} onChange={e => setHizbTo(e.target.value)} placeholder="≤" className="input" min="0" max="60" />
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
              <th className="table-th">{t('common.phone')}</th>
              <th className="table-th">{t('students.guardian')}</th>
              <th className="table-th">{t('students.progress')}</th>
              <th className="table-th">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={8} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('common.noData')}</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="table-row">
                <td className="table-td">
                  <div>
                    <p className="font-medium">{lang === 'ar' ? (s.nameAr || s.name) : (s.nameEn || s.nameAr || s.name)}</p>
                    {lang === 'ar' && s.parent && (
                      <p className="text-xs text-[var(--color-text-muted)]">{s.parent.nameAr || s.parent.name}</p>
                    )}
                    {lang !== 'ar' && (s.nameEn && s.nameAr) && (
                      <p className="text-xs text-[var(--color-text-muted)]">{s.nameAr}</p>
                    )}
                  </div>
                </td>
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
                <td className="table-td text-sm text-[var(--color-text-muted)]">{s.phone || '—'}</td>
                <td className="table-td text-sm text-[var(--color-text-muted)]">{lang === 'ar' ? (s.parent?.nameAr || s.parent?.name || '—') : (s.parent?.nameEn || s.parent?.name || '—')}</td>
                <td className="table-td">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div className="hizb-progress h-full" style={{ width: `${Math.min((s.hizbProgress / 60) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-brand-green-600 whitespace-nowrap">{s.hizbProgress.toFixed(1)} / 60</span>
                  </div>
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700 p-1" title={t('common.edit')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteId(s.id)} className="text-red-500 hover:text-red-700 p-1" title={t('common.delete')}>
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
        title={editingStudent ? t('students.edit') : t('students.add')}
        size="md"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-ghost">{t('common.cancel')}</button>
            <button form="student-form" type="submit" className="btn-primary">{t('common.save')}</button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('students.nameAr')}</label>
              <input type="text" value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} className="input" dir="rtl" placeholder="الاسم بالعربية" required={!form.nameEn} />
            </div>
            <div>
              <label className="label">{t('students.nameEn')}</label>
              <input type="text" value={form.nameEn} onChange={e => {
                const nameEn = e.target.value;
                const updates = { nameEn };
                if (!editingStudent) updates.username = generateUsername(nameEn, form.nameAr);
                setForm({...form, ...updates});
              }} className="input" placeholder="Name in English" />
            </div>
          </div>
          <div>
            <label className="label">{t('students.username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              className="input"
              placeholder={!editingStudent ? t('students.nameEn') + ' →' : ''}
            />
          </div>
          {(() => {
            const ageNum = parseInt(form.age) || 0;
            const showStudentPhone = !form.age || ageNum >= 12;
            const showParentPhone = !form.age || ageNum <= 19;
            const parentPhoneRequired = ageNum > 0 && ageNum < 12;
            return (
              <div className="grid grid-cols-2 gap-3">
                {showStudentPhone && (
                  <div>
                    <label className="label">{t('students.phone')}</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
                  </div>
                )}
                {showParentPhone && (
                  <div>
                    <label className="label">{t('students.parentPhone')}{parentPhoneRequired && ' *'}</label>
                    <input type="tel" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} className="input" required={parentPhoneRequired} />
                  </div>
                )}
              </div>
            );
          })()}
          <div>
            <label className="label">{editingStudent ? t('auth.password') + ' (' + t('common.notes') + ')' : t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="input pr-10"
                required={!editingStudent}
                placeholder={editingStudent ? t('common.notes') : ''}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('common.gender')}</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="select">
                <option value="male">{t('gender.male')}</option>
                <option value="female">{t('gender.female')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('common.age')}</label>
              <input type="number" min="5" max="25" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="input" />
            </div>
          </div>
          {(parseInt(form.age) || 0) <= 19 && (
            <div>
              <label className="label">{t('students.guardian')}</label>
              <select value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} className="select">
                <option value="">{t('common.select')}</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{t('students.class')}</label>
            <select value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} className="select">
              <option value="">{t('common.select')}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('students.hizbMemorized')}</label>
            <input type="number" min="0" max="60" step="0.5" value={form.hizbMemorized} onChange={e => setForm({...form, hizbMemorized: e.target.value})} className="input" />
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
    </div>
  );
};

export default AdminStudents;
