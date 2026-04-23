const db = require('../config/db');

exports.getNotifications = async (req, res, next) => {
  try {
    const [notifications] = await db.query(
      `SELECT n.*, u.username as actor_username, u.full_name as actor_name, u.avatar as actor_avatar,
              a.title as article_title, a.slug as article_slug
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       LEFT JOIN articles a ON n.article_id = a.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const [[{ unread }]] = await db.query('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ success: true, notifications, unread });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};
