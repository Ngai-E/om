import axios from 'axios';
import { handleApiError } from './error-handler';
import { getTenantSlug } from '../tenant';
import AuthGuard from '../auth/auth-guard';
import AuthRecovery from '../auth/auth-recovery';

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

// Request interceptor to add auth token and tenant context
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if we're on platform port (3000) - don't send tenant slug
    const isPlatform = typeof window !== 'undefined' && window.location.port === '3000';
    
    // Add tenant slug header for multi-tenancy (only for tenant app)
    if (!isPlatform) {
      config.headers['X-Tenant-Slug'] = getTenantSlug();
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
  async (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';

      // Don't retry auth endpoints (login, register, etc.) - they're supposed to return 401 on failure
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
                            requestUrl.includes('/auth/register') ||
                            requestUrl.includes('/auth/refresh');

      if (!isAuthEndpoint) {
        // Try automatic recovery for non-auth endpoints
        const recovered = await AuthRecovery.handleAuthError(error);

        if (recovered) {
          console.log('✅ Auth error automatically recovered, retrying request...');
          // Retry the original request with fresh auth
          return apiClient.request(error.config);
        }
      }

      // Auth endpoint failed or recovery failed - handle normally
      const authError = AuthGuard.handleAuthError(error);
      console.error('Authentication error:', AuthGuard.getErrorMessage(authError));
    } else if (globalErrorHandler) {
      // Call global error handler for other errors
      const apiError = handleApiError(error);
      globalErrorHandler(apiError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
