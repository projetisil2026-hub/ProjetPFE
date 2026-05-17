'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/memorizationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── Memorization CRUD ────────────────────────────────────────────────────────
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// ── Progress endpoints ───────────────────────────────────────────────────────
// Must be declared BEFORE /:id routes to avoid "progress" being treated as an ID.

// Single student progress
// GET /api/memorization/progress/:studentId?academicYearId=...&refresh=true
router.get('/progress/:studentId', ctrl.getProgress);

// Class-wide progress (teacher / admin)
// GET /api/memorization/progress/class/:classId?academicYearId=...
router.get('/progress/class/:classId', ctrl.getClassProgress);

module.exports = router;
