const User = require('../models/User');
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');

class AuthService {
  /**
   * Register a new user with optional role-specific profile data
   * Supports: FARMER, BUYER, PARTNER, ADMIN
   */
  static async registerUser(userData) {
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

    // Create the user record
    const user = await User.create({
      name,
      phone,
      email,
      password,
      role: role.toUpperCase()
    });

    // Auto-create farmer profile if registering as FARMER
    if (role.toUpperCase() === 'FARMER' && profile) {
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
        console.error('Failed to create farmer profile:', err.message);
        // Don't fail registration if profile creation fails
      }
    }

    // Generate token immediately on registration
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'agrichain360_jwt_secret',
      { expiresIn: '30d' }
    );

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
   * Returns JWT token + user profile
   */
  static async loginUser(phone, password) {
    if (!phone || !password) {
      throw new Error('Phone number and password are required.');
    }

    const user = await User.findByPhone(phone);

    if (!user) {
      throw new Error('Invalid phone number or password.');
    }

    // Check if user has a password set
    if (!user.password_hash) {
      throw new Error('This account was created without a password. Please contact support.');
    }

    const isMatch = await User.verifyPassword(password, user.password_hash);

    if (!isMatch) {
      throw new Error('Invalid phone number or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Your account is currently suspended or pending approval.');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET || 'agrichain360_jwt_secret',
      { expiresIn: '30d' }
    );

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
    if (!user) {
      throw new Error('User not found.');
    }

    // Attach role-specific profile data
    let profile = null;
    if (user.role === 'FARMER' || user.role === 'farmer') {
      profile = await Farmer.findByUserId(user.id);
    }

    return { user, profile };
  }
}

module.exports = AuthService;
