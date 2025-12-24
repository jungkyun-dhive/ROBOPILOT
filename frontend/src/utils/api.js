// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// API Client
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 204 No Content 응답 처리
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const api = new ApiClient(API_BASE_URL);

// Company API
export const companyApi = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Site API
export const siteApi = {
  getAll: () => api.get('/sites'),
  getById: (id) => api.get(`/sites/${id}`),
  getByCompanyId: (companyId) => api.get(`/sites/company/${companyId}`),
  getByStatus: (status) => api.get(`/sites/status/${status}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
};

// Robot API
export const robotApi = {
  getAll: () => api.get('/robots'),
  getById: (id) => api.get(`/robots/${id}`),
  getBySiteId: (siteId) => api.get(`/robots/site/${siteId}`),
  getByStatus: (status) => api.get(`/robots/status/${status}`),
  getByType: (type) => api.get(`/robots/type/${type}`),
  create: (data) => api.post('/robots', data),
  update: (id, data) => api.put(`/robots/${id}`, data),
  delete: (id) => api.delete(`/robots/${id}`),
};

// Mission API
export const missionApi = {
  getAll: () => api.get('/missions'),
  getById: (id) => api.get(`/missions/${id}`),
  getBySiteId: (siteId) => api.get(`/missions/site/${siteId}`),
  getByRobotId: (robotId) => api.get(`/missions/robot/${robotId}`),
  getByStatus: (status) => api.get(`/missions/status/${status}`),
  create: (data) => api.post('/missions', data),
  update: (id, data) => api.put(`/missions/${id}`, data),
  delete: (id) => api.delete(`/missions/${id}`),
};

// User API
export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
  getByEmail: (email) => api.get(`/users/email/${email}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
