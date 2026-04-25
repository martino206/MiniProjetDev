const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/userController.js');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.js');
const {upload} = require('../middlewares/upload.js');

// Public
router.get('/profile/:username', ctrl.getProfile);

// Authenticated
router.put('/me', authMiddleware, [
  body('full_name').optional().trim().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 500 })
], ctrl.updateProfile);

router.post('/me/avatar', authMiddleware, (req, res, next) => {
  req.uploadType = 'avatar';
  next();
}, upload.single('avatar'), ctrl.updateAvatar);

router.put('/me/password', authMiddleware, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], ctrl.changePassword);

// Admin
router.get('/', authMiddleware, adminMiddleware, ctrl.getAllUsers);
router.patch('/:id/toggle', authMiddleware, adminMiddleware, ctrl.toggleUserStatus);
router.delete('/:id', authMiddleware, adminMiddleware, ctrl.deleteUser);

module.exports = router;
