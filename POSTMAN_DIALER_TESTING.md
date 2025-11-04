# 🧪 Postman Testing Guide for Dialer Integration

## Quick Test Setup

### Step 1: Create a New Request in Postman

1. Open Postman
2. Click **New** → **HTTP Request**
3. Name it: `Create Lead from Dialer`

### Step 2: Configure the Request

#### **Method & URL**
```
Method: POST
URL: https://crm.margav.energy/api/leads/from-dialer/
```

#### **Headers Tab**
Add these headers:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `X-Dialer-Api-Key` | `margav-dialer-2024-secure-key-12345` |

**Note:** Postman is case-sensitive for headers. Use exactly `X-Dialer-Api-Key` (capital X, D, A, K).

#### **Body Tab**
1. Select **raw**
2. Select **JSON** from the dropdown
3. Paste this JSON body (matching your dialer format):

```json
{
  "email": "l.andrews416@icloud.com",
  "first_name": "Lisa",
  "last_name": "Andrews",
  "phone": "+447956582788",
  "postal_code": "ST14 8NF",
  "user": "James Sykes"
}
```

### Step 3: Send the Request

Click **Send** and check the response.

## Expected Responses

### ✅ Success Response (201 Created)

```json
{
  "success": true,
  "lead": {
    "id": 123,
    "full_name": "Lisa Andrews",
    "phone": "+447956582788",
    "email": "l.andrews416@icloud.com",
    "postal_code": "ST14 8NF",
    "status": "interested",
    "assigned_agent_name": "James Sykes",
    "assigned_agent_username": "James Sykes",
    "created_at": "2025-11-04T12:47:00Z",
    "updated_at": "2025-11-04T12:47:00Z"
  },
  "message": "Lead created successfully"
}
```

### ❌ Error Responses

#### 401 Unauthorized - Invalid API Key
```json
{
  "error": "Invalid API key"
}
```
**Fix:** Check that `X-Dialer-Api-Key` header matches your `DIALER_API_KEY` environment variable.

#### 401 Unauthorized - Missing Security Headers
```json
{
  "error": "Missing security headers"
}
```
**Fix:** This should no longer occur after the fix. If it does, check that `DIALER_SECRET_KEY` is NOT set in your environment.

#### 400 Bad Request - Missing Required Fields
```json
{
  "error": "Missing required fields: user"
}
```
**Fix:** Ensure the `user` or `dialer_user_id` field is included in the request body.

#### 404 Not Found - Agent Not Found
```json
{
  "error": "Agent with username 'James Sykes' not found"
}
```
**Fix:** Ensure the agent username exists in your CRM. Check valid usernames in the admin panel.

## Test Scenarios

### Test 1: Minimal Request (Only Required Fields)

```json
{
  "user": "CalebG",
  "phone": "+44123456789"
}
```

### Test 2: Full Request (All Fields)

```json
{
  "user": "CalebG",
  "first_name": "John",
  "last_name": "Smith",
  "full_name": "John Smith",
  "phone": "+44123456789",
  "email": "john@example.com",
  "address1": "123 Main Street",
  "city": "London",
  "postal_code": "SW1A 1AA",
  "notes": "Interested in solar panels",
  "dialer_lead_id": "DL123456",
  "campaign": "Solar_2024",
  "session_id": "SESSION_123"
}
```

### Test 3: Using dialer_user_id (Preferred)

```json
{
  "dialer_user_id": "CalebG",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+44123456789",
  "email": "jane@example.com"
}
```

### Test 4: Test Error Handling

Try sending without the `user` field:
```json
{
  "first_name": "Test",
  "phone": "+44123456789"
}
```
Expected: 400 error with "Missing required fields: user"

## Postman Collection Setup

### Option 1: Import Existing Collection

1. In Postman, click **Import**
2. Select the file: `Margav_Energy_CRM.postman_collection.json`
3. The collection will include dialer endpoints

### Option 2: Create Environment Variables

1. Click **Environments** → **+**
2. Name it: `Margav CRM Production`
3. Add variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `https://crm.margav.energy/api` | `https://crm.margav.energy/api` |
| `dialer_api_key` | `margav-dialer-2024-secure-key-12345` | `margav-dialer-2024-secure-key-12345` |

4. Use in URL: `{{base_url}}/leads/from-dialer/`
5. Use in Headers: `{{dialer_api_key}}`

## Testing Different Agent Usernames

