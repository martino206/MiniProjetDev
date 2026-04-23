const db = require('../config/db');

exports.getCategories = async (req, res, next) => {
  try {
    const [categories] = await db.query(
      `SELECT c.*, COUNT(DISTINCT ac.article_id) as article_count
       FROM categories c
       LEFT JOIN article_categories ac ON c.id = ac.category_id
       LEFT JOIN articles a ON ac.article_id = a.id AND a.status = 'published'
       GROUP BY c.id ORDER BY article_count DESC`
    );
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const slugify = require('slugify');
    const slug = slugify(name, { lower: true, strict: true });

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description, color) VALUES (?, ?, ?, ?)',
      [name, slug, description || '', color || '#6366f1']
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) as total FROM users');
    const [[articles]] = await db.query("SELECT COUNT(*) as total FROM articles WHERE status = 'published'");
    const [[comments]] = await db.query('SELECT COUNT(*) as total FROM comments');
    const [[likes]] = await db.query('SELECT COUNT(*) as total FROM likes');

    const [topArticles] = await db.query(
      `SELECT a.id, a.title, a.slug, a.views, a.created_at,
              u.username, u.full_name,
              (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as likes_count
       FROM articles a JOIN users u ON a.author_id = u.id
       WHERE a.status = 'published'
       ORDER BY a.views DESC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        users: users.total,
        articles: articles.total,
        comments: comments.total,
        likes: likes.total
      },
      topArticles
    });
  } catch (err) { next(err); }
};
