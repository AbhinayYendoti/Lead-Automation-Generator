const { body, validationResult } = require('express-validator');

/**
 * Validation rules for POST /lead
 *
 * Routing:
 *   testMode = false/absent → email + phone REQUIRED (sent to system recipients)
 *   testMode = true         → testEmail + testPhone REQUIRED; email + phone IGNORED
 *
 * This prevents 422 errors when the frontend correctly omits email/phone
 * in Test Mode (disabled fields are not submitted in the payload).
 */
const leadValidationRules = [
  // ── Always required ──────────────────────────────────────────────────────
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),

  body('source')
    .notEmpty().withMessage('Source is required')
    .isString().withMessage('Source must be a string')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Source must be between 1 and 50 characters')
    .escape(),

  // ── Mode flag ─────────────────────────────────────────────────────────────
  body('testMode')
    .optional()
    .isBoolean().withMessage('testMode must be a boolean'),

  // ── Default Mode: email + phone required only when testMode !== true ──────
  // Uses a custom function instead of .if(body().not().equals()) to avoid
  // unreliable boolean string-comparison in express-validator's .equals().
  body('email')
    .if((value, { req }) => !req.body.testMode)
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('phone')
    .if((value, { req }) => !req.body.testMode)
    .notEmpty().withMessage('Phone is required')
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Phone must be 10–15 digits, optionally prefixed with +'),

  // ── Test Mode: testEmail + testPhone required only when testMode === true ──
  body('testEmail')
    .if((value, { req }) => req.body.testMode === true)
    .notEmpty().withMessage('Test email is required when Live Test Mode is enabled')
    .isEmail().withMessage('Test email must be a valid email address')
    .normalizeEmail(),

  body('testPhone')
    .if((value, { req }) => req.body.testMode === true)
    .notEmpty().withMessage('Test phone is required when Live Test Mode is enabled')
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Test phone must be 10–15 digits, optionally prefixed with +'),
];

/**
 * Middleware that checks for validation errors and returns 422 if any.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { leadValidationRules, validate };
