require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Tatabu database...');

  const hash = async (pw) => bcrypt.hash(pw, 10);

  // Clear existing data
  await prisma.memorization.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();

  // Academic year
  const year = await prisma.academicYear.create({
    data: {
      name: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-06-30',
      isActive: true,
    },
  });

  // Users
  const admin = await prisma.user.create({
    data: {
      name: 'Ahmed Al-Rashidi',
      nameAr: 'أحمد الراشدي',
      nameEn: 'Ahmed Al-Rashidi',
      email: 'admin@tatabu.com',
      password: await hash('Admin123!'),
      role: 'admin',
      gender: 'male',
      age: 40,
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      name: 'Omar Al-Farouq',
      nameAr: 'عمر الفاروق',
      nameEn: 'Omar Al-Farouq',
      email: 'teacher1@tatabu.com',
      password: await hash('Teacher123!'),
      role: 'teacher',
      gender: 'male',
      age: 32,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      name: 'Fatimah Zahra',
      nameAr: 'فاطمة الزهراء',
      nameEn: 'Fatimah Zahra',
      email: 'teacher2@tatabu.com',
      password: await hash('Teacher123!'),
      role: 'teacher',
      gender: 'female',
      age: 28,
    },
  });

  const parent1 = await prisma.user.create({
    data: {
      name: 'Khalid Al-Mansouri',
      nameAr: 'خالد المنصوري',
      nameEn: 'Khalid Al-Mansouri',
      email: 'parent1@tatabu.com',
      password: await hash('Parent123!'),
      role: 'parent',
      gender: 'male',
      age: 38,
    },
  });

  const parent2 = await prisma.user.create({
    data: {
      name: 'Maryam Al-Hashimi',
      nameAr: 'مريم الهاشمي',
      nameEn: 'Maryam Al-Hashimi',
      email: 'parent2@tatabu.com',
      password: await hash('Parent123!'),
      role: 'parent',
      gender: 'female',
      age: 35,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: 'Yusuf Al-Mansouri',
      nameAr: 'يوسف المنصوري',
      nameEn: 'Yusuf Al-Mansouri',
      email: 'student1@tatabu.com',
      username: 'yusuf.almansouri',
      password: await hash('Student123!'),
      role: 'student',
      gender: 'male',
      age: 12,
      parentId: parent1.id,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Aisha Al-Mansouri',
      nameAr: 'عائشة المنصوري',
      nameEn: 'Aisha Al-Mansouri',
      email: 'student2@tatabu.com',
      username: 'aisha.almansouri',
      password: await hash('Student123!'),
      role: 'student',
      gender: 'female',
      age: 10,
      parentId: parent1.id,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Ibrahim Al-Hashimi',
      nameAr: 'إبراهيم الهاشمي',
      nameEn: 'Ibrahim Al-Hashimi',
      email: 'student3@tatabu.com',
      username: 'ibrahim.alhashimi',
      password: await hash('Student123!'),
      role: 'student',
      gender: 'male',
      age: 14,
      parentId: parent2.id,
    },
  });

  const student4 = await prisma.user.create({
    data: {
      name: 'Khadija Al-Hashimi',
      nameAr: 'خديجة الهاشمي',
      nameEn: 'Khadija Al-Hashimi',
      email: 'student4@tatabu.com',
      username: 'khadija.alhashimi',
      password: await hash('Student123!'),
      role: 'student',
      gender: 'female',
      age: 11,
      parentId: parent2.id,
    },
  });

  // Classes
  const class1 = await prisma.class.create({
    data: {
      name: 'Nour Circle',
      teacherId: teacher1.id,
      academicYearId: year.id,
      sessionsPerWeek: 5,
      schedule: JSON.stringify([
        { day: 'monday', timeType: 'fixed', startTime: '16:00', endTime: '17:30' },
        { day: 'tuesday', timeType: 'fixed', startTime: '16:00', endTime: '17:30' },
        { day: 'wednesday', timeType: 'prayer', prayerRef: 'after_maghrib' },
        { day: 'thursday', timeType: 'fixed', startTime: '16:00', endTime: '17:30' },
        { day: 'saturday', timeType: 'prayer', prayerRef: 'after_fajr' },
      ]),
      students: {
        create: [
          { studentId: student1.id },
          { studentId: student2.id },
        ],
      },
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: 'Badr Circle',
      teacherId: teacher2.id,
      academicYearId: year.id,
      sessionsPerWeek: 4,
      schedule: JSON.stringify([
        { day: 'monday', timeType: 'prayer', prayerRef: 'after_asr' },
        { day: 'wednesday', timeType: 'prayer', prayerRef: 'after_asr' },
        { day: 'friday', timeType: 'prayer', prayerRef: 'after_dhuhr' },
        { day: 'sunday', timeType: 'fixed', startTime: '10:00', endTime: '11:30' },
      ]),
      students: {
        create: [
          { studentId: student3.id },
          { studentId: student4.id },
        ],
      },
    },
  });

  // Sample attendance
  const today = new Date();
  const attendanceData = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    [student1.id, student2.id].forEach(sid => {
      attendanceData.push({
        studentId: sid,
        classId: class1.id,
        academicYearId: year.id,
        date: dateStr,
        status: Math.random() > 0.2 ? 'present' : 'absent',
      });
    });

    [student3.id, student4.id].forEach(sid => {
      attendanceData.push({
        studentId: sid,
        classId: class2.id,
        academicYearId: year.id,
        date: dateStr,
        status: Math.random() > 0.15 ? 'present' : 'absent',
      });
    });
  }
  await prisma.attendance.createMany({ data: attendanceData });

  // Sample memorization
  const surahSamples = [
    { surahId: 67, fromAyah: 1, toAyah: 10 },
    { surahId: 67, fromAyah: 11, toAyah: 20 },
    { surahId: 68, fromAyah: 1, toAyah: 15 },
    { surahId: 69, fromAyah: 1, toAyah: 12 },
    { surahId: 78, fromAyah: 1, toAyah: 20 },
  ];
  const evals = ['excellent', 'good', 'good', 'average', 'excellent'];
  const memoData = [];

  surahSamples.forEach((s, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 2);
    const dateStr = d.toISOString().split('T')[0];

    [student1.id, student2.id].forEach(sid => {
      memoData.push({
        studentId: sid, classId: class1.id, academicYearId: year.id,
        date: dateStr, surahId: s.surahId, fromAyah: s.fromAyah, toAyah: s.toAyah,
        evaluation: evals[i],
      });
    });
    [student3.id, student4.id].forEach(sid => {
      memoData.push({
        studentId: sid, classId: class2.id, academicYearId: year.id,
        date: dateStr, surahId: s.surahId, fromAyah: s.fromAyah, toAyah: s.toAyah,
        evaluation: evals[i],
      });
    });
  });
  await prisma.memorization.createMany({ data: memoData });

  // Welcome notification
  await prisma.notification.create({
    data: {
      message: 'Welcome to Tatabu — Quranic School Management Platform. May Allah bless your journey.',
      senderId: admin.id,
      senderName: admin.nameEn || admin.name,
      readBy: '[]',
    },
  });

  // Sample messages
  const chatId = [admin.id, teacher1.id].sort().join('_');
  await prisma.message.createMany({
    data: [
      {
        fromId: admin.id, toId: teacher1.id,
        message: 'Welcome to the platform, please review the class schedules.',
        chatId, type: 'private',
      },
      {
        fromId: teacher1.id, toId: admin.id,
        message: 'Thank you! I will review them right away.',
        chatId, type: 'private',
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('🔑 Demo credentials:');
  console.log('   Admin:   admin@tatabu.com / Admin123!');
  console.log('   Teacher: teacher1@tatabu.com / Teacher123!');
  console.log('   Student: student1@tatabu.com / Student123!');
  console.log('   Parent:  parent1@tatabu.com / Parent123!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
