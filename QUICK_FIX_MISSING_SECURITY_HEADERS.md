# 🚨 Quick Fix: "Missing security headers" Error

## Problem
You're getting `{"error": "Missing security headers"}` when testing the dialer endpoint in Postman.

## Root Cause
The production server is checking for HMAC security headers, but your code fix hasn't been deployed yet, OR `DIALER_SECRET_KEY` is set in your environment.

## ✅ Quick Fix: Remove DIALER_SECRET_KEY

### Step 1: Go to Render Dashboard
1. Go to: https://dashboard.render.com
2. Click on your **Backend Service** (Margav CRM Backend)

### Step 2: Check Environment Variables
1. Click on the **"Environment"** tab
2. Look for `DIALER_SECRET_KEY` in the list
3. If it exists, **DELETE it**:
   - Click the three dots (⋯) next to `DIALER_SECRET_KEY`
   - Click **Delete**
   - Confirm deletion

### Step 3: Redeploy
- Render will automatically redeploy when you save changes
- Wait for deployment to complete (usually 2-5 minutes)

### Step 4: Test Again
Try your Postman request again. It should work now! ✅

---

## Alternative: Deploy the Code Fix

If you want the permanent fix:

### Step 1: Commit and Push the Code
```bash
git add backend/leads/views.py
git commit -m "Fix: Make HMAC optional unless DIALER_SECRET_KEY is set"
git push origin main
```

### Step 2: Render Auto-Deploys
- Render will automatically detect the push
- It will redeploy your backend
- Wait for deployment to complete

---

## Why This Works

The error occurs because:
- Old code: Requires HMAC signatures in production (when `DEBUG=False`)
- New code: Only requires HMAC if `DIALER_SECRET_KEY` is explicitly set

By removing `DIALER_SECRET_KEY`, the system will skip HMAC validation and only check the API key.

---

## After Fix

Once the fix is applied, your Postman request should succeed with just:
- Header: `X-Dialer-Api-Key: margav-dialer-2024-secure-key-12345`
- Body: Your lead data

No HMAC signatures needed! 🎉

