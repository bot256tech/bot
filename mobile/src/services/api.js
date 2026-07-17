const API_BASE = 'https://agrichain360.onrender.com/api/v1';

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Auth
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(phone, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    if (result.data && result.data.token) {
      this.token = result.data.token;
    }
    return result;
  }

  // AI Advisor
  async askAI(question) {
    return this.request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, district: 'Mayuge', crops: ['Maize'] }),
    });
  }

  // Marketplace
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/marketplace/products?${params}`);
  }

  async getProduct(id) {
    return this.request(`/marketplace/product/${id}`);
  }

  // Quality Passport
  async verifyPassport(batchNumber) {
    return this.request(`/quality/verify/${batchNumber}`);
  }

  // Disease Detection
  async detectDisease(crop, imageData) {
    return this.request('/disease/diagnose', {
      method: 'POST',
      body: JSON.stringify({ crop, image_description: imageData }),
    });
  }

  // Village Agents
  async getNearbyAgents(location) {
    return this.request(`/village-agents/nearby?territory=${location}`);
  }

  // Logistics
  async getTransportProviders(lat, lng) {
    return this.request(`/logistics/providers?lat=${lat}&lng=${lng}`);
  }
}

export default new ApiService();
