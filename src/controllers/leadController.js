const Lead = require('../models/Lead');
const { assignPriority } = require('../services/priorityService');
const { sendLeadEmail } = require('../services/emailService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const logger = require('../utils/logger');

/**
 * Generates a human-readable lead ID for traceability.
 * Format: LEAD-XXXXXXXX (last 8 chars of MongoDB ObjectId, uppercased)
 * @param {import('mongoose').Document} doc
 * @returns {string}
 */
function generateLeadId(doc) {
  return 'LEAD-' + doc._id.toString().slice(-8).toUpperCase();
}

/**
 * POST /lead
 * Full LeadFlow processing pipeline:
 *
 * Architecture:
 *   Lead Entity   → name, source, email?, phone? (business data, persisted to DB)
 *   Notification  → routed to system OR test contacts depending on testMode
 *
 * Steps:
 *   1. Assign priority
 *   2. Save lead to MongoDB (email/phone stored only if Default Mode)
 *   3. Dispatch notifications concurrently (WhatsApp + Email)
 *   4. Return structured response with per-channel status
 */
async function createLead(req, res) {
  const { name, source, email, phone, testMode, testEmail, testPhone } = req.body;

  const isTestMode = testMode === true;

  // ── Step 1: Assign Priority ────────────────────────────────────────────────
  const priority = assignPriority(source);
  logger.info('LeadController', [
    `Priority: ${priority}`,
    `Source: "${source}"`,
    `TestMode: ${isTestMode}`,
    isTestMode
      ? `Notify → ${testEmail} / ${testPhone}`
      : `Notify → system defaults`,
  ].join(' | '));

  // ── Step 2: Persist Lead to MongoDB ───────────────────────────────────────
  // Separation of concerns:
  //   - In Default Mode: email + phone are lead contact details → stored in DB
  //   - In Test Mode:    email + phone are not submitted → stored as null (schema: required:false)
  //     Notification routing uses testEmail/testPhone separately
  let savedLead;
  try {
    const lead = new Lead({
      name,
      source,
      email: isTestMode ? null : (email || null),
      phone: isTestMode ? null : (phone || null),
      priority,
    });
    savedLead = await lead.save();
    logger.success('LeadController', `Lead saved — ID: ${savedLead._id}`);
  } catch (dbError) {
    logger.error('LeadController', 'DB save failed', dbError);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process lead. Please try again.',
    });
  }

  const leadId = generateLeadId(savedLead);

  // ── Step 3: Dispatch Notifications ────────────────────────────────────────
  // Promise.allSettled guarantees both fire and partial failures don't crash the request.
  // WhatsApp or email failure → reported in response, never masked as success.
  logger.info('LeadController', 'Dispatching notifications (WhatsApp + Email)...');

  const [waResult, emailResult] = await Promise.allSettled([
    sendWhatsAppMessage(savedLead, isTestMode ? testPhone : undefined),
    sendLeadEmail(savedLead, isTestMode ? testEmail : undefined, isTestMode),
  ]);

  logger.info('LeadController', [
    `WhatsApp: ${waResult.status}`,
    `Email: ${emailResult.status}`,
  ].join(' | '));

  const notificationStatus = {
    whatsapp: waResult.status    === 'fulfilled' ? 'sent' : 'failed',
    email:    emailResult.status === 'fulfilled' ? 'sent' : 'failed',
  };

  if (waResult.status === 'rejected') {
    logger.error('LeadController', `WhatsApp FAILED: ${waResult.reason?.message || waResult.reason}`);
    if (waResult.reason?.stack) logger.error('LeadController', waResult.reason.stack);
  }
  if (emailResult.status === 'rejected') {
    logger.error('LeadController', `Email FAILED: ${emailResult.reason?.message || emailResult.reason}`);
    if (emailResult.reason?.stack) logger.error('LeadController', emailResult.reason.stack);
  }

  // ── Step 4: Structured Response ───────────────────────────────────────────
  return res.status(201).json({
    status: 'success',
    message: 'Lead processed successfully',
    data: {
      leadId,
      priority:  priority.charAt(0).toUpperCase() + priority.slice(1),
      name:      savedLead.name,
      email:     savedLead.email || null,
      source:    savedLead.source,
      timestamp: savedLead.createdAt,
    },
    notifications: {
      ...notificationStatus,
      mode: isTestMode ? 'live_test' : 'system',
      ...(isTestMode && { deliveredTo: { email: testEmail, whatsapp: testPhone } }),
    },
  });
}

module.exports = { createLead };
