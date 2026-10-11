/* ==========================================================================
   HemoConnect API REST Client Module
   ========================================================================== */

const API_BASE = '/api';

const API = {
  // Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return await res.json();
  },

  // Donors
  async getDonors(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/donors?${query}`);
    return await res.json();
  },

  async registerDonor(data) {
    const res = await fetch(`${API_BASE}/donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getDonorDetail(donorId) {
    const res = await fetch(`${API_BASE}/donors/${donorId}`);
    return await res.json();
  },

  async updateDonorStatus(donorId, statusData) {
    const res = await fetch(`${API_BASE}/donors/${donorId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    });
    return await res.json();
  },

  // Requests
  async getRequests(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/requests?${query}`);
    return await res.json();
  },

  async createRequest(data) {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getRequestDetail(requestId) {
    const res = await fetch(`${API_BASE}/requests/${requestId}`);
    return await res.json();
  },

  // Matching Engine
  async getRequestMatches(requestId) {
    const res = await fetch(`${API_BASE}/requests/${requestId}/matches`);
    return await res.json();
  },

  async pledgeDonor(requestId, donorId, units = 1) {
    const res = await fetch(`${API_BASE}/requests/${requestId}/pledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor_id: donorId, units_pledged: units })
    });
    return await res.json();
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE}/reset-db`, { method: 'POST' });
    return await res.json();
  }
};
