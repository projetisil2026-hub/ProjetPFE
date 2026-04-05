import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { generateId } from '../../utils/auth';
import Modal, { ConfirmModal } from '../../components/common/Modal';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const PRAYERS = ['after_fajr','after_dhuhr','after_asr','after_maghrib','after_isha'];

const AdminClasses = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(null); // classId
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const emptyForm = {
    name: '', teacherId: '', academicYearId: '', sessionsPerWeek: 3,
    schedule: [{ day: 'monday', timeType: 'fixed', startTime: '16:00', endTime: '17:30' }],
    studentIds: [],
  };
  const [form, setForm] = useState(emptyForm);

  const teachers = storage.getAll(KEYS.USERS).filter(u => u.role === 'teacher');
  const academicYears = storage.getAll(KEYS.ACADEMIC_YEARS);
  const allStudents = storage.getAll(KEYS.USERS).filter(u => u.role === 'student');
  const activeYear = academicYears.find(y => y.isActive);

  const classes = useMemo(() => {
    let all = storage.getAll(KEYS.CLASSES);
    if (search) all = all.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filterDay) all = all.filter(c => c.schedule?.some(s => s.day === filterDay));
    return all.map(cls => ({
      ...cls,
      teacher: teachers.find(t => t.id === cls.teacherId),
      year: academicYears.find(y => y.id === cls.academicYearId),
    }));
  }, [search, filterDay, teachers, academicYears]);

  const openAdd = () => {
    setEditClass(null);
    setForm({ ...emptyForm, academicYearId: activeYear?.id || '' });
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditClass(cls);
    setForm({
      name: cls.name,
      teacherId: cls.teacherId,
      academicYearId: activeYear?.id || cls.academicYearId,
      sessionsPerWeek: cls.sessionsPerWeek,
      schedule: cls.schedule || [],
      studentIds: cls.studentIds || [],
    });
    setShowModal(true);
  };

  const addScheduleRow = () => {
    setForm(f => ({ ...f, schedule: [...f.schedule, { day: 'monday', timeType: 'fixed', startTime: '', endTime: '' }] }));
  };

  const updateScheduleRow = (idx, field, value) => {
    setForm(f => {
      const sched = [...f.schedule];
      sched[idx] = { ...sched[idx], [field]: value };
      return { ...f, schedule: sched };
    });
  };

  const removeScheduleRow = (idx) => {
    setForm(f => ({ ...f, schedule: f.schedule.filter((_, i) => i !== idx) }));
  };

  const toggleStudent = (studentId) => {
    setForm(f => {
      const ids = f.studentIds.includes(studentId)
        ? f.studentIds.filter(id => id !== studentId)
        : [...f.studentIds, studentId];
      return { ...f, studentIds: ids };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editClass) {
      storage.update(KEYS.CLASSES, editClass.id, form);
    } else {
      storage.add(KEYS.CLASSES, { ...form, id: generateId(), createdAt: new Date().toISOString() });
    }
    setShowModal(false);
    showToast(editClass ? t('common.updated') : t('common.created'));
  };

  const handleDelete = (id) => {
    storage.delete(KEYS.CLASSES, id);
    showToast(t('common.deleted'));
  };

  // Available students (not in any other class, or in this class already)
  const availableStudents = allStudents.filter(s => {
    const allClasses = storage.getAll(KEYS.CLASSES);
    const inOtherClass = allClasses.some(c => c.id !== editClass?.id && c.studentIds?.includes(s.id));
    return !inOtherClass;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>
      )}

      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('classes.title')}</h1>
          <p className="page-subtitle">{classes.length} {t('nav.classes').toLowerCase()}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          {t('classes.add')}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('classes.search')} className="input" />
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('classes.day')}</option>
            {DAYS.map(d => <option key={d} value={d}>{t(`day.${d}`)}</option>)}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-3 card p-10 text-center text-[var(--color-text-muted)]">{t('common.noData')}</div>
        ) : classes.map(cls => (
          <div key={cls.id} className="card p-5 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-[var(--color-text)]">{cls.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{cls.year?.name || '—'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cls)} className="p-2 rounded-lg hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 text-brand-green-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => setDeleteId(cls.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            {cls.teacher && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {(cls.teacher.nameAr || cls.teacher.name || '?').charAt(0)}
                </div>
                <span className="text-[var(--color-text-muted)]">{cls.teacher.nameAr || cls.teacher.name}</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {cls.sessionsPerWeek} {t('classes.sessions').toLowerCase()}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cls.studentIds?.length || 0} {t('nav.students').toLowerCase()}
              </span>
            </div>

            {cls.schedule?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cls.schedule.map((s, i) => (
                  <span key={i} className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400">
                    {t(`day.${s.day}`)} — {s.timeType === 'prayer' ? t(`prayer.${s.prayerRef}`) : `${s.startTime}–${s.endTime}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editClass ? t('classes.edit') : t('classes.add')} size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-ghost">{t('common.cancel')}</button>
            <button form="class-form" type="submit" className="btn-primary">{t('common.save')}</button>
          </>
        }
      >
        <form id="class-form" onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('classes.name')}</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
            </div>
            <div>
              <label className="label">{t('classes.sessions')}</label>
              <input type="number" min="1" max="7" value={form.sessionsPerWeek} onChange={e => setForm({...form, sessionsPerWeek: parseInt(e.target.value)})} className="input" required />
            </div>
            <div>
              <label className="label">{t('classes.teacher')}</label>
              <select value={form.teacherId} onChange={e => setForm({...form, teacherId: e.target.value})} className="select" required>
                <option value="">{t('common.select')}</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.nameAr || t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('classes.academicYear')}</label>
              <div className="input flex items-center gap-2 bg-[var(--color-border)] cursor-not-allowed opacity-80">
                <span className="text-[var(--color-text)]">{activeYear?.name || t('year.noYears')}</span>
                {activeYear && <span className="badge bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400 text-xs ms-auto">{t('year.active')}</span>}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t('classes.schedule')}</label>
              <button type="button" onClick={addScheduleRow} className="text-sm text-brand-green-600 hover:underline">+ {t('classes.addSession')}</button>
            </div>
            <div className="space-y-2">
              {form.schedule.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                  <select value={s.day} onChange={e => updateScheduleRow(i, 'day', e.target.value)} className="select flex-1 min-w-28">
                    {DAYS.map(d => <option key={d} value={d}>{t(`day.${d}`)}</option>)}
                  </select>
                  <select value={s.timeType} onChange={e => updateScheduleRow(i, 'timeType', e.target.value)} className="select flex-1 min-w-28">
                    <option value="fixed">{t('classes.fixed')}</option>
                    <option value="prayer">{t('classes.prayer')}</option>
                  </select>
                  {s.timeType === 'fixed' ? (
                    <>
                      <input type="time" value={s.startTime} onChange={e => updateScheduleRow(i, 'startTime', e.target.value)} className="input flex-1 min-w-24" />
                      <input type="time" value={s.endTime} onChange={e => updateScheduleRow(i, 'endTime', e.target.value)} className="input flex-1 min-w-24" />
                    </>
                  ) : (
                    <select value={s.prayerRef} onChange={e => updateScheduleRow(i, 'prayerRef', e.target.value)} className="select flex-1 min-w-40">
                      {PRAYERS.map(p => <option key={p} value={p}>{t(`prayer.${p}`)}</option>)}
                    </select>
                  )}
                  <button type="button" onClick={() => removeScheduleRow(i)} className="text-red-400 hover:text-red-600 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
    </div>
  );
};

export default AdminClasses;
