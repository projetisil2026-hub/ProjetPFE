const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.post('/bulk', ctrl.bulkUpsert);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
