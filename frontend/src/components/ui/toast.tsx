'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, onClose, duration = 3000, type = 'success' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = 
    type === 'error' ? 'bg-red-600 text-white' :
    type === 'info' ? 'bg-blue-600 text-white' :
    'bg-green-600 text-white';

  const Icon = 
    type === 'error' ? AlertCircle :
    type === 'info' ? AlertCircle :
    CheckCircle;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`${styles} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1">{message}</p>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
