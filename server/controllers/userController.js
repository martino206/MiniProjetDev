const bcrypt   = require('bcrypt')
const { validationResult } = require('express-validator')
const db       = require('../config/db')
const cloudinary = require('../config/cloudinary')
const { uploadToCloudinary } = require('../middlewares/upload')

exports.getProfile = async (req, res, next) => {
  try {
    const { username } = req.params
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.bio, u.avatar, u.created_at, r.name AS role_name,
              (SELECT COUNT(*) FROM articles WHERE author_id = u.id AND status = 'published') AS article_count
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = ?`,
      [username]
    )
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' })
    res.json({ success: true, user: rows[0] })
  } catch (err) { next(err) }
}

exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    const { full_name, bio } = req.body
    await db.query('UPDATE users SET full_name = ?, bio = ? WHERE id = ?', [full_name, bio, req.user.id])

    const [user] = await db.query(
      'SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    )
    const { password, ...safe } = user[0]
    res.json({ success: true, message: 'Profil mis à jour', user: safe })
  } catch (err) { next(err) }
}

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier envoyé' })

    // Supprimer l'ancien avatar Cloudinary si présent
    const [current] = await db.query('SELECT avatar, avatar_public_id FROM users WHERE id = ?', [req.user.id])
    if (current[0]?.avatar_public_id) {
      await cloudinary.uploader.destroy(current[0].avatar_public_id).catch(() => {})
    }

    // Upload vers Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'blog/avatars', {
      public_id:  `avatar_${req.user.id}_${Date.now()}`,
      width:  400,
      height: 400,
      crop:   'fill',
      gravity: 'face',
    })

    const avatarUrl      = result.secure_url   // URL HTTPS Cloudinary
    const avatarPublicId = result.public_id     // pour suppression future

    await db.query(
      'UPDATE users SET avatar = ?, avatar_public_id = ? WHERE id = ?',
      [avatarUrl, avatarPublicId, req.user.id]
    )

    // Enregistrer dans media
    await db.query(
      'INSERT INTO media (user_id, filename, original_name, mimetype, size, type) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, result.public_id, req.file.originalname, req.file.mimetype, req.file.size, 'avatar']
    )

    res.json({ success: true, message: 'Avatar mis à jour', avatar: avatarUrl })
  } catch (err) { next(err) }
}

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id])
    const match  = await bcrypt.compare(current_password, rows[0].password)
    if (!match) return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' })

    const hash = await bcrypt.hash(new_password, 10)
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id])
    res.json({ success: true, message: 'Mot de passe modifié avec succès' })
  } catch (err) { next(err) }
}

exports.getAllUsers = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const search = req.query.search || ''

    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.is_active, u.created_at, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
    )

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM users WHERE username LIKE ? OR email LIKE ?',
      [`%${search}%`, `%${search}%`]
    )

    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const [rows] = await db.query('SELECT is_active FROM users WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' })

    const newStatus = rows[0].is_active ? 0 : 1
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id])
    res.json({ success: true, message: `Utilisateur ${newStatus ? 'activé' : 'désactivé'}` })
  } catch (err) { next(err) }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' })
    }
    // Supprimer l'avatar Cloudinary si présent
    const [rows] = await db.query('SELECT avatar_public_id FROM users WHERE id = ?', [id])
    if (rows[0]?.avatar_public_id) {
      await cloudinary.uploader.destroy(rows[0].avatar_public_id).catch(() => {})
    }
    await db.query('DELETE FROM users WHERE id = ?', [id])
    res.json({ success: true, message: 'Utilisateur supprimé' })
  } catch (err) { next(err) }
}
