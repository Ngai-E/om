import axios from 'axios';
import { handleApiError } from './error-handler';
import { getTenantSlug } from '../tenant';
import AuthGuard from '../auth/auth-guard';
import AuthRecovery from '../auth/auth-recovery';
import { useAuthStore } from '../store/auth-store';

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
    // Read the access token from the Zustand auth store, which is the single
    // source of truth (persisted under `auth-storage`). Earlier code read a
    // separate `token` key that could be wiped independently of the store,
    // causing the UI to look "logged in" while every request went without
    // Authorization header.
    const token =
      typeof window !== 'undefined'
        ? useAuthStore.getState().token
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Determine whether this client is running inside the platform app
    // (landing/marketplace/console) — those requests must NOT carry a tenant slug.
    // In production this is controlled by the explicit NEXT_PUBLIC_IS_PLATFORM flag;
    // the dev-only fallback treats localhost:3000 as platform.
    const isPlatform =
      process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' ||
      (typeof window !== 'undefined' && window.location.port === '3000');

    if (!isPlatform) {
      const slug = getTenantSlug();
      if (slug) {
        config.headers['X-Tenant-Slug'] = slug;
      }
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

      // Per-request retry guard: every request gets AT MOST one auto-recovery
      // retry. Without this, an interceptor that keeps reporting "recovered"
      // can put us in an infinite 401 loop (freezes the browser).
      const alreadyRetried = (error.config as any)?.__authRetried === true;

      if (!isAuthEndpoint && !alreadyRetried) {
        // Try automatic recovery for non-auth endpoints
        const recovered = await AuthRecovery.handleAuthError(error);

        if (recovered) {
          console.log('✅ Auth error automatically recovered, retrying request...');
          // Mark the config so a second 401 on the retry doesn't loop.
          (error.config as any).__authRetried = true;
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
