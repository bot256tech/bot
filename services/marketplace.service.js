const Product = require('../models/Product');
const QualityPassport = require('../models/QualityPassport');

class MarketplaceService {
  static async createListing(farmer_id, productData) {
    return await Product.create({
      farmer_id,
      ...productData
    });
  }

  static async getAvailableProducts(filters = {}) {
    return await Product.getAvailable(filters);
  }

  static async searchVerifiedProducts(filters = {}) {
    // Get products that have approved quality passports
    const products = await Product.getAvailable(filters);
    
    const verifiedProducts = [];
    
    for (const product of products) {
      const passport = await QualityPassport.findByFarmerId(product.farmer_id);
      if (passport && passport.length > 0) {
        verifiedProducts.push({
          ...product,
          has_passport: true,
          passport_batch: passport[0].batch_number
        });
      }
    }
    
    return verifiedProducts;
  }

  static async updateProductAvailability(id, available) {
    return await Product.updateAvailability(id, available);
  }
}

module.exports = MarketplaceService;