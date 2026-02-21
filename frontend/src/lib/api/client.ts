import axios from 'axios';
import { handleApiError } from './error-handler';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// Global error handler for displaying errors
let globalErrorHandler: ((error: any) => void) | null = null;

export function setGlobalErrorHandler(handler: (error: any) => void) {
  globalErrorHandler = handler;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (globalErrorHandler) {
      // Call global error handler for other errors
      const apiError = handleApiError(error);
      globalErrorHandler(apiError);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
