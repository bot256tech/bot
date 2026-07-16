const Buyer = require('../models/Buyer');
const Subscription = require('../models/Subscription');

class BuyerService {
  static async createBuyerProfile(user_id, profileData) {
    const existing = await Buyer.findByUserId(user_id);
    if (existing) throw new Error('Buyer profile already exists for this user.');
    return await Buyer.createProfile({ user_id, ...profileData });
  }

  static async getProfile(user_id) {
    return await Buyer.findByUserId(user_id);
  }

  static async getDashboardData(user_id) {
    const stats = await Buyer.getDashboardStats(user_id);
    const profile = await Buyer.findByUserId(user_id);

    let subscription = null;
    if (profile) {
      subscription = await Subscription.getActiveSubscription(profile.id);
    }

    return {
      stats: {
        total_suppliers: parseInt(stats.total_suppliers) || 0,
        verified_batches: parseInt(stats.total_passports) || 0,
        available_produce_kg: parseFloat(stats.total_available_kg) || 0,
        available_produce_tonnes: Math.round((parseFloat(stats.total_available_kg) || 0) / 1000 * 100) / 100,
        crop_varieties: parseInt(stats.crop_varieties) || 0,
        verified_listings: parseInt(stats.verified_listings) || 0,
        quality_grades: {
          A: parseInt(stats.grade_a_count) || 0,
          B: parseInt(stats.grade_b_count) || 0,
          C: parseInt(stats.grade_c_count) || 0
        }
      },
      profile,
      subscription
    };
  }

  static async searchSuppliers(filters, buyer_user_id) {
    const profile = await Buyer.findByUserId(buyer_user_id);
    let maxViewable = 50;

    if (profile) {
      const sub = await Subscription.getActiveSubscription(profile.id);
      if (sub) {
        maxViewable = sub.max_suppliers_viewable || 50;
      }
    }

    if (!filters.limit || parseInt(filters.limit) > maxViewable) {
      filters.limit = maxViewable;
    }

    const suppliers = await Buyer.searchSuppliers(filters);
    return {
      suppliers,
      total_returned: suppliers.length,
      limit_applied: maxViewable
    };
  }

  static async getAvailableBatches(filters, buyer_user_id) {
    return await Buyer.getAvailableBatches(filters);
  }

  static async verifyBuyer(buyer_id) {
    return await Buyer.verify(buyer_id);
  }

  static async getAllBuyers(filters) {
    return await Buyer.getAll(filters);
  }
}

module.exports = BuyerService;
