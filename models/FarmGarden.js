const db = require('../database/connection');

class FarmGarden {
  static async create({ farmer_id, agent_id, name, gps_boundary, soil_type, elevation_meters, water_source }) {
    const area = FarmGarden.calculateArea(gps_boundary);
    const query = `
      INSERT INTO farm_gardens (farmer_id, agent_id, name, gps_boundary, area_hectares, area_acres, soil_type, elevation_meters, water_source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *;
    `;
    const hectares = area.hectares;
    const acres = area.acres;
    const { rows } = await db.query(query, [farmer_id, agent_id || null, name, JSON.stringify(gps_boundary), hectares, acres, soil_type, elevation_meters, water_source]);
    return rows[0];
  }

  static async findById(id) {
    const query = `SELECT fg.*, u.name as farmer_name, f.district, f.village FROM farm_gardens fg JOIN farmers f ON fg.farmer_id = f.id JOIN users u ON f.user_id = u.id WHERE fg.id = $1;`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findByFarmerId(farmer_id) {
    const query = `SELECT * FROM farm_gardens WHERE farmer_id = $1 AND is_active = true ORDER BY created_at DESC;`;
    const { rows } = await db.query(query, [farmer_id]);
    return rows;
  }

  static async findByAgentId(agent_id) {
    const query = `SELECT fg.*, u.name as farmer_name FROM farm_gardens fg JOIN farmers f ON fg.farmer_id = f.id JOIN users u ON f.user_id = u.id WHERE fg.agent_id = $1 ORDER BY created_at DESC;`;
    const { rows } = await db.query(query, [agent_id]);
    return rows;
  }

  static async getGardenCalculations(garden_id, crop) {
    const garden = await FarmGarden.findById(garden_id);
    if (!garden) return null;
    const hectares = parseFloat(garden.area_hectares) || 0;
    const cropRates = {
      'maize': { seed_per_ha: 25, fertilizer_per_ha: 150, expected_yield_per_ha: 3000, price_per_kg: 1500, labor_days: 30 },
      'rice': { seed_per_ha: 80, fertilizer_per_ha: 200, expected_yield_per_ha: 4000, price_per_kg: 2500, labor_days: 45 },
      'beans': { seed_per_ha: 60, fertilizer_per_ha: 100, expected_yield_per_ha: 1500, price_per_kg: 3000, labor_days: 25 },
      'groundnuts': { seed_per_ha: 100, fertilizer_per_ha: 120, expected_yield_per_ha: 2000, price_per_kg: 3500, labor_days: 35 },
      'coffee': { seed_per_ha: 1100, fertilizer_per_ha: 250, expected_yield_per_ha: 1500, price_per_kg: 8000, labor_days: 60 },
      'cassava': { seed_per_ha: 1000, fertilizer_per_ha: 80, expected_yield_per_ha: 15000, price_per_kg: 500, labor_days: 20 },
      'banana': { seed_per_ha: 400, fertilizer_per_ha: 200, expected_yield_per_ha: 20000, price_per_kg: 800, labor_days: 40 },
    };
    const rate = cropRates[crop.toLowerCase()] || cropRates['maize'];
    const seed_kg = Math.round(hectares * rate.seed_per_kg * 100) / 100;
    const fertilizer_kg = Math.round(hectares * rate.fertilizer_per_ha * 100) / 100;
    const expected_yield = Math.round(hectares * rate.expected_yield_per_ha);
    const expected_revenue = expected_yield * rate.price_per_kg;
    const seed_cost = seed_kg * (crop.toLowerCase() === 'coffee' ? 500 : 5000);
    const fertilizer_cost = fertilizer_kg * 3000;
    const labor_cost = rate.labor_days * hectares * 10000;
    const total_cost = seed_cost + fertilizer_cost + labor_cost;
    const profit = expected_revenue - total_cost;
    return {
      garden, hectares, acres: parseFloat(garden.area_acres),
      seed_required_kg: seed_kg, fertilizer_required_kg: fertilizer_kg,
      expected_yield_kg: expected_yield, expected_revenue_ugx: expected_revenue,
      seed_cost_ugx: seed_cost, fertilizer_cost_ugx: fertilizer_cost,
      labor_cost_ugx: labor_cost, total_cost_ugx: total_cost, profit_ugx: profit
    };
  }

  static calculateArea(gps_boundary) {
    if (!gps_boundary || !gps_boundary.coordinates || gps_boundary.coordinates.length < 3) {
      return { hectares: 0, acres: 0 };
    }
    const coords = gps_boundary.coordinates;
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }
    area = Math.abs(area) / 2;
    const sqMeters = area * 111320 * 110540;
    const hectares = sqMeters / 10000;
    const acres = hectares * 2.471;
    return { hectares: Math.round(hectares * 10000) / 10000, acres: Math.round(acres * 100) / 100 };
  }
}

module.exports = FarmGarden;
