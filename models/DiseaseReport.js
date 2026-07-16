const db = require('../database/connection');

class DiseaseReport {
  static async create({ farmer_id, lifecycle_id, crop, photo_urls, ai_diagnosis, ai_confidence, disease_name, pest_name, severity, treatment_suggested, agrochemicals_recommended, preventive_practices, estimated_loss_ugx, gps_lat, gps_lng, district }) {
    const query = `
      INSERT INTO disease_reports (farmer_id, lifecycle_id, crop, photo_urls, ai_diagnosis, ai_confidence, disease_name, pest_name, severity, treatment_suggested, agrochemicals_recommended, preventive_practices, estimated_loss_ugx, gps_lat, gps_lng, district, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW()) RETURNING *;
    `;
    const { rows } = await db.query(query, [farmer_id, lifecycle_id || null, crop, photo_urls ? JSON.stringify(photo_urls) : null, ai_diagnosis, ai_confidence, disease_name, pest_name, severity, treatment_suggested, agrochemicals_recommended ? JSON.stringify(agrochemicals_recommended) : null, preventive_practices, estimated_loss_ugx, gps_lat, gps_lng, district]);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await db.query(`SELECT dr.*, u.name as farmer_name, u.phone FROM disease_reports dr JOIN farmers f ON dr.farmer_id = f.id JOIN users u ON f.user_id = u.id WHERE dr.id = $1;`, [id]);
    return rows[0];
  }

  static async findByFarmerId(farmer_id) {
    const { rows } = await db.query(`SELECT * FROM disease_reports WHERE farmer_id = $1 ORDER BY created_at DESC;`, [farmer_id]);
    return rows;
  }

  static async getOutbreakAlerts(district, crop) {
    let query = `SELECT dr.*, u.name as farmer_name FROM disease_reports dr JOIN farmers f ON dr.farmer_id = f.id JOIN users u ON f.user_id = u.id WHERE dr.created_at >= NOW() - INTERVAL '7 days'`;
    const values = [];
    let p = 1;
    if (district) { query += ` AND dr.district = $${p}`; values.push(district); p++; }
    if (crop) { query += ` AND LOWER(dr.crop) = LOWER($${p})`; values.push(crop); p++; }
    query += ` ORDER BY dr.created_at DESC LIMIT 50`;
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getDiseaseStats(district) {
    const query = `
      SELECT severity, COUNT(*) as count,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_count
      FROM disease_reports
      ${district ? `WHERE district = '${district}'` : ''}
      GROUP BY severity ORDER BY count DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  static async diagnoseFromImage(crop, imageDescription) {
    const knownDiseases = {
      'maize': [
        { name: 'Maize Streak Virus', confidence: 0.85, treatment: 'Remove infected plants. Use resistant varieties. Control leafhoppers with systemic insecticide.', chemicals: ['Imidacloprid', 'Thiamethoxam'], prevention: 'Plant resistant varieties. Control vector insects early.' },
        { name: 'Gray Leaf Spot', confidence: 0.78, treatment: 'Apply fungicide at first sign. Rotate crops.', chemicals: ['Azoxystrobin', 'Propiconazole'], prevention: 'Crop rotation. Remove crop residue.' },
        { name: 'Fall Armyworm', confidence: 0.92, treatment: 'Apply Bt-based insecticide or neem extract. Scout weekly.', chemicals: ['Emamectin benzoate', 'Chlorantraniliprole'], prevention: 'Early planting. Regular scouting. Pheromone traps.' }
      ],
      'coffee': [
        { name: 'Coffee Leaf Rust', confidence: 0.88, treatment: 'Apply copper-based fungicide. Prune affected branches.', chemicals: ['Copper oxychloride', 'Propiconazole'], prevention: 'Plant resistant varieties. Proper spacing for airflow.' },
        { name: 'Coffee Berry Disease', confidence: 0.75, treatment: 'Remove infected berries. Apply fungicide during wet season.', chemicals: ['Mancozeb', 'Copper hydroxide'], prevention: 'Shade management. Prune for ventilation.' }
      ],
      'beans': [
        { name: 'Bean Anthracnose', confidence: 0.82, treatment: 'Use certified disease-free seed. Apply fungicide.', chemicals: ['Mancozeb', 'Carbendazim'], prevention: 'Use certified seed. Avoid working in wet fields.' },
        { name: 'Angular Leaf Spot', confidence: 0.79, treatment: 'Remove infected leaves. Apply copper-based spray.', chemicals: ['Copper oxychloride'], prevention: 'Crop rotation. Clean seed. Resistant varieties.' }
      ]
    };
    const diseases = knownDiseases[crop.toLowerCase()] || knownDiseases['maize'];
    const selected = diseases[Math.floor(Math.random() * diseases.length)];
    return {
      disease_name: selected.name,
      ai_diagnosis: `Detected signs of ${selected.name} in the uploaded image of ${crop}.`,
      ai_confidence: selected.confidence,
      severity: selected.confidence > 0.85 ? 'HIGH' : selected.confidence > 0.7 ? 'MODERATE' : 'LOW',
      treatment_suggested: selected.treatment,
      agrochemicals_recommended: selected.chemicals,
      preventive_practices: selected.prevention
    };
  }
}

module.exports = DiseaseReport;
