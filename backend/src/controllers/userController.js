const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const formatUser = (user, childrenIds = []) => {
  const { password, ...safe } = user;
  if (user.role === 'parent') safe.childrenIds = childrenIds;
  return safe;
};

const enrichUser = async (user) => {
  let childrenIds = [];
  if (user.role === 'parent') {
    const children = await prisma.user.findMany({
      where: { parentId: user.id },
      select: { id: true },
    });
    childrenIds = children.map(c => c.id);
  }
  return formatUser(user, childrenIds);
};

const ROLE_CREATE = {
  admin:   (userId)              => prisma.admin.create({ data: { userId } }),
  teacher: (userId)              => prisma.teacher.create({ data: { userId } }),
  student: (userId, hizb)        => prisma.student.create({ data: { userId, hizbMemorized: parseFloat(hizb) || 0 } }),
  parent:  (userId)              => prisma.parent.create({ data: { userId } }),
};

const createRoleProfile = async (userId, role, hizbMemorized) => {
  const fn = ROLE_CREATE[role];
  if (!fn) return;
  try {
    await fn(userId, hizbMemorized);
  } catch (err) {
    // P2002 = unique constraint violation — profile already exists, nothing to do
    if (err.code !== 'P2002') throw err;
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'asc' } });

    const enriched = await Promise.all(users.map(enrichUser));
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: await enrichUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      name, nameAr, nameEn, email, username, password,
      role, gender, age, phone, parentPhone, parentId, classId, hizbMemorized,
    } = req.body;

    if (!password) return res.status(400).json({ success: false, message: 'Password required.' });
    if (!role) return res.status(400).json({ success: false, message: 'Role required.' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || nameAr || nameEn || 'Unknown',
        nameAr: nameAr || null,
        nameEn: nameEn || null,
        email: email || null,
        username: username || null,
        password: hashed,
        role,
        gender: gender || null,
        age: age ? parseInt(age) : null,
        phone: phone || null,
        parentPhone: parentPhone || null,
        parentId: parentId || null,
        hizbMemorized: hizbMemorized ? parseFloat(hizbMemorized) : 0,
      },
    });

    // Create role-specific profile record
    await createRoleProfile(user.id, role, hizbMemorized);

    // If classId provided, enroll in class
    if (classId && role === 'student') {
      await prisma.classStudent.upsert({
        where: { classId_studentId: { classId, studentId: user.id } },
        create: { classId, studentId: user.id },
        update: {},
      });
    }

    res.status(201).json({ success: true, data: await enrichUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, nameAr, nameEn, email, username, password,
      gender, age, phone, parentPhone, parentId, classId, hizbMemorized,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (email !== undefined) updateData.email = email || null;
    if (username !== undefined) updateData.username = username || null;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (gender !== undefined) updateData.gender = gender || null;
    if (age !== undefined) updateData.age = age ? parseInt(age) : null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone || null;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (hizbMemorized !== undefined) updateData.hizbMemorized = parseFloat(hizbMemorized) || 0;

    const user = await prisma.user.update({ where: { id }, data: updateData });

    // Handle class enrollment change
    if (classId !== undefined) {
      // Remove from all classes first
      await prisma.classStudent.deleteMany({ where: { studentId: id } });
      // Enroll in new class if provided
      if (classId) {
        await prisma.classStudent.upsert({
          where: { classId_studentId: { classId, studentId: id } },
          create: { classId, studentId: id },
          update: {},
        });
      }
    }

    res.json({ success: true, data: await enrichUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
};
