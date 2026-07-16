const express = require('express');
const router = express.Router();
const AuthService = require('../../services/auth.service');
const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validate');
const { registerLimiter, authLimiter } = require('../../config/rateLimiter');

// ─────────────────────────────────────────────────────
// AUTHENTICATION ROUTES
// ─────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Register a new user (rate limited: 5/hour)
 */
router.post('/register', registerLimiter, registerValidation, async (req, res) => {
  try {
    const result = await AuthService.registerUser(req.body, req);
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Login with phone + password (rate limited: 10/15min)
 */
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { phone, password } = req.body;
    const result = await AuthService.loginUser(phone, password, req);

    res.json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user profile (Protected)
 */
router.get('/me', protect(), async (req, res) => {
  try {
    const result = await AuthService.getProfile(req.user.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
