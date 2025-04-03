# App Component and Authentication Flow

## App.js

The `App.js` file serves as the main entry point for the React application, defining the routing structure and authentication protection for routes.

### Purpose
- Defines the application routes
- Implements protected routes requiring authentication
- Manages redirection based on authentication state

### Code Structure

```jsx
import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataTable from './pages/DataTable';
import Settings from './pages/Settings';
import { Box, CircularProgress } from '@mui/material';
```

The component imports necessary dependencies:
- React Router components for navigation
- AuthContext for authentication state
- Page components
- Material UI components for UI elements

### Protected Routes System

```jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login with the intended route
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected content
  return children;
};
```

The `ProtectedRoute` component:
- Uses the AuthContext to check if the user is authenticated
- Displays a loading spinner while verifying authentication
- Redirects unauthenticated users to the login page with the original destination stored in location state
- Renders the requested route content if authenticated

### Route Configuration

```jsx
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/data"
        element={
          <ProtectedRoute>
            <DataTable />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      {/* Fallback route for any other path */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

The route configuration:
- Defines a public `/login` route
- Wraps all other routes with the `ProtectedRoute` component
- Redirects the root path and unknown paths to the dashboard
- Sets up dedicated routes for the dashboard, data table, and settings pages

## Authentication Context

The authentication system is managed through a React context provider in `./context/AuthContext.js`.

### Key Features

1. **JWT Token Management**:
   - Stores authentication tokens in localStorage
   - Includes token in API requests
   - Handles token expiration

2. **Authentication State**:
   - Tracks whether a user is authenticated
   - Manages loading state during authentication checks
   - Stores current user information

3. **Authentication Actions**:
   - Login functionality (sends credentials, stores token)
   - Logout functionality (clears token, redirects to login)
   - Token validation

### Authentication Flow

1. User attempts to access a protected route
2. App checks for existing token in localStorage
3. If token exists, validates it with backend
4. If token is valid, user proceeds to requested route
5. If token is invalid or missing, user is redirected to login
6. After successful login, user is redirected to originally requested route

This authentication system ensures that only authenticated users can access protected parts of the application while providing a smooth user experience with appropriate loading states and redirects. 