import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  errors?: string[];
  statusCode?: number;
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const response = error.response;
    
    if (response) {
      // Backend validation errors
      if (response.status === 400 && response.data?.message) {
        const message = response.data.message;
        
        // Handle array of validation errors
        if (Array.isArray(message)) {
          return {
            message: 'Validation failed',
            errors: message,
            statusCode: 400,
          };
        }
        
        // Handle single error message
        return {
          message: typeof message === 'string' ? message : 'Validation failed',
          statusCode: 400,
        };
      }
      
      // Other HTTP errors
      return {
        message: response.data?.message || error.message || 'An error occurred',
        statusCode: response.status,
      };
    }
    
    // Network errors
    if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        statusCode: 0,
      };
    }
  }
  
  // Unknown errors
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}

export function formatValidationErrors(errors: string[]): string[] {
  return errors.map((error) => {
    // Clean up common validation error patterns
    return error
      .replace(/^property /, '')
      .replace(/ should not exist$/, ' is not allowed')
      .replace(/ must not be less than (\d+)/, ' must be at least $1')
      .replace(/ must be a (\w+)/, ' must be a valid $1')
      .replace(/ must not be empty/, ' is required');
  });
}
