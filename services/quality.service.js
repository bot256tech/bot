const QualityPassport = require('../models/QualityPassport');
const Product = require('../models/Product');
const crypto = require('crypto');
const logger = require('../config/logger');

function baseUrl() {
  return (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

class QualityService {
  /**
   * Issue a Digital Quality Passport for a farmer's batch.
   * record_source distinguishes 'user' (farmer-entered), 'partner'
   * (partner-entered) and 'demo' (clearly identified demonstration data).
   */
  static async createPassport(data) {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const batch_number = `AGR-${year}-${randomHex}`;
    const qr_code = `${baseUrl()}/passport/${batch_number}`;

    const moisture = data.moisture_level !== undefined && data.moisture_level !== null && data.moisture_level !== ''
      ? data.moisture_level : null;
    const aflatoxin = data.aflatoxin_result !== undefined && data.aflatoxin_result !== null && data.aflatoxin_result !== ''
      ? data.aflatoxin_result : null;
    const quality_grade = data.quality_grade || QualityService.determineGrade(moisture, aflatoxin);

    const passport = await QualityPassport.create({
      batch_number,
      farmer_id: data.farmer_id,
      crop_type: data.crop_type,
      quantity: data.quantity,
      moisture_level: moisture,
      aflatoxin_result: aflatoxin,
      quality_grade,
      testing_partner_id: data.testing_partner_id || null,
      drying_center: data.drying_center || null,
      record_source: data.record_source || 'user',
      qr_code
    });

    // Keep the linked listing in sync with the initial grade
    if (passport && passport.farmer_id && quality_grade && quality_grade !== 'PENDING') {
      const productStatus =
        quality_grade === 'A' || quality_grade === 'B' ? 'APPROVED'
        : quality_grade === 'C' ? 'PENDING'
        : 'REJECTED';
      try {
        await Product.updateQualityStatusByFarmer(passport.farmer_id, passport.crop_type, productStatus);
      } catch (err) {
        logger.warn('Failed to update product quality status at passport creation', { error: err.message });
      }
    }

    return passport;
  }

  static async verifyPassport(batch_number) {
    return await QualityPassport.findByBatchNumber(batch_number);
  }

  static async getPassportById(id) {
    return await QualityPassport.findById(id);
  }

  static async getPassportsByFarmer(farmer_id) {
    return await QualityPassport.findByFarmerId(farmer_id);
  }

  static async updatePassportResults(id, moisture_level, aflatoxin_result, quality_grade) {
    if (!quality_grade) {
      quality_grade = QualityService.determineGrade(moisture_level, aflatoxin_result);
    }

    const passport = await QualityPassport.updateTestResults(
      id,
      moisture_level,
      aflatoxin_result,
      quality_grade
    );

    // Keep the linked listing in sync with the batch grade
    if (passport && passport.farmer_id) {
      const productStatus =
        quality_grade === 'A' || quality_grade === 'B' ? 'APPROVED'
        : quality_grade === 'C' ? 'PENDING'
        : 'REJECTED';

      try {
        await Product.updateQualityStatusByFarmer(
          passport.farmer_id,
          passport.crop_type,
          productStatus
        );
      } catch (err) {
        logger.warn('Failed to update product quality status', { error: err.message });
      }
    }

    return passport;
  }

  /**
   * Deterministic grading rules (documented on the passport verification page):
   *   A: moisture <= 13% and aflatoxin <= 5 ppb
   *   B: moisture <= 14% and aflatoxin <= 10 ppb
   *   C: moisture <= 15% and aflatoxin <= 20 ppb
   *   REJECTED beyond those limits
   */
  static determineGrade(moisture_level, aflatoxin_result) {
    const moisture = parseFloat(moisture_level);
    const aflatoxin = parseFloat(aflatoxin_result);

    if (isNaN(moisture) || isNaN(aflatoxin)) {
      return 'PENDING';
    }

    if (moisture <= 13 && aflatoxin <= 5) return 'A';
    if (moisture <= 14 && aflatoxin <= 10) return 'B';
    if (moisture <= 15 && aflatoxin <= 20) return 'C';
    return 'REJECTED';
  }
}

module.exports = QualityService;
