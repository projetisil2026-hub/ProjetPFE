const prisma = require('../config/prisma');

exports.getAll = async (req, res, next) => {
  try {
    const { classId, studentId, date, academicYearId } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = date;
    if (academicYearId) where.academicYearId = academicYearId;

    // Role-based filtering
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

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

exports.bulkUpsert = async (req, res, next) => {
  try {
    const { classId, date, records, academicYearId } = req.body;
    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'classId, date, and records[] required.' });
    }

    // Delete existing for this class+date, then re-insert
    await prisma.attendance.deleteMany({ where: { classId, date } });

    const activeYear = academicYearId
      ? { id: academicYearId }
      : await prisma.academicYear.findFirst({ where: { isActive: true } });

    const created = await prisma.attendance.createMany({
      data: records.map(r => ({
        studentId: r.studentId,
        classId,
        academicYearId: activeYear?.id || '',
        date,
        status: r.status || 'present',
      })),
    });

    const saved = await prisma.attendance.findMany({ where: { classId, date } });
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { studentId, classId, date, status, academicYearId } = req.body;

    const activeYear = academicYearId
      ? { id: academicYearId }
      : await prisma.academicYear.findFirst({ where: { isActive: true } });

    const record = await prisma.attendance.upsert({
      where: { studentId_classId_date: { studentId, classId, date } },
      create: { studentId, classId, date, status: status || 'present', academicYearId: activeYear?.id || '' },
      update: { status: status || 'present' },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const record = await prisma.attendance.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.attendance.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    next(err);
  }
};
