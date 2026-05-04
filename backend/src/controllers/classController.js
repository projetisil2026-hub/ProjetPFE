const prisma = require('../config/prisma');

const parseSchedule = (s) => {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || '[]'); } catch { return []; }
};

const formatClass = (cls) => ({
  id: cls.id,
  name: cls.name,
  teacherId: cls.teacherId,
  academicYearId: cls.academicYearId,
  sessionsPerWeek: cls.sessionsPerWeek,
  schedule: parseSchedule(cls.schedule),
  studentIds: cls.students ? cls.students.map(cs => cs.studentId) : [],
  createdAt: cls.createdAt,
});

exports.getAll = async (req, res, next) => {
  try {
    const { academicYearId, teacherId } = req.query;
    const where = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (teacherId) where.teacherId = teacherId;

    const classes = await prisma.class.findMany({
      where,
      include: { students: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: classes.map(formatClass) });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: { students: true },
    });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data: formatClass(cls) });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, teacherId, academicYearId, sessionsPerWeek, schedule, studentIds } = req.body;

    if (!name || !teacherId || !academicYearId) {
      return res.status(400).json({ success: false, message: 'name, teacherId, and academicYearId are required.' });
    }

    const cls = await prisma.class.create({
      data: {
        name,
        teacherId,
        academicYearId,
        sessionsPerWeek: sessionsPerWeek || 3,
        schedule: JSON.stringify(schedule || []),
        students: studentIds?.length
          ? { create: studentIds.map(id => ({ studentId: id })) }
          : undefined,
      },
      include: { students: true },
    });

    res.status(201).json({ success: true, data: formatClass(cls) });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, teacherId, academicYearId, sessionsPerWeek, schedule, studentIds } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (academicYearId !== undefined) updateData.academicYearId = academicYearId;
    if (sessionsPerWeek !== undefined) updateData.sessionsPerWeek = parseInt(sessionsPerWeek) || 3;
    if (schedule !== undefined) updateData.schedule = JSON.stringify(schedule);

    if (studentIds !== undefined) {
      // Sync enrollments
      await prisma.classStudent.deleteMany({ where: { classId: id } });
      if (studentIds.length) {
        await prisma.classStudent.createMany({
          data: studentIds.map(sid => ({ classId: id, studentId: sid })),
        });
      }
    }

    const cls = await prisma.class.update({
      where: { id },
      data: updateData,
      include: { students: true },
    });

    res.json({ success: true, data: formatClass(cls) });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.class.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Class deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.enrollStudent = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const { studentId } = req.body;
    await prisma.classStudent.upsert({
      where: { classId_studentId: { classId, studentId } },
      create: { classId, studentId },
      update: {},
    });
    res.json({ success: true, message: 'Student enrolled.' });
  } catch (err) {
    next(err);
  }
};

exports.unenrollStudent = async (req, res, next) => {
  try {
    const { id: classId, studentId } = req.params;
    await prisma.classStudent.delete({
      where: { classId_studentId: { classId, studentId } },
    });
    res.json({ success: true, message: 'Student unenrolled.' });
  } catch (err) {
    next(err);
  }
};
