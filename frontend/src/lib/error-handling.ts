/**
 * Error Handling Utilities
 * 
 * Provides consistent error handling, retry logic, and user-friendly error messages
 * throughout the Coffee Scheduler application.
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: Error) => boolean;
}

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

interface ApiErrorResponse {
  message?: string;
  userMessage?: string;
}

interface NetworkError extends Error {
  code?: string;
  response?: {
    status: number;
    data?: ApiErrorResponse;
  };
}

/**
 * Enhanced error class with context and user-friendly messages
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;
  public readonly retryable: boolean;

  constructor({
    message,
    code = 'UNKNOWN_ERROR',
    userMessage,
    context,
    originalError,
    retryable = false
  }: {
    message: string;
    code?: string;
    userMessage?: string;
    context?: ErrorContext;
    originalError?: Error;
    retryable?: boolean;
  }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
    this.context = context;
    this.originalError = originalError;
    this.retryable = retryable;
  }

  private getDefaultUserMessage(code: string): string {
    const messages: Record<string, string> = {
      NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
      TIMEOUT_ERROR: 'Request timed out. Please try again.',
      AUTH_ERROR: 'Authentication failed. Please log in again.',
      PERMISSION_ERROR: 'You don\'t have permission to perform this action.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      CONFLICT_ERROR: 'The requested action conflicts with existing data.',
      NOT_FOUND_ERROR: 'The requested resource was not found.',
      RATE_LIMIT_ERROR: 'Too many requests. Please wait before trying again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
    };

    return messages[code] || messages.UNKNOWN_ERROR;
  }
}

/**
 * Parse and categorize errors from API responses
 */
export function parseApiError(error: NetworkError, context?: Partial<ErrorContext>): AppError {
  const timestamp = new Date().toISOString();
  const fullContext = { ...context, timestamp } as ErrorContext;

  // Network/connection errors
  if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('fetch'))) {
    return new AppError({
      message: error.message,
      code: 'NETWORK_ERROR',
      context: fullContext,
      originalError: error,
      retryable: true
    });
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new AppError({
      message: error.message,
      code: 'TIMEOUT_ERROR',
      context: fullContext,
      originalError: error,
      retryable: true
    });
  }

  // HTTP status errors
  if (error.response?.status) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return new AppError({
          message: data?.message || 'Bad request',
          code: 'VALIDATION_ERROR',
          userMessage: data?.userMessage || 'Please check your input and try again.',
          context: fullContext,
          originalError: error,
          retryable: false
        });
        
      case 401:
        return new AppError({
          message: 'Unauthorized',
          code: 'AUTH_ERROR',
          context: fullContext,
          originalError: error,
          retryable: false
        });
        
      case 403:
        return new AppError({
          message: 'Forbidden',
          code: 'PERMISSION_ERROR',
          context: fullContext,
          originalError: error,
          retryable: false
        });
        
      case 404:
        return new AppError({
          message: 'Not found',
          code: 'NOT_FOUND_ERROR',
          userMessage: data?.userMessage || 'The requested item was not found.',
          context: fullContext,
          originalError: error,
          retryable: false
        });
        
      case 409:
        return new AppError({
          message: 'Conflict',
          code: 'CONFLICT_ERROR',
          userMessage: data?.userMessage || 'This action conflicts with existing data.',
          context: fullContext,
          originalError: error,
          retryable: false
        });
        
      case 429:
        return new AppError({
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_ERROR',
          context: fullContext,
          originalError: error,
          retryable: true
        });
        
      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError({
          message: 'Server error',
          code: 'SERVER_ERROR',
          userMessage: data?.userMessage || 'Server error. Our team has been notified.',
          context: fullContext,
          originalError: error,
          retryable: true
        });
    }
  }

  // Default unknown error
  return new AppError({
    message: error.message || 'Unknown error',
    code: 'UNKNOWN_ERROR',
    context: fullContext,
    originalError: error,
    retryable: false
  });
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBackoff = true,
    retryCondition = (error: Error) => error instanceof AppError && (error as AppError).retryable
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt or if retry condition fails
      if (attempt === maxAttempts || !retryCondition(lastError)) {
        throw lastError;
      }

      // Calculate delay
      let delay = exponentialBackoff 
        ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
        : baseDelay;
      
      // Add jitter to prevent thundering herd
      delay = delay + (Math.random() * delay * 0.1);

      console.warn(`Retrying operation (attempt ${attempt}/${maxAttempts}) after ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Log errors for monitoring and debugging
 */
export function logError(error: AppError, additionalContext?: Record<string, unknown>) {
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      userMessage: error.userMessage,
      retryable: error.retryable,
      stack: error.stack
    },
    context: error.context,
    originalError: error.originalError ? {
      name: error.originalError.name,
      message: error.originalError.message,
      stack: error.originalError.stack
    } : undefined,
    additionalContext,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
  };

  console.error('Application Error:', logData);

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    try {
      // Example: Sentry.captureException(error, { extra: logData });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  }
}

/**
 * User-friendly error display helper
 */
export function getDisplayError(error: unknown): { title: string; message: string; canRetry: boolean } {
  if (error instanceof AppError) {
    return {
      title: getErrorTitle(error.code),
      message: error.userMessage,
      canRetry: error.retryable
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Unexpected Error',
      message: 'Something went wrong. Please try again.',
      canRetry: true
    };
  }

  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please refresh the page.',
    canRetry: true
  };
}

function getErrorTitle(code: string): string {
  const titles: Record<string, string> = {
    NETWORK_ERROR: 'Connection Problem',
    TIMEOUT_ERROR: 'Request Timeout',
    AUTH_ERROR: 'Authentication Required',
    PERMISSION_ERROR: 'Access Denied',
    VALIDATION_ERROR: 'Invalid Input',
    CONFLICT_ERROR: 'Conflict Detected',
    NOT_FOUND_ERROR: 'Not Found',
    RATE_LIMIT_ERROR: 'Rate Limit Exceeded',
    SERVER_ERROR: 'Server Error',
    UNKNOWN_ERROR: 'Unexpected Error'
  };

  return titles[code] || 'Error';
}

/**
 * Validate required fields with user-friendly messages
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T, 
  requiredFields: (keyof T)[],
  customMessages?: Partial<Record<keyof T, string>>
): void {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      const fieldName = customMessages?.[field] || String(field);
      missing.push(fieldName);
    }
  }
  
  if (missing.length > 0) {
    throw new AppError({
      message: `Missing required fields: ${missing.join(', ')}`,
      code: 'VALIDATION_ERROR',
      userMessage: `Please provide: ${missing.join(', ')}`,
      retryable: false
    });
  }
}