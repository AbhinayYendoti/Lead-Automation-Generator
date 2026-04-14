const express = require('express');
const { leadValidationRules, validate } = require('../middleware/validate');
const { createLead } = require('../controllers/leadController');

const router = express.Router();

/**
 * POST /lead
 * Captures a new lead, validates, assigns priority,
 * stores in MongoDB, and triggers WhatsApp + Email notifications.
 */
router.post('/', leadValidationRules, validate, createLead);

module.exports = router;
