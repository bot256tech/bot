/**
 * AGRICHAIN 360 — Telemetry Validation Engine
 *
 * Ingests ESP32 solar-dryer sensor feeds with strict server-side
 * validation and anomaly detection. Physically impossible readings are
 * rejected; suspicious but possible readings are accepted and FLAGGED
 * for manual review so a faulty or tampered unit cannot silently
 * contaminate a batch's quality history.
 */

const db = require('../database/connection');

// Physically plausible bounds (outside => rejected as bad data)
const HARD_LIMITS = {
  temperature_c: { min: -10, max: 80 },
  humidity_pct: { min: 0, max: 100 },
  grain_moisture_pct: { min: 0, max: 90 },   // >90% is sensor failure, never grain
  batch_kg: { min: 0, max: 5000 }
};

// Plausible operating envelope (inside hard limits but suspicious => flag)
const SOFT_RULES = [
  { field: 'grain_moisture_pct', test: (v) => v > 45, reason: 'Grain moisture above 45% is implausible for a drying batch — sensor calibration suspect' },
  { field: 'grain_moisture_pct', test: (v) => v < 5, reason: 'Grain moisture below 5% — likely sensor disconnect or desiccation error' },
  { field: 'temperature_c', test: (v) => v < 15, reason: 'Chamber temperature below ambient expectation — heater/fan fault or night reading' },
  { field: 'temperature_c', test: (v) => v > 65, reason: 'Chamber temperature above safe drying range — crop at risk, inspect immediately' },
  { field: 'humidity_pct', test: (v) => v > 95, reason: 'Relative humidity near saturation — exhaust failure or rain ingress' }
];

class TelemetryService {
  /**
   * Validate + persist one reading.
   * @returns {status: 'rejected'|'stored', anomaly, reasons, reading}
   */
  static async ingest(payload) {
    const reading = {
      device_id: String(payload.device_id || '').trim().slice(0, 60),
      hub: payload.hub ? String(payload.hub).trim().slice(0, 60) : null,
      batch_ref: payload.batch_ref ? String(payload.batch_ref).trim().slice(0, 50) : null,
      temperature_c: this.num(payload.temperature_c),
      humidity_pct: this.num(payload.humidity_pct),
      grain_moisture_pct: this.num(payload.grain_moisture_pct),
      batch_kg: this.num(payload.batch_kg),
      fan_on: !!payload.fan_on
    };

    if (!reading.device_id) {
      return { status: 'rejected', reasons: ['device_id is required'] };
    }

    // Hard limits → reject bad data entirely
    const rejectReasons = [];
    for (const [field, lim] of Object.entries(HARD_LIMITS)) {
      const v = reading[field];
      if (v !== null && (v < lim.min || v > lim.max)) {
        rejectReasons.push(`${field}=${v} outside physically possible range ${lim.min}–${lim.max}`);
      }
    }
    if (rejectReasons.length) {
      return { status: 'rejected', reasons: rejectReasons };
    }

    // Soft rules → flag for manual review
    const flags = [];
    for (const rule of SOFT_RULES) {
      const v = reading[rule.field];
      if (v !== null && rule.test(v)) flags.push(rule.reason);
    }

    // Rate-of-change anomaly vs previous reading (max one reading/10s assumed)
    try {
      const prev = await db.query(
        `SELECT temperature_c, grain_moisture_pct FROM dryer_telemetry
         WHERE device_id = $1 ORDER BY received_at DESC LIMIT 1;`, [reading.device_id]);
      const p = prev.rows[0];
      if (p) {
        if (reading.temperature_c !== null && p.temperature_c !== null) {
          const dT = Math.abs(reading.temperature_c - parseFloat(p.temperature_c));
          if (dT > 20) flags.push(`Temperature jumped ${dT.toFixed(1)}°C since previous reading — sensor interference suspected`);
        }
        if (reading.grain_moisture_pct !== null && p.grain_moisture_pct !== null) {
          const dM = Math.abs(reading.grain_moisture_pct - parseFloat(p.grain_moisture_pct));
          if (dM > 15) flags.push(`Moisture jumped ${dM.toFixed(1)}% since previous reading — sensor fault or batch switched without recalibration`);
        }
      }
    } catch (e) { /* first reading or history unavailable */ }

    const result = await db.query(
      `INSERT INTO dryer_telemetry
        (device_id, hub, batch_ref, temperature_c, humidity_pct, grain_moisture_pct, batch_kg, fan_on, anomaly_flag, anomaly_reasons)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;`,
      [reading.device_id, reading.hub, reading.batch_ref, reading.temperature_c, reading.humidity_pct,
       reading.grain_moisture_pct, reading.batch_kg, reading.fan_on, flags.length > 0, flags.length ? flags.join(' | ') : null]
    );

    return {
      status: 'stored',
      anomaly: flags.length > 0,
      reasons: flags,
      reading: result.rows[0]
    };
  }

  /** Recent readings for a device (partner/admin) */
  static async recent(deviceId, limit = 20) {
    const { rows } = await db.query(
      `SELECT * FROM dryer_telemetry WHERE device_id = $1
       ORDER BY received_at DESC LIMIT $2;`, [String(deviceId), Math.min(parseInt(limit) || 20, 200)]);
    return rows;
  }

  /** Open anomaly queue (partner/admin) */
  static async anomalies(limit = 50) {
    const { rows } = await db.query(
      `SELECT * FROM dryer_telemetry WHERE anomaly_flag = true
       ORDER BY received_at DESC LIMIT $1;`, [Math.min(parseInt(limit) || 50, 200)]);
    return rows;
  }

  static num(v) {
    if (v === undefined || v === null || v === '') return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
}

module.exports = TelemetryService;
