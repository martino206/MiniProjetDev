const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController.js');
const { authMiddleware } = require('../middlewares/auth.js');

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username: 3-50 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe: 8 caractères minimum')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Doit contenir majuscule, minuscule et chiffre'),
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
], login);

router.get('/me', authMiddleware, getMe);

module.exports = router;
