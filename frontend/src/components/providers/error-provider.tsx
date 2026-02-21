'use client';

import { useEffect, useState } from 'react';
import { setGlobalErrorHandler } from '@/lib/api/client';
import { ErrorToast } from '@/components/ui/error-toast';
import { formatValidationErrors, ApiError } from '@/lib/api/error-handler';

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    // Set up global error handler
    setGlobalErrorHandler((apiError: ApiError) => {
      // Format validation errors for better readability
      if (apiError.errors) {
        apiError.errors = formatValidationErrors(apiError.errors);
      }
      setError(apiError);
    });

    return () => {
      setGlobalErrorHandler(() => {});
    };
  }, []);

  return (
    <>
      {children}
      {error && (
        <ErrorToast
          message={error.message}
          errors={error.errors}
          onClose={() => setError(null)}
        />
      )}
    </>
  );
}
