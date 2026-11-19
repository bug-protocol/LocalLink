const { body } = require('express-validator');

/**
 * Validation rules for user registration — simple auth pipeline
 */
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('role')
    .optional()
    .isIn(['customer', 'vendor', 'admin'])
    .withMessage('Role must be customer or vendor'),

  body('businessInfo.businessName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Business name cannot exceed 100 characters'),
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for password change
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

/**
 * Validation rules for product creation
 */
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('unit')
    .isIn(['piece', 'kg', 'gram', 'liter', 'ml', 'packet', 'box', 'dozen'])
    .withMessage('Invalid unit'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of URLs'),
];

/**
 * Validation rules for service creation
 */
const validateService = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service title must be between 2 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required'),

  body('pricingType')
    .isIn(['fixed', 'hourly', 'per-visit', 'negotiable'])
    .withMessage('Invalid pricing type'),

  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('priceUnit')
    .isIn(['per-hour', 'per-visit', 'per-project', 'per-day'])
    .withMessage('Invalid price unit'),

  body('duration.estimated')
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be at least 1 minute'),
];

/**
 * Validation rules for product update
 */
const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .optional()
    .notEmpty()
    .withMessage('Category cannot be empty'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('unit')
    .optional()
    .isIn(['piece', 'kg', 'gram', 'liter', 'ml', 'packet', 'box', 'dozen'])
    .withMessage('Invalid unit'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of URLs'),
];

/**
 * Validation rules for service update
 */
const validateServiceUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service title must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .optional()
    .notEmpty()
    .withMessage('Category cannot be empty'),

  body('pricingType')
    .optional()
    .isIn(['fixed', 'hourly', 'per-visit', 'negotiable'])
    .withMessage('Invalid pricing type'),

  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('priceUnit')
    .optional()
    .isIn(['per-hour', 'per-visit', 'per-project', 'per-day'])
    .withMessage('Invalid price unit'),

  body('duration.estimated')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be at least 1 minute'),
];

/**
 * Validation rules for order creation
 */
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),

  body('items.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  body('deliveryType')
    .isIn(['home-delivery', 'self-pickup'])
    .withMessage('Invalid delivery type'),

  body('paymentMethod')
    .isIn(['cash-on-delivery', 'pay-at-shop'])
    .withMessage('Invalid payment method'),
];

/**
 * Validation rules for booking creation
 */
const validateBooking = [
  body('service')
    .isMongoId()
    .withMessage('Invalid service ID'),

  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid scheduled date'),

  body('scheduledTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (use HH:MM)'),

  body('paymentMethod')
    .isIn(['cash-on-service', 'pay-at-shop'])
    .withMessage('Invalid payment method'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateProduct,
  validateProductUpdate,
  validateService,
  validateServiceUpdate,
  validateOrder,
  validateBooking,
};
