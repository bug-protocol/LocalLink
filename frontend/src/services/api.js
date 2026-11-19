import axios from 'axios';

/**
 * API Configuration
 * Centralized axios instance with interceptors
 */

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized) - only redirect for protected requests, not login attempts
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Do not force-redirect if we are already logging in or registering
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthEndpoint && !isAuthPage) {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        response: {
          data: {
            message: 'Network error. Please check your connection.'
          }
        }
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;