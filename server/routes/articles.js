const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/articleController');
const commentCtrl = require('../controllers/commentController');
const { authMiddleware, optionalAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public with optional auth
router.get('/', optionalAuth, ctrl.getArticles);
router.get('/:slug', optionalAuth, ctrl.getArticleBySlug);

// Authenticated
router.post('/', authMiddleware, (req, res, next) => {
  req.uploadType = 'cover';
  next();
}, upload.single('cover_image'), [
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Titre requis (max 255 car.)'),
  body('content').notEmpty().withMessage('Contenu requis'),
], ctrl.createArticle);

router.put('/:id', authMiddleware, (req, res, next) => {
  req.uploadType = 'cover';
  next();
}, upload.single('cover_image'), ctrl.updateArticle);

router.delete('/:id', authMiddleware, ctrl.deleteArticle);

router.get('/user/:userId', ctrl.getUserArticles);
router.get('/me/list', authMiddleware, ctrl.getUserArticles);

router.post('/:id/like', authMiddleware, ctrl.toggleLike);
router.post('/:id/bookmark', authMiddleware, ctrl.toggleBookmark);
router.get('/me/bookmarks', authMiddleware, ctrl.getBookmarks);

// Comments
router.post('/:id/comments', authMiddleware, commentCtrl.addComment);
router.delete('/comments/:id', authMiddleware, commentCtrl.deleteComment);

module.exports = router;
