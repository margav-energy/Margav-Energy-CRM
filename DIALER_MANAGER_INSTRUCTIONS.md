# 📞 Instructions for Dialer Manager

## Overview
Your dialer system can now redirect agents directly to a pre-filled lead form in the Margav Energy CRM. When an agent clicks "Interested" or similar action, they'll be taken to a CRM page with customer details already filled in.

## 🔗 Integration URL

**Base URL:**
```
https://crm.margav.energy/agent-form
```

## 📋 Required URL Parameters

Your dialer should redirect to the above URL and include these parameters as query strings:

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `first_name` | ✅ Yes | Customer's first name | `Jane` |
| `last_name` | ✅ Yes | Customer's last name | `Doe` |
| `phone` | ✅ Yes | Customer's phone number (include country code) | `+44123456789` |
| `postcode` | ✅ Yes | Customer's postcode | `SW1A 1AA` |
| `email` | ❌ No | Customer's email address | `jane.doe@example.com` |
| `data_list_name` | ❌ No | Campaign/list name | `Summer_2024_Campaign` |
| `agent` | ❌ No | Dialer agent name | `John Smith` |
| `source` | ❌ No | Lead source (used if `data_list_name` not provided) | `Summer_2024_Campaign` |

## 🔗 Example Redirect URL

```
https://crm.margav.energy/agent-form?data_list_name=Summer_2024_Campaign&first_name=Jane&last_name=Doe&email=jane.doe@example.com&phone=%2B44123456789&postcode=SW1A%201AA&agent=John%20Smith&source=Summer_2024_Campaign
```

**Note:** Make sure to URL-encode special characters:
- Spaces → `%20`
- `+` → `%2B`
- `&` → `%26`
- etc.

## ⚙️ How It Works

1. **Agent clicks "Interested"** in your dialer system
2. **Dialer redirects** to the CRM form URL with customer parameters
3. **CRM checks authentication:**
   - If agent is logged in → Form opens immediately
   - If agent is not logged in → Redirects to login, then back to form
4. **Form pre-fills** with customer data from URL parameters
5. **Agent completes** remaining property/energy details
6. **Agent submits** form:
   - **Option 1:** "Create Lead" → Creates lead normally
   - **Option 2:** "Create & Send to Qualifier" → Creates lead and sends directly to qualifier team

## ✅ Minimum Required Parameters

At minimum, you must provide:
- `first_name` OR `last_name` (at least one)
- `phone`
- `postcode`

## 🧪 Testing

### Test URL (Copy and paste into browser):
```
https://crm.margav.energy/agent-form?data_list_name=Test_Campaign&first_name=Jane&last_name=Doe&email=jane.doe@example.com&phone=%2B44123456789&postcode=SW1A%201AA&agent=Test%20Agent&source=Test_Campaign
```

### Testing Steps:
1. Ensure you're logged into the CRM as an agent
2. Paste the test URL into your browser
3. Verify the form shows pre-filled data:
   - Name: "Jane Doe"
   - Phone: "+44123456789"
   - Email: "jane.doe@example.com"
   - Postcode: "SW1A 1AA"
4. Fill in remaining fields and submit
5. Check your agent dashboard to confirm the lead was created

## 🔒 Security Notes

- The form page is **protected** - only logged-in CRM users can access it
- If an agent is not logged in, they'll be prompted to log in first
- URL parameters are preserved during the login redirect

## 📝 What Gets Saved

- **Contact Information:** Name, phone, email, postcode (from URL parameters)
- **Dialer Metadata:** Agent name, source, data list name (stored in lead notes)
- **Form Data:** Property details, energy usage, timeframe (filled by agent)
- **Lead Assignment:** Automatically assigned to the logged-in CRM agent

## 🚨 Important Notes

1. **Phone Number Format:** Include country code (e.g., `+44` for UK)
2. **URL Encoding:** Always URL-encode special characters in parameters
3. **Authentication:** Agents must be logged into the CRM to access the form
4. **Lead Creation:** Leads are automatically assigned to the logged-in agent
5. **Send to Qualifier:** Agents can choose to send leads directly to qualifiers

## ❓ Support

If you have questions or need help:
- **Email:** tech@margav.energy
- **Documentation:** See `DIALER_FORM_URL_GUIDE.md` for detailed technical documentation

---

## Quick Reference Card

**URL:** `https://crm.margav.energy/agent-form`

**Required Parameters:**
- `first_name` (or `last_name`)
- `phone`
- `postcode`

**Optional Parameters:**
- `last_name`
- `email`
- `data_list_name`
- `agent`
- `source`

**Example:**
```
https://crm.margav.energy/agent-form?first_name=Jane&last_name=Doe&phone=%2B44123456789&postcode=SW1A%201AA
```

