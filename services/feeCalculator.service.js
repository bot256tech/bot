
/**
 * Fee Calculator Service
 * Handles all fee calculations for AGRICHAIN 360
 * Aligned with UGX 45M budget
 */

const { pool } = require('../config/database');

class FeeCalculatorService {
  /**
   * Get fee structure from database
   */
  static async getFeeStructure(cropType, feeType) {
    const result = await pool.query(
      `SELECT * FROM fee_structures 
       WHERE crop_type = $1 AND fee_type = $2 
       AND effective_from <= CURRENT_DATE 
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY effective_from DESC LIMIT 1`,
      [cropType, feeType]
    );
    return result.rows[0];
  }

  /**
   * Calculate drying fee
   */
  static async calculateDryingFee(cropType, quantityKg) {
    const feeStructure = await this.getFeeStructure(cropType, 'DRYING');
    if (!feeStructure) {
      throw new Error(`No drying fee structure found for ${cropType}`);
    }
    return Math.ceil(feeStructure.rate_per_kg * quantityKg);
  }

  /**
   * Calculate testing fee
   */
  static async calculateTestingFee(cropType, quantityKg) {
    const feeStructure = await this.getFeeStructure(cropType, 'TESTING');
    if (!feeStructure) {
      throw new Error(`No testing fee structure found for ${cropType}`);
    }
    return Math.ceil(feeStructure.rate_per_kg * quantityKg);
  }

  /**
   * Calculate marketplace commission
   */
  static async calculateCommission(cropType, totalPrice) {
    const feeStructure = await this.getFeeStructure(cropType, 'COMMISSION');
    if (!feeStructure) {
      throw new Error(`No commission structure found for ${cropType}`);
    }
    return Math.ceil(totalPrice * (feeStructure.percentage / 100));
  }

  /**
   * Calculate all fees for a transaction
   */
  static async calculateAllFees(cropType, quantityKg, pricePerKg) {
    const totalPrice = quantityKg * pricePerKg;
    
    const [dryingFee, testingFee, commission] = await Promise.all([
      this.calculateDryingFee(cropType, quantityKg),
      this.calculateTestingFee(cropType, quantityKg),
      this.calculateCommission(cropType, totalPrice)
    ]);

    const totalFees = dryingFee + testingFee + commission;
    const farmerReceives = totalPrice - totalFees;

    return {
      cropType,
      quantityKg,
      pricePerKg,
      totalPrice,
      dryingFee,
      testingFee,
      commission,
      totalFees,
      farmerReceives,
      feeBreakdown: {
        drying: { rate: dryingFee / quantityKg, total: dryingFee },
        testing: { rate: testingFee / quantityKg, total: testingFee },
        commission: { percentage: 3, total: commission }
      }
    };
  }
}

module.exports = FeeCalculatorService;
