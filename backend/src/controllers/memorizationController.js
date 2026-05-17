'use strict';

const prisma = require('../config/prisma');
const {
  getStudentProgress,
  recomputeProgress,
  invalidateStudentCache,
  applyNewRecord,
  getBatchProgress,
  formatProgressResponse,
} = require('../services/memorizationService');

// ─── Read ─────────────────────────────────────────────────────────────────────

exports.getAll = async (req, res, next) => {
  try {
    const { classId, studentId, date, surahId, academicYearId } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = date;
    if (surahId) where.surahId = parseInt(surahId, 10);
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

// ─── Progress — single student ────────────────────────────────────────────────

/**
 * GET /api/memorization/progress/:studentId
 *
 * Query params:
 *   academicYearId  (optional) — scope progress to a specific year
 *   refresh         (optional) — set to "true" to bypass cache
 *
 * Response: { success, data: { percentage, hizb, juz, memorizedWords, ... } }
 *
 * Access rules:
 *   • admin/teacher: any student
 *   • student: only themselves
 *   • parent: only their children
 */
exports.getProgress = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYearId, refresh } = req.query;

    // Authorization check
    const authError = _checkProgressAccess(req.user, studentId, null);
    if (authError) {
      if (authError === 'PARENT_FETCH_CHILDREN') {
        const children = await prisma.user.findMany({
          where: { parentId: req.user.userId },
          select: { id: true },
        });
        if (!children.some(c => c.id === studentId)) {
          return res.status(403).json({ success: false, message: 'Access denied.' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const progressFn = refresh === 'true' ? recomputeProgress : getStudentProgress;
    const result = await progressFn(studentId, academicYearId || undefined);

    res.json({
      success: true,
      data: {
        studentId,
        ...(academicYearId ? { academicYearId } : {}),
        progress: formatProgressResponse(result),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Progress — batch (class) ─────────────────────────────────────────────────

/**
 * GET /api/memorization/progress/class/:classId
 *
 * Returns progress for every student in a class.
 * Accessible by: admin, teacher (own classes).
 *
 * Query params:
 *   academicYearId  (optional)
 */
exports.getClassProgress = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { academicYearId } = req.query;

    // Teachers may only query their own classes
    if (req.user.role === 'teacher') {
      const cls = await prisma.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });
      if (!cls || cls.teacherId !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    } else if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Fetch student IDs for this class
    const enrollments = await prisma.classStudent.findMany({
      where: { classId },
      select: { studentId: true },
    });
    const studentIds = enrollments.map(e => e.studentId);

    if (!studentIds.length) {
      return res.json({ success: true, data: [] });
    }

    const progressMap = await getBatchProgress(studentIds, academicYearId || undefined);

    const data = Array.from(progressMap.entries()).map(([sid, result]) => ({
      studentId: sid,
      progress: formatProgressResponse(result),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Create ───────────────────────────────────────────────────────────────────

exports.create = async (req, res, next) => {
  try {
    const {
      studentId,
      classId,
      date,
      hijriDate,
      surahId,
      fromAyah,
      toAyah,
      evaluation,
      academicYearId,
    } = req.body;

    const activeYear = academicYearId
      ? { id: academicYearId }
      : await prisma.academicYear.findFirst({ where: { isActive: true } });

    const record = await prisma.memorization.create({
      data: {
        studentId,
        classId,
        date,
        hijriDate: hijriDate || null,
        surahId: parseInt(surahId, 10),
        fromAyah: parseInt(fromAyah, 10),
        toAyah: parseInt(toAyah, 10),
        evaluation: evaluation || 'good',
        academicYearId: activeYear?.id || '',
      },
    });

    // Incremental cache update (fast path — no DB re-read)
    await applyNewRecord(studentId, activeYear?.id, record).catch(() => {
      // If incremental update fails (e.g. metadata not found), invalidate so
      // the next read triggers a full recompute.
      invalidateStudentCache(studentId);
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

exports.update = async (req, res, next) => {
  try {
    const { surahId, fromAyah, toAyah, evaluation, date, hijriDate, academicYearId } = req.body;

    // Fetch before update to know the studentId for cache invalidation
    const existing = await prisma.memorization.findUnique({
      where: { id: req.params.id },
      select: { studentId: true },
    });

    const updateData = {};
    if (surahId !== undefined) updateData.surahId = parseInt(surahId, 10);
    if (fromAyah !== undefined) updateData.fromAyah = parseInt(fromAyah, 10);
    if (toAyah !== undefined) updateData.toAyah = parseInt(toAyah, 10);
    if (evaluation !== undefined) updateData.evaluation = evaluation;
    if (date !== undefined) updateData.date = date;
    if (hijriDate !== undefined) updateData.hijriDate = hijriDate || null;
    if (academicYearId !== undefined) updateData.academicYearId = academicYearId;

    const record = await prisma.memorization.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Must full-recompute: cannot incrementally undo a changed range
    if (existing) {
      invalidateStudentCache(existing.studentId);
    }

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.memorization.findUnique({
      where: { id: req.params.id },
      select: { studentId: true },
    });

    await prisma.memorization.delete({ where: { id: req.params.id } });

    // Full recompute required on next read
    if (existing) {
      invalidateStudentCache(existing.studentId);
    }

    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Returns null (allowed), 'DENIED', or 'PARENT_FETCH_CHILDREN' (deferred check).
 */
function _checkProgressAccess(user, targetStudentId, _classId) {
  if (user.role === 'admin' || user.role === 'teacher') return null;
  if (user.role === 'student') {
    return user.userId === targetStudentId ? null : 'DENIED';
  }
  if (user.role === 'parent') return 'PARENT_FETCH_CHILDREN';
  return 'DENIED';
}
