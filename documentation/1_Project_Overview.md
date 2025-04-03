# Shopify Admin Dashboard - Project Documentation

## Project Overview

The Shopify Admin Dashboard is a web application designed to provide administrators with comprehensive insights into Shopify sales data. The application features interactive charts, data filtering capabilities, and detailed analytics to help users understand sales performance.

## Project Structure

The project follows a standard client-server architecture:

- **Frontend**: React application with Material UI components
- **Backend**: FastAPI server that processes data and provides API endpoints
- **Data**: CSV data source containing Shopify order information

### Directory Structure

```
admin_shopify_dashboard/
│
├── frontend/                 # React client application
│   ├── public/               # Static assets
│   └── src/                  # React source code
│       ├── assets/           # Images and static resources
│       ├── components/       # Reusable UI components
│       ├── context/          # React context providers
│       ├── pages/            # Main application views
│       └── utils/            # Helper functions and API services
│
├── backend/                  # FastAPI server
│   ├── main.py              # Main server application
│   └── requirements.txt     # Python dependencies
│
└── Data/                     # Data source files
    └── shopify.csv           # Sample Shopify order data
```

## Key Features

1. **Authentication System**: Secure login with JWT token-based authentication
2. **Interactive Dashboard**: Visualizations of sales data, including:
   - Monthly sales trends
   - Average order value trends
   - Sales by state
   - Top products by order count
   - Order status distribution
3. **Advanced Filtering**: Filter data by:
   - Order status
   - Delivery status
   - State
   - Payment method
   - Date range
4. **Data Table**: Detailed view of all order records with sorting and filtering
5. **Settings Page**: Configure application preferences

## Technology Stack

- **Frontend**:
  - React
  - Material UI
  - Chart.js
  - Axios for API requests
  - React Router for navigation

- **Backend**:
  - FastAPI
  - Pandas for data processing
  - JWT for authentication
  - CORS middleware for cross-origin requests

## Application Flow

1. User authenticates through the login page
2. Upon successful login, user is redirected to the dashboard
3. Dashboard loads data from the backend API
4. User can view visualizations, apply filters, and navigate to other pages
5. Data is refreshed when filters are applied or refresh buttons are clicked

This documentation provides details on each component of the application, the code structure, and the implementation of key features. 