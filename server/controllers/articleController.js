const db = require('../config/db');
const slugify = require('slugify');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const makeSlug = (title) =>
  slugify(title, { lower: true, strict: true, locale: 'fr' }) + '-' + Date.now();

/* =========================================================
   GET ARTICLES
========================================================= */
exports.getArticles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search?.trim() || '';
    const category = req.query.category?.trim() || '';
    const status = req.query.status || 'published';

    let query = `
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.status,
             a.reading_time, a.views, a.created_at,
             u.id as author_id, u.username, u.full_name, u.avatar,
             (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comments_count,
             COALESCE(GROUP_CONCAT(DISTINCT c.name), '') as categories,
             COALESCE(GROUP_CONCAT(DISTINCT c.color), '') as category_colors
      FROM articles a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.status = ?
    `;

    const params = [status];

    if (search) {
      query += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    query += ' GROUP BY a.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [articles] = await db.query(query, params);

    const countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.status = ?
    `;

    const countParams = [status];

    if (search) {
      countQuery += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      countQuery += ' AND c.slug = ?';
      countParams.push(category);
    }

    const [[{ total }]] = await db.query(countQuery, countParams);

    let userLikes = [];
    let userBookmarks = [];

    if (req.user?.id) {
      const ids = articles.map(a => a.id);

      if (ids.length > 0) {
        const [lk] = await db.query(
          'SELECT article_id FROM likes WHERE user_id = ? AND article_id IN (?)',
          [req.user.id, ids]
        );

        const [bm] = await db.query(
          'SELECT article_id FROM bookmarks WHERE user_id = ? AND article_id IN (?)',
          [req.user.id, ids]
        );

        userLikes = lk.map(l => l.article_id);
        userBookmarks = bm.map(b => b.article_id);
      }
    }

    const enriched = articles.map(a => ({
      ...a,
      categories: a.categories ? a.categories.split(',') : [],
      category_colors: a.category_colors ? a.category_colors.split(',') : [],
      liked: userLikes.includes(a.id),
      bookmarked: userBookmarks.includes(a.id)
    }));

    res.json({
      success: true,
      articles: enriched,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET ARTICLE BY SLUG
========================================================= */
exports.getArticleBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [rows] = await db.query(
      `SELECT a.*, u.id as author_id, u.username, u.full_name, u.avatar, u.bio,
              (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comments_count
       FROM articles a JOIN users u ON a.author_id = u.id
       WHERE a.slug = ?`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Article introuvable' });
    }

    const article = rows[0];

    const [cats] = await db.query(
      'SELECT c.* FROM categories c JOIN article_categories ac ON c.id = ac.category_id WHERE ac.article_id = ?',
      [article.id]
    );

    article.categories = cats;

    const [comments] = await db.query(
      `SELECT c.*, u.username, u.full_name, u.avatar
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.article_id = ? AND c.parent_id IS NULL AND c.is_approved = 1
       ORDER BY c.created_at DESC`,
      [article.id]
    );

    for (const comment of comments) {
      const [replies] = await db.query(
        `SELECT c.*, u.username, u.full_name, u.avatar
         FROM comments c JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = ? AND c.is_approved = 1
         ORDER BY c.created_at ASC`,
        [comment.id]
      );
      comment.replies = replies;
    }

    article.comments = comments;

    await db.query('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);

    if (req.user?.id) {
      const [[like]] = await db.query(
        'SELECT id FROM likes WHERE user_id = ? AND article_id = ?',
        [req.user.id, article.id]
      );

      const [[bm]] = await db.query(
        'SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ?',
        [req.user.id, article.id]
      );

      article.liked = !!like;
      article.bookmarked = !!bm;
    }

    res.json({ success: true, article });

  } catch (err) {
    next(err);
  }
};

/* =========================================================
   CREATE ARTICLE
========================================================= */
exports.createArticle = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, content, excerpt, status, category_ids } = req.body;

    const slug = makeSlug(title);

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    let cover_image = null;

    if (req.file) {
      cover_image = `/uploads/covers/${req.file.filename}`;

      await db.query(
        'INSERT INTO media (user_id, filename, original_name, mimetype, size, type) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, 'cover']
      );
    }

    const [result] = await db.query(
      'INSERT INTO articles (title, slug, excerpt, content, cover_image, author_id, status, reading_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, slug, excerpt || '', content, cover_image, req.user.id, status || 'draft', readingTime]
    );

    const articleId = result.insertId;

    let ids = [];
    if (category_ids) {
      try {
        ids = Array.isArray(category_ids)
          ? category_ids
          : JSON.parse(category_ids);
      } catch (e) {
        ids = [];
      }

      for (const cid of ids) {
        await db.query(
          'INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)',
          [articleId, cid]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Article créé',
      article_id: articleId,
      slug
    });

  } catch (err) {
    next(err);
  }
};
