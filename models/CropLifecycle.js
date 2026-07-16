const db = require('../database/connection');

class CropLifecycle {
  static async create(data) {
    const batch_id = data.batch_id || ('BATCH-' + Date.now().toString(36).toUpperCase());
    const traceability_hash = require('crypto').createHash('sha256').update(JSON.stringify({ ...data, batch_id, ts: Date.now() })).digest('hex');
    const query = `
      INSERT INTO crop_lifecycle (garden_id, farmer_id, crop, variety, batch_id, seed_source, seed_supplier, seed_certified,
        planting_date, expected_harvest_date, planted_area_hectares, seed_quantity_kg, fertilizer_type, fertilizer_quantity_kg,
        expected_yield_kg, estimated_revenue, total_cost, current_stage, traceability_hash, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW()) RETURNING *;
    `;
    const values = [data.garden_id, data.farmer_id, data.crop, data.variety || null, batch_id,
      data.seed_source || null, data.seed_supplier || null, data.seed_certified || false,
      data.planting_date || new Date(), data.expected_harvest_date || null,
      data.planted_area_hectares || null, data.seed_quantity_kg || null,
      data.fertilizer_type || null, data.fertilizer_quantity_kg || null,
      data.expected_yield_kg || null, data.estimated_revenue || null, data.total_cost || null,
      data.current_stage || 'PLANTING', traceability_hash];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await db.query(`SELECT cl.*, fg.name as garden_name, fg.area_hectares, u.name as farmer_name FROM crop_lifecycle cl LEFT JOIN farm_gardens fg ON cl.garden_id = fg.id JOIN farmers f ON cl.farmer_id = f.id JOIN users u ON f.user_id = u.id WHERE cl.id = $1;`, [id]);
    return rows[0];
  }

  static async findByBatchId(batch_id) {
    const { rows } = await db.query(`SELECT cl.*, fg.name as garden_name FROM crop_lifecycle cl LEFT JOIN farm_gardens fg ON cl.garden_id = fg.id WHERE cl.batch_id = $1;`, [batch_id]);
    return rows[0];
  }

  static async findByFarmerId(farmer_id, status) {
    let query = `SELECT cl.*, fg.name as garden_name FROM crop_lifecycle cl LEFT JOIN farm_gardens fg ON cl.garden_id = fg.id WHERE cl.farmer_id = $1`;
    const values = [farmer_id];
    if (status) { query += ` AND cl.status = $2`; values.push(status); }
    query += ` ORDER BY cl.created_at DESC`;
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async updateStage(id, new_stage, additional_data) {
    const updates = [`current_stage = $1`];
    const values = [new_stage];
    let p = 2;
    if (additional_data) {
      for (const [key, val] of Object.entries(additional_data)) {
        updates.push(`${key} = $${p}`);
        values.push(val);
        p++;
      }
    }
    values.push(id);
    const query = `UPDATE crop_lifecycle SET ${updates.join(', ')} WHERE id = $${p} RETURNING *;`;
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async getFullTraceability(batch_id) {
    const lifecycle = await CropLifecycle.findByBatchId(batch_id);
    if (!lifecycle) return null;
    const activities = await db.query(`SELECT * FROM farm_activities WHERE lifecycle_id = $1 ORDER BY date_performed;`, [lifecycle.id]);
    const passports = await db.query(`SELECT * FROM quality_passports WHERE farmer_id = $1 AND LOWER(crop_type) = LOWER($2);`, [lifecycle.farmer_id, lifecycle.crop]);
    const traceRecords = await db.query(`SELECT * FROM traceability_records WHERE batch_id = $1 ORDER BY created_at;`, [batch_id]);
    const diseaseReports = await db.query(`SELECT * FROM disease_reports WHERE lifecycle_id = $1;`, [lifecycle.id]);
    return { lifecycle, activities: activities.rows, passports: passports.rows, traceability: traceRecords.rows, disease_reports: diseaseReports.rows };
  }

  static async recordActivity(data) {
    const query = `
      INSERT INTO farm_activities (lifecycle_id, farmer_id, agent_id, activity_type, description, date_performed,
        input_used, input_quantity, cost, gps_lat, gps_lng, photo_urls, notes, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) RETURNING *;
    `;
    const values = [data.lifecycle_id, data.farmer_id, data.agent_id || null, data.activity_type,
      data.description, data.date_performed || new Date(), data.input_used || null,
      data.input_quantity || null, data.cost || null, data.gps_lat || null,
      data.gps_lng || null, data.photo_urls || null, data.notes || null];
    const { rows } = await db.query(query, values);
    return rows[0];
  }
}

module.exports = CropLifecycle;
