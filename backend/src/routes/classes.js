const router = require('express').Router();
const ctrl = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);
router.post('/:id/students', authorize('admin'), ctrl.enrollStudent);
router.delete('/:id/students/:studentId', authorize('admin'), ctrl.unenrollStudent);

module.exports = router;
