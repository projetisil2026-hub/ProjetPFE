import { hashPassword, generateId } from './auth';

// Storage keys
export const KEYS = {
  USERS: 'tatabu_users',
  ACADEMIC_YEARS: 'tatabu_academic_years',
  CLASSES: 'tatabu_classes',
  ATTENDANCE: 'tatabu_attendance',
  MEMORIZATION: 'tatabu_memorization',
  NOTIFICATIONS: 'tatabu_notifications',
  MESSAGES: 'tatabu_messages',
  MONTHLY_NOTES: 'tatabu_monthly_notes',
  INITIALIZED: 'tatabu_initialized',
};

// Generic storage operations
export const storage = {
  get: (key, defaultVal = null) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultVal;
    } catch { return defaultVal; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  getAll: (key) => storage.get(key, []),
  add: (key, item) => {
    const arr = storage.getAll(key);
    arr.push(item);
    storage.set(key, arr);
    return item;
  },
  update: (key, id, updates) => {
    const arr = storage.getAll(key);
    const idx = arr.findIndex(i => i.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...updates };
    storage.set(key, arr);
    return arr[idx];
  },
  delete: (key, id) => {
    const arr = storage.getAll(key).filter(i => i.id !== id);
    storage.set(key, arr);
  },
  find: (key, predicate) => storage.getAll(key).filter(predicate),
  findOne: (key, predicate) => storage.getAll(key).find(predicate),
};

