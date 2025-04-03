import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Set the authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      // You could also validate the token here by making a request to the API
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create form data for token endpoint
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axios.post('/token', formData);
      const { access_token } = response.data;
      
      // Save token to local storage
      localStorage.setItem('token', access_token);
      
      // Set the authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser({ username });
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
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