import axios from 'axios';

// Create an instance of axios with a base URL that works for both development and production
const isProduction = process.env.NODE_ENV === 'production';
const api = axios.create({
  baseURL: isProduction ? '/api' : 'http://localhost:8000',
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

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token might be expired, redirect to login
      console.log('Authentication error, redirecting to login');
      // For this demo, we'll just try to get a new token automatically
      loginSilently();
    }
    return Promise.reject(error);
  }
);

// Login silently in case of auth errors
const loginSilently = async () => {
  try {
    const response = await api.post('/api/token', 
      `username=admin&password=password123`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
  } catch (error) {
    console.error('Silent login failed:', error);
  }
};

// API functions

// Data fetching
export const fetchData = async (skip = 0, limit = 100) => {
  try {
    const endpoint = `/api/data?skip=${skip}&limit=${limit}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const fetchFilteredData = async (filters, skip = 0, limit = 100) => {
  try {
    const params = { skip, limit, ...filters };
    const endpoint = '/api/data/filter';
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered data:', error);
    throw error;
  }
};

export const fetchStats = async () => {
  try {
    const endpoint = '/api/stats';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export const fetchColumns = async () => {
  try {
    const endpoint = '/api/columns';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching columns:', error);
    throw error;
  }
};

export const fetchFilterOptions = async () => {
  try {
    const endpoint = '/api/filter-options';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

// Add column
export const addColumn = async (columnName, defaultValue = '') => {
  try {
    const endpoint = '/api/data/add-column';
    const response = await api.post(endpoint, {
      column_name: columnName,
      default_value: defaultValue,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  }
};

// Updated login function that actually authenticates with the backend
export const login = async (username = 'admin', password = 'password123') => {
  try {
    const response = await api.post('/api/token', 
      `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Initialize authentication on app load
loginSilently();

export default api; 