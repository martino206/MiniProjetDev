const router = require('express').Router();
const ctrl = require('../controllers/categoryController.js');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.js');

router.get('/', ctrl.getCategories);
router.post('/', authMiddleware, adminMiddleware, ctrl.createCategory);
router.delete('/:id', authMiddleware, adminMiddleware, ctrl.deleteCategory);
router.get('/stats', authMiddleware, adminMiddleware, ctrl.getStats);

module.exports = router;
