/**
 * Priority Service
 * Assigns lead priority based on the source field.
 *
 * High   → hot, referral, enterprise, vip, inbound
 * Medium → website, google, linkedin, facebook, social, organic
 * Low    → everything else (cold, unknown, etc.)
 */

const HIGH_PRIORITY_SOURCES = new Set(['hot', 'referral', 'enterprise', 'vip', 'inbound']);
const MEDIUM_PRIORITY_SOURCES = new Set(['website', 'google', 'linkedin', 'facebook', 'social', 'organic']);

/**
 * @param {string} source - Lead source string (case-insensitive)
 * @returns {'high' | 'medium' | 'low'}
 */
function assignPriority(source) {
  const normalized = (source || '').toLowerCase().trim();

  if (HIGH_PRIORITY_SOURCES.has(normalized)) return 'high';
  if (MEDIUM_PRIORITY_SOURCES.has(normalized)) return 'medium';
  return 'low';
}

module.exports = { assignPriority };
