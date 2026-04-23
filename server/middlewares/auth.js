require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../config/db');


const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = 1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expiré' });
    }
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role_name === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Accès refusé — admin requis' });
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await db.query(
        'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
        [decoded.id]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (e) { /* ignore */ }
  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuth };
