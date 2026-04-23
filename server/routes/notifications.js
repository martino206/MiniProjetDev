const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, ctrl.getNotifications);
router.put('/read-all', authMiddleware, ctrl.markAllRead);
router.put('/:id/read', authMiddleware, ctrl.markRead);

module.exports = router;
