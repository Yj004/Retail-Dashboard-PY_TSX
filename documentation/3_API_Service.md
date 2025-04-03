# API Service

## Overview

The `api.js` file located in the `frontend/src/utils` directory serves as the central hub for all API communication in the application. It handles API requests, authentication, and error handling.

## Code Structure and Functionality

### API Instance Configuration

```javascript
import axios from 'axios';

// Create an instance of axios with a base URL
const api = axios.create({
  baseURL: 'http://localhost:8000',
});
```

The file creates a configured axios instance with:
- A base URL pointing to the backend server
- Default configuration shared across all API requests

### Authentication Interceptors

```javascript
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
```

The interceptors:
1. **Request Interceptor**: Automatically adds the JWT authentication token from localStorage to each request header
2. **Response Interceptor**: Handles authentication errors (401 status) by clearing the token and redirecting to the login page

### API Functions

```javascript
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
```

The file exports several API functions:

1. **fetchData**: Retrieves paginated data records
2. **fetchFilteredData**: Retrieves data with applied filters
3. **fetchStats**: Gets aggregated statistics for the dashboard
4. **fetchColumns**: Retrieves available data columns
5. **fetchFilterOptions**: Gets available filter options
6. **addColumn**: Adds a new column to the dataset

## Usage Flow

1. **Import Functions**: Components import the required API functions
   ```javascript
   import { fetchStats, fetchFilterOptions } from '../utils/api';
   ```

2. **Call Functions**: Components call the functions, usually in useEffect hooks or event handlers
   ```javascript
   useEffect(() => {
     const loadData = async () => {
       try {
         const statsData = await fetchStats();
         setStats(statsData);
       } catch (error) {
         setError('Failed to load data');
       }
     };
     
     loadData();
   }, []);
   ```

3. **Handle Responses**: Components handle the returned data and any errors
   ```javascript
   try {
     const response = await fetchFilteredData(filters);
     setData(response);
   } catch (error) {
     console.error('Error fetching filtered data:', error);
     setError('Failed to load filtered data');
   }
   ```

## Error Handling

The API service handles errors at multiple levels:

1. **Global Interceptors**: Handle authentication errors automatically
2. **Function-Level Rejections**: Propagate errors to calling components
3. **Component-Level Try/Catch**: Components implement specific error handling logic

This multi-layered approach ensures robust error handling throughout the application.

## Benefits

1. **Centralization**: All API logic is centralized in one file
2. **Authentication**: Automatic token management for all requests
3. **Consistency**: Standardized error handling
4. **Reusability**: Functions can be imported and used across components
5. **Maintainability**: API changes only need to be updated in one place 