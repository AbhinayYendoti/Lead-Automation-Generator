const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email Service
 * Sends lead notification email via Gmail SMTP.
 * Credentials loaded from environment — never hard-coded.
 * Supports Live Test Mode: redirects email to user-provided address.
 */

let transporter = null;

/**
 * Build and cache the SMTP transporter.
 * Uses explicit host + port 465 (SSL) instead of `service:'gmail'`
 * for reliable operation on Render (avoids IPv6 routing issues).
 * Throws if credentials are missing.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER or EMAIL_PASS environment variables are not set.');
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,               // SSL on port 465 — more stable than STARTTLS 587 on Render
    connectionTimeout: 10000,  // 10 s — fail fast instead of hanging
    greetingTimeout:   10000,
    socketTimeout:     10000,
    auth: {
      user: process.env.EMAIL_USER.trim(),
      // Gmail App Passwords may contain spaces in .env — trim them
      pass: process.env.EMAIL_PASS.trim(),
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  // Verify connection at startup — logs result but never crashes the process
  transporter.verify((err) => {
    if (err) {
      logger.warn('EmailService', 'SMTP connection verify failed', err.message);
    } else {
      logger.success('EmailService', 'SMTP ready — Gmail connection verified');
    }
  });

  return transporter;
}

/** Priority badge colors for the HTML email body */
const PRIORITY_COLORS = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
};

/**
 * Sends a formatted HTML email notification for a new lead.
 * @param {object}  lead         - The saved lead document
 * @param {string}  [overrideTo] - Live Test Mode: send to this address instead of system default
 * @param {boolean} [isTestMode] - If true, injects a test mode banner into the email
 */
async function sendLeadEmail(lead, overrideTo, isTestMode) {
  const transport = getTransporter();

  const priorityColor = PRIORITY_COLORS[lead.priority] || '#6b7280';
  const timestamp = new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Live Test Mode: redirect to user-provided email; else use system default
  const recipient = overrideTo || process.env.NOTIFY_EMAIL || process.env.EMAIL_USER;

  // Defensive fallbacks — lead.email/phone are null in Test Mode
  const safeEmail = lead.email || 'Not provided';
  const safePhone = lead.phone || 'Not provided';

  const testBanner = isTestMode
    ? `<tr>
        <td style="padding:10px 32px;background:#fef3c7;border-bottom:1px solid #fde68a;text-align:center;">
          <span style="font-size:13px;color:#92400e;font-weight:600;">
            🧪 LIVE TEST MODE &mdash; You triggered this notification
          </span>
        </td>
       </tr>`
    : '';

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>New Lead – LeadFlow</title>
  </head>
  <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
                <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">⚡ LeadFlow</h1>
                <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">CRM Automation Notification</p>
              </td>
            </tr>
            <!-- Test Mode Banner (injected when Live Test Mode is on) -->
            ${testBanner}
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 20px;color:#e2e8f0;font-size:18px;">🎯 New Lead Captured</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #334155;">
                      <span style="color:#94a3b8;font-size:13px;">Name</span><br/>
                      <strong style="color:#f1f5f9;font-size:15px;">${lead.name}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #334155;">
                      <span style="color:#94a3b8;font-size:13px;">Email</span><br/>
                      <strong style="color:#f1f5f9;font-size:15px;">${safeEmail}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #334155;">
                      <span style="color:#94a3b8;font-size:13px;">Phone</span><br/>
                      <strong style="color:#f1f5f9;font-size:15px;">${safePhone}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #334155;">
                      <span style="color:#94a3b8;font-size:13px;">Source</span><br/>
                      <strong style="color:#f1f5f9;font-size:15px;">${lead.source}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #334155;">
                      <span style="color:#94a3b8;font-size:13px;">Priority</span><br/>
                      <span style="display:inline-block;margin-top:4px;padding:4px 14px;border-radius:999px;background:${priorityColor};color:#fff;font-size:13px;font-weight:bold;text-transform:uppercase;">${lead.priority}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;">
                      <span style="color:#94a3b8;font-size:13px;">Captured At</span><br/>
                      <strong style="color:#f1f5f9;font-size:15px;">${timestamp} IST</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:16px 32px;background:#0f172a;text-align:center;">
                <p style="margin:0;color:#475569;font-size:12px;">
                  ${isTestMode
                    ? 'This is a <strong>Live Test Mode</strong> notification from LeadFlow.'
                    : 'This is an automated notification from LeadFlow CRM Automation System.'}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const subjectPrefix = isTestMode ? '[LIVE TEST]' : `[${lead.priority.toUpperCase()} PRIORITY]`;

  const mailOptions = {
    from: `"LeadFlow CRM" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: `${subjectPrefix} New Lead: ${lead.name}`,
    html,
  };

  try {
    await transport.sendMail(mailOptions);
    logger.success('EmailService', `Email sent to ${isTestMode ? 'test address' : 'system'}: ${recipient}`);
  } catch (err) {
    // Reset cached transporter so the next request gets a fresh connection
    transporter = null;
    logger.error('EmailService', 'sendMail failed', err.message);
    throw err;   // Re-throw so the controller can mark email as 'failed'
  }
}

module.exports = { sendLeadEmail };
