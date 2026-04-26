import axios from 'axios';

// Set base URL for all API requests
// In development (empty string): uses Vite proxy configured in vite.config.js
// In production: uses full backend URL from VITE_API_URL environment variable
const API_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'https://nexora-backend-2zw6.onrender.com') 
  : '';

// Configure axios instance
const instance = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add JWT token to headers
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
export { API_URL };
