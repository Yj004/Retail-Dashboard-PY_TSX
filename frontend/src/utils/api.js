import axios from 'axios';

// Create an instance of axios with a base URL that works for both development and production
const isProduction = process.env.NODE_ENV === 'production';
const api = axios.create({
  baseURL: isProduction ? '/api' : 'http://localhost:3001/api',
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
    console.error('API Error:', error);
    
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
    const response = await api.post('/token', 
      `username=admin&password=password123`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      console.log('Silent login successful');
      return true;
    }
  } catch (error) {
    console.error('Silent login failed:', error);
  }
  return false;
};

// Data fetching
export const fetchData = async (skip = 0, limit = 100) => {
  try {
    const endpoint = `/data?skip=${skip}&limit=${limit}`;
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
    const endpoint = '/data/filter';
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered data:', error);
    throw error;
  }
};

export const fetchStats = async () => {
  try {
    const endpoint = '/stats';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export const fetchColumns = async () => {
  try {
    const endpoint = '/columns';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching columns:', error);
    throw error;
  }
};

export const fetchFilterOptions = async () => {
  try {
    const endpoint = '/filter-options';
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
    const endpoint = '/data/add-column';
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
    const response = await api.post('/token', 
      `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      return response.data;
    }
    
    throw new Error('Invalid response from authentication server');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Initialize authentication on app load
loginSilently();

export default api; 