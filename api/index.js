// Node.js backend for the Retail Dashboard
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET_KEY || "your-secure-jwt-secret-change-in-production";
const TOKEN_EXPIRE_TIME = '30m';

// Store data in memory
let shopifyData = [];

// Load data function
async function loadData() {
  try {
    const results = [];
    
    console.log('Fetching data from GitHub...');
    
    // Fetch data from GitHub
    const response = await fetch('https://raw.githubusercontent.com/Yj004/Retail-Dashboard-PY_TSX/main/Data/retail_data.csv');
    const csvText = await response.text();
    
    console.log('Successfully fetched data from GitHub.');
    
    // Parse CSV data
    const rows = csvText.split('\n');
    const headers = rows[0].split(',');
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim() === '') continue;
      
      const values = rows[i].split(',');
      const rowData = {};
      
      headers.forEach((header, index) => {
        rowData[header.trim()] = values[index] ? values[index].trim() : '';
      });
      
      results.push(rowData);
    }
    
    // Process data - convert string values to appropriate types
    for (const row of results) {
      // Convert Date to standard format if needed
      if (row.Date) {
        if (row.Date.includes('/')) {
          const parts = row.Date.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // months are 0-indexed in JS
            const year = parseInt(parts[2]);
            row.Date = new Date(year, month, day).toISOString().split('T')[0];
          }
        }
        // Already in YYYY-MM-DD format, no action needed
      }
      
      // Convert Total and Quantity to numbers
      if (row.Total) {
        row.Total = parseFloat(row.Total) || 0;
      }
      
      if (row.Quantity) {
        row.Quantity = parseInt(row.Quantity) || 0;
      }
    }
    
    console.log(`Loaded ${results.length} records`);
    return results;
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
}

// Initial data load (optional for Vercel - will be loaded on-demand)
loadData().then(data => {
  shopifyData = data;
}).catch(err => {
  console.error('Failed to load initial data:', err);
});

// User authentication
const users = {
  admin: {
    username: 'admin',
    full_name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123', // Simple plain text for testing
    disabled: false
  }
};

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

// Helper function to ensure data is loaded
async function ensureDataLoaded(req, res, next) {
  if (shopifyData.length === 0) {
    console.log('No data loaded, loading now...');
    try {
      shopifyData = await loadData();
    } catch (error) {
      console.error('Error loading data in middleware:', error);
    }
  }
  next();
}

// Routes
app.get('/api', (req, res) => {
  console.log('Root endpoint hit');
  res.json({ message: 'Welcome to the Retail Dashboard API' });
});

