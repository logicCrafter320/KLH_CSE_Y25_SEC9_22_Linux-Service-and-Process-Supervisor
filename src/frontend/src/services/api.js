import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attaches API Key
api.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('api_key') || process.env.REACT_APP_API_KEY;
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    console.error('API Error:', message);
    return Promise.reject({ message, status: error.response?.status });
  }
);

// Services API
export const servicesAPI = {
  getAll: () => api.get('/services'),
  getDetail: (name) => api.get(`/services/${name}`),
  control: (name, action) => api.post(`/services/${name}/control`, { action }),
  search: (query) => api.get(`/services/search?q=${query}`)
};

// Processes API
export const processesAPI = {
  getAll: (sortBy = 'cpu', limit = 50) => api.get(`/processes?sortBy=${sortBy}&limit=${limit}`),
  getDetail: (pid) => api.get(`/processes/${pid}`),
  kill: (pid, signal = 'SIGTERM') => api.post(`/processes/${pid}/kill`, { signal }),
  getSummary: () => api.get('/processes/summary'),
  getTree: () => api.get('/processes/tree')
};

// System API
export const systemAPI = {
  getInfo: () => api.get('/system'),
  getCpuLoad: () => api.get('/system/cpu'),
  getMemory: () => api.get('/system/memory'),
  getNetwork: () => api.get('/system/network')
};

// Logs API
export const logsAPI = {
  getJournal: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/logs?${query}`);
  },
  getUnits: () => api.get('/logs/units'),
  getDmesg: (lines = 50) => api.get(`/logs/dmesg?lines=${lines}`)
};

export default api;