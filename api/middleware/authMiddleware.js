const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware with Role-Based Access Control
 * 
 * Usage:
 *   protect()                      — Any authenticated user
 *   protect(['ADMIN'])             — Admin only
 *   protect(['FARMER', 'farmer'])  — Farmer (supports both case styles)
 *   protect(['PARTNER', 'lab'])    — Partner or Lab role
 */
const protect = (allowedRoles = []) => {
  return (req, res, next) => {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Also check query parameter (for USSD / simple clients)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource. Please provide a valid token.'
      });
    }

    try {
      // Verify token
      const secret = process.env.JWT_SECRET || 'agrichain360_jwt_secret';
      const decoded = jwt.verify(token, secret);
      req.user = decoded;

      // Role-based authorization check
      if (allowedRoles.length > 0) {
        // Normalize roles for case-insensitive comparison
        const userRole = (req.user.role || '').toUpperCase();
        const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

        if (!normalizedAllowed.includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
          });
        }
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid or malformed token.'
      });
    }
  };
};

module.exports = { protect };
