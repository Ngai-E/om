/**
 * Automatic Authentication Recovery System
 * 
 * This system automatically detects and fixes authentication issues
 * without requiring any user intervention or browser data clearing.
 */

// Notification system is now handled by the container component

interface AuthState {
  token: string | null;
  user: any | null;
  tenantId: string | null;
  lastValidCheck: number;
  isValid: boolean;
}

interface RecoveryAction {
  type: 'CLEAR_TOKEN' | 'CLEAR_USER' | 'CLEAR_ALL' | 'REFRESH_TENANT' | 'REVALIDATE_SESSION';
  description: string;
  criticality: 'low' | 'medium' | 'high';
}

export class AuthRecovery {
  private static readonly STORAGE_KEY = 'auth_recovery_state';
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_FAILURES = 3;
  private static readonly RECOVERY_COOLDOWN = 30 * 1000; // 30 seconds

  private static failureCount = 0;
  private static lastRecoveryAttempt = 0;
  private static isRecovering = false;

  /**
   * Initialize automatic recovery system
   */
  static initialize(): void {
    if (typeof window === 'undefined') return;

    // NOTE: periodic health check is disabled. It polled relative URLs
    // (`/api/auth/health`, `/api/auth/validate`, `/api/auth/refresh`) that
    // do not exist on the Next.js frontend, generating 404s every 5 min.
    // Recovery already runs on demand from the axios response interceptor
    // when a real 401 occurs, so the poller adds nothing.

    // Listen for storage changes (other tabs)
    window.addEventListener('storage', this.handleStorageChange.bind(this));

    // Listen for online/offline events
    window.addEventListener('online', this.handleConnectionChange.bind(this));
    window.addEventListener('offline', this.handleConnectionChange.bind(this));
  }

  /**
   * Handle authentication errors automatically
   */
  static async handleAuthError(error: any): Promise<boolean> {
    if (this.isRecovering) {
      console.log('🔄 Recovery already in progress, waiting...');
      return false;
    }

    const errorType = this.classifyError(error);
    console.log(`🔍 Auth error detected: ${errorType}`);

    try {
      this.isRecovering = true;
      const recovered = await this.performRecovery(errorType);
      
      if (recovered) {
        console.log('✅ Automatic recovery successful');
        this.showNotification('recovery-success', 'Your session has been automatically restored. You can continue using the app.');
        this.failureCount = 0;
        return true;
      } else {
        console.log('❌ Automatic recovery failed, manual intervention needed');
        this.showNotification('recovery-failed', 'We couldn\'t restore your session automatically. Please login again to continue.');
        this.failureCount++;
        return false;
      }
    } catch (recoveryError) {
      console.error('💥 Recovery system error:', recoveryError);
      this.failureCount++;
      return false;
    } finally {
      this.isRecovering = false;
      this.lastRecoveryAttempt = Date.now();
    }
  }

  /**
   * Classify the type of authentication error
   */
  private static classifyError(error: any): string {
    if (!error.response) {
      return 'NETWORK_ERROR';
    }

    const status = error.response.status;
    const message = error.response.data?.message || '';

    if (status === 401) {
      if (message.includes('expired') || message.includes('token')) {
        return 'TOKEN_EXPIRED';
      } else if (message.includes('user') || message.includes('not found')) {
        return 'USER_NOT_FOUND';
      } else {
        return 'UNAUTHORIZED';
      }
    } else if (status === 403) {
      return 'FORBIDDEN';
    } else if (status === 404) {
      return 'NOT_FOUND';
    }

    return 'UNKNOWN';
  }

  /**
   * Perform automatic recovery based on error type
   */
  private static async performRecovery(errorType: string): Promise<boolean> {
    const actions = this.getRecoveryActions(errorType);
    
    for (const action of actions) {
      console.log(`🔧 Attempting recovery: ${action.description}`);
      
      try {
        const success = await this.executeRecoveryAction(action);
        if (success) {
          console.log(`✅ Recovery action succeeded: ${action.description}`);
          return true;
        }
      } catch (actionError) {
        console.warn(`⚠️ Recovery action failed: ${action.description}`, actionError);
      }
    }

    return false;
  }

  /**
   * Get recovery actions for specific error type
   */
  private static getRecoveryActions(errorType: string): RecoveryAction[] {
    switch (errorType) {
      case 'TOKEN_EXPIRED':
        return [
          {
            type: 'CLEAR_TOKEN',
            description: 'Clear expired token and attempt silent refresh',
            criticality: 'high'
          },
          {
            type: 'REVALIDATE_SESSION',
            description: 'Revalidate session with refresh token',
            criticality: 'high'
          }
        ];

      case 'USER_NOT_FOUND':
        return [
          {
            type: 'CLEAR_ALL',
            description: 'Clear all auth data and reset session',
            criticality: 'high'
          },
          {
            type: 'REFRESH_TENANT',
            description: 'Refresh tenant context',
            criticality: 'medium'
          }
        ];

      case 'UNAUTHORIZED':
        return [
          {
            type: 'CLEAR_TOKEN',
            description: 'Clear invalid token',
            criticality: 'high'
          }
        ];

      case 'NETWORK_ERROR':
        return [
          {
            type: 'REVALIDATE_SESSION',
            description: 'Retry session validation when connection restored',
            criticality: 'medium'
          }
        ];

      default:
        return [
          {
            type: 'CLEAR_ALL',
            description: 'Reset all auth data as fallback',
            criticality: 'medium'
          }
        ];
    }
  }

