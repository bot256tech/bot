/**
 * AGRICHAIN 360 — Password Policy (shared by web signup and the API)
 *
 * Enforced server-side at the single choke point (AuthService.registerUser)
 * so the rule applies identically to the website, the Android app and any
 * API client. Mirrored client-side by the signup strength meter.
 */

const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper',  label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',  label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%^&*)', test: (p) => /[^a-zA-Z0-9]/.test(p) }
];

/**
 * @returns {{ valid: boolean, errors: string[], passed: string[], score: number }}
 * score: 0–5 (number of satisfied rules)
 */
function checkPassword(password) {
  const pw = String(password || '');
  const passed = [];
  const errors = [];
  for (const rule of RULES) {
    if (rule.test(pw)) passed.push(rule.id);
    else errors.push(rule.label);
  }
  return { valid: errors.length === 0, errors, passed, score: passed.length };
}

module.exports = { checkPassword, RULES };
