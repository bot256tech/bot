/**
 * AGRICHAIN 360™ — Input Validation Middleware
 * 
 * Uses express-validator to validate and sanitize all incoming data.
 * Prevents SQL injection, XSS, and malformed data.
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns 400 if errors exist
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
        value: e.value
      }))
    });
  }
  next();
};

// ─────────────────────────────────────────────────────
// AUTH VALIDATION RULES
// ─────────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+?256|0)?7\d{8}$/).withMessage('Invalid Ugandan phone number'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['FARMER', 'BUYER', 'PARTNER', 'ADMIN', 'farmer', 'buyer', 'field_officer', 'quality_officer', 'lab', 'admin'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

const loginValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+?256|0)?7\d{8}$/).withMessage('Invalid Ugandan phone number'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// PARTNER VALIDATION RULES
// ─────────────────────────────────────────────────────

const createPartnerValidation = [
  body('partner_type')
    .notEmpty().withMessage('Partner type is required')
    .isIn(['DRYER', 'LAB', 'TRANSPORTER', 'WAREHOUSE'])
    .withMessage('Invalid partner type'),
  body('business_name')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ min: 2, max: 150 }).withMessage('Business name must be 2-150 characters')
    .escape(),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location too long')
    .escape(),
  body('services')
    .optional()
    .isArray().withMessage('Services must be an array'),
  handleValidationErrors
];

const bookPartnerValidation = [
  body('partner_id')
    .notEmpty().withMessage('Partner ID is required')
    .isInt({ min: 1 }).withMessage('Invalid partner ID'),
  body('service_type')
    .trim()
    .notEmpty().withMessage('Service type is required')
    .isLength({ max: 50 }).withMessage('Service type too long')
    .escape(),
  body('scheduled_date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Amount must be positive'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// QUALITY PASSPORT VALIDATION RULES
// ─────────────────────────────────────────────────────

const issuePassportValidation = [
  body('farmer_id')
    .notEmpty().withMessage('Farmer ID is required')
    .isInt({ min: 1 }).withMessage('Invalid farmer ID'),
  body('crop_type')
    .trim()
    .notEmpty().withMessage('Crop type is required')
    .isLength({ max: 50 }).withMessage('Crop type too long')
    .escape(),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isFloat({ min: 0.1 }).withMessage('Quantity must be positive'),
  body('moisture_level')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Moisture level must be 0-100%'),
  body('aflatoxin_result')
    .optional()
    .isFloat({ min: 0 }).withMessage('Aflatoxin result must be positive'),
  body('testing_partner_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid testing partner ID'),
  handleValidationErrors
];

const updatePassportValidation = [
  body('moisture_level')
    .notEmpty().withMessage('Moisture level is required')
    .isFloat({ min: 0, max: 100 }).withMessage('Moisture level must be 0-100%'),
  body('aflatoxin_result')
    .notEmpty().withMessage('Aflatoxin result is required')
    .isFloat({ min: 0 }).withMessage('Aflatoxin result must be positive'),
  body('quality_grade')
    .optional()
    .isIn(['A', 'B', 'C', 'REJECTED', 'PENDING'])
    .withMessage('Invalid quality grade'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// MARKETPLACE VALIDATION RULES
// ─────────────────────────────────────────────────────

const createListingValidation = [
  body('crop')
    .trim()
    .notEmpty().withMessage('Crop name is required')
    .isLength({ max: 50 }).withMessage('Crop name too long')
    .escape(),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isFloat({ min: 0.1 }).withMessage('Quantity must be positive'),
  body('unit')
    .optional()
    .isIn(['kg', 'tonnes', 'bags', 'pieces'])
    .withMessage('Invalid unit'),
  body('price_per_unit')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be positive'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// PAYMENT VALIDATION RULES
// ─────────────────────────────────────────────────────

const initiatePaymentValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 100 }).withMessage('Minimum payment is UGX 100'),
  body('method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD'])
    .withMessage('Invalid payment method'),
  body('booking_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid booking ID'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// BUYER VALIDATION RULES
// ─────────────────────────────────────────────────────

const createBuyerProfileValidation = [
  body('company_name')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Company name must be 2-200 characters')
    .escape(),
  body('business_type')
    .notEmpty().withMessage('Business type is required')
    .isIn(['EXPORTER', 'PROCESSOR', 'TRADER', 'NGO', 'COOPERATIVE', 'GOVERNMENT', 'MANUFACTURER', 'OTHER'])
    .withMessage('Invalid business type'),
  body('city')
    .optional().trim().isLength({ max: 50 }).escape(),
  body('website')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid website URL'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// SUBSCRIPTION VALIDATION RULES
// ─────────────────────────────────────────────────────

const subscribeValidation = [
  body('plan_name')
    .trim()
    .notEmpty().withMessage('Plan name is required')
    .isIn(['FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
    .withMessage('Invalid plan name'),
  body('billing_cycle')
    .optional()
    .isIn(['MONTHLY', 'ANNUAL'])
    .withMessage('Invalid billing cycle'),
  body('payment_method')
    .optional()
    .isIn(['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// BOOKING STATUS VALIDATION
// ─────────────────────────────────────────────────────

const updateBookingStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid booking status'),
  handleValidationErrors
];

// ─────────────────────────────────────────────────────
// GENERIC PARAM VALIDATORS
// ─────────────────────────────────────────────────────

const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid ID parameter'),
  handleValidationErrors
];

const batchNumberValidation = [
  param('batch_number')
    .trim()
    .notEmpty().withMessage('Batch number is required')
    .isLength({ max: 50 }).withMessage('Batch number too long'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  createPartnerValidation,
  bookPartnerValidation,
  issuePassportValidation,
  updatePassportValidation,
  createListingValidation,
  initiatePaymentValidation,
  createBuyerProfileValidation,
  subscribeValidation,
  updateBookingStatusValidation,
  idParamValidation,
  batchNumberValidation
};
