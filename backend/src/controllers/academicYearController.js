const prisma = require('../config/prisma');

exports.getAll = async (req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: years });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, startDate, endDate, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required.' });

    if (isActive) {
      await prisma.academicYear.updateMany({ data: { isActive: false } });
    }

    const year = await prisma.academicYear.create({
      data: { name, startDate: startDate || '', endDate: endDate || '', isActive: !!isActive },
    });
    res.status(201).json({ success: true, data: year });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, startDate, endDate, isActive } = req.body;

    if (isActive) {
      await prisma.academicYear.updateMany({ data: { isActive: false } });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (isActive !== undefined) updateData.isActive = isActive;

    const year = await prisma.academicYear.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ success: true, data: year });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.academicYear.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Year deleted.' });
  } catch (err) {
    next(err);
  }
};
