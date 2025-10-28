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
      console.error('❌ IndexedDB open error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      console.log('✅ IndexedDB opened successfully, version:', db.version);
      
      // Handle version change events (database upgrades)
      db.onversionchange = (event) => {
        console.log('⚠️ IndexedDB version change detected');
        db.close();
      };
      
      // Add error handling for the database
      db.onerror = (event) => {
        console.error('❌ IndexedDB error:', event);
      };
      
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('📦 IndexedDB upgrade needed');
      
      // Create object store for authentication tokens
      if (!db.objectStoreNames.contains('authTokens')) {
        console.log('📦 Creating authTokens object store');
        const store = db.createObjectStore('authTokens', { keyPath: 'id' });
        store.createIndex('loginTimestamp', 'loginTimestamp', { unique: false });
        store.createIndex('token', 'token', { unique: true });
      }
      
      // Delete the 'keys' store if it exists (old schema)
      if (db.objectStoreNames.contains('keys')) {
        console.log('🗑️ Deleting old keys store');
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
    console.log('📦 Opening IndexedDB...');
    const db = await openAuthDB();
    console.log('✅ IndexedDB opened successfully');
    
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
    
    console.log('📝 Preparing to store auth data:', { user: authData.user.username, tokenLength: token.length });
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['authTokens'], 'readwrite');
        const store = transaction.objectStore('authTokens');
        
        console.log('📝 Store ready, object store:', store.name);
        
        const request = store.put(authData);
        
        request.onsuccess = () => {
          console.log('✅ Auth token stored successfully in IndexedDB');
          console.log('✅ Store request success, waiting for transaction...');
        };
        
        request.onerror = () => {
          console.error('❌ Error storing auth token:', request.error);
          reject(request.error);
        };
        
        // Wait for the transaction to complete
        transaction.oncomplete = () => {
          console.log('✅ Transaction completed - auth token now persisted');
          resolve();
        };
        
        transaction.onerror = () => {
          console.error('❌ Transaction error:', transaction.error);
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
          console.log('✅ Also stored in localStorage as backup');
        } catch (e) {
          console.error('⚠️ Could not store in localStorage:', e);
        }
      } catch (transactionError) {
        console.error('❌ Transaction setup error:', transactionError);
        reject(transactionError);
      }
    });
  } catch (error) {
    console.error('❌ Error in storeAuthToken:', error);
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
      console.log('🔍 Opening IndexedDB to retrieve auth token...');
      const db = await openAuthDB();
      console.log('✅ IndexedDB opened');
      console.log('📦 Checking object stores:', Array.from(db.objectStoreNames));
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['authTokens'], 'readonly');
        const store = transaction.objectStore('authTokens');
        
        // Wait for the transaction to be ready
        transaction.oncomplete = () => {
          console.log('✅ Transaction completed (read)');
        };
        
        transaction.onerror = () => {
          console.error('❌ Transaction error:', transaction.error);
        };
        
        // First, try to get all records to see what's in there
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          console.log('🔍 All records in store:', getAllRequest.result);
          console.log('🔍 Record count:', getAllRequest.result.length);
        };
        
        const request = store.get('current');
        
        request.onsuccess = () => {
          console.log('🔍 Request completed, result:', request.result);
          const data = request.result as (AuthTokenData & { id: string }) | undefined;
          
          console.log('🔍 Data from request.result:', data);
          
          if (!data) {
            console.log('❌ No auth data found in IndexedDB, trying localStorage fallback...');
            // Fallback to localStorage
            try {
              const localStorageData = localStorage.getItem('authTokenIndexedDB');
              if (localStorageData) {
                console.log('✅ Found token in localStorage fallback');
                const parsedData = JSON.parse(localStorageData);
                
                // Check if token has expired
                if (parsedData.expiryTimestamp && Date.now() > parsedData.expiryTimestamp) {
                  console.log('⚠️ Token in localStorage has expired');
                  localStorage.removeItem('authTokenIndexedDB');
                  resolve(null);
                  return;
                }
                
                console.log('✅ Token from localStorage is valid');
                resolve({
                  token: parsedData.token,
                  loginTimestamp: parsedData.loginTimestamp,
                  expiryTimestamp: parsedData.expiryTimestamp,
                  user: parsedData.user,
                });
                return;
              }
            } catch (e) {
              console.error('❌ Error parsing localStorage data:', e);
            }
            
            resolve(null);
            return;
          }
          
          console.log('✅ Found auth data for user:', data.user.username);
          
          // Check if token has expired
          if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
            console.log('⚠️ Token has expired');
            // Token expired, automatically clean it up
            clearAuthToken();
            resolve(null);
            return;
          }
          
          console.log('✅ Token is valid');
          resolve({
            token: data.token,
            loginTimestamp: data.loginTimestamp,
            expiryTimestamp: data.expiryTimestamp,
            user: data.user,
          });
        };
        
        request.onerror = () => {
          console.error('❌ Error getting auth token:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('❌ Error in getStoredAuthToken:', error);
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
    console.error('Error clearing auth token:', error);
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

