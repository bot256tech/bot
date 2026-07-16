const User = require('../models/User');
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');
const NotificationService = require('./notification.service');
const { logAudit, AUDIT_ACTIONS } = require('../api/middleware/auditLog');
const logger = require('../config/logger');

class AuthService {
  /**
   * Register a new user with optional farmer profile creation
   */
  static async registerUser(userData, req) {
    const { name, phone, email, password, role, profile } = userData;

    // Validate required fields
    if (!name || !phone || !password) {
      throw new Error('Name, phone, and password are required.');
    }
    if (!role) {
      throw new Error('Role is required (FARMER, BUYER, PARTNER, or ADMIN).');
    }

    // Check for existing user
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      throw new Error('Phone number is already registered.');
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      email,
      password,
      role: role.toUpperCase()
    });

    // Auto-create farmer profile if FARMER
    if (user.role === 'FARMER' && profile) {
      try {
        await Farmer.create({
          user_id: user.id,
          district: profile.district || null,
          village: profile.village || null,
          crops: profile.crops || [],
          farm_size: profile.farm_size || null,
          national_id: profile.national_id || null
        });
      } catch (err) {
        logger.error('Failed to create farmer profile during registration', { error: err.message });
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'agrichain360_jwt_secret',
      { expiresIn: '30d' }
    );

    // Send welcome SMS (non-blocking)
    try {
      await NotificationService.notifyWelcome(phone, name);
    } catch (err) {
      logger.warn('Failed to send welcome SMS', { error: err.message });
    }

    // Audit log
    logAudit(AUDIT_ACTIONS.USER_REGISTERED, {
      user_id: user.id,
      role: user.role,
      phone: phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2') // Mask phone for logs
    }, req);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  }

  /**
   * Login user by phone and password
   */
  static async loginUser(phone, password, req) {
    if (!phone || !password) {
      throw new Error('Phone number and password are required.');
    }

    const user = await User.findByPhone(phone);

    if (!user) {
      logAudit(AUDIT_ACTIONS.USER_LOGIN_FAILED, { phone }, req);
      throw new Error('Invalid phone number or password.');
    }

    if (!user.password_hash) {
      throw new Error('This account was created without a password. Please contact support.');
    }

    const isMatch = await User.verifyPassword(password, user.password_hash);

    if (!isMatch) {
      logAudit(AUDIT_ACTIONS.USER_LOGIN_FAILED, {
        phone: phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')
      }, req);
      throw new Error('Invalid phone number or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Your account is currently suspended or pending approval.');
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'agrichain360_jwt_secret',
      { expiresIn: '30d' }
    );

    // Audit log
    logAudit(AUDIT_ACTIONS.USER_LOGIN, {
      user_id: user.id,
      role: user.role
    }, req);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Get current user profile from token
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found.');

    let profile = null;
    if (user.role === 'FARMER' || user.role === 'farmer') {
      profile = await Farmer.findByUserId(user.id);
    }

    return { user, profile };
  }
}

module.exports = AuthService;