// Initialize seed data
export const initializeData = () => {
  if (storage.get(KEYS.INITIALIZED)) return;

  const adminId = generateId();
  const teacher1Id = generateId();
  const teacher2Id = generateId();
  const student1Id = generateId();
  const student2Id = generateId();
  const student3Id = generateId();
  const student4Id = generateId();
  const parent1Id = generateId();
  const parent2Id = generateId();
  const yearId = generateId();
  const class1Id = generateId();
  const class2Id = generateId();

  // Users
  const users = [
    {
      id: adminId,
      name: 'Ahmed Al-Rashidi',
      nameAr: 'أحمد الراشدي',
      nameEn: 'Ahmed Al-Rashidi',
      email: 'admin@tatabu.com',
      password: hashPassword('Admin123!'),
      role: 'admin',
      gender: 'male',
      age: 40,
      createdAt: new Date().toISOString(),
    },
    {
      id: teacher1Id,
      name: 'Omar Al-Farouq',
      nameAr: 'عمر الفاروق',
      nameEn: 'Omar Al-Farouq',
      email: 'teacher1@tatabu.com',
      password: hashPassword('Teacher123!'),
      role: 'teacher',
      gender: 'male',
      age: 32,
      createdAt: new Date().toISOString(),
    },
    {
      id: teacher2Id,
      name: 'Fatimah Zahra',
      nameAr: 'فاطمة الزهراء',
      nameEn: 'Fatimah Zahra',
      email: 'teacher2@tatabu.com',
      password: hashPassword('Teacher123!'),
      role: 'teacher',
      gender: 'female',
      age: 28,
      createdAt: new Date().toISOString(),
    },
    {
      id: parent1Id,
      name: 'Khalid Al-Mansouri',
      nameAr: 'خالد المنصوري',
      nameEn: 'Khalid Al-Mansouri',
      email: 'parent1@tatabu.com',
      password: hashPassword('Parent123!'),
      role: 'parent',
      gender: 'male',
      age: 38,
      childrenIds: [student1Id, student2Id],
      createdAt: new Date().toISOString(),
    },
    {
      id: parent2Id,
      name: 'Maryam Al-Hashimi',
      nameAr: 'مريم الهاشمي',
      nameEn: 'Maryam Al-Hashimi',
      email: 'parent2@tatabu.com',
      password: hashPassword('Parent123!'),
      role: 'parent',
      gender: 'female',
      age: 35,
      childrenIds: [student3Id, student4Id],
      createdAt: new Date().toISOString(),
    },
    {
      id: student1Id,
      name: 'Yusuf Al-Mansouri',
      nameAr: 'يوسف المنصوري',
      nameEn: 'Yusuf Al-Mansouri',
      email: 'student1@tatabu.com',
      password: hashPassword('Student123!'),
      role: 'student',
      gender: 'male',
      age: 12,
      parentId: parent1Id,
      createdAt: new Date().toISOString(),
    },
    {
      id: student2Id,
      name: 'Aisha Al-Mansouri',
      nameAr: 'عائشة المنصوري',
      nameEn: 'Aisha Al-Mansouri',
      email: 'student2@tatabu.com',
      password: hashPassword('Student123!'),
      role: 'student',
      gender: 'female',
      age: 10,
      parentId: parent1Id,
      createdAt: new Date().toISOString(),
    },
    {
      id: student3Id,
      name: 'Ibrahim Al-Hashimi',
      nameAr: 'إبراهيم الهاشمي',
      nameEn: 'Ibrahim Al-Hashimi',
      email: 'student3@tatabu.com',
      password: hashPassword('Student123!'),
      role: 'student',
      gender: 'male',
      age: 14,
      parentId: parent2Id,
      createdAt: new Date().toISOString(),
    },
    {
      id: student4Id,
      name: 'Khadija Al-Hashimi',
      nameAr: 'خديجة الهاشمي',
      nameEn: 'Khadija Al-Hashimi',
      email: 'student4@tatabu.com',
      password: hashPassword('Student123!'),
      role: 'student',
      gender: 'female',
      age: 11,
      parentId: parent2Id,
      createdAt: new Date().toISOString(),
    },
  ];

  // Academic Years
  const academicYears = [
    {
      id: yearId,
      name: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-06-30',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Classes
  const classes = [
    {
      id: class1Id,
      name: 'Nour Circle',
      teacherId: teacher1Id,
      academicYearId: yearId,
      sessionsPerWeek: 5,
      schedule: [
        { day: 'monday', timeType: 'fixed', startTime: '16:00', endTime: '17:30' },
        { day: 'tuesday', timeType: 'fixed', startTime: '16:00', endTime: '17:30' },
        { day: 'wednesday', timeType: 'prayer', prayerRef: 'after_maghrib' },
        { day: 'thursday', timeType: 'fixed', startTime: '16:00', endTime: '17:30' },
        { day: 'saturday', timeType: 'prayer', prayerRef: 'after_fajr' },
      ],
      studentIds: [student1Id, student2Id],
      createdAt: new Date().toISOString(),
    },
    {
      id: class2Id,
      name: 'Badr Circle',
      teacherId: teacher2Id,
      academicYearId: yearId,
      sessionsPerWeek: 4,
      schedule: [
        { day: 'monday', timeType: 'prayer', prayerRef: 'after_asr' },
        { day: 'wednesday', timeType: 'prayer', prayerRef: 'after_asr' },
        { day: 'friday', timeType: 'prayer', prayerRef: 'after_dhuhr' },
        { day: 'sunday', timeType: 'fixed', startTime: '10:00', endTime: '11:30' },
      ],
      studentIds: [student3Id, student4Id],
      createdAt: new Date().toISOString(),
    },
  ];

  // Sample attendance
  const today = new Date();
  const attendance = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    [student1Id, student2Id].forEach(sId => {
      attendance.push({
        id: generateId(),
        studentId: sId,
        classId: class1Id,
        academicYearId: yearId,
        date: dateStr,
        status: Math.random() > 0.2 ? 'present' : 'absent',
        createdAt: new Date().toISOString(),
      });
    });
    [student3Id, student4Id].forEach(sId => {
      attendance.push({
        id: generateId(),
        studentId: sId,
        classId: class2Id,
        academicYearId: yearId,
        date: dateStr,
        status: Math.random() > 0.15 ? 'present' : 'absent',
        createdAt: new Date().toISOString(),
      });
    });
  }

  // Sample memorization
  const memoRecords = [];
  const surahSamples = [
    { surahId: 67, from: 1, to: 10 },
    { surahId: 67, from: 11, to: 20 },
    { surahId: 68, from: 1, to: 15 },
    { surahId: 69, from: 1, to: 12 },
    { surahId: 78, from: 1, to: 20 },
  ];
  const evals = ['excellent', 'good', 'good', 'average', 'excellent'];

  surahSamples.forEach((s, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 2);
    [student1Id, student2Id].forEach(sId => {
      memoRecords.push({
        id: generateId(),
        studentId: sId,
        classId: class1Id,
        academicYearId: yearId,
        date: d.toISOString().split('T')[0],
        surahId: s.surahId,
        fromAyah: s.from,
        toAyah: s.to,
        evaluation: evals[i],
        createdAt: new Date().toISOString(),
      });
    });
    [student3Id, student4Id].forEach(sId => {
      memoRecords.push({
        id: generateId(),
        studentId: sId,
        classId: class2Id,
        academicYearId: yearId,
        date: d.toISOString().split('T')[0],
        surahId: s.surahId,
        fromAyah: s.from,
        toAyah: s.to,
        evaluation: evals[i],
        createdAt: new Date().toISOString(),
      });
    });
  });

  // Welcome notification
  const notifications = [
    {
      id: generateId(),
      message: 'Welcome to Tatabu — Quranic School Management Platform. May Allah bless your journey.',
      senderId: adminId,
      senderName: 'Ahmed Al-Rashidi',
      timestamp: new Date().toISOString(),
      readBy: [],
    },
  ];

  // Seed messages
  const messages = [
    {
      id: generateId(),
      fromId: adminId,
      toId: teacher1Id,
      message: 'Welcome to the platform, please review the class schedules.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'private',
      chatId: [adminId, teacher1Id].sort().join('_'),
    },
    {
      id: generateId(),
      fromId: teacher1Id,
      toId: adminId,
      message: 'Thank you! I will review them right away.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'private',
      chatId: [adminId, teacher1Id].sort().join('_'),
    },
  ];

  storage.set(KEYS.USERS, users);
  storage.set(KEYS.ACADEMIC_YEARS, academicYears);
  storage.set(KEYS.CLASSES, classes);
  storage.set(KEYS.ATTENDANCE, attendance);
  storage.set(KEYS.MEMORIZATION, memoRecords);
  storage.set(KEYS.NOTIFICATIONS, notifications);
  storage.set(KEYS.MESSAGES, messages);
  storage.set(KEYS.MONTHLY_NOTES, []);
  storage.set(KEYS.INITIALIZED, true);

  console.log('✅ Tatabu data initialized');
  console.log('🔑 Demo credentials:');
  console.log('   Admin:   admin@tatabu.com / Admin123!');
  console.log('   Teacher: teacher1@tatabu.com / Teacher123!');
  console.log('   Student: student1@tatabu.com / Student123!');
  console.log('   Parent:  parent1@tatabu.com / Parent123!');
};
