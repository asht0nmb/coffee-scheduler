/**
 * Environment Configuration and Validation
 * 
 * Validates required environment variables at application startup
 * to prevent runtime failures in production.
 */

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL'
] as const;

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_APP_NAME: 'Coffee Scheduler'
} as const;

/**
 * Validate required environment variables
 * Throws an error if any required variables are missing
 */
function validateEnvironment(): void {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

/**
 * Get validated environment configuration
 */
function getConfig() {
  // Only validate strictly on server side
  if (typeof window === 'undefined') {
    validateEnvironment();
  }
  
  return {
    // Required variables with fallback for client-side
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
    
    // Optional variables with defaults
    nodeEnv: process.env.NODE_ENV || optionalEnvVars.NODE_ENV,
    appName: process.env.NEXT_PUBLIC_APP_NAME || optionalEnvVars.NEXT_PUBLIC_APP_NAME,
    
    // Computed values
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  };
}

// Server-side validation happens in getConfig()
// Client-side uses fallback values gracefully

export const config = getConfig();
export { validateEnvironment };