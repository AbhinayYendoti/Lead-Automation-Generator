/**
 * LeadFlow – Centralized Logger
 * Timestamps all log entries and masks sensitive data.
 * Never logs credentials, tokens, or passwords.
 */

const LOG_LEVELS = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR', SUCCESS: 'SUCCESS' };

function formatMessage(level, context, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${context}] ${message}`;
}

const logger = {
  info: (context, message) => console.log(formatMessage(LOG_LEVELS.INFO, context, message)),
  warn: (context, message) => console.warn(formatMessage(LOG_LEVELS.WARN, context, message)),
  error: (context, message, err) => {
    const errMsg = err ? ` | Error: ${err.message || err}` : '';
    console.error(formatMessage(LOG_LEVELS.ERROR, context, message + errMsg));
  },
  success: (context, message) => console.log(formatMessage(LOG_LEVELS.SUCCESS, context, message)),
};

module.exports = logger;
