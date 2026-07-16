const db = require('../database/connection');

class VillageAgent {
  static async create({ user_id, territory, sub_county, parish, village, commission_rate }) {
    const agent_code = 'VA-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const query = `
      INSERT INTO village_agents (user_id, agent_code, territory, sub_county, parish, village, commission_rate, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *;
    `;
    const { rows } = await db.query(query, [user_id, agent_code, territory, sub_county, parish, village, commission_rate || 5]);
    return rows[0];
  }

  static async findById(id) {
    const query = `SELECT va.*, u.name, u.phone, u.email FROM village_agents va JOIN users u ON va.user_id = u.id WHERE va.id = $1;`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findByUserId(user_id) {
    const query = `SELECT va.*, u.name, u.phone FROM village_agents va JOIN users u ON va.user_id = u.id WHERE va.user_id = $1;`;
    const { rows } = await db.query(query, [user_id]);
    return rows[0];
  }

  static async findByAgentCode(agent_code) {
    const query = `SELECT va.*, u.name, u.phone FROM village_agents va JOIN users u ON va.user_id = u.id WHERE va.agent_code = $1;`;
    const { rows } = await db.query(query, [agent_code]);
    return rows[0];
  }

  static async getActiveAgents(filters = {}) {
    let query = `SELECT va.*, u.name, u.phone FROM village_agents va JOIN users u ON va.user_id = u.id WHERE va.is_active = true`;
    const values = [];
    let p = 1;
    if (filters.territory) { query += ` AND va.territory ILIKE $${p}`; values.push(`%${filters.territory}%`); p++; }
    if (filters.sub_county) { query += ` AND va.sub_county ILIKE $${p}`; values.push(`%${filters.sub_county}%`); p++; }
    query += ` ORDER BY va.farmers_registered DESC`;
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(parseInt(filters.limit)); }
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async incrementFarmersRegistered(id) {
    const query = `UPDATE village_agents SET farmers_registered = farmers_registered + 1 WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async updateCollections(id, amount) {
    const commission = amount * 0.05;
    const query = `UPDATE village_agents SET total_collections = total_collections + $2, total_commission = total_commission + $3 WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(query, [id, amount, commission]);
    return rows[0];
  }

  static async getAgentStats(agent_id) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM farm_gardens WHERE agent_id = $1) as gardens_mapped,
        (SELECT COUNT(*) FROM crop_lifecycle WHERE agent_id = (SELECT user_id FROM village_agents WHERE id = $1)) as active_crops,
        (SELECT COUNT(*) FROM farm_activities WHERE agent_id = $1) as activities_recorded,
        (SELECT COUNT(*) FROM extension_visits WHERE agent_id = $1) as visits_made;
    `;
    const { rows } = await db.query(query, [agent_id]);
    return rows[0];
  }
}

module.exports = VillageAgent;
