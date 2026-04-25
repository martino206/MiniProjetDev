const db       = require('../config/db.js')
const slugify  = require('slugify')
const { validationResult } = require('express-validator')
const cloudinary = require('../config/Claudinary.js')
const { uploadToCloudinary } = require('../middlewares/upload.js')

const makeSlug = (title) =>
  slugify(title, { lower: true, strict: true, locale: 'fr' }) + '-' + Date.now()

// ─── GET ALL ARTICLES ────────────────────────────────────────────────────────
exports.getArticles = async (req, res, next) => {
  try {
    const page     = parseInt(req.query.page)   || 1
    const limit    = parseInt(req.query.limit)  || 10
    const offset   = (page - 1) * limit
    const search   = req.query.search   || ''
    const category = req.query.category || ''
    const status   = req.query.status   || 'published'

    let conditions = ['a.status = ?']
    let params     = [status]

    if (search) {
      conditions.push('(a.title LIKE ? OR a.excerpt LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    if (category) {
      conditions.push(`a.id IN (
        SELECT ac2.article_id
        FROM article_categories ac2
        JOIN categories c2 ON ac2.category_id = c2.id
        WHERE c2.slug = ?
      )`)
      params.push(category)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    // Requête compatible TiDB — sous-requêtes pour catégories (pas de GROUP BY)
    const query = `
      SELECT
        a.id, a.title, a.slug, a.excerpt, a.cover_image,
        a.status, a.reading_time, a.views, a.created_at,
        u.id        AS author_id,
        u.username,
        u.full_name,
        u.avatar,
        (SELECT COUNT(*) FROM likes    WHERE article_id = a.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE article_id = a.id) AS comments_count,
        (
          SELECT GROUP_CONCAT(c2.name ORDER BY c2.name SEPARATOR ',')
          FROM article_categories ac2
          JOIN categories c2 ON ac2.category_id = c2.id
          WHERE ac2.article_id = a.id
        ) AS categories,
        (
          SELECT GROUP_CONCAT(c2.color ORDER BY c2.name SEPARATOR ',')
          FROM article_categories ac2
          JOIN categories c2 ON ac2.category_id = c2.id
          WHERE ac2.article_id = a.id
        ) AS category_colors
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `

    const countQuery = `SELECT COUNT(*) AS total FROM articles a ${whereClause}`

    const [articles]    = await db.query(query,      [...params, limit, offset])
    const [[{ total }]] = await db.query(countQuery, params)

    // Likes / bookmarks si connecté
    let userLikes = [], userBookmarks = []
    if (req.user && articles.length) {
      const ids = articles.map(a => a.id)
      const ph  = ids.map(() => '?').join(',')
      const [lk] = await db.query(`SELECT article_id FROM likes     WHERE user_id = ? AND article_id IN (${ph})`, [req.user.id, ...ids])
      const [bm] = await db.query(`SELECT article_id FROM bookmarks WHERE user_id = ? AND article_id IN (${ph})`, [req.user.id, ...ids])
      userLikes     = lk.map(l => l.article_id)
      userBookmarks = bm.map(b => b.article_id)
    }

    const enriched = articles.map(a => ({
      ...a,
      categories:      a.categories      ? a.categories.split(',')      : [],
      category_colors: a.category_colors ? a.category_colors.split(',') : [],
      liked:      userLikes.includes(a.id),
      bookmarked: userBookmarks.includes(a.id),
    }))

    res.json({ success: true, articles: enriched, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// ─── GET ARTICLE BY SLUG ─────────────────────────────────────────────────────
exports.getArticleBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params
    const [rows] = await db.query(
      `SELECT a.*, u.id AS author_id, u.username, u.full_name, u.avatar, u.bio,
              (SELECT COUNT(*) FROM likes    WHERE article_id = a.id) AS likes_count,
              (SELECT COUNT(*) FROM comments WHERE article_id = a.id) AS comments_count
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.slug = ?`,
      [slug]
    )
    if (!rows.length) return res.status(404).json({ success: false, message: 'Article introuvable' })

    const article = rows[0]

    const [cats] = await db.query(
      `SELECT c.* FROM categories c
       JOIN article_categories ac ON c.id = ac.category_id
       WHERE ac.article_id = ?`,
      [article.id]
    )
    article.categories = cats

    const [comments] = await db.query(
      `SELECT c.*, u.username, u.full_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.article_id = ? AND c.parent_id IS NULL AND c.is_approved = 1
       ORDER BY c.created_at DESC`,
      [article.id]
    )
    for (const comment of comments) {
      const [replies] = await db.query(
        `SELECT c.*, u.username, u.full_name, u.avatar
         FROM comments c JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = ? AND c.is_approved = 1
         ORDER BY c.created_at ASC`,
        [comment.id]
      )
      comment.replies = replies
    }
    article.comments = comments

    await db.query('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id])

    if (req.user) {
      const [[like]] = await db.query('SELECT id FROM likes     WHERE user_id = ? AND article_id = ?', [req.user.id, article.id])
      const [[bm]]   = await db.query('SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ?', [req.user.id, article.id])
      article.liked      = !!like
      article.bookmarked = !!bm
    }

    res.json({ success: true, article })
  } catch (err) { next(err) }
}

// ─── CREATE ARTICLE ──────────────────────────────────────────────────────────
exports.createArticle = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    const { title, content, excerpt, status, category_ids } = req.body
    const slug      = makeSlug(title)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length
    const readTime  = Math.max(1, Math.ceil(wordCount / 200))

    let cover_image        = null
    let cover_public_id    = null

    if (req.file) {
      // Upload vers Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, 'blog/covers', {
        public_id: `cover_${req.user.id}_${Date.now()}`,
        width: 1200, height: 630, crop: 'fill',
      })
      cover_image     = result.secure_url  // URL HTTPS permanente
      cover_public_id = result.public_id

      await db.query(
        'INSERT INTO media (user_id, filename, original_name, mimetype, size, type) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, result.public_id, req.file.originalname, req.file.mimetype, req.file.size, 'cover']
      )
    }

    const [result] = await db.query(
      `INSERT INTO articles (title, slug, excerpt, content, cover_image, cover_public_id, author_id, status, reading_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, excerpt || '', content, cover_image, cover_public_id, req.user.id, status || 'draft', readTime]
    )

    const articleId = result.insertId

    if (category_ids) {
      const ids = Array.isArray(category_ids) ? category_ids : JSON.parse(category_ids)
      for (const cid of ids) {
        await db.query('INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)', [articleId, cid])
      }
    }

    res.status(201).json({ success: true, message: 'Article créé', article_id: articleId, slug })
  } catch (err) { next(err) }
}

// ─── UPDATE ARTICLE ──────────────────────────────────────────────────────────
exports.updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params
    const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ success: false, message: 'Article introuvable' })

    const article = rows[0]
    if (article.author_id !== req.user.id && req.user.role_name !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' })
    }

    const { title, content, excerpt, status, category_ids } = req.body
    const newContent = content || article.content
    const wordCount  = newContent.replace(/<[^>]*>/g, '').split(/\s+/).length
    const readTime   = Math.max(1, Math.ceil(wordCount / 200))

    let cover_image     = article.cover_image
    let cover_public_id = article.cover_public_id

    if (req.file) {
      // Supprimer l'ancienne image Cloudinary
      if (cover_public_id) {
        await cloudinary.uploader.destroy(cover_public_id).catch(() => {})
      }
      // Uploader la nouvelle
      const result = await uploadToCloudinary(req.file.buffer, 'blog/covers', {
        public_id: `cover_${req.user.id}_${Date.now()}`,
        width: 1200, height: 630, crop: 'fill',
      })
      cover_image     = result.secure_url
      cover_public_id = result.public_id
    }

    await db.query(
      `UPDATE articles
       SET title = ?, content = ?, excerpt = ?, cover_image = ?, cover_public_id = ?, status = ?, reading_time = ?
       WHERE id = ?`,
      [title || article.title, newContent, excerpt || article.excerpt, cover_image, cover_public_id, status || article.status, readTime, id]
    )

    if (category_ids !== undefined) {
      await db.query('DELETE FROM article_categories WHERE article_id = ?', [id])
      const ids = Array.isArray(category_ids) ? category_ids : JSON.parse(category_ids)
      for (const cid of ids) {
        await db.query('INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)', [id, cid])
      }
    }

    res.json({ success: true, message: 'Article mis à jour' })
  } catch (err) { next(err) }
}

// ─── DELETE ARTICLE ──────────────────────────────────────────────────────────
exports.deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params
    const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ success: false, message: 'Article introuvable' })

    const article = rows[0]
    if (article.author_id !== req.user.id && req.user.role_name !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' })
    }

    // Supprimer l'image Cloudinary
    if (article.cover_public_id) {
      await cloudinary.uploader.destroy(article.cover_public_id).catch(() => {})
    }

    await db.query('DELETE FROM articles WHERE id = ?', [id])
    res.json({ success: true, message: 'Article supprimé' })
  } catch (err) { next(err) }
}

// ─── GET USER ARTICLES ───────────────────────────────────────────────────────
exports.getUserArticles = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const status = req.query.status || null

    let conditions = ['a.author_id = ?']
    let params     = [userId]
    if (status) { conditions.push('a.status = ?'); params.push(status) }

    const where = 'WHERE ' + conditions.join(' AND ')

    const [articles] = await db.query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.status, a.reading_time, a.views, a.created_at,
              (SELECT COUNT(*) FROM likes    WHERE article_id = a.id) AS likes_count,
              (SELECT COUNT(*) FROM comments WHERE article_id = a.id) AS comments_count
       FROM articles a ${where}
       ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM articles a ${where}`, params)

    res.json({ success: true, articles, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// ─── TOGGLE LIKE ─────────────────────────────────────────────────────────────
exports.toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params
    const [[existing]] = await db.query('SELECT id FROM likes WHERE user_id = ? AND article_id = ?', [req.user.id, id])

    if (existing) {
      await db.query('DELETE FROM likes WHERE user_id = ? AND article_id = ?', [req.user.id, id])
      return res.json({ success: true, liked: false })
    }

    await db.query('INSERT INTO likes (user_id, article_id) VALUES (?, ?)', [req.user.id, id])

    const [[article]] = await db.query('SELECT author_id FROM articles WHERE id = ?', [id])
    if (article && article.author_id !== req.user.id) {
      await db.query(
        'INSERT INTO notifications (user_id, actor_id, type, message, article_id) VALUES (?, ?, ?, ?, ?)',
        [article.author_id, req.user.id, 'like', `${req.user.full_name || req.user.username} a aimé votre article.`, id]
      )
    }
    res.json({ success: true, liked: true })
  } catch (err) { next(err) }
}

// ─── TOGGLE BOOKMARK ─────────────────────────────────────────────────────────
exports.toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params
    const [[existing]] = await db.query('SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ?', [req.user.id, id])

    if (existing) {
      await db.query('DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?', [req.user.id, id])
      return res.json({ success: true, bookmarked: false })
    }

    await db.query('INSERT INTO bookmarks (user_id, article_id) VALUES (?, ?)', [req.user.id, id])
    res.json({ success: true, bookmarked: true })
  } catch (err) { next(err) }
}

// ─── GET BOOKMARKS ───────────────────────────────────────────────────────────
exports.getBookmarks = async (req, res, next) => {
  try {
    const [articles] = await db.query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.reading_time, a.created_at,
              u.username, u.full_name, u.avatar, b.created_at AS bookmarked_at
       FROM bookmarks b
       JOIN articles a ON b.article_id = a.id
       JOIN users    u ON a.author_id  = u.id
       WHERE b.user_id = ? AND a.status = 'published'
       ORDER BY b.created_at DESC`,
      [req.user.id]
    )
    res.json({ success: true, articles })
  } catch (err) { next(err) }
}