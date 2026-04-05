import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { formatHijri, formatGregorian, todayISO, gregorianToHijri, hijriToGregorian, HIJRI_MONTHS_AR, HIJRI_MONTHS_EN } from '../../utils/hijriDate';
import { generateId } from '../../utils/auth';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const todayHijri = gregorianToHijri(new Date());
  const [hijriYear, setHijriYear] = useState(todayHijri.year);
  const [hijriMonth, setHijriMonth] = useState(todayHijri.month);
  const [hijriDay, setHijriDay] = useState(todayHijri.day);
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [recordingClass, setRecordingClass] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const myClasses = useMemo(() => storage.getAll(KEYS.CLASSES).filter(c => c.teacherId === user?.id), [user]);
  const allUsers = storage.getAll(KEYS.USERS);

  const hijriMonthNames = lang === 'ar' ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;

  const updateHijriDate = (y, m, d) => {
    const iso = hijriToGregorian(y, m, d);
    setSelectedDate(iso);
    if (recordingClass) initAttendanceMap(recordingClass, iso);
  };

  const handleHijriYearChange = (y) => {
    const val = parseInt(y);
    setHijriYear(val);
    updateHijriDate(val, hijriMonth, hijriDay);
  };

  const handleHijriMonthChange = (m) => {
    const val = parseInt(m);
    setHijriMonth(val);
    updateHijriDate(hijriYear, val, hijriDay);
  };

  const handleHijriDayChange = (d) => {
    const val = parseInt(d);
    setHijriDay(val);
    updateHijriDate(hijriYear, hijriMonth, val);
  };

  const records = useMemo(() => {
    let all = storage.getAll(KEYS.ATTENDANCE).filter(a => {
      const cls = myClasses.find(c => c.id === a.classId);
      return !!cls;
    });
    if (filterClass) all = all.filter(a => a.classId === filterClass);
    if (filterDate) all = all.filter(a => a.date === filterDate);
    return all.map(a => {
      const student = allUsers.find(u => u.id === a.studentId);
      const cls = myClasses.find(c => c.id === a.classId);
      return { ...a, studentName: student?.nameAr || student?.name || '?', className: cls?.name || '?' };
    }).filter(a => {
      if (search) return a.studentName.toLowerCase().includes(search.toLowerCase());
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filterClass, filterDate, search, myClasses, allUsers]);

  const studentsForClass = useMemo(() => {
    if (!recordingClass) return [];
    const cls = myClasses.find(c => c.id === recordingClass);
    return allUsers.filter(u => cls?.studentIds?.includes(u.id));
  }, [recordingClass, myClasses, allUsers]);

  const initAttendanceMap = (classId, date) => {
    const existing = storage.getAll(KEYS.ATTENDANCE).filter(a => a.classId === classId && a.date === date);
    const cls = myClasses.find(c => c.id === classId);
    const map = {};
    cls?.studentIds?.forEach(id => {
      const rec = existing.find(a => a.studentId === id);
      map[id] = rec?.status || 'present';
    });
    setAttendanceMap(map);
  };

  const handleClassSelect = (classId) => {
    setRecordingClass(classId);
    if (classId) initAttendanceMap(classId, selectedDate);
  };

  const handleSave = () => {
    if (!recordingClass || !selectedDate) return;
    const cls = myClasses.find(c => c.id === recordingClass);
    const activeYear = storage.findOne(KEYS.ACADEMIC_YEARS, y => y.isActive);

    const existing = storage.getAll(KEYS.ATTENDANCE).filter(a => !(a.classId === recordingClass && a.date === selectedDate));
    storage.set(KEYS.ATTENDANCE, existing);

    cls?.studentIds?.forEach(studentId => {
      storage.add(KEYS.ATTENDANCE, {
        id: generateId(),
        studentId,
        classId: recordingClass,
        academicYearId: activeYear?.id || '',
        date: selectedDate,
        status: attendanceMap[studentId] || 'present',
        createdAt: new Date().toISOString(),
      });
    });

    showToast(t('common.success'));
    setRecordingClass('');
    setAttendanceMap({});
  };

  const hijriYears = Array.from({ length: 15 }, (_, i) => todayHijri.year - 5 + i);

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">{t('attendance.title')}</h1>
      </div>

      {/* Record attendance */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-[var(--color-text)]">{t('attendance.record')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('common.class')}</label>
            <select value={recordingClass} onChange={e => handleClassSelect(e.target.value)} className="select">
              <option value="">{t('common.select')}</option>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">{t('attendance.hijriDate')}</label>
            <div className="grid grid-cols-3 gap-2">
              <select value={hijriDay} onChange={e => handleHijriDayChange(e.target.value)} className="select text-sm">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={hijriMonth} onChange={e => handleHijriMonthChange(e.target.value)} className="select text-sm">
                {hijriMonthNames.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
              <select value={hijriYear} onChange={e => handleHijriYearChange(e.target.value)} className="select text-sm">
                {hijriYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="flex gap-3 text-sm text-[var(--color-text-muted)]">
            <span>{formatHijri(selectedDate, lang)}</span>
            <span>|</span>
            <span>{formatGregorian(selectedDate, lang)}</span>
          </div>
        )}

        {studentsForClass.length > 0 && (
          <div className="space-y-2">
            {studentsForClass.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:border-brand-green-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {(s.nameAr || s.name || '?').charAt(0)}
                  </div>
                  <span className="font-medium">{s.nameAr || s.name}</span>
                </div>
                <div className="flex gap-2">
                  {['present', 'absent'].map(status => (
                    <button key={status} onClick={() => setAttendanceMap(m => ({ ...m, [s.id]: status }))}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${attendanceMap[s.id] === status
                        ? status === 'present' ? 'bg-brand-green-600 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                        : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-brand-green-300'}`}>
                      {t(`attend.${status}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button onClick={handleSave} className="btn-primary">{t('attendance.save')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('attendance.search')} className="input" />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="select">
            <option value="">{t('common.all')} {t('common.class')}</option>
            {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input" placeholder={t('attendance.filterDate')} title={t('attendance.filterDate')} />
        </div>
      </div>

      {/* History table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('common.name')}</th>
              <th className="table-th">{t('common.class')}</th>
              <th className="table-th">{t('attendance.hijriDate')}</th>
              <th className="table-th">{t('attendance.date')}</th>
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
                <td className="table-td font-medium">{formatHijri(r.date, lang)}</td>
                <td className="table-td text-xs text-[var(--color-text-muted)]">{formatGregorian(r.date, lang)}</td>
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

export default TeacherAttendance;
