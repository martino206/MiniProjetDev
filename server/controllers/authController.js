const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db.js');


const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res, next) => {
  console.log("JWT_SECRET =", process.env.JWT_SECRET);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, full_name } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email ou nom d\'utilisateur déjà pris.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, full_name, role_id) VALUES (?, ?, ?, ?, 2)',
      [username, email, hash, full_name || username]
    );

    const [user] = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [result.insertId]
    );

    const token = generateToken(user[0]);
    const { password: _, ...userSafe } = user[0];
    res.status(201).json({ success: true, message: 'Compte créé avec succès', token, user: userSafe });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const [rows] = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ? AND u.is_active = 1',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    res.json({ success: true, message: 'Connexion réussie', token, user: userSafe });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    );
    const { password, ...userSafe } = rows[0];
    res.json({ success: true, user: userSafe });
  } catch (err) { next(err); }
};
