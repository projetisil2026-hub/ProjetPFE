const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/conversation/:chatId', ctrl.getConversation);
router.post('/', ctrl.send);

module.exports = router;
