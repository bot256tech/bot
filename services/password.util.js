/**
 * AGRICHAIN 360 — Farmer-Friendly Password Policy
 *
 * Design principle: rural farmers may have limited literacy in English
 * and complex passwords create barriers. The minimum is deliberately
 * simple — real security comes from bcrypt hashing, rate limiting,
 * and role-based access control, not from password complexity for users
 * who may be creating their first digital account.
 *
 * Minimum: 6 characters. That's it.
 * The signup form still shows a helpful hint but doesn't block.
 */

function checkPassword(password) {
  const pw = String(password || '');
  const errors = [];
  if (pw.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  return { valid: errors.length === 0, errors, passed: ['length'], score: pw.length >= 6 ? 5 : 0 };
}

module.exports = { checkPassword, RULES: [{ id: 'length', label: 'At least 6 characters', test: (p) => p.length >= 6 }] };
