const db = require('../database/connection');

class CreditProfile {
  static async createOrUpdate(farmer_id) {
    const scores = await CreditProfile.calculateScores(farmer_id);
    const query = `
      INSERT INTO credit_profiles (farmer_id, yield_score, sales_score, repayment_score, farm_size_score, productivity_score, overall_credit_score, risk_level, max_loan_eligible, last_scored_at, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
      ON CONFLICT (farmer_id) DO UPDATE SET
        yield_score = EXCLUDED.yield_score, sales_score = EXCLUDED.sales_score,
        repayment_score = EXCLUDED.repayment_score, farm_size_score = EXCLUDED.farm_size_score,
        productivity_score = EXCLUDED.productivity_score, overall_credit_score = EXCLUDED.overall_credit_score,
        risk_level = EXCLUDED.risk_level, max_loan_eligible = EXCLUDED.max_loan_eligible, last_scored_at = NOW()
      RETURNING *;
    `;
    const { rows } = await db.query(query, [farmer_id, scores.yield, scores.sales, scores.repayment, scores.farm_size, scores.productivity, scores.overall, scores.risk_level, scores.max_loan]);
    return rows[0];
  }

  static async findByFarmerId(farmer_id) {
    const { rows } = await db.query(`SELECT cp.*, u.name as farmer_name, u.phone FROM credit_profiles cp JOIN farmers f ON cp.farmer_id = f.id JOIN users u ON f.user_id = u.id WHERE cp.farmer_id = $1;`, [farmer_id]);
    return rows[0];
  }

  static async calculateScores(farmer_id) {
    const stats = await db.query(`
      SELECT
        COALESCE((SELECT SUM(actual_yield_kg) FROM crop_lifecycle WHERE farmer_id = $1 AND status = 'COMPLETED'), 0) as total_yield,
        COALESCE((SELECT SUM(actual_revenue) FROM crop_lifecycle WHERE farmer_id = $1 AND status = 'COMPLETED'), 0) as total_sales,
        COALESCE((SELECT COUNT(*) FROM loan_requests WHERE farmer_id = $1 AND status = 'COMPLETED'), 0) as loans_repaid,
        COALESCE((SELECT COUNT(*) FROM loan_requests WHERE farmer_id = $1 AND status = 'DEFAULTED'), 0) as defaults,
        COALESCE((SELECT COUNT(*) FROM loan_requests WHERE farmer_id = $1), 0) as total_loans,
        COALESCE((SELECT SUM(farm_size) FROM farmers WHERE id = $1), 0) as farm_size,
        COALESCE((SELECT COUNT(*) FROM crop_lifecycle WHERE farmer_id = $1 AND status = 'ACTIVE'), 0) as active_crops
    `, [farmer_id]);

    const s = stats.rows[0];
    const yieldScore = Math.min(100, (parseFloat(s.total_yield) / 5000) * 100);
    const salesScore = Math.min(100, (parseFloat(s.total_sales) / 10000000) * 100);
    const repaymentScore = s.total_loans > 0 ? ((s.loans_repaid / s.total_loans) * 100) : 50;
    const farmSizeScore = Math.min(100, (parseFloat(s.farm_size) / 10) * 100);
    const productivityScore = Math.min(100, (parseInt(s.active_crops) / 5) * 100);
    const overall = Math.round((yieldScore * 0.25 + salesScore * 0.25 + repaymentScore * 0.25 + farmSizeScore * 0.15 + productivityScore * 0.1) * 100) / 100;
    let risk_level = 'LOW';
    if (overall < 30) risk_level = 'VERY_HIGH';
    else if (overall < 50) risk_level = 'HIGH';
    else if (overall < 70) risk_level = 'MODERATE';
    const max_loan = Math.round(overall * 50000);
    return { yield: Math.round(yieldScore * 100) / 100, sales: Math.round(salesScore * 100) / 100, repayment: Math.round(repaymentScore * 100) / 100, farm_size: Math.round(farmSizeScore * 100) / 100, productivity: Math.round(productivityScore * 100) / 100, overall, risk_level, max_loan };
  }

  static async requestLoan({ farmer_id, amount_requested, purpose }) {
    const profile = await CreditProfile.findByFarmerId(farmer_id);
    const status = profile && profile.overall_credit_score >= 40 ? 'PENDING' : 'REJECTED';
    const query = `INSERT INTO loan_requests (farmer_id, credit_profile_id, amount_requested, purpose, status, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *;`;
    const { rows } = await db.query(query, [farmer_id, profile ? profile.id : null, amount_requested, purpose, status]);
    return rows[0];
  }
}

module.exports = CreditProfile;
