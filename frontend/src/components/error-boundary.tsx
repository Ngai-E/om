'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/lib/auth/auth-guard';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isAuthError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isAuthError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Check if it's an authentication-related error
    const isAuthError = 
      error.message.includes('401') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('token') ||
      error.message.includes('authentication');

    return {
      hasError: true,
      error,
      isAuthError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);

    // If it's an auth error, handle it gracefully
    if (this.state.isAuthError) {
      console.warn('Authentication error detected, clearing auth data');
      AuthGuard.clearAuthData();
    }
  }

  handleReset = () => {
    // Clear any auth-related issues
    if (this.state.isAuthError) {
      AuthGuard.clearAuthData();
      AuthGuard.reset();
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isAuthError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            reset={this.handleReset} 
          />
        );
      }

      // Default error UI
      return (
        <ErrorFallback 
          error={this.state.error!}
          isAuthError={this.state.isAuthError}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ 
  error, 
  isAuthError, 
  onReset 
}: { 
  error: Error; 
  isAuthError: boolean; 
  onReset: () => void;
}) {
  const router = useRouter();

  const handleGoToLogin = () => {
    AuthGuard.clearAuthData();
    AuthGuard.reset();
    router.push('/login?reason=expired');
  };

  if (isAuthError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-6">
            Your session has expired or there was an authentication issue. Please login again to continue.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:opacity-90 transition"
            >
              Go to Login
            </button>
            
            <button
              onClick={onReset}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Try Again
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'An unexpected error occurred.'}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:opacity-90 transition"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Refresh Page
          </button>
        </div>
        
        <details className="mt-4 text-left">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Technical details
          </summary>
          <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap break-all">
            {error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default ErrorBoundary;
