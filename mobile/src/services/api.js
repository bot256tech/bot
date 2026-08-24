// AGRICHAIN 360 — Mobile API Service
// Talks to the SAME backend as the web application (https://16.192.159.6).
// One backend, one PostgreSQL database — web and mobile stay in sync.

import AsyncStorage from '@react-native-async-storage/async-storage';

// Set EXPO_PUBLIC_API_BASE when building; defaults to the pilot server
const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || 'https://16.192.159.6') + '/api/v1';

const TOKEN_KEY = '@agrichain_token';
const USER_KEY = '@agrichain_user';
const QUEUE_KEY = '@agrichain_offline_queue';

/**
 * Offline-to-online sync: mutations that fail due to connectivity are
 * queued locally (AsyncStorage) and automatically replayed against the
 * PostgreSQL backend as soon as any request succeeds again — so village
 * agents can keep recording data in zero-connectivity zones.
 */
const offlineQueue = {
  async items() {
    try { return JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || []; }
    catch (e) { return []; }
  },
  async push(entry) {
    const q = await this.items();
    // idempotency: one queued mutation per endpoint+payload hash
    const key = entry.endpoint + ':' + JSON.stringify(entry.body || {});
    if (!q.some(i => i.key === key)) {
      q.push({ key, ...entry, queuedAt: Date.now() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    }
  },
  async drain() {
    const q = await this.items();
    if (!q.length) return { synced: 0 };
    const remaining = [];
    let synced = 0;
    for (const item of q) {
      try {
        const resp = await fetch(item.url, {
          method: item.method || 'POST',
          headers: { 'Content-Type': 'application/json', ...(item.token ? { Authorization: 'Bearer ' + item.token } : {}) },
          body: item.body ? JSON.stringify(item.body) : undefined
        });
        if (resp.ok) { synced++; }
        else if (resp.status >= 500) { remaining.push(item); } // retry server errors later
        // 4xx = permanent rejection (e.g. duplicate) → drop
      } catch (e) { remaining.push(item); } // still offline
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return { synced, remaining: remaining.length };
  }
};

class ApiService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  // ── Session persistence ──────────────────────────
  // Exposed for the Profile screen / diagnostics
  async syncNow() { return offlineQueue.drain(); }
  async pendingSyncCount() { return (await offlineQueue.items()).length; }

  async restoreSession() {
    try {
      const [token, user] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY)
      ]);
      if (token) this.token = token;
      if (user) this.user = JSON.parse(user);
    } catch (e) {
      // storage unavailable — treat as logged out
    }
    offlineQueue.drain().catch(() => {});
    return { token: this.token, user: this.user };
  }

  async saveSession(token, user) {
    this.token = token;
    this.user = user;
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) { /* non-fatal */ }
  }

  async clearSession() {
    this.token = null;
    this.user = null;
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (e) { /* non-fatal */ }
  }

  isLoggedIn() {
    return !!this.token;
  }

  // ── Core request helper ──────────────────────────
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response;
    try {
      response = await fetch(url, { ...options, headers });
      // We are online — drain any queued offline mutations (sync)
      if ((options.method || 'GET').toUpperCase() !== 'GET') {
        offlineQueue.drain().catch(() => {});
      }
    } catch (err) {
      // Offline: queue write operations for auto-sync instead of losing them
      if ((options.method || 'GET').toUpperCase() !== 'GET') {
        const body = options.body ? JSON.parse(options.body) : null;
        await offlineQueue.push({
          url,
          method: options.method,
          body,
          token: this.token
        });
      }
      throw new Error('You appear to be offline. Your changes are saved on this device and will sync automatically when the connection returns.');
    }

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      // Session expired → clear local state
      if (response.status === 401) {
        await this.clearSession();
      }
      throw new Error((data && data.message) || `Request failed (${response.status})`);
    }
    return data;
  }

  // ── Health ───────────────────────────────────────
  async health() {
    const base = API_BASE.replace('/api/v1', '');
    try {
      const r = await fetch(`${base}/health`);
      return await r.json();
    } catch (e) {
      return { success: false };
    }
  }

  // ── Authentication ───────────────────────────────
  async register({ name, phone, password, role, profile }) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, role, profile })
    });
    if (result.data && result.data.token) {
      await this.saveSession(result.data.token, result.data.user);
    }
    return result;
  }

  async login(phone, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    if (result.data && result.data.token) {
      await this.saveSession(result.data.token, result.data.user);
    }
    return result;
  }

  async logout() {
    // JWT is stateless server-side; discarding it locally ends the session
    await this.clearSession();
  }

  async getProfile() {
    const result = await this.request('/auth/me');
    return result.data;
  }

  // ── Marketplace ──────────────────────────────────
  async getProducts(filters = {}) {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
    const params = new URLSearchParams(clean).toString();
    return this.request(`/marketplace/products${params ? '?' + params : ''}`);
  }

  async getProduct(id) {
    return this.request(`/marketplace/product/${id}`);
  }

  async getMarketplaceStats() {
    return this.request('/marketplace/stats');
  }

  // ── Farmer: produce & quality ────────────────────
  async getMyListings() {
    return this.request('/marketplace/my-listings');
  }

  async createListing({ crop, quantity, unit, price_per_unit }) {
    return this.request('/marketplace/listing', {
      method: 'POST',
      body: JSON.stringify({ crop, quantity, unit, price_per_unit })
    });
  }

  async toggleListingAvailability(id, available) {
    return this.request(`/marketplace/listing/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ available })
    });
  }

  async recordQuality({ product_id, moisture_level, aflatoxin_result, drying_center }) {
    return this.request('/quality/record', {
      method: 'POST',
      body: JSON.stringify({ product_id, moisture_level, aflatoxin_result, drying_center })
    });
  }

  async getMyPassports() {
    return this.request('/quality/my-passports');
  }

  // ── Quality passport verification ────────────────
  async verifyPassport(batchNumber) {
    return this.request(`/quality/verify/${encodeURIComponent(batchNumber)}`);
  }

  // ── Buyer: orders ────────────────────────────────
  async placeOrder(product_id, quantity) {
    return this.request('/marketplace/orders', {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity })
    });
  }

  async getMyOrders() {
    return this.request('/marketplace/orders');
  }

  async cancelOrder(id) {
    return this.request(`/marketplace/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' })
    });
  }

  // ── Decision Advisor ─────────────────────────────
  async askAdvisor(question) {
    return this.request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
  }

  async getSuggestions() {
    return this.request('/ai/suggestions');
  }
}

export default new ApiService();
