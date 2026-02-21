import { useState, useCallback } from 'react';

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  errors?: string[];
}

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((toastData: ToastMessage) => {
    setToast(toastData);
  }, []);

  const success = useCallback((message: string, title?: string) => {
    setToast({ type: 'success', message, title: title || 'Success' });
  }, []);

  const error = useCallback((message: string, errors?: string[], title?: string) => {
    setToast({ type: 'error', message, errors, title: title || 'Error' });
  }, []);

  const info = useCallback((message: string, title?: string) => {
    setToast({ type: 'info', message, title: title || 'Info' });
  }, []);

  const warning = useCallback((message: string, title?: string) => {
    setToast({ type: 'warning', message, title: title || 'Warning' });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    success,
    error,
    info,
    warning,
    hideToast,
  };
}
