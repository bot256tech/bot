const QualityPassport = require('../models/QualityPassport');
const Product = require('../models/Product');
const crypto = require('crypto');

class QualityService {
  static async createPassport(data) {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const batch_number = `AGR-${year}-${randomHex}`;
    const qr_code = `https://agrichain360.com/passport/${batch_number}`;

    const passport = await QualityPassport.create({
      batch_number,
      farmer_id: data.farmer_id,
      crop_type: data.crop_type,
      quantity: data.quantity,
      moisture_level: data.moisture_level || null,
      aflatoxin_result: data.aflatoxin_result || null,
      quality_grade: data.quality_grade || null,
      testing_partner_id: data.testing_partner_id || null,
      qr_code
    });

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

    if (passport && passport.farmer_id) {
      const productStatus = (quality_grade === 'A' || quality_grade === 'B')
        ? 'APPROVED'
        : 'REJECTED';

      try {
        await Product.updateQualityStatusByFarmer(
          passport.farmer_id,
          passport.crop_type,
          productStatus
        );
      } catch (err) {
        console.error('Failed to update product quality status:', err.message);
      }
    }

    return passport;
  }

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
