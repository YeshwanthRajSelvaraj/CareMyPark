import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const reportService = {
  // Get all reports (filtered by role on backend)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.problem_type) params.append('problem_type', filters.problem_type);
    if (filters.priority) params.append('priority', filters.priority);
    
    const response = await api.get(`/reports?${params.toString()}`);
    return response.data;
  },

  // Get a specific report by reference ID
  getById: async (referenceId) => {
    const response = await api.get(`/reports/${referenceId}`);
    return response.data;
  },

  // Create a new report
  create: async (formData) => {
    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update report status (Authority only)
  updateStatus: async (referenceId, status, priority = null) => {
    const data = { status };
    if (priority) data.priority = priority;
    
    const response = await api.put(`/reports/${referenceId}/status`, data);
    return response.data;
  },

  // Get statistics (Authority only)
  getStatistics: async () => {
    const response = await api.get('/statistics');
    return response.data;
  }
};

export default api;