  /**
   * Execute a specific recovery action
   */
  private static async executeRecoveryAction(action: RecoveryAction): Promise<boolean> {
    switch (action.type) {
      case 'CLEAR_TOKEN':
        return this.clearToken();
      
      case 'CLEAR_USER':
        return this.clearUser();
      
      case 'CLEAR_ALL':
        return this.clearAll();
      
      case 'REFRESH_TENANT':
        return this.refreshTenantContext();
      
      case 'REVALIDATE_SESSION':
        return this.revalidateSession();
      
      default:
        return false;
    }
  }

  /**
   * Clear only the token, preserve other data
   */
  private static async clearToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Nothing to recover from.
        return false;
      }

      const refreshToken = localStorage.getItem('refreshToken');

      // ONLY delete the access token if we actually have a refresh token
      // to swap it for. Otherwise we'd silently log the user out (token
      // wiped from localStorage, axios interceptor stops sending the
      // Authorization header) while the persisted auth-store still says
      // "authenticated" — the UI lies and every subsequent request 401s.
      if (refreshToken) {
        console.log('🗑️ Clearing access token, attempting refresh');
        localStorage.removeItem('token');
        return await this.attemptTokenRefresh(refreshToken);
      }

      // No recovery possible. Leave the token in place; the response
      // interceptor will surface the error normally and the user can
      // log in again deliberately.
      return false;
    } catch (error) {
      console.error('Failed to clear token:', error);
      return false;
    }
  }

  /**
   * Clear user data only
   */
  private static async clearUser(): Promise<boolean> {
    try {
      console.log('🗑️ Clearing user data');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Failed to clear user:', error);
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  private static async clearAll(): Promise<boolean> {
    try {
      console.log('🗑️ Clearing all auth data');
      const keysToRemove = ['token', 'user', 'refreshToken', 'tenant-branding-cache'];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      
      // Reset auth store if available
      if (typeof window !== 'undefined' && (window as any).authStore) {
        (window as any).authStore.clearAuth();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear all auth data:', error);
      return false;
    }
  }

  /**
   * Refresh tenant context
   */
  private static async refreshTenantContext(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing tenant context');
      
      // Clear tenant branding cache
      localStorage.removeItem('tenant-branding-cache');
      
      // Trigger tenant revalidation
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tenant-context-refresh'));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to refresh tenant context:', error);
      return false;
    }
  }

  /**
   * Attempt to revalidate session
   */
  private static async revalidateSession(): Promise<boolean> {
    try {
      console.log('🔍 Revalidating session');
      
      // This would call your auth validation endpoint
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          console.log('✅ Session is valid');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Attempt token refresh
   */
  private static async attemptTokenRefresh(refreshToken: string): Promise<boolean> {
    try {
      console.log('🔄 Attempting token refresh');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        console.log('✅ Token refresh successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private static startHealthCheck(): void {
    setInterval(() => {
      this.checkAuthHealth();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Check authentication health
   */
  private static async checkAuthHealth(): Promise<void> {
    if (this.isRecovering) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Validate token with a lightweight request
      const response = await fetch('/api/auth/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log('⚠️ Auth health check failed, initiating recovery');
        await this.handleAuthError({ response: { status: response.status } });
      }
    } catch (error) {
      console.log('⚠️ Auth health check error, may need recovery');
    }
  }

  /**
   * Handle storage changes from other tabs
   */
  private static handleStorageChange(event: StorageEvent): void {
    if (event.key === 'token' && !event.newValue) {
      // Token was cleared in another tab
      console.log('🔄 Token cleared in another tab, syncing state');
      this.clearUser();
    }
  }

  /**
   * Handle connection changes
   */
  private static handleConnectionChange(): void {
    if (navigator.onLine) {
      console.log('🌐 Connection restored, checking auth state');
      setTimeout(() => this.checkAuthHealth(), 1000);
    }
  }

  /**
   * Get recovery statistics
   */
  static getStats(): {
    failureCount: number;
    lastRecoveryAttempt: number;
    isRecovering: boolean;
  } {
    return {
      failureCount: this.failureCount,
      lastRecoveryAttempt: this.lastRecoveryAttempt,
      isRecovering: this.isRecovering,
    };
  }

  /**
   * Show notification to user
   */
  private static showNotification(type: 'recovery-success' | 'recovery-failed' | 'session-expired', message: string): void {
    if (typeof window !== 'undefined' && (window as any).addAuthNotification) {
      (window as any).addAuthNotification(type, message);
    } else {
      // Fallback: dispatch custom event
      window.dispatchEvent(new CustomEvent('auth-notification', {
        detail: { type, message }
      }));
    }
  }

  /**
   * Reset recovery state (call after successful manual login)
   */
  static reset(): void {
    this.failureCount = 0;
    this.lastRecoveryAttempt = 0;
    this.isRecovering = false;
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  AuthRecovery.initialize();
}

export default AuthRecovery;
