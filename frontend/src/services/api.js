import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

// Intercept requests and attach Bearer token.
// IMPORTANT: must read the same key authContext.jsx writes to
// (TOKEN_STORAGE_KEY = 'school_sms_token'), not a hardcoded 'token' —
// otherwise every request silently goes out unauthenticated.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Clear stale token if rejected with 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export default api;