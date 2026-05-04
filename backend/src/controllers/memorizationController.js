const prisma = require('../config/prisma');

exports.getAll = async (req, res, next) => {
  try {
    const { classId, studentId, date, surahId, academicYearId } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = date;
    if (surahId) where.surahId = parseInt(surahId);
    if (academicYearId) where.academicYearId = academicYearId;

    if (req.user.role === 'teacher') {
      const myClasses = await prisma.class.findMany({
        where: { teacherId: req.user.userId },
        select: { id: true },
      });
      const myClassIds = myClasses.map(c => c.id);
      where.classId = where.classId
        ? (myClassIds.includes(where.classId) ? where.classId : 'NONE')
        : { in: myClassIds };
    } else if (req.user.role === 'student') {
      where.studentId = req.user.userId;
    } else if (req.user.role === 'parent') {
      const children = await prisma.user.findMany({
        where: { parentId: req.user.userId },
        select: { id: true },
      });
      const childIds = children.map(c => c.id);
      where.studentId = studentId
        ? (childIds.includes(studentId) ? studentId : 'NONE')
        : { in: childIds };
    }

    const records = await prisma.memorization.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { studentId, classId, date, surahId, fromAyah, toAyah, evaluation, academicYearId } = req.body;

    const activeYear = academicYearId
      ? { id: academicYearId }
      : await prisma.academicYear.findFirst({ where: { isActive: true } });

    const record = await prisma.memorization.create({
      data: {
        studentId,
        classId,
        date,
        surahId: parseInt(surahId),
        fromAyah: parseInt(fromAyah),
        toAyah: parseInt(toAyah),
        evaluation: evaluation || 'good',
        academicYearId: activeYear?.id || '',
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { surahId, fromAyah, toAyah, evaluation, date, academicYearId } = req.body;
    const updateData = {};
    if (surahId !== undefined) updateData.surahId = parseInt(surahId);
    if (fromAyah !== undefined) updateData.fromAyah = parseInt(fromAyah);
    if (toAyah !== undefined) updateData.toAyah = parseInt(toAyah);
    if (evaluation !== undefined) updateData.evaluation = evaluation;
    if (date !== undefined) updateData.date = date;
    if (academicYearId !== undefined) updateData.academicYearId = academicYearId;

    const record = await prisma.memorization.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.memorization.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    next(err);
  }
};
