const db = require('../database/connection');

class Community {
  static async createPost({ author_id, category, title, content, photo_urls, voice_note_url, language }) {
    const query = `INSERT INTO community_posts (author_id, category, title, content, photo_urls, voice_note_url, language, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *;`;
    const { rows } = await db.query(query, [author_id, category, title || null, content, photo_urls ? JSON.stringify(photo_urls) : null, voice_note_url, language || 'en']);
    await Community.awardPoints(author_id, 'POST_CREATED', 10);
    return rows[0];
  }

  static async getPosts(filters = {}) {
    let query = `SELECT cp.*, u.name as author_name FROM community_posts cp JOIN users u ON cp.author_id = u.id WHERE 1=1`;
    const values = []; let p = 1;
    if (filters.category) { query += ` AND cp.category = $${p}`; values.push(filters.category); p++; }
    if (filters.language) { query += ` AND cp.language = $${p}`; values.push(filters.language); p++; }
    query += ` ORDER BY cp.is_pinned DESC, cp.created_at DESC`;
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(parseInt(filters.limit)); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(parseInt(filters.offset)); }
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async addReply({ post_id, author_id, content, voice_note_url, is_expert }) {
    const query = `INSERT INTO community_replies (post_id, author_id, content, voice_note_url, is_expert, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *;`;
    const { rows } = await db.query(query, [post_id, author_id, content, voice_note_url, is_expert || false]);
    await db.query(`UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = $1;`, [post_id]);
    await Community.awardPoints(author_id, 'REPLY_CREATED', 5);
    return rows[0];
  }

  static async getReplies(post_id) {
    const { rows } = await db.query(`SELECT cr.*, u.name as author_name FROM community_replies cr JOIN users u ON cr.author_id = u.id WHERE cr.post_id = $1 ORDER BY cr.created_at ASC;`, [post_id]);
    return rows;
  }

  static async awardPoints(user_id, action_type, points) {
    const descriptions = { 'POST_CREATED': 'Created a community post', 'REPLY_CREATED': 'Replied to a post', 'PROFILE_COMPLETED': 'Completed profile', 'FARM_REGISTERED': 'Registered a farm garden', 'CROP_PLANTED': 'Logged a new crop', 'HARVEST_RECORDED': 'Recorded harvest' };
    try {
      await db.query(`INSERT INTO gamification_points (user_id, action_type, points, description, created_at) VALUES ($1,$2,$3,$4,NOW());`, [user_id, action_type, points, descriptions[action_type] || action_type]);
    } catch (e) { /* non-critical */ }
  }

  static async getUserPoints(user_id) {
    const { rows } = await db.query(`SELECT COALESCE(SUM(points), 0) as total_points FROM gamification_points WHERE user_id = $1;`, [user_id]);
    return parseInt(rows[0].total_points);
  }

  static async getLeaderboard(limit) {
    const { rows } = await db.query(`SELECT u.id, u.name, COALESCE(SUM(gp.points), 0) as total_points FROM users u LEFT JOIN gamification_points gp ON u.id = gp.user_id GROUP BY u.id, u.name ORDER BY total_points DESC LIMIT $1;`, [limit || 20]);
    return rows;
  }

  static async getUserBadges(user_id) {
    const { rows } = await db.query(`SELECT * FROM badges WHERE user_id = $1 ORDER BY earned_at DESC;`, [user_id]);
    return rows;
  }
}

module.exports = Community;
