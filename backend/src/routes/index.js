const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/classes', require('./classes'));
router.use('/attendance', require('./attendance'));
router.use('/memorization', require('./memorization'));
router.use('/messages', require('./messages'));
router.use('/notifications', require('./notifications'));
router.use('/academic-years', require('./academicYears'));

module.exports = router;
