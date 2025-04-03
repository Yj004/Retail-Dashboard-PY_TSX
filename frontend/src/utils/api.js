import axios from 'axios';

// Create an instance of axios with a base URL
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Add a request interceptor to include the auth token in all requests
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

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions

// Data fetching
export const fetchData = async (skip = 0, limit = 100) => {
  const response = await api.get(`/data?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const fetchFilteredData = async (filters, skip = 0, limit = 100) => {
  const params = { skip, limit, ...filters };
  const response = await api.get('/data/filter', { params });
  return response.data;
};

export const fetchStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const fetchColumns = async () => {
  const response = await api.get('/columns');
  return response.data;
};

export const fetchFilterOptions = async () => {
  const response = await api.get('/filter-options');
  return response.data;
};

// Add column
export const addColumn = async (columnName, defaultValue = '') => {
  const response = await api.post('/data/add-column', {
    column_name: columnName,
    default_value: defaultValue,
  });
  return response.data;
};

export default api; 