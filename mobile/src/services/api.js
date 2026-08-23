// AGRICHAIN 360 — Mobile API Service
// Talks to the SAME backend as the web application (https://16.192.159.6).
// One backend, one PostgreSQL database — web and mobile stay in sync.

import AsyncStorage from '@react-native-async-storage/async-storage';

// Set EXPO_PUBLIC_API_BASE when building; defaults to the pilot server
const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || 'https://16.192.159.6') + '/api/v1';

const TOKEN_KEY = '@agrichain_token';
const USER_KEY = '@agrichain_user';

class ApiService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  // ── Session persistence ──────────────────────────
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
    } catch (err) {
      throw new Error('Cannot reach the AGRICHAIN server. Check your internet connection and try again.');
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
