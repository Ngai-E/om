/**
 * Authentication Guard - Prevents infinite login loops
 * 
 * This service handles authentication errors gracefully and prevents
 * infinite redirect loops that can occur when authentication fails.
 */

interface AuthError {
  code: 'TOKEN_EXPIRED' | 'INVALID_TOKEN' | 'USER_NOT_FOUND' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  shouldRedirect: boolean;
}

export class AuthGuard {
  private static redirectAttempts = 0;
  private static maxRedirectAttempts = 2;
  private static lastRedirectTime = 0;
  private static redirectCooldown = 5000; // 5 seconds

  /**
   * Handle 401 authentication errors safely
   */
  static handleAuthError(error: any): AuthError {
    const now = Date.now();
    
    // Detect potential infinite loop
    if (this.isInfiniteLoopDetected(now)) {
      console.warn('🔄 Infinite login loop detected - breaking cycle');
      this.clearAuthData();
      return {
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please login again.',
        shouldRedirect: false
      };
    }

    // Analyze the specific error
    const authError = this.analyzeAuthError(error);
    
    if (authError.shouldRedirect) {
      this.performSafeRedirect();
    }
    
    return authError;
  }

  /**
   * Check if we're in an infinite redirect loop
   */
  private static isInfiniteLoopDetected(now: number): boolean {
    // Too many redirects in short time
    if (now - this.lastRedirectTime < this.redirectCooldown) {
      this.redirectAttempts++;
      if (this.redirectAttempts > this.maxRedirectAttempts) {
        return true;
      }
    } else {
      // Reset counter if enough time has passed
      this.redirectAttempts = 0;
    }
    
    this.lastRedirectTime = now;
    return false;
  }

  /**
   * Analyze the specific authentication error
   */
  private static analyzeAuthError(error: any): AuthError {
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        shouldRedirect: false
      };
    }

    const status = error.response.status;
    const message = error.response.data?.message || 'Authentication failed';

    switch (status) {
      case 401:
        return {
          code: 'TOKEN_EXPIRED',
          message: message || 'Session expired. Please login again.',
          shouldRedirect: true
        };
      
      case 403:
        return {
          code: 'INVALID_TOKEN',
          message: message || 'Access denied. Invalid credentials.',
          shouldRedirect: true
        };
      
      case 404:
        if (error.config?.url?.includes('/auth/')) {
          return {
            code: 'USER_NOT_FOUND',
            message: message || 'User not found.',
            shouldRedirect: true
          };
        }
        break;
      
      default:
        return {
          code: 'UNKNOWN',
          message: message || 'Authentication error occurred.',
          shouldRedirect: false
        };
    }

    return {
      code: 'UNKNOWN',
      message: 'Unknown error occurred.',
      shouldRedirect: false
    };
  }

  /**
   * Perform safe redirect to login page
   */
  private static performSafeRedirect(): void {
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login' || currentPath === '/register';

    // Only redirect if on authenticated route, not public routes
    const authenticatedRoutes = ['/admin', '/account', '/staff'];
    const isOnAuthenticatedRoute = authenticatedRoutes.some(route => currentPath.startsWith(route));

    if (!isLoginPage && isOnAuthenticatedRoute) {
      // Add reason parameter to help with user experience
      const loginUrl = '/login?reason=expired&ts=' + Date.now();
      window.location.href = loginUrl;
    }
  }

  /**
   * Clear all authentication data
   */
  static clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant-branding-cache');
    
    // Also clear session storage
    sessionStorage.clear();
  }

  /**
   * Reset the redirect counter (call this after successful login)
   */
  static reset(): void {
    this.redirectAttempts = 0;
    this.lastRedirectTime = 0;
  }

  /**
   * Check if current page is login page
   */
  static isLoginPage(): boolean {
    if (typeof window === 'undefined') return false;
    
    const currentPath = window.location.pathname;
    return currentPath === '/login' || currentPath === '/register';
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please login again.';
      case 'INVALID_TOKEN':
        return 'Invalid credentials. Please login again.';
      case 'USER_NOT_FOUND':
        return 'Account not found. Please check your credentials.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your internet connection.';
      default:
        return error.message;
    }
  }
}

// Export singleton instance
export default AuthGuard;
