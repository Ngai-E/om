'use client';

import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ErrorToastProps {
  title?: string;
  message: string;
  errors?: string[];
  onClose: () => void;
  duration?: number;
}

export function ErrorToast({ title = 'Error', message, errors, onClose, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2">
      <div className="bg-white border-2 border-red-500 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-600 rounded p-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-gray-700 mb-2">{message}</p>
          
          {errors && errors.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold text-gray-600">Validation Errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
