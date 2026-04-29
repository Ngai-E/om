'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

interface AuthNotificationProps {
  type: 'recovery-success' | 'recovery-failed' | 'session-expired';
  message: string;
  onDismiss?: () => void;
}

export function AuthNotification({ type, message, onDismiss }: AuthNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds for success messages
    if (type === 'recovery-success') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  if (!isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case 'recovery-success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'recovery-failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'session-expired':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'recovery-success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'recovery-failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'session-expired':
        return <RefreshCw className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm border rounded-lg shadow-lg p-4 ${getStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {type === 'recovery-success' && 'Session Recovered'}
            {type === 'recovery-failed' && 'Recovery Failed'}
            {type === 'session-expired' && 'Session Expired'}
          </p>
          <p className="text-sm mt-1 opacity-90">
            {message}
          </p>
          
          {type === 'recovery-failed' && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="text-xs bg-white/50 px-2 py-1 rounded hover:bg-white/70 transition"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="text-xs bg-white/50 px-2 py-1 rounded hover:bg-white/70 transition"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default AuthNotification;
