const QualityPassport = require('../models/QualityPassport');
const Product = require('../models/Product');
const crypto = require('crypto');

class QualityService {
  /**
   * Issue a new Digital Quality Passport
   * Generates a unique batch number and QR code URL
   */
  static async issueQualityPassport(data) {
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

  /**
   * Verify a passport by batch number (public endpoint)
   */
  static async verifyPassport(batch_number) {
    return await QualityPassport.findByBatchNumber(batch_number);
  }

  /**
   * Update passport with laboratory test results
   * Automatically determines quality grade and updates related product status
   */
  static async updatePassportResults(id, moisture_level, aflatoxin_result, quality_grade) {
    // Auto-determine quality grade if not provided
    if (!quality_grade) {
      quality_grade = QualityService.determineGrade(moisture_level, aflatoxin_result);
    }

    const passport = await QualityPassport.updateTestResults(
      id,
      moisture_level,
      aflatoxin_result,
      quality_grade
    );

    // Update related product quality status if passport is linked to a farmer
    if (passport && passport.farmer_id) {
      const productStatus = (quality_grade === 'A' || quality_grade === 'B')
        ? 'APPROVED'
        : 'REJECTED';

      try {
        await Product.updateQualityStatusByFarmer(passport.farmer_id, passport.crop_type, productStatus);
      } catch (err) {
        // Non-critical: log but don't fail the passport update
        console.error('Failed to update product quality status:', err.message);
      }
    }

    return passport;
  }

  /**
   * Get all passports for a specific farmer
   */
  static async getPassportsByFarmer(farmer_id) {
    return await QualityPassport.findByFarmerId(farmer_id);
  }

  /**
   * Get a passport by its database ID
   */
  static async getPassportById(id) {
    return await QualityPassport.findById(id);
  }

  /**
   * Determine quality grade based on moisture and aflatoxin levels
   * Grade A: Moisture <= 13% AND Aflatoxin <= 5 ppb
   * Grade B: Moisture <= 14% AND Aflatoxin <= 10 ppb
   * Grade C: Moisture <= 15% AND Aflatoxin <= 20 ppb
   * Rejected: Anything above Grade C thresholds
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
