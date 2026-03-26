import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { SURAHS, calcHizbProgress } from '../../utils/quranData';
import { formatHijri, formatGregorian, todayISO } from '../../utils/hijriDate';
import { generateId } from '../../utils/auth';
import { ConfirmModal } from '../../components/common/Modal';

const evalColors = {
  excellent: 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  average: 'bg-brand-gold-100 text-brand-gold-700 dark:bg-brand-gold-900/30 dark:text-brand-gold-400',
  repeat: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TeacherMemorization = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [form, setForm] = useState({
    classId: '', studentId: '', date: todayISO(),
    surahId: 1, fromAyah: 1, toAyah: 1, evaluation: 'good',
  });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const myClasses = useMemo(() => storage.getAll(KEYS.CLASSES).filter(c => c.teacherId === user?.id), [user]);
  const allUsers = storage.getAll(KEYS.USERS);

  const studentsForClass = useMemo(() => {
    if (!form.classId) return [];
    const cls = myClasses.find(c => c.id === form.classId);
    return allUsers.filter(u => cls?.studentIds?.includes(u.id));
  }, [form.classId, myClasses, allUsers]);

  const selectedSurah = SURAHS.find(s => s.id === parseInt(form.surahId));
  const ayahCount = form.toAyah - form.fromAyah + 1;
  const hizbEstimate = selectedSurah ? calcHizbProgress(parseInt(form.surahId), parseInt(form.fromAyah), parseInt(form.toAyah)) : 0;

  const records = useMemo(() => {
    let all = storage.getAll(KEYS.MEMORIZATION).filter(m => {
      return myClasses.some(c => c.id === m.classId);
    });
    if (filterClass) all = all.filter(m => m.classId === filterClass);
    if (filterDate) all = all.filter(m => m.date === filterDate);
    return all.map(m => {
      const student = allUsers.find(u => u.id === m.studentId);
      const cls = myClasses.find(c => c.id === m.classId);
      const surah = SURAHS.find(s => s.id === m.surahId);
      return {
        ...m, studentName: student?.name || '?', className: cls?.name || '?',
        surahName: lang === 'ar' ? surah?.nameAr : surah?.nameEn,
      };
    }).filter(m => !search || m.studentName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filterClass, filterDate, search, myClasses, allUsers, lang]);

  const handleSave = (e) => {
    e.preventDefault();
    const activeYear = storage.findOne(KEYS.ACADEMIC_YEARS, y => y.isActive);
    if (editId) {
      storage.update(KEYS.MEMORIZATION, editId, {
        ...form, surahId: parseInt(form.surahId), fromAyah: parseInt(form.fromAyah),
        toAyah: parseInt(form.toAyah), academicYearId: activeYear?.id || '',
      });
      setEditId(null);
      showToast(t('common.updated'));
    } else {
      storage.add(KEYS.MEMORIZATION, {
        id: generateId(),
        ...form, surahId: parseInt(form.surahId),
        fromAyah: parseInt(form.fromAyah), toAyah: parseInt(form.toAyah),
        academicYearId: activeYear?.id || '',
        createdAt: new Date().toISOString(),
      });
      showToast(t('common.created'));
    }
    setForm(f => ({ ...f, studentId: '', surahId: 1, fromAyah: 1, toAyah: 1, evaluation: 'good' }));
  };

  const handleEdit = (record) => {
    setEditId(record.id);
    const cls = myClasses.find(c => c.id === record.classId);
    setForm({
      classId: record.classId, studentId: record.studentId, date: record.date,
      surahId: record.surahId, fromAyah: record.fromAyah, toAyah: record.toAyah, evaluation: record.evaluation,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    storage.delete(KEYS.MEMORIZATION, id);
    showToast(t('common.deleted'));
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">{t('memo.title')}</h1>
      </div>

      {/* Record form */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">{editId ? t('common.edit') : t('memo.record')}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="label">{t('common.class')}</label>
              <select value={form.classId} onChange={e => setForm({...form, classId: e.target.value, studentId: ''})} className="select" required>
                <option value="">{t('common.select')}</option>
                {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('common.student')}</label>
              <select value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} className="select" required>
                <option value="">{t('common.select')}</option>
                {studentsForClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('memo.date')}</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" required />
            </div>
          </div>

          {form.date && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {formatGregorian(form.date, lang)} | {formatHijri(form.date, lang)}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="label">{t('memo.surah')}</label>
              <select
                value={form.surahId}
                onChange={e => setForm({...form, surahId: parseInt(e.target.value), fromAyah: 1, toAyah: 1})}
                className="select"
                required
              >
                {SURAHS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {lang === 'ar' ? s.nameAr : s.nameEn} ({s.ayahs} {t('quran.ayahs')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('memo.fromAyah')}</label>
              <input
                type="number" min="1" max={selectedSurah?.ayahs || 286}
                value={form.fromAyah}
                onChange={e => setForm({...form, fromAyah: parseInt(e.target.value) || 1})}
                className="input" required
              />
            </div>
            <div>
              <label className="label">{t('memo.toAyah')} (/{selectedSurah?.ayahs})</label>
              <input
                type="number" min={form.fromAyah} max={selectedSurah?.ayahs || 286}
                value={form.toAyah}
                onChange={e => setForm({...form, toAyah: parseInt(e.target.value) || form.fromAyah})}
                className="input" required
              />
            </div>
          </div>

          {/* Hizb estimate */}
          {ayahCount > 0 && (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-brand-gold-50 dark:bg-brand-gold-900/20 text-sm">
              <span className="text-brand-gold-700 dark:text-brand-gold-400 font-medium">{t('quran.ayahs')}: {ayahCount}</span>
              <span className="text-brand-gold-700 dark:text-brand-gold-400">|</span>
              <span className="text-brand-gold-700 dark:text-brand-gold-400 font-medium">≈ {hizbEstimate.toFixed(3)} {t('quran.hizb')}</span>
            </div>
          )}

          <div>
            <label className="label">{t('memo.evaluation')}</label>
            <div className="flex flex-wrap gap-2">
              {['excellent','good','average','repeat'].map(ev => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => setForm({...form, evaluation: ev})}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${form.evaluation === ev ? `${evalColors[ev]} border-transparent shadow-sm` : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-brand-green-300'}`}
                >
                  {t(`eval.${ev}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{editId ? t('common.save') : t('memo.record')}</button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(f => ({ ...f, studentId: '', surahId: 1, fromAyah: 1, toAyah: 1 })); }} className="btn-ghost">{t('common.cancel')}</button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('memo.search')} className="input" />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('common.class')}</option>
            {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input" />
        </div>
      </div>

      {/* Records table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('common.class')}</th>
              <th className="table-th">{t('memo.date')}</th>
              <th className="table-th">{t('memo.surah')}</th>
              <th className="table-th">{t('memo.fromAyah')} ← {t('memo.toAyah')}</th>
              <th className="table-th">{t('memo.evaluation')}</th>
              <th className="table-th">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={7} className="table-td text-center text-[var(--color-text-muted)] py-8">{t('memo.noRecords')}</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="table-row">
                <td className="table-td font-medium">{r.studentName}</td>
                <td className="table-td text-[var(--color-text-muted)]">{r.className}</td>
                <td className="table-td">
                  <div className="text-sm">{r.date}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{formatHijri(r.date, lang)}</div>
                </td>
                <td className="table-td font-medium" style={{ fontFamily: lang === 'ar' ? "'Amiri', serif" : undefined }}>
                  {r.surahName}
                </td>
                <td className="table-td">
                  <span className="text-brand-green-600 font-semibold">{r.fromAyah}</span>
                  <span className="text-[var(--color-text-muted)] mx-1.5">
                    <svg className="w-3 h-3 inline rtl-flip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <span className="text-brand-green-600 font-semibold">{r.toAyah}</span>
                  <span className="text-xs text-[var(--color-text-muted)] ms-1">({r.toAyah - r.fromAyah + 1})</span>
                </td>
                <td className="table-td">
                  <span className={`badge ${evalColors[r.evaluation]}`}>{t(`eval.${r.evaluation}`)}</span>
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 text-brand-green-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
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

export default TeacherMemorization;
