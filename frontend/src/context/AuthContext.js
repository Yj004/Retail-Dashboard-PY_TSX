import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setUser({ username: 'admin' });
    }
    setLoading(false);
  }, []);

  // Use the real login function from API
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiLogin(username || 'admin', password || 'password123');
      
      if (data && data.access_token) {
        localStorage.setItem('token', data.access_token);
        setIsAuthenticated(true);
        setUser({ username: username || 'admin' });
        return true;
      } else {
        setError('Authentication failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Real logout that clears the token
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 