/**
 * AGRICHAIN 360 — Fee Calculator Service
 * Reads the fee_structures table (migration 004) and falls back to the
 * Busoga pilot schedule (config/pilot.json) when a row is unavailable,
 * so fee quotes never fail at a demo.
 */

const db = require('../database/connection');
const logger = require('../config/logger');

const DEFAULT_RATES = {
  DRYING: {
    Maize: 200, Rice: 200, Soybeans: 200, Cassava: 200, Banana: 150,
    Beans: 250, Groundnuts: 350, Coffee: 350, Cocoa: 500, DEFAULT: 250
  },
  TESTING: {
    Maize: 100, Rice: 120, Soybeans: 120, Cassava: 100, Banana: 100,
    Beans: 150, Groundnuts: 200, Coffee: 250, Cocoa: 400, DEFAULT: 150
  },
  COMMISSION: { DEFAULT: 3 } // percentage
};

class FeeCalculatorService {
  /** Get fee structure row from DB (or null) */
  static async getFeeStructure(cropType, feeType) {
    try {
      const result = await db.query(
        `SELECT * FROM fee_structures
         WHERE crop_type = $1 AND fee_type = $2
         AND effective_from <= CURRENT_DATE
         AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
         ORDER BY effective_from DESC LIMIT 1`,
        [cropType, feeType]
      );
      return result.rows[0] || null;
    } catch (err) {
      logger.warn('Fee structure lookup unavailable, using pilot defaults', {
        crop: cropType, feeType, error: err.message
      });
      return null;
    }
  }

  static async calculateDryingFee(cropType, quantityKg) {
    const row = await this.getFeeStructure(cropType, 'DRYING');
    const rate = row ? parseFloat(row.rate_per_kg)
      : (DEFAULT_RATES.DRYING[cropType] || DEFAULT_RATES.DRYING.DEFAULT);
    return Math.ceil(rate * quantityKg);
  }

  static async calculateTestingFee(cropType, quantityKg) {
    const row = await this.getFeeStructure(cropType, 'TESTING');
    const rate = row ? parseFloat(row.rate_per_kg)
      : (DEFAULT_RATES.TESTING[cropType] || DEFAULT_RATES.TESTING.DEFAULT);
    return Math.ceil(rate * quantityKg);
  }

  static async calculateCommission(cropType, totalPrice) {
    const row = await this.getFeeStructure(cropType, 'COMMISSION');
    const pct = row ? parseFloat(row.percentage) : DEFAULT_RATES.COMMISSION.DEFAULT;
    return Math.ceil(totalPrice * (pct / 100));
  }

  /**
   * Full fee quote for a prospective listing/transaction.
   * Source of each rate is reported so demo can state where numbers came from.
   */
  static async calculateAllFees(cropType, quantityKg, pricePerKg) {
    const dryingRow = await this.getFeeStructure(cropType, 'DRYING');
    const testingRow = await this.getFeeStructure(cropType, 'TESTING');
    const commissionRow = await this.getFeeStructure(cropType, 'COMMISSION');

    const dryingRate = dryingRow ? parseFloat(dryingRow.rate_per_kg)
      : (DEFAULT_RATES.DRYING[cropType] || DEFAULT_RATES.DRYING.DEFAULT);
    const testingRate = testingRow ? parseFloat(testingRow.rate_per_kg)
      : (DEFAULT_RATES.TESTING[cropType] || DEFAULT_RATES.TESTING.DEFAULT);
    const commissionPct = commissionRow ? parseFloat(commissionRow.percentage)
      : DEFAULT_RATES.COMMISSION.DEFAULT;

    const totalPrice = Math.round(quantityKg * pricePerKg);
    const dryingFee = Math.ceil(dryingRate * quantityKg);
    const testingFee = Math.ceil(testingRate * quantityKg);
    const commission = Math.ceil(totalPrice * (commissionPct / 100));
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
        drying: { rate: dryingRate, total: dryingFee, source: dryingRow ? 'fee_structures' : 'pilot_default' },
        testing: { rate: testingRate, total: testingFee, source: testingRow ? 'fee_structures' : 'pilot_default' },
        commission: { percentage: commissionPct, total: commission, source: commissionRow ? 'fee_structures' : 'pilot_default' }
      }
    };
  }
}

module.exports = FeeCalculatorService;
