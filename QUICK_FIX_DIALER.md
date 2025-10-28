# Quick Fix: Dialer "Invalid API Key" Error

## Problem
Your dialer is getting `HTTP 401: "Invalid API key"` when trying to send leads to CRM.

## Root Cause
The `DIALER_API_KEY` environment variable is set in your Render production, but your dialer isn't sending it in the URL.

## Immediate Fix (Choose One)

### Fix Option 1: Add API Key to Dialer URL ⭐ EASIEST

Update your dialer configuration URL to include the API key:

**Current URL:**
```
https://crm.margav.energy/api/leads/from-dialer/?&lead_id=67770&...
```

**Fixed URL (add `&api_key=...` at the start):**
```
https://crm.margav.energy/api/leads/from-dialer/?api_key=margav-dialer-key-2024&lead_id=67770&...
```

Replace `margav-dialer-key-2024` with your actual API key from Render.

---

### Fix Option 2: Check/Create API Key on Render

1. **Go to Render:** https://dashboard.render.com
2. **Click your backend service**
3. **Go to "Environment" tab**
4. **Check if `DIALER_API_KEY` exists**
   - If it exists → copy the value
   - If it doesn't exist → Add it:
     - Click "Add Environment Variable"
     - Key: `DIALER_API_KEY`
     - Value: `margav-dialer-key-2024` (or any secure string)
5. **Save and redeploy**

---

### Fix Option 3: Temporarily Disable API Key Check

For quick testing, you can temporarily disable the API key requirement:

1. **Go to Render Environment variables**
2. **Delete or rename** `DIALER_API_KEY` variable
3. **Redeploy**
4. **Test again**

---

## Find Your Current API Key

### Method 1: From Render Dashboard
1. Go to backend service on Render
2. Environment tab
3. Find `DIALER_API_KEY`
4. Copy the value

### Method 2: From Backend Code
The key is stored in `backend/crm_backend/settings.py`:

```python
DIALER_API_KEY = config('DIALER_API_KEY', default=None)
```

It's loaded from environment variables on Render.

---

## Testing

After adding API key to dialer URL:

1. **Trigger a test from dialer**
2. **Check Render logs:**
   - Go to Render → Backend Service → Logs
   - Look for: `"Received dialer lead data"`
   - Should see: `"Successfully created lead ID: X"`

3. **Check your CRM:**
   - Go to https://crm.margav.energy/admin/
   - Leads section
   - You should see the new lead!

---

## URL Format

Your dialer should send:
```
GET https://crm.margav.energy/api/leads/from-dialer/
```

**With parameters:**
```javascript
{
  api_key: "your-api-key-here",
  lead_id: 67770,
  phone: "07823949543",
  first_name: "Emmanuella",
  last_name: "Adu",
  full_name: "Emmanuella Opokua Adu",
  phone_number: "07823949543",
  address1: "24 Tawny Place",
  city: "Cannock",
  postal_code: "WS11 1JW",
  user: "EllaA",
  // ... all other fields
}
```

---

## Security Recommendation

For production, use a strong API key:

**Generate a secure key:**
```bash
# On Linux/Mac:
openssl rand -hex 32

# Or use online generator:
# https://www.random.org/strings/
```

Example: `a8f5f167f44f4964e6c998dee827110c`

Set this in Render environment variables.

---

## Quick Command to Test

You can test the endpoint directly with curl:

```bash
curl "https://crm.margav.energy/api/leads/from-dialer/?api_key=YOUR_KEY&lead_id=67770&phone=07823949543&full_name=Test"
```

Replace `YOUR_KEY` with your actual API key.

---

## Summary

**Problem:** Dialer URL missing API key parameter  
**Solution:** Add `&api_key=YOUR_API_KEY` to the dialer URL  
**Quick fix:** Temporarily disable API key check by removing DIALER_API_KEY from Render  
**Long-term:** Use proper API key authentication


