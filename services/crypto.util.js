/**
 * AGRICHAIN 360 — Cryptography utilities
 *
 * 1. Passport signing: HMAC-SHA256 over the canonical passport record.
 *    Anyone can verify authenticity via the public verification endpoint
 *    without gaining the ability to forge signatures.
 * 2. AES-256-GCM encryption at rest for sensitive personal fields
 *    (application-layer; key never leaves the server environment).
 */

const crypto = require('crypto');

function hmacKey() {
  const k = process.env.PASSPORT_SIGNING_KEY;
  if (!k) throw new Error('PASSPORT_SIGNING_KEY is not configured');
  return k;
}

function aesKey() {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error('ENCRYPTION_KEY is not configured');
  return crypto.createHash('sha256').update(k).digest(); // 32-byte key
}

/** Canonical string for a passport record (order-stable) */
function passportCanonical(p) {
  return [
    p.batch_number,
    p.farmer_id == null ? '' : String(p.farmer_id),
    p.crop_type,
    p.quantity,
    p.moisture_level == null ? '' : String(p.moisture_level),
    p.aflatoxin_result == null ? '' : String(p.aflatoxin_result),
    p.quality_grade == null ? '' : String(p.quality_grade),
    p.record_source == null ? '' : String(p.record_source),
    new Date(p.created_at).toISOString()
  ].join('|');
}

/** HMAC-SHA256 signature (hex) for a passport record */
function signPassport(passport) {
  return crypto.createHmac('sha256', hmacKey())
    .update(passportCanonical(passport))
    .digest('hex');
}

/** Verify a passport's stored signature. Returns {valid, reason} */
function verifyPassportSignature(passport) {
  if (!passport || !passport.passport_signature) {
    return { valid: false, reason: 'This passport carries no cryptographic signature (issued before signing was enabled).' };
  }
  const expected = signPassport(passport);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(passport.passport_signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'Signature mismatch: the passport record has been altered or was not issued by AGRICHAIN 360.' };
  }
  return { valid: true, reason: 'HMAC-SHA256 signature verified against the issuing platform key.' };
}

/** AES-256-GCM encrypt → "v1:<iv_b64>:<tag_b64>:<ct_b64>" */
function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(':');
}

/** AES-256-GCM decrypt of encryptField() output */
function decryptField(payload) {
  if (!payload || typeof payload !== 'string' || !payload.startsWith('v1:')) return null;
  try {
    const [, ivB64, tagB64, ctB64] = payload.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
  } catch (e) {
    return null;
  }
}

module.exports = { signPassport, verifyPassportSignature, encryptField, decryptField, passportCanonical };
