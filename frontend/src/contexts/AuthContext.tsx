import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { authAPI, setAuthToken } from '../api';
import { 
  storeAuthToken, 
  getStoredAuthToken, 
  clearAuthToken,
  isOnline,
  addNetworkStatusListener 
} from '../utils/authStorage';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  offlineMode: boolean; // Indicates if user is in offline mode
  checkOfflineLogin: () => Promise<boolean>; // Attempt offline login
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // Attempt offline login using stored token
  const attemptOfflineLogin = async (): Promise<boolean> => {
    try {
      const tokenData = await getStoredAuthToken();
      
      if (!tokenData) {
        return false;
      }
      
      // Check if token is expired
      if (tokenData.expiryTimestamp && Date.now() > tokenData.expiryTimestamp) {
        console.log('Stored token has expired');
        await clearAuthToken();
        return false;
      }
      
      // Set token for offline authentication
      setAuthToken(tokenData.token);
      
      // Create minimal user object from stored data
      setUser({
        username: tokenData.user.username,
        email: tokenData.user.email,
        role: tokenData.user.role,
        first_name: tokenData.user.username,
        last_name: '',
        id: 0,
      } as User);
      
      setOfflineMode(true);
      return true;
    } catch (error) {
      console.error('Error attempting offline login:', error);
      return false;
    }
  };

  const checkOfflineLogin = useCallback(async (): Promise<boolean> => {
    return await attemptOfflineLogin();
  }, []);

  // Logout function - clears both localStorage and IndexedDB
  const logout = useCallback(async () => {
    authAPI.logout();
    await clearAuthToken();
    setUser(null);
    setOfflineMode(false);
  }, []);

  // Initialize authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for offline login capability
      const networkStatus = isOnline();
      
      if (networkStatus) {
        // Online: Try to load from localStorage first
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            setAuthToken(token);
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            
            // Store token in IndexedDB for future offline login
            await storeAuthToken(token, {
              username: userData.username,
              email: userData.email,
              role: userData.role,
            });
          } catch (error) {
            console.error('Failed to load user from server:', error);
            setAuthToken(null);
            
            // Try offline login as fallback
            await attemptOfflineLogin();
          }
        }
      } else {
        // Offline: Attempt to login with stored token
        await attemptOfflineLogin();
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen for network status changes
  useEffect(() => {
    const cleanup = addNetworkStatusListener(
      // When coming back online
      async () => {
        console.log('Connection restored');
        if (offlineMode && user) {
          toast.info('Reconnecting to server...');
          try {
            // Verify token is still valid
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            setOfflineMode(false);
            toast.success('Successfully reconnected!');
          } catch (error) {
            console.error('Token verification failed:', error);
            toast.error('Session expired. Please log in again.');
            logout();
          }
        }
      },
      // When going offline
      () => {
        console.log('Connection lost');
        if (user) {
          setOfflineMode(true);
          toast.warning('You are now offline. Some features may be limited.');
        }
      }
    );
    
    return cleanup;
  }, [offlineMode, user, logout]);

  // Login function - stores token in IndexedDB for offline use
  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login({ username, password });
      
      // Store in localStorage for normal operation
      setAuthToken(response.token);
      setUser(response.user);
      
      // Store in IndexedDB for offline login capability
      await storeAuthToken(response.token, {
        username: response.user.username,
        email: response.user.email,
        role: response.user.role,
      }, 30 * 24); // 30 days expiry
      
      setOfflineMode(false);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    offlineMode,
    checkOfflineLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
