const express = require('express');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema,
  resetPasswordSchema,
  register, 
  login, 
  forgotPassword,
  resetPassword,
  logout, 
  me 
} = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user and set JWT HttpOnly cookie
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 */
router.post('/logout', auth, logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 */
router.get('/me', auth, me);

module.exports = router;