Use these valid agent usernames for testing:

- `CalebG` (Caleb Galloway)
- `DaniC` (Danielle Crutchley)
- `JakeR` (Jake Rose)
- `LeiaG` (Leia Garbitt)
- `LibbyL` (Liberty Liddle-Old)
- `ImaniU` (Roheece Imani Hines)
- `Tyler` (Tyler Gittoes-Lemm)

Or use any username that exists in your CRM.

## Troubleshooting

### Issue: "Invalid API key" Error

**Check:**
1. Header name is exactly `X-Dialer-Api-Key` (case-sensitive)
2. API key value matches your `DIALER_API_KEY` environment variable
3. No extra spaces in the header value

**Solution:**
- In Postman, go to Headers tab
- Make sure the header is exactly: `X-Dialer-Api-Key: margav-dialer-2024-secure-key-12345`
- Check for hidden characters or spaces

### Issue: "Missing security headers" Error

**This should be fixed**, but if you still see it:

**Check:**
1. Ensure `DIALER_SECRET_KEY` is NOT set in your environment
2. If it is set, you'll need to implement HMAC signatures (see below)

**Solution:**
- Remove `DIALER_SECRET_KEY` from your environment variables
- Redeploy your backend
- Test again

### Issue: "Agent not found" Error

**Check:**
1. The username in the `user` field exists in your CRM
2. The user account is active

**Solution:**
- Check admin panel: `https://crm.margav.energy/admin/accounts/user/`
- Use the exact username (case-sensitive)
- Or create a DialerUserLink mapping (see below)

## Advanced: HMAC Signature Testing (If DIALER_SECRET_KEY is Set)

If you have `DIALER_SECRET_KEY` configured, you need to add HMAC signature headers.

### Pre-request Script

Add this to Postman's **Pre-request Script** tab:

```javascript
// HMAC Signature Generation
const crypto = require('crypto-js');

// Get the request body
const body = pm.request.body.raw;
const bodyData = JSON.parse(body);

// Create canonical string (sort keys alphabetically)
const canonicalParams = [];
for (const key of Object.keys(bodyData).sort()) {
    if (!['api_key', 'signature'].includes(key)) {
        canonicalParams.push(`${key}=${bodyData[key]}`);
    }
}
const canonicalString = canonicalParams.join('&');

// Generate HMAC signature
const secretKey = pm.environment.get('dialer_secret_key') || 'your-secret-key';
const timestamp = Math.floor(Date.now() / 1000);

const signature = crypto.HmacSHA256(canonicalString, secretKey).toString();

// Set headers
pm.request.headers.add({
    key: 'X-Dialer-Signature',
    value: signature
});

pm.request.headers.add({
    key: 'X-Dialer-Timestamp',
    value: timestamp.toString()
});
```

## Quick Test Checklist

Before sending to dialer manager, verify:

- [ ] Request method is `POST`
- [ ] URL is correct: `https://crm.margav.energy/api/leads/from-dialer/`
- [ ] Header `X-Dialer-Api-Key` is set correctly
- [ ] Header `Content-Type` is `application/json`
- [ ] Body contains `user` or `dialer_user_id` field
- [ ] Body contains at least `phone` or `phone_number`
- [ ] Response is `201 Created` with lead data
- [ ] Lead appears in CRM admin panel
- [ ] Lead is assigned to correct agent

## Example: Complete Postman Request Export

Save this as a Postman collection:

```json
{
  "info": {
    "name": "Dialer Integration Test",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Lead from Dialer",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "X-Dialer-Api-Key",
            "value": "margav-dialer-2024-secure-key-12345"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"l.andrews416@icloud.com\",\n  \"first_name\": \"Lisa\",\n  \"last_name\": \"Andrews\",\n  \"phone\": \"+447956582788\",\n  \"postal_code\": \"ST14 8NF\",\n  \"user\": \"James Sykes\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://crm.margav.energy/api/leads/from-dialer/",
          "protocol": "https",
          "host": ["crm", "margav", "energy"],
          "path": ["api", "leads", "from-dialer", ""]
        }
      }
    }
  ]
}
```

## Next Steps

1. ✅ Test in Postman first
2. ✅ Verify lead is created in CRM
3. ✅ Check lead appears in agent dashboard
4. ✅ Share endpoint details with dialer manager
5. ✅ Monitor logs for any issues

---

**Ready to test!** 🚀

