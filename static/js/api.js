/* ==========================================================================
   HemoConnect API REST Client Module
   ========================================================================== */

const API_BASE = '/api';

const API = {
  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const isGuest = Boolean(window.HemoAuth?.isGuest);
    if (isGuest) {
      headers.set('X-Hemo-Guest', 'true');
    } else {
      let token;
      try {
        token = await window.HemoAuth?.getIdToken(true);
      } catch (error) {
        console.error('Firebase ID token refresh failed:', { code: error.code || 'token-refresh-failed' });
        return { success: false, error: 'Your sign-in session could not be refreshed. Please sign out and sign in again.' };
      }
      if (!token) {
        return { success: false, error: 'Sign in is required before using this feature.' };
      }
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const result = await response.json();
    if (response.status === 401 && !isGuest) {
      console.warn('Protected API rejected Firebase authentication:', { path, status: response.status, error: result.error });
    }
    return result;
  },

  // Stats
  async getStats() {
    return await this.request('/stats');
  },

  // Donors
  async getDonors(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return await this.request(`/donors?${query}`);
  },

  async updateDonorLocationSharing(donorId, locationSharing) {
    return await this.request(`/donors/${donorId}/location-sharing`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_sharing: locationSharing })
    });
  },

  async registerDonor(data) {
    return await this.request('/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getDonorDetail(donorId) {
    return await this.request(`/donors/${donorId}`);
  },

  async updateDonorStatus(donorId, statusData) {
    return await this.request(`/donors/${donorId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    });
  },

  // Requests
  async getRequests(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return await this.request(`/requests?${query}`);
  },

  async createRequest(data) {
    return await this.request('/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getRequestDetail(requestId) {
    return await this.request(`/requests/${requestId}`);
  },

  // Matching Engine
  async getRequestMatches(requestId) {
    return await this.request(`/requests/${requestId}/matches`);
  },

  async searchAddresses(query, around = {}) {
    const params = new URLSearchParams({ q: query, ...around });
    return await this.request(`/geocode/search?${params}`);
  },

  async reverseGeocode(latitude, longitude) {
    const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
    return await this.request(`/geocode/reverse?${params}`);
  },

  async pledgeDonor(requestId, donorId, units = 1) {
    return await this.request(`/requests/${requestId}/pledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor_id: donorId, units_pledged: units })
    });
  }
};
