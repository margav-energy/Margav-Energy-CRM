# Offline Login Testing Guide

## How to Test Offline Authentication Locally

### Prerequisites
1. Your development environment running
2. Browser with DevTools access
3. Network connection for initial login

---

## Testing Steps

### Step 1: Login While Online
1. **Start your backend server:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Navigate to the canvasser portal:**
   - Go to `http://localhost:3000/canvasser`
   - Or use your dev URL

4. **Login with your canvasser credentials:**
   - Enter username and password
   - Click "Sign In"

5. **Verify login was successful:**
   - You should see the Canvasser Form interface
   - Take note of your username for verification

6. **Verify token was stored:**
   - Open Browser DevTools (F12)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Look for **IndexedDB** → **AuthDB** → **authTokens**
   - You should see a record with:
     - `id: "current"`
     - `token: "your-token-here"`
     - `user: { username, email, role }`
     - `expiryTimestamp: number`

---

### Step 2: Simulate Offline Mode

There are several ways to simulate offline mode:

#### Method 1: Browser DevTools (Recommended)
1. **Open Browser DevTools** (F12)
2. Go to **Network** tab
3. Select **Offline** from the throttling dropdown (top toolbar)
4. The browser will now act as if it's offline

#### Method 2: Disconnect Wi-Fi/Ethernet
1. Actually disconnect your network connection
2. Or disable Wi-Fi in your system settings

#### Method 3: Browser Settings
- **Chrome**: DevTools → Network → Check "Offline" checkbox
- **Firefox**: DevTools → Settings → Change "Network throttling" to "Offline"

---

### Step 3: Test Offline Login

#### Test 1: Refresh the Page While Offline
1. With the app in offline mode (from Step 2)
2. **Refresh the browser** (F5 or Ctrl+R)
3. **Expected Result:**
   - You should remain logged in automatically
   - See a toast message: "You are logged in offline mode"
   - The Canvasser Form should still be visible
   - You should NOT see the login form

#### Test 2: Navigate Away and Back
1. While offline, try navigating to another URL
2. Navigate back to `/canvasser`
3. **Expected Result:**
   - You should remain logged in
   - No login form should appear

#### Test 3: Close and Reopen Browser
1. While online, login to the canvasser portal
2. Close the browser completely
3. Turn OFF your internet connection
4. Reopen browser and go to `/canvasser`
5. **Expected Result:**
   - You should be automatically logged in
   - See offline mode indicator

---

### Step 4: Test Online/Offline Transitions

#### Test: Going Offline While Logged In
1. Login while online
2. Use the canvasser form
3. Go offline (using DevTools Method 1)
4. **Expected Result:**
   - You should see: "You are now offline. Some features may be limited."
   - You remain logged in
   - Form is still accessible

#### Test: Coming Back Online
1. While offline and logged in
2. Turn network back online
3. **Expected Result:**
   - You should see: "Reconnecting to server..."
   - Then: "Successfully reconnected!"
   - You remain logged in

---

### Step 5: Verify Offline Capabilities

While offline and logged in, you should be able to:
- ✅ Fill out the canvasser form
- ✅ Take photos
- ✅ Save form data locally
- ✅ See your previously filled forms

While offline, you CANNOT:
- ❌ Submit forms to the server
- ❌ Fetch new data from the server
- ❌ Create new lead records

---

## Troubleshooting

### Issue: Still showing login form when offline
**Solution:**
1. Check DevTools Console for errors
2. Verify IndexedDB has the auth token:
   - Open DevTools → Application → IndexedDB → AuthDB
   - Check if `authTokens` object store exists
   - Check if there's a record with `id: "current"`
3. Check browser console logs for any errors

### Issue: Token not found in IndexedDB
**Possible Causes:**
- Token wasn't stored during initial login
- Token expired (30-day default expiry)
- Browser cleared IndexedDB

**Solution:**
1. Log in again while online
2. Check that token was stored in IndexedDB
3. Verify the expiry timestamp is in the future

### Issue: "Module not found" errors
**Solution:**
- Make sure you've built the frontend:
  ```bash
  cd frontend
  npm run build
  ```

### Issue: Can't see offline mode indicators
**Solution:**
- Check that toast notifications are enabled
- Open browser console and check for JavaScript errors
- Verify React is running without errors

---

## Debug Checklist

Use this checklist to verify offline login is working:

- [ ] Login successfully while online
- [ ] Token is stored in IndexedDB (check DevTools)
- [ ] Can access canvasser form while online
- [ ] Go offline (Network throttling to Offline)
- [ ] Refresh page while offline
- [ ] Still logged in (no login form shown)
- [ ] See "offline mode" toast message
- [ ] Can fill out form while offline
- [ ] Turn internet back on
- [ ] See "reconnecting" then "successfully reconnected" messages
- [ ] Still logged in after reconnecting

---

## Browser Compatibility

Offline login should work on:
- ✅ Chrome/Chromium (Recommended)
- ✅ Edge
- ✅ Firefox
- ✅ Safari (with minor issues)
- ❌ Internet Explorer (not supported)

---

## Next Steps

After testing locally:

1. **Deploy to production** (your updates are already pushed to GitHub)
2. **Test on production** using the same steps
3. **Test on real mobile devices** for field agents
4. **Monitor error logs** for any issues

---

## Advanced Testing

### Simulate Token Expiry
To test token expiration handling:

1. Open DevTools → Application → IndexedDB → AuthDB → authTokens
2. Click on the record with `id: "current"`
3. Edit the `expiryTimestamp` to a past date (e.g., `1630000000000`)
4. Refresh the page
5. You should be logged out and see the login form

### Test First-Time User
1. Clear all browser data (including IndexedDB)
2. Go offline immediately
3. Try to access `/canvasser`
4. You should see: "You must be online to log in for the first time"

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab to see failed requests
3. Check IndexedDB contents in DevTools
4. Verify backend server is running
5. Verify API endpoints are accessible when online

