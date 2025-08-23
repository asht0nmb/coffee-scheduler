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

  // Check authentication status with backend
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${config.apiUrl}/api/auth/status`, {
        method: 'GET',
        credentials: 'include', // Important: include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else if (response.status === 401) {
        // Not authenticated - this is expected for logged out users
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
  }, []);

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

    // Check auth status when user returns to the tab
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && user === null) {
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
  }, [checkAuthStatus, user]);

  // Periodic auth check (every 5 minutes) to handle session expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, checkAuthStatus]);

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