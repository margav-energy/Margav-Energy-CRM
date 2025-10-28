# Dialer API Key Setup

## Current Issue

The dialer is trying to send leads to your CRM but getting:
```
HTTP 401 Unauthorized
{
    "error": "Invalid API key"
}
```

## Solution

You have two options:

### Option 1: Set API Key on Render (Recommended for Production)

1. **Go to your Render Dashboard**
2. **Click on your Backend Service**
3. **Go to "Environment" tab**
4. **Add new variable:**
   - Key: `DIALER_API_KEY`
   - Value: (generate a secure key, e.g., `your-secret-api-key-2024`)
   - Click "Add"

5. **Redeploy your service** (automatic on save)

6. **Configure dialer to use this key:**
   - Go to your dialer configuration
   - Add the API key to the URL: `&api_key=your-secret-api-key-2024`

### Option 2: Disable API Key (Quick Fix for Testing)

If you don't have the API key set, the endpoint allows requests without it. The error you're seeing means:

1. **DIALER_API_KEY is set in your Render environment**
2. **The dialer isn't sending the API key**

**Quick fix:** Temporarily remove or comment out the DIALER_API_KEY in your Render environment variables, then redeploy.

## Setting API Key on Render

### Step-by-Step:

1. Go to: https://dashboard.render.com
2. Click on your backend web service (Margav CRM Backend)
3. Scroll to "Environment" tab
4. Click "Add Environment Variable"
5. Set:
   ```
   Key: DIALER_API_KEY
   Value: margav-dialer-key-2024-secure
   ```
6. Click "Save Changes"
7. Render will automatically redeploy

## Dialer Configuration

Your dialer needs to send the API key. Update your dialer configuration to include:

```
https://crm.margav.energy/api/leads/from-dialer/?&api_key=margav-dialer-key-2024-secure&lead_id=...
```

## Current Request

Your dialer is sending:
```
GET /api/leads/from-dialer/?&lead_id=67770&vendor_id=&...
```

But it's **missing** the `api_key` parameter.

## Fix the URL

Add `&api_key=YOUR_API_KEY` to the dialer URL:

**Before:**
```
https://crm.margav.energy/api/leads/from-dialer/?&lead_id=67770&...
```

**After:**
```
https://crm.margav.energy/api/leads/from-dialer/?&api_key=margav-dialer-key-2024-secure&lead_id=67770&...
```

## Security Note

The endpoint also supports **header authentication** (more secure):

**Option A: Query Parameter (Current)**
```
?api_key=your-key&lead_id=...
```

**Option B: Header (More Secure)**
Set HTTP header:
```
X-Dialer-Api-Key: your-secret-key
```

## Testing

Once you set the API key:

1. **Update dialer URL** with `&api_key=...`
2. **Test from dialer**
3. **Check backend logs** on Render to see if lead is created
4. **Verify in admin** at https://crm.margav.energy/admin/

## Emergency: Disable Authentication

If you need to test immediately without API key:

1. Go to Render dashboard
2. Find your backend service
3. Environment variables
4. **Delete or rename** `DIALER_API_KEY` variable
5. Redeploy
6. Update after testing

## Recommended Production Setup

```bash
# In Render Environment Variables:
DIALER_API_KEY=margav-dialer-key-2024-$(date +%s)

# In your dialer configuration:
https://crm.margav.energy/api/leads/from-dialer/?api_key=margav-dialer-key-2024-1727437980&...
```

## Check Current Configuration

To see what's currently set on Render:
1. Go to backend service
2. Click "Logs" tab
3. Filter for "DIALER_API_KEY"
4. You should see configuration logs