app.get('/api/hello', (req, res) => {
  console.log('Hello endpoint hit');
  res.json({ message: 'Hello from the API server!' });
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({
    status: 'success',
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    auth_url: '/api/token',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication endpoint
app.post('/api/token', (req, res) => {
  console.log('Authentication request received');
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  
  // Accept both application/json and form data
  let username, password;
  
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    // JSON data
    username = req.body.username;
    password = req.body.password;
  } else {
    // Form data
    username = req.body.username;
    password = req.body.password;
  }
  
  console.log(`Extracted credentials - Username: ${username}, Password: ${password}`);
  
  if (!username || !password) {
    console.log('Missing username or password');
    return res.status(400).json({ detail: 'Username and password are required' });
  }
  
  const user = users[username];
  
  if (!user) {
    console.log(`User not found: ${username}`);
    return res.status(401).json({ detail: 'Incorrect username or password' });
  }
  
  console.log(`Comparing password for user: ${username}, received password: ${password}, stored password: ${user.password}`);
  
  // Simple direct password comparison for testing
  const passwordMatch = (password === user.password);
  
  if (!passwordMatch) {
    console.log('Password does not match');
    return res.status(401).json({ detail: 'Incorrect username or password' });
  }
  
  // Generate token
  const token = jwt.sign({ sub: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRE_TIME });
  
  console.log('Auth successful, sending token');
  res.json({ access_token: token, token_type: 'bearer' });
});

// Secured routes below - use the authenticate middleware
// Get paginated data
app.get('/api/data', ensureDataLoaded, authenticate, (req, res) => {
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 100;
  
  const paginatedData = shopifyData.slice(skip, skip + limit);
  
  res.json(paginatedData);
});

// Get stats
app.get('/api/stats', ensureDataLoaded, authenticate, (req, res) => {
  try {
    const data = shopifyData;
    
    // Basic stats
    const total_records = data.length;
    const total_sales = data.reduce((sum, item) => sum + item.Total, 0);
    const total_quantity = data.reduce((sum, item) => sum + item.Quantity, 0);
    
    // Calculate average order value
    const avg_order_value = total_records > 0 ? total_sales / total_records : 0;
    
    // Monthly data
    const monthlyData = {};
    const monthlyOrderCounts = {};
    const monthlyAvgValues = {};
    
    data.forEach(item => {
      if (item.Date) {
        const month = item.Date.substring(0, 7); // YYYY-MM format
        
        // Monthly sales
        if (!monthlyData[month]) {
          monthlyData[month] = 0;
        }
        monthlyData[month] += item.Total;
        
        // Monthly order counts
        if (!monthlyOrderCounts[month]) {
          monthlyOrderCounts[month] = 0;
        }
        monthlyOrderCounts[month] += 1;
        
        // For average value calculation
        if (!monthlyAvgValues[month]) {
          monthlyAvgValues[month] = { total: 0, count: 0 };
        }
        monthlyAvgValues[month].total += item.Total;
        monthlyAvgValues[month].count += 1;
      }
    });
    
    const monthly_sales = Object.entries(monthlyData).map(([Month, Total]) => ({ Month, Total }))
      .sort((a, b) => a.Month.localeCompare(b.Month));
    
    const monthly_orders = Object.entries(monthlyOrderCounts).map(([Month, count]) => ({ Month, count }))
      .sort((a, b) => a.Month.localeCompare(b.Month));
    
    const monthly_avg = Object.entries(monthlyAvgValues).map(([Month, { total, count }]) => ({
      Month,
      avg_value: count > 0 ? parseFloat((total / count).toFixed(2)) : 0,
      order_count: count
    })).sort((a, b) => a.Month.localeCompare(b.Month));
    
    // Count statistics
    const countByField = (field) => {
      const counts = {};
      data.forEach(item => {
        if (item[field]) {
          const value = item[field].toString();
          counts[value] = (counts[value] || 0) + 1;
        }
      });
      return counts;
    };
    
    const sumByField = (groupField, sumField) => {
      const sums = {};
      data.forEach(item => {
        if (item[groupField] && item[sumField] !== undefined) {
          const value = item[groupField].toString();
          sums[value] = (sums[value] || 0) + item[sumField];
        }
      });
      return sums;
    };
    
    const avgByField = (groupField, avgField) => {
      const totals = {};
      const counts = {};
      
      data.forEach(item => {
        if (item[groupField] && item[avgField] !== undefined) {
          const value = item[groupField].toString();
          totals[value] = (totals[value] || 0) + item[avgField];
          counts[value] = (counts[value] || 0) + 1;
        }
      });
      
      const avgs = {};
      Object.keys(totals).forEach(key => {
        avgs[key] = counts[key] > 0 ? totals[key] / counts[key] : 0;
      });
      
      return avgs;
    };
    
    const status_counts = countByField('Status');
    const delivery_status_counts = countByField('Deliver Status');
    const country_counts = countByField('Shipping Country');
    const state_counts = countByField('State');
    const payment_method_counts = countByField('Payment Method');
    
    const state_values = sumByField('State', 'Total');
    const avg_quantity_by_state = avgByField('State', 'Quantity');
    
    // Top SKUs
    const sku_counts = countByField('SKU');
    const top_skus = Object.entries(sku_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    res.json({
      // KPIs
      total_records,
      total_sales,
      total_quantity,
      avg_order_value,
      
      // State breakdown
      state_counts,
      state_values,
      avg_quantity_by_state,
      
      // Other categorical breakdowns
      status_counts,
      delivery_status_counts,
      country_counts,
      payment_method_counts,
      
      // Time series data
      monthly_sales,
      monthly_orders,
      monthly_avg_values: monthly_avg,
      
      // Product data
      top_skus
    });
  } catch (error) {
    console.error('Error in stats:', error);
    res.status(500).json({ detail: `Error generating stats: ${error.message}` });
  }
});

// Filter data
app.get('/api/data/filter', ensureDataLoaded, authenticate, (req, res) => {
  try {
    const {
      status, delivery_status, country, province, state, payment_method,
      from_date, to_date, min_total, max_total, skip, limit
    } = req.query;
    
    let filtered = [...shopifyData];
    
    // Apply filters
    if (status && status !== 'All') {
      filtered = filtered.filter(item => item.Status === status);
    }
    
    if (delivery_status && delivery_status !== 'All') {
      filtered = filtered.filter(item => item['Deliver Status'] === delivery_status);
    }
    
    if (country && country !== 'All') {
      filtered = filtered.filter(item => item['Shipping Country'] === country);
    }
    
    if (province && province !== 'All') {
      filtered = filtered.filter(item => item['Shipping Province'] === province);
    }
    
    if (state && state !== 'All') {
      filtered = filtered.filter(item => item.State === state);
    }
    
    if (payment_method && payment_method !== 'All') {
      filtered = filtered.filter(item => item['Payment Method'] === payment_method);
    }
    
    if (min_total !== undefined) {
      const minValue = parseFloat(min_total);
      filtered = filtered.filter(item => item.Total >= minValue);
    }
    
    if (max_total !== undefined) {
      const maxValue = parseFloat(max_total);
      filtered = filtered.filter(item => item.Total <= maxValue);
    }
    
    if (from_date) {
      filtered = filtered.filter(item => item.Date >= from_date);
    }
    
    if (to_date) {
      filtered = filtered.filter(item => item.Date <= to_date);
    }
    
    // Pagination
    const skipVal = parseInt(skip) || 0;
    const limitVal = parseInt(limit) || 100;
    
    const paginatedData = filtered.slice(skipVal, skipVal + limitVal);
    
    res.json(paginatedData);
  } catch (error) {
    console.error('Error filtering data:', error);
    res.status(500).json({ detail: `Error filtering data: ${error.message}` });
  }
});

// Get columns
app.get('/api/columns', ensureDataLoaded, authenticate, (req, res) => {
  if (shopifyData.length === 0) {
    return res.json([]);
  }
  
  const columns = Object.keys(shopifyData[0]);
  res.json(columns);
});

// Get filter options
app.get('/api/filter-options', ensureDataLoaded, authenticate, (req, res) => {
  try {
    const data = shopifyData;
    const options = {};
    
    const categorical_columns = [
      'Status', 'Deliver Status', 'Shipping Country', 
      'Shipping Province', 'Payment Method', 'Risk Level', 'State'
    ];
    
    categorical_columns.forEach(col => {
      if (data.some(item => item[col])) {
        // Get unique non-empty values
        const values = [...new Set(
          data
            .filter(item => item[col] && item[col].toString().trim() !== '')
            .map(item => item[col].toString().trim())
        )];
        
        options[col] = ['All', ...values];
      }
    });
    
    res.json(options);
  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({ detail: `Error getting filter options: ${error.message}` });
  }
});

// For local development only
if (process.env.NODE_ENV !== 'production') {
  app.listen(3001, () => {
    console.log('Server running on port 3001');
  });
}

// Export the Express API for Vercel
module.exports = app; 