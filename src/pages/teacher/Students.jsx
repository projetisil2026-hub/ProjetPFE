import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage, KEYS } from '../../utils/storage';
import { calcTotalHizbProgress } from '../../utils/quranData';
import { generateId } from '../../utils/auth';
import { todayISO } from '../../utils/hijriDate';

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
  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(todayISO());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [toast, setToast] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const myClasses = useMemo(() => {
    return storage.getAll(KEYS.CLASSES).filter(c => c.teacherId === user?.id);
  }, [user]);

  const allMemo = storage.getAll(KEYS.MEMORIZATION);
  const allUsers = storage.getAll(KEYS.USERS);

  const students = useMemo(() => {
    const classStudentIds = new Set(myClasses.flatMap(c => c.studentIds || []));
    let all = allUsers.filter(u => u.role === 'student' && classStudentIds.has(u.id));

    if (search) all = all.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    if (filterAge) all = all.filter(s => s.age === parseInt(filterAge));

    return all.map(s => {
      const cls = myClasses.find(c => c.studentIds?.includes(s.id));
      const memos = allMemo.filter(m => m.studentId === s.id);
      const hizbProgress = calcTotalHizbProgress(memos);
      const lastMemo = memos.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return { ...s, class: cls, hizbProgress, lastEvaluation: lastMemo?.evaluation };
    });
  }, [search, filterAge, myClasses, allMemo, allUsers]);

  const studentsForAttendance = useMemo(() => {
    if (!attendanceClass) return [];
    const cls = myClasses.find(c => c.id === attendanceClass);
    return allUsers.filter(u => cls?.studentIds?.includes(u.id));
  }, [attendanceClass, myClasses, allUsers]);

  // Initialize attendance map when class/date changes
  const initAttendance = (classId, date) => {
    const existing = storage.getAll(KEYS.ATTENDANCE).filter(a => a.classId === classId && a.date === date);
    const map = {};
    const cls = myClasses.find(c => c.id === classId);
    cls?.studentIds?.forEach(id => {
      const record = existing.find(a => a.studentId === id);
      map[id] = record?.status || 'present';
    });
    setAttendanceMap(map);
  };

  const handleClassChange = (classId) => {
    setAttendanceClass(classId);
    if (classId) initAttendance(classId, attendanceDate);
  };

  const handleDateChange = (date) => {
    setAttendanceDate(date);
    if (attendanceClass) initAttendance(attendanceClass, date);
  };

  const handleSaveAttendance = () => {
    if (!attendanceClass || !attendanceDate) return;
    const cls = myClasses.find(c => c.id === attendanceClass);
    const activeYear = storage.findOne(KEYS.ACADEMIC_YEARS, y => y.isActive);

    // Remove existing records for this class/date
    const existing = storage.getAll(KEYS.ATTENDANCE).filter(a => !(a.classId === attendanceClass && a.date === attendanceDate));
    storage.set(KEYS.ATTENDANCE, existing);

    // Add new records
    cls?.studentIds?.forEach(studentId => {
      storage.add(KEYS.ATTENDANCE, {
        id: generateId(),
        studentId,
        classId: attendanceClass,
        academicYearId: activeYear?.id || '',
        date: attendanceDate,
        status: attendanceMap[studentId] || 'present',
        createdAt: new Date().toISOString(),
      });
    });

    showToast(t('common.success'));
    setShowAttendance(false);
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm bg-brand-green-600">{toast}</div>}

      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('students.title')}</h1>
          <p className="page-subtitle">{students.length} {t('role.student')}</p>
        </div>
        <button onClick={() => setShowAttendance(!showAttendance)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          {t('attendance.record')}
        </button>
      </div>

      {/* Attendance panel */}
      {showAttendance && (
        <div className="card p-5 space-y-4 border-2 border-brand-green-300 dark:border-brand-green-700">
          <h3 className="font-semibold text-brand-green-700 dark:text-brand-green-400">{t('attendance.record')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('common.class')}</label>
              <select value={attendanceClass} onChange={e => handleClassChange(e.target.value)} className="select">
                <option value="">{t('common.select')}</option>
                {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('attendance.date')}</label>
              <input type="date" value={attendanceDate} onChange={e => handleDateChange(e.target.value)} className="input" />
            </div>
          </div>

          {studentsForAttendance.length > 0 && (
            <div className="space-y-2">
              {studentsForAttendance.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)]">
                  <span className="font-medium">{s.name}</span>
                  <div className="flex gap-2">
                    {['present','absent'].map(status => (
                      <button
                        key={status}
                        onClick={() => setAttendanceMap(m => ({ ...m, [s.id]: status }))}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          attendanceMap[s.id] === status
                            ? status === 'present' ? 'bg-brand-green-600 text-white' : 'bg-red-500 text-white'
                            : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-brand-green-300'
                        }`}
                      >
                        {t(`attend.${status}`)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button onClick={handleSaveAttendance} className="btn-primary">{t('attendance.save')}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('students.search')} className="input" />
          <input type="number" value={filterAge} onChange={e => setFilterAge(e.target.value)} placeholder={t('students.filterAge')} className="input" min="5" max="25" />
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
                    <div className="w-8 h-8 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-bold text-sm">{s.name.charAt(0)}</div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="table-td text-[var(--color-text-muted)]">{s.class?.name || '—'}</td>
                <td className="table-td">{s.age}</td>
                <td className="table-td">
                  <span className={`badge ${s.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
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
