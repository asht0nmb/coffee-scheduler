'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { config } from '@/lib/config';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  timezone: string;
  _id: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  // Check authentication status with backend
  const checkAuthStatus = useCallback(async () => {
    // Throttle requests - don't check more than once every 2 seconds
    const now = Date.now();
    if (now - lastCheckTime < 2000) {
      console.log('⏳ Auth check throttled - too soon since last check');
      return;
    }
    setLastCheckTime(now);

    try {
      console.log('🔍 Checking auth status...', {
        apiUrl: config.apiUrl,
        timestamp: new Date().toISOString(),
        // Log available cookies (non-sensitive info only)
        hasCookies: typeof document !== 'undefined' && document.cookie.length > 0
      });
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${config.apiUrl}/api/auth/status`, {
        method: 'GET',
        credentials: 'include', // Important: include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Auth status request details:', {
        url: `${config.apiUrl}/api/auth/status`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auth status response:', { 
          authenticated: data.authenticated, 
          hasUser: !!data.user,
          userEmail: data.user?.email 
        });
        
        if (data.authenticated && data.user) {
          setUser(data.user);
          console.log('🎉 User authenticated:', data.user.email);
        } else {
          setUser(null);
          console.log('❌ User not authenticated');
        }
      } else if (response.status === 401) {
        // Not authenticated - this is expected for logged out users
        console.log('❌ 401 - Not authenticated');
        setUser(null);
      } else {
        throw new Error(`Auth check failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Auth status check failed:', err);
      setError('Unable to verify authentication status');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [lastCheckTime]);

  // Login - redirect to backend OAuth
  const login = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `${config.apiUrl}/api/auth/google`;
    }
  };

  // Logout - call backend logout endpoint
  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch(`${config.apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUser(null);
        // Optionally redirect to home page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Check auth status on mount and when returning to the app
  useEffect(() => {
    checkAuthStatus();

    // Check auth status when user returns to the tab (only if not loading)
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkAuthStatus();
      }
    };

    // Check auth status when user comes back online
    const handleOnline = () => {
      checkAuthStatus();
    };

    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
      };
    }
  }, [checkAuthStatus]); // Remove 'user' dependency to prevent loop

  // Periodic auth check (every 5 minutes) to handle session expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, checkAuthStatus]); // Simplified dependencies - throttling handles conflicts

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    checkAuthStatus,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};