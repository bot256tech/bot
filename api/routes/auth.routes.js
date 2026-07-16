const express = require('express');
const router = express.Router();
const AuthService = require('../../services/auth.service');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────
// AUTHENTICATION ROUTES
// ─────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Register a new user
 * 
 * Body: {
 *   name: string (required),
 *   phone: string (required),
 *   email: string (optional),
 *   password: string (required),
 *   role: string (required: FARMER | BUYER | PARTNER | ADMIN),
 *   profile: {  // optional, for FARMER role
 *     district, village, crops[], farm_size, national_id
 *   }
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const result = await AuthService.registerUser(req.body);
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
 * Login with phone + password
 * 
 * Body: { phone: string, password: string }
 * Returns: { token, user }
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const result = await AuthService.loginUser(phone, password);

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
