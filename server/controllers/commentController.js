const db = require('../config/db');

exports.addComment = async (req, res, next) => {
  try {
    const { id: article_id } = req.params;
    const { content, parent_id } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Contenu requis' });

    const [result] = await db.query(
      'INSERT INTO comments (content, article_id, user_id, parent_id) VALUES (?, ?, ?, ?)',
      [content.trim(), article_id, req.user.id, parent_id || null]
    );

    const [[comment]] = await db.query(
      `SELECT c.*, u.username, u.full_name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
      [result.insertId]
    );

    // Notification
    const [[article]] = await db.query('SELECT author_id, title FROM articles WHERE id = ?', [article_id]);
    if (article && article.author_id !== req.user.id) {
      await db.query(
        'INSERT INTO notifications (user_id, actor_id, type, message, article_id) VALUES (?, ?, ?, ?, ?)',
        [article.author_id, req.user.id, 'comment', `${req.user.full_name || req.user.username} a commenté votre article.`, article_id]
      );
    }

    res.status(201).json({ success: true, comment });
  } catch (err) { next(err); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[comment]] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
    if (!comment) return res.status(404).json({ success: false, message: 'Commentaire introuvable' });

    if (comment.user_id !== req.user.id && req.user.role_name !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Commentaire supprimé' });
  } catch (err) { next(err); }
};
