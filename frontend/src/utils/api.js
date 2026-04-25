import axios from 'axios';

// Set base URL for all API requests
// In development (empty string): uses Vite proxy configured in vite.config.js
// In production: uses full backend URL from VITE_API_URL environment variable
const API_URL = import.meta.env.VITE_API_URL || '';

// Configure axios instance
axios.defaults.baseURL = API_URL;

export default axios;
export { API_URL };
