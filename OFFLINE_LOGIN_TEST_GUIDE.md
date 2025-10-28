# Testing Offline Login

## The Offline Login Feature

The offline login feature allows users to log in without internet after they have logged in at least once while online. This is the expected behavior for PWA-style offline capability.

## How It Works

1. **First Login (Online Required)**: User logs in while online
   - Token is stored in both localStorage (for immediate use) and IndexedDB (for offline use)

2. **Subsequent Logins (Offline Capable)**: User can log in offline using the cached token from IndexedDB
   - Token is valid for 30 days
   - Works even when browser is closed and reopened

3. **Token Expiry**: After 30 days, user must log in online again to renew the token

## Testing Instructions

### Step 1: Clear Existing Data (Fresh Test)

Open your browser's Developer Console (F12) and run:

```javascript
// Clear localStorage
localStorage.clear();

// Clear IndexedDB
indexedDB.deleteDatabase('AuthDB');
indexedDB.deleteDatabase('CRMDB');

console.log('Cleared all authentication data');
```

### Step 2: Log In Online

1. Make sure you're online
2. Go to the Canvasser Login page
3. Log in with your canvasser credentials
4. This will save the token to IndexedDB for offline use

### Step 3: Verify Token is Stored

Open Developer Console and run:

```javascript
// Check localStorage
console.log('localStorage token:', localStorage.getItem('authToken'));

// Check IndexedDB
const request = indexedDB.open('AuthDB', 1);
request.onsuccess = () => {
  const db = request.result;
  const transaction = db.transaction(['authTokens'], 'readonly');
  const store = transaction.objectStore('authTokens');
  const getRequest = store.get('current');
  getRequest.onsuccess = () => {
    console.log('IndexedDB token data:', getRequest.result);
  };
};
```

You should see:
- `localStorage token:` with your token
- `IndexedDB token data:` with the full auth data including username, email, role

### Step 4: Test Offline Login

1. Log out (if still logged in)
2. In Chrome DevTools: 
   - Press F12
   - Go to **Network** tab
   - Check **"Offline"** checkbox at the top
3. Refresh the page
4. You should see the yellow "Offline Mode" banner
5. The app should automatically log you in with the cached token
6. If not automatically logged in, the login page should show a message about being able to log in offline

### Step 5: Test While Connected

1. Uncheck the "Offline" checkbox in Network tab
2. You should see "Connection restored" notification
3. The app should verify your token with the server
4. You should remain logged in

## Expected Messages

### When Going Offline (First Time)
- "⚠️ You are now offline. Some features may be limited."

### When Offline and Trying to Login (Without Saved Token)
- "⚠️ No saved login found. Connection required for first login."

### When Offline and Has Saved Token
- Automatically logs you in
- Shows "You are logged in offline mode"

### When Coming Back Online
- "✅ Successfully reconnected!"
- "🔄 Reconnecting to server..."

## Troubleshooting

### "No saved login found" Message

This means the IndexedDB doesn't have a valid cached token. This is normal if:
- You've never logged in online
- Your cached token expired (30 days)
- You cleared browser data
- You're in a different browser/profile

**Solution**: Log in once while online, then you can use offline mode.

### Token Not Storing in IndexedDB

Check the browser console for errors:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common issues:
   - Browser blocking IndexedDB access
   - Incognito mode (some browsers don't allow IndexedDB)

### Automatic Login Not Working

Check the `AuthContext.tsx` code:
- Look for the `attemptOfflineLogin` function
- Verify it's being called on component mount
- Check console logs for "Offline login successful" message

## Development Tools

### Chrome DevTools

1. **Application Tab** → **Storage** → **IndexedDB**
   - See all IndexedDB databases
   - Inspect the `AuthDB` database
   - Check the `authTokens` object store

2. **Application Tab** → **Storage** → **Local Storage**
   - See localStorage entries
   - Check the `authToken` key

3. **Network Tab** → **Offline Checkbox**
   - Simulate offline mode
   - Test offline login behavior

### Console Commands

```javascript
// Check if IndexedDB is available
console.log('IndexedDB available:', !!window.indexedDB);

// List all IndexedDB databases
indexedDB.databases().then(dbs => console.log('Databases:', dbs));

// Open a specific database
const request = indexedDB.open('AuthDB', 1);
request.onsuccess = () => {
  console.log('AuthDB opened');
  const db = request.result;
  console.log('Object stores:', Array.from(db.objectStoreNames));
};
```

## Production Testing

Before deploying to production:

1. ✅ Test fresh install (no cached data)
2. ✅ Test first online login
3. ✅ Test offline login with cached token
4. ✅ Test going online from offline state
5. ✅ Test token expiry handling
6. ✅ Test logout clears both localStorage and IndexedDB

## Summary

**The behavior you're seeing is CORRECT**: You must log in once while online to establish the token in IndexedDB. After that, you can log in offline for up to 30 days.

This is the standard PWA offline authentication pattern.

