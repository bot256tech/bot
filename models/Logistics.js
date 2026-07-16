const db = require('../database/connection');
const crypto = require('crypto');

class Logistics {
  static async registerProvider({ user_id, business_name, vehicle_type, capacity_kg, plate_number, gps_lat, gps_lng, price_per_km }) {
    const query = `INSERT INTO transport_providers (user_id, business_name, vehicle_type, capacity_kg, plate_number, gps_lat, gps_lng, price_per_km, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *;`;
    const { rows } = await db.query(query, [user_id, business_name, vehicle_type, capacity_kg, plate_number, gps_lat, gps_lng, price_per_km]);
    return rows[0];
  }

  static async createRequest({ requester_id, pickup_location, pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng, cargo_type, cargo_weight_kg, cargo_description, preferred_vehicle, budget }) {
    const tracking_id = 'TRK-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const distance = Logistics.estimateDistance(pickup_lat, pickup_lng, delivery_lat, delivery_lng);
    const fuel_cost = distance * 400;
    const query = `INSERT INTO transport_requests (requester_id, pickup_location, pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng, cargo_type, cargo_weight_kg, cargo_description, preferred_vehicle, estimated_distance_km, estimated_fuel_cost, budget, tracking_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()) RETURNING *;`;
    const { rows } = await db.query(query, [requester_id, pickup_location, pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng, cargo_type, cargo_weight_kg, cargo_description, preferred_vehicle, distance, fuel_cost, budget, tracking_id]);
    return rows[0];
  }

  static async placeBid({ request_id, provider_id, bid_amount, estimated_hours, message }) {
    const query = `INSERT INTO transport_bids (request_id, provider_id, bid_amount, estimated_hours, message, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *;`;
    const { rows } = await db.query(query, [request_id, provider_id, bid_amount, estimated_hours, message]);
    await db.query(`UPDATE transport_requests SET status = 'BIDDING' WHERE id = $1;`, [request_id]);
    return rows[0];
  }

  static async acceptBid(bid_id) {
    const bid = await db.query(`SELECT * FROM transport_bids WHERE id = $1;`, [bid_id]);
    if (!bid.rows[0]) throw new Error('Bid not found');
    const { request_id, provider_id, bid_amount } = bid.rows[0];
    await db.query(`UPDATE transport_bids SET accepted = false WHERE request_id = $1;`, [request_id]);
    await db.query(`UPDATE transport_bids SET accepted = true WHERE id = $1;`, [bid_id]);
    await db.query(`UPDATE transport_requests SET status = 'ASSIGNED', assigned_provider_id = $2, actual_cost = $3 WHERE id = $1;`, [request_id, provider_id, bid_amount]);
    return { request_id, provider_id, bid_amount };
  }

  static async updateTracking(tracking_id, status, extra) {
    const updates = [`status = $1`];
    const values = [status];
    let p = 2;
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        updates.push(`${k} = $${p}`); values.push(v); p++;
      }
    }
    values.push(tracking_id);
    const { rows } = await db.query(`UPDATE transport_requests SET ${updates.join(', ')} WHERE tracking_id = $${p} RETURNING *;`, values);
    return rows[0];
  }

  static async findNearbyProviders(lat, lng, radius_km, vehicle_type) {
    let query = `SELECT tp.*, u.name, u.phone, (6371 * acos(cos(radians($1)) * cos(radians(tp.gps_lat)) * cos(radians(tp.gps_lng) - radians($2)) + sin(radians($1)) * sin(radians(tp.gps_lat)))) AS distance_km FROM transport_providers tp JOIN users u ON tp.user_id = u.id WHERE tp.available = true`;
    const values = [lat, lng];
    let p = 3;
    if (vehicle_type) { query += ` AND tp.vehicle_type = $${p}`; values.push(vehicle_type); p++; }
    query += ` AND (6371 * acos(cos(radians($1)) * cos(radians(tp.gps_lat)) * cos(radians(tp.gps_lng) - radians($2)) + sin(radians($1)) * sin(radians(tp.gps_lat)))) <= $${p}`;
    values.push(radius_km || 50); p++;
    query += ` ORDER BY distance_km ASC`;
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getRequestByTrackingId(tracking_id) {
    const query = `SELECT tr.*, u.name as requester_name, u.phone as requester_phone, tp.business_name as provider_name FROM transport_requests tr JOIN users u ON tr.requester_id = u.id LEFT JOIN transport_providers tp ON tr.assigned_provider_id = tp.id WHERE tr.tracking_id = $1;`;
    const { rows } = await db.query(query, [tracking_id]);
    return rows[0];
  }

  static async getBidsForRequest(request_id) {
    const query = `SELECT tb.*, tp.business_name, tp.vehicle_type, u.phone FROM transport_bids tb JOIN transport_providers tp ON tb.provider_id = tp.id JOIN users u ON tp.user_id = u.id WHERE tb.request_id = $1 ORDER BY tb.bid_amount ASC;`;
    const { rows } = await db.query(query, [request_id]);
    return rows;
  }

  static estimateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 20;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }
}

module.exports = Logistics;
