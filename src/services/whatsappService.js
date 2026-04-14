const axios = require('axios');
const logger = require('../utils/logger');

/**
 * WhatsApp Service
 * Sends lead notifications via UltraMsg API.
 * All credentials loaded from environment variables.
 *
 * Docs: https://docs.ultramsg.com/api/post/messages/chat
 */

const ULTRAMSG_BASE_URL = 'https://api.ultramsg.com';
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Validates required environment variables are present.
 * @throws {Error} if any required env var is missing
 */
function validateConfig() {
  const required = ['ULTRAMSG_INSTANCE_ID', 'ULTRAMSG_TOKEN', 'WHATSAPP_TO'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing WhatsApp config: ${missing.join(', ')}`);
  }
}

/**
 * Formats a phone number to UltraMsg-required format: 91XXXXXXXXXX@c.us
 *
 * UltraMsg rejects numbers with '+' prefix or without @c.us suffix.
 * Examples:
 *   +919876543210 → 919876543210@c.us
 *   9876543210    → 919876543210@c.us   (10-digit → prepend India code 91)
 *   919876543210  → 919876543210@c.us  (already has country code)
 *
 * @param {string} phone - Raw phone number from user input or env var
 * @returns {string} UltraMsg-formatted recipient string
 */
function formatPhoneForUltraMsg(phone) {
  // Strip everything except digits
  const digits = String(phone).replace(/\D/g, '');

  // If user entered 10 digits (no country code), prepend Indian country code
  const withCountryCode = digits.length === 10 ? '91' + digits : digits;

  return `${withCountryCode}@c.us`;
}

/**
 * Builds a plain-text WhatsApp message for the lead.
 * @param {object}  lead       - The saved lead document
 * @param {boolean} isTestMode - If true, adds a Live Test Mode header
 * @param {string}  testPhone  - Test phone (used in message if test mode)
 * @returns {string}
 */
function buildMessage(lead, isTestMode, testPhone) {
  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[lead.priority] || '⚪';
  const timestamp = new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // In test mode, lead.email / lead.phone may be empty — use test contacts as display
  const displayEmail = lead.email || '(not provided in test mode)';
  const displayPhone = lead.phone || testPhone || '(not provided in test mode)';

  const lines = [
    isTestMode ? '🧪 *[LIVE TEST MODE]* — LeadFlow CRM' : '⚡ *LeadFlow CRM Alert*',
    '',
    `${priorityEmoji} *Priority:* ${lead.priority.toUpperCase()}`,
    '',
    `👤 *Name:* ${lead.name}`,
    `📧 *Email:* ${displayEmail}`,
    `📱 *Phone:* ${displayPhone}`,
    `🔗 *Source:* ${lead.source}`,
    `🕒 *Captured:* ${timestamp} IST`,
    '',
    isTestMode
      ? '_You triggered this via Live Test Mode — the system works!_'
      : '_Automated notification from LeadFlow_',
  ];

  return lines.join('\n');
}

/**
 * Sends a WhatsApp message for a new lead via UltraMsg.
 *
 * @param {object} lead         - The saved lead document
 * @param {string} [overrideTo] - Live Test Mode: redirect to this number instead of system default
 */
async function sendWhatsAppMessage(lead, overrideTo) {
  validateConfig();

  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const url = `${ULTRAMSG_BASE_URL}/${instanceId}/messages/chat`;

  // Live Test Mode: redirect to user-provided number, else use system default
  const rawRecipient = overrideTo || process.env.WHATSAPP_TO;

  // ✅ Fix: UltraMsg requires format 91XXXXXXXXXX@c.us — format here
  const formattedRecipient = formatPhoneForUltraMsg(rawRecipient);

  const isTestMode = !!overrideTo;
  const messageBody = buildMessage(lead, isTestMode, overrideTo);

  logger.info('WhatsAppService', `Sending to: ${formattedRecipient} (raw: ${rawRecipient})`);

  const payload = new URLSearchParams({
    token: process.env.ULTRAMSG_TOKEN,
    to:    formattedRecipient,
    body:  messageBody,
  });

  const response = await axios.post(url, payload.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: REQUEST_TIMEOUT_MS,
  });

  // ✅ Fix: Throw on UltraMsg API error so Promise.allSettled correctly marks as 'failed'
  // Previously: logged as warn but didn't throw → reported 'sent' even on failure
  if (!response.data || response.data.sent !== 'true') {
    const errDetail = JSON.stringify(response.data);
    logger.error('WhatsAppService', `UltraMsg rejected message: ${errDetail}`);
    throw new Error(`UltraMsg API error: ${errDetail}`);
  }

  logger.success('WhatsAppService', `Message sent to ${isTestMode ? 'test' : 'system'}: ${formattedRecipient}`);
}

module.exports = { sendWhatsAppMessage };
