/**
 * Offline Authentication Storage Utility
 * 
 * This utility handles storing and retrieving authentication tokens for offline use.
 * It uses IndexedDB to persist authentication data even when the browser is closed.
 * 
 * OFFLINE LOGIN FLOW:
 * 1. User logs in online -> token stored in both localStorage (for immediate use) and IndexedDB (for offline)
 * 2. User goes offline -> app checks IndexedDB for valid cached token
 * 3. If valid token found -> user automatically logged in with limited offline capabilities
 * 4. When back online -> token verified with backend /auth/verify/ endpoint
 * 5. If token invalid -> attempt refresh via /auth/refresh/ or force re-login
 * 
 * Features:
 * - Store authentication tokens after first online login
 * - Check if tokens are valid and not expired (30-day default expiry)
 * - Support offline login for returning users
 * - Automatic cleanup of expired tokens
 * - Network status monitoring for seamless online/offline transitions
 */

interface AuthTokenData {
  token: string;                    // Django REST framework token
  loginTimestamp: number;            // When the login occurred (for debugging)
  expiryTimestamp?: number;         // When the token expires (calculated from expiryMinutes)
  user: {
    username: string;               // User's username
    email?: string;                // User's email
    role?: string;                 // User's role (agent, admin, etc.)
  };
}

/**
 * Open the authentication IndexedDB database
 * Creates the database and object stores if they don't exist
 */
const openAuthDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Using a separate database for auth to keep it isolated
    // Open with version 3 to trigger upgrade and clean up old stores
    const request = indexedDB.open('AuthDB', 3);
    
    request.onerror = () => {
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      
      // Handle version change events (database upgrades)
      db.onversionchange = (event) => {
        db.close();
      };
      
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for authentication tokens
      if (!db.objectStoreNames.contains('authTokens')) {
        const store = db.createObjectStore('authTokens', { keyPath: 'id' });
        store.createIndex('loginTimestamp', 'loginTimestamp', { unique: false });
        store.createIndex('token', 'token', { unique: true });
      }
      
      // Delete the 'keys' store if it exists (old schema)
      if (db.objectStoreNames.contains('keys')) {
        db.deleteObjectStore('keys');
      }
    };
  });
};

/**
 * Store authentication token after successful login
 * 
 * Called when user successfully logs in while online.
 * Stores token in IndexedDB for offline login capability.
 * 
 * @param token - Django REST framework authentication token
 * @param user - User details (username, email, role)
 * @param expiryMinutes - Token validity period in minutes (default: 30 days)
 */
export const storeAuthToken = async (
  token: string,
  user: { username: string; email?: string; role?: string },
  expiryMinutes?: number
): Promise<void> => {
  try {
    const db = await openAuthDB();
    
    const now = Date.now();
    // Calculate expiry timestamp: now + (minutes * 60 seconds * 1000 milliseconds)
    const expiryTimestamp = expiryMinutes 
      ? now + (expiryMinutes * 60 * 1000)
      : undefined;
    
    const authData: AuthTokenData & { id: string } = {
      id: 'current', // Single record for current session
      token,
      loginTimestamp: now,
      expiryTimestamp,
      user,
    };
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['authTokens'], 'readwrite');
        const store = transaction.objectStore('authTokens');
        
        const request = store.put(authData);
        
        request.onerror = () => {
          reject(request.error);
        };
        
        // Wait for the transaction to complete
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
        
        // Also store in localStorage as backup
        try {
          localStorage.setItem('authTokenIndexedDB', JSON.stringify({
            token,
            user,
            expiryTimestamp,
            loginTimestamp: now,
          }));
        } catch (e) {
          // Ignore localStorage errors
        }
      } catch (transactionError) {
        reject(transactionError);
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieve stored authentication token from IndexedDB
 * 
 * Used for offline login attempts.
 * 
 * Returns token data if valid and not expired, otherwise null.
 * Automatically cleans up expired tokens.
 * 
 * @returns AuthTokenData if valid, null if expired or not found
 */
export const getStoredAuthToken = async (): Promise<AuthTokenData | null> => {
    try {
      const db = await openAuthDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['authTokens'], 'readonly');
        const store = transaction.objectStore('authTokens');
        
        const request = store.get('current');
        
        request.onsuccess = () => {
          const data = request.result as (AuthTokenData & { id: string }) | undefined;
          
          if (!data) {
            // Fallback to localStorage
            try {
              const localStorageData = localStorage.getItem('authTokenIndexedDB');
              if (localStorageData) {
                const parsedData = JSON.parse(localStorageData);
                
                // Check if token has expired
                if (parsedData.expiryTimestamp && Date.now() > parsedData.expiryTimestamp) {
                  localStorage.removeItem('authTokenIndexedDB');
                  resolve(null);
                  return;
                }
                
                resolve({
                  token: parsedData.token,
                  loginTimestamp: parsedData.loginTimestamp,
                  expiryTimestamp: parsedData.expiryTimestamp,
                  user: parsedData.user,
                });
                return;
              }
            } catch (e) {
              // Ignore parsing errors
            }
            
            resolve(null);
            return;
          }
          
          // Check if token has expired
          if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
            // Token expired, automatically clean it up
            clearAuthToken();
            resolve(null);
            return;
          }
          
          resolve({
            token: data.token,
            loginTimestamp: data.loginTimestamp,
            expiryTimestamp: data.expiryTimestamp,
            user: data.user,
          });
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      return null;
    }
  };

/**
 * Check if stored token is valid
 * Returns true if token exists and is not expired
 */
export const isTokenValid = async (): Promise<boolean> => {
  const tokenData = await getStoredAuthToken();
  return !!tokenData;
};

/**
 * Clear stored authentication token
 * Called on logout or when token is invalidated
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    const db = await openAuthDB();
    const transaction = db.transaction(['authTokens'], 'readwrite');
    const store = transaction.objectStore('authTokens');
    const request = store.delete('current');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get the stored user data for offline mode
 * Returns user info stored with the token
 */
export const getStoredUserData = async (): Promise<AuthTokenData['user'] | null> => {
  const tokenData = await getStoredAuthToken();
  return tokenData ? tokenData.user : null;
};

/**
 * Check network status
 * Returns true if online, false if offline
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Listen for online/offline events
 * Returns cleanup function
 */
export const addNetworkStatusListener = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

