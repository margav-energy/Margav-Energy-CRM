# 📞 Dialer Integration API Documentation

## Overview

This API allows the dialer system to create leads in the Margav Energy CRM when agents click "Interested" during calls. The API now supports comprehensive dialer data with all fields from the dialer system.

## Base URL

```
https://crm.margav.energy/api
```

## Authentication

In production, the endpoint requires an API key.

- Header: `X-Dialer-Api-Key: margav-dialer-2024-secure-key-12345`
- If the key is missing or invalid, the API responds with `401 Unauthorized`.

## Endpoints

### Create Lead from Dialer

Preferred: **POST** `/leads/from-dialer/`

Compatibility: **GET** `/leads/from-dialer/?...`

Creates a new lead or updates an existing one when an agent clicks "Interested" on the dialer. For systems that can only perform GET requests, the endpoint now accepts query parameters and validates the API key via either the `X-Dialer-Api-Key` header or `api_key` query parameter.

#### Request Headers (POST)

```
Content-Type: application/json
X-Dialer-Api-Key: margav-dialer-2024-secure-key-12345
```

#### Request Body (POST)

The API accepts comprehensive dialer data. Preferred identity fields are shown first.

```json
{
  // Core identification (one required)
  "dialer_user_id": "string (preferred - stable dialer user ID: CalebG, DaniC, JakeR, LeiaG, LibbyL, ImaniU, Tyler)",
  "user": "string (fallback - CRM/dialer username)",

  // Lead identification
  "lead_id": "string (optional - dialer's lead ID)",
  "vendor_id": "string (optional)",
  "list_id": "string (optional)",
  "gmt_offset_now": "string (optional)",
  "phone_code": "string (optional)",
  "phone_number": "string (optional)",

  // Name components
  "title": "string (optional)",
  "first_name": "string (optional)",
  "middle_initial": "string (optional)",
  "last_name": "string (optional)",
  "full_name": "string (optional - will be built from components if not provided)",

  // Address components
  "address1": "string (optional)",
  "address2": "string (optional)",
  "address3": "string (optional)",
  "city": "string (optional)",
  "state": "string (optional)",
  "province": "string (optional)",
  "postal_code": "string (optional)",
  "country_code": "string (optional)",

  // Personal details
  "gender": "string (optional)",
  "date_of_birth": "string (optional - YYYY-MM-DD format)",
  "alt_phone": "string (optional)",
  "security_phrase": "string (optional)",

  // Contact information
  "phone": "string (optional - will use phone_number if not provided)",
  "email": "string (optional)",
  "comments": "string (optional)",

  // Dialer system fields
  "campaign": "string (optional)",
  "phone_login": "string (optional)",
  "fronter": "string (optional)",
  "closer": "string (optional)",
  "group": "string (optional)",
  "channel_group": "string (optional)",
  "SQLdate": "string (optional)",
  "epoch": "string (optional)",
  "uniqueid": "string (optional)",
  "customer_zap_channel": "string (optional)",
  "server_ip": "string (optional)",
  "SIPexten": "string (optional)",
  "session_id": "string (optional)",
  "dialed_number": "string (optional)",
  "dialed_label": "string (optional)",
  "rank": "string (optional)",
  "owner": "string (optional)",
  "camp_script": "string (optional)",
  "in_script": "string (optional)",
  "script_width": "string (optional)",
  "script_height": "string (optional)",
  "recording_file": "string (optional)",

  // Energy section fields (new in v1.1.0)
  "energy_bill_amount": "decimal (optional - specific energy bill amount)",
  "has_ev_charger": "boolean (optional - whether lead has EV charger)",
  "day_night_rate": "string (optional - yes/no/unsure for time-of-use rates)",
  "has_previous_quotes": "boolean (optional - whether lead has had previous quotes)",
  "previous_quotes_details": "string (optional - details about previous quotes)"
}
```

#### Query Parameters (GET compatibility)

- api_key: Dialer API key if header cannot be set
- user or dialer_user_id: Agent identifier (at least one required)
- fullname or full_name: Lead full name
- phone_number or phone: Lead phone number
- recording_filename or recording_file: Call recording filename
- All other fields listed in the POST body are accepted as query parameters (optional)

#### Field Descriptions

**Required Fields:**

- One of: `dialer_user_id` (preferred) or `user` (username)
- Valid `dialer_user_id` values: `CalebG`, `DaniC`, `JakeR`, `LeiaG`, `LibbyL`, `ImaniU`, `Tyler`

**Core Fields:**

- `lead_id`: Original lead ID from dialer system (optional)
- `phone_number` or `phone`: Phone number of the lead (optional)
- `first_name`, `last_name`: Name components (optional)
- `full_name`: Full name (optional - will be built from components if not provided)

**Address Fields:**

- `address1`, `address2`, `address3`: Address components (optional)
- `city`, `state`, `province`: Location details (optional)
- `postal_code`: Postal/ZIP code (optional)
- `country_code`: Country code (optional)

**Dialer System Fields:**

- `campaign`: Campaign identifier (optional)
- `session_id`: Call session ID (optional)
- `dialed_number`: Number that was dialed (optional)
- `recording_file`: Call recording file path (optional)
- And many more system-specific fields...

**Energy Section Fields (New in v1.1.0):**

- `energy_bill_amount`: Specific energy bill amount if known (optional)
- `has_ev_charger`: Whether the lead has an EV charger (optional)
- `day_night_rate`: Whether the lead has day/night rates (optional)
- `has_previous_quotes`: Whether the lead has had previous quotes (optional)
- `previous_quotes_details`: Details about previous quotes if any (optional)

#### Response Codes

- `201`: Lead created/updated successfully
- `400`: Bad request (missing required fields or validation errors)
- `404`: Agent not found
- `500`: Internal server error

#### Success Response (201)

```json
{
  "success": true,
  "lead": {
    "id": 123,
    "full_name": "John A Smith",
    "phone": "+44123456789",
    "email": "john.smith@example.com",
    "status": "interested",
    "assigned_agent_name": "Caleb Galloway",
    "assigned_agent_username": "CalebG",
    "dialer_lead_id": "DIALER_12345",
    "vendor_id": "VENDOR_001",
    "list_id": "LIST_12345",
    "address1": "123 Solar Street",
    "city": "London",
    "postal_code": "SW1A 1AA",
    "campaign": "Solar_Campaign_2024",
    "session_id": "SESSION_12345",
    "recording_file": "recording_12345.wav",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Lead created successfully"
}
```

#### Error Response (400)

```json
{
  "error": "Missing required fields: user"
}
```

#### Error Response (404)

```json
{
  "error": "Agent with dialer_user_id 'CalebG' not found"
}
```

## Integration Examples

### JavaScript/Node.js (POST)

```javascript
async function createLeadFromDialer(leadData) {
  try {
    const response = await fetch(
      "https://crm.margav.energy/api/leads/from-dialer/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dialer-Api-Key": "margav-dialer-2024-secure-key-12345",
        },
        body: JSON.stringify(leadData),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("Lead created:", result.lead);
      return result.lead;
    } else {
      console.error("Error creating lead:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Network error:", error);
    throw error;
  }
}

// Usage
const leadData = {
  dialer_user_id: "CalebG", // preferred - use actual agent usernames
  // user: "CalebG", // fallback if mapping not available
  full_name: "John Smith",
  phone: "+44123456789",
  email: "john@example.com",
  address1: "123 Main Street",
  city: "London",
  postal_code: "SW1A 1AA",
  notes: "Interested in solar panels",
};

createLeadFromDialer(leadData);
```

### GET Compatibility Example

```bash
curl "https://crm.margav.energy/api/leads/from-dialer/?api_key=margav-dialer-2024-secure-key-12345&user=CalebG&fullname=John%20Smith&phone_number=%2B44123456789&recording_filename=rec_123.wav&lead_id=67770"
```

### Python (POST)

```python
import requests
import json

def create_lead_from_dialer(lead_data):
    url = "https://crm.margav.energy/api/leads/from-dialer/"

    try:
        response = requests.post(url, json=lead_data, headers={"X-Dialer-Api-Key": "margav-dialer-2024-secure-key-12345"})
        response.raise_for_status()

        result = response.json()
        print(f"Lead created: {result['lead']}")
        return result['lead']

    except requests.exceptions.RequestException as e:
        print(f"Error creating lead: {e}")
        if e.response:
            print(f"Response: {e.response.text}")
        raise

# Usage
lead_data = {
    "dialer_user_id": "CalebG",
    "full_name": "John Smith",
    "phone": "+44123456789",
    "email": "john@example.com",
    "address1": "123 Main Street",
    "city": "London",
    "postal_code": "SW1A 1AA",
    "notes": "Interested in solar panels"
}

create_lead_from_dialer(lead_data)
```

### PHP

```php
<?php
function createLeadFromDialer($leadData) {
    $url = 'https://crm.margav.energy/api/leads/from-dialer/';

    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\nX-Dialer-Api-Key: margav-dialer-2024-secure-key-12345\r\n",
            'method' => 'POST',
            'content' => json_encode($leadData)
        ]
    ];

    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);

    if ($result === FALSE) {
        throw new Exception('Failed to create lead');
    }

    $response = json_decode($result, true);
    return $response;
}

// Usage
$leadData = [
    'dialer_user_id' => 'CalebG',
    'full_name' => 'John Smith',
    'phone' => '+44123456789',
    'email' => 'john@example.com',
    'address1' => '123 Main Street',
    'city' => 'London',
    'postal_code' => 'SW1A 1AA',
    'notes' => 'Interested in solar panels'
];

$result = createLeadFromDialer($leadData);
echo "Lead created: " . json_encode($result['lead']);
?>
```

## Workflow Integration

### 1. Agent Clicks "Interested"

When an agent clicks the "Interested" button on the dialer:

1. Collect lead information from the call
2. Call the API endpoint with the lead data
3. Handle the response appropriately

### 2. Redirect to CRM Dashboard

After successful API call:

1. Extract the lead ID from the response
2. Construct the redirect URL:
   ```
   https://crm.margav.energy/agent-dashboard?from_dialer=true&lead_id=123&full_name=John%20Smith&phone=%2B44123456789&email=john%40example.com&notes=Interested%20in%20solar%20panels
   ```
3. Redirect the agent to the CRM dashboard

### 3. Error Handling

- If API call fails, show error message to agent
- Retry mechanism for network failures
- Log all API calls for debugging

## Testing

### Test Endpoint

You can test the API using curl:

```bash
curl -X POST https://crm.margav.energy/api/leads/from-dialer/ \
  -H "Content-Type: application/json" \
  -H "X-Dialer-Api-Key: margav-dialer-2024-secure-key-12345" \
  -d '{
    "dialer_user_id": "CalebG",
    "full_name": "Test Lead",
    "phone": "+44123456789",
    "email": "test@example.com",
    "address1": "123 Test Street",
    "city": "London",
    "postal_code": "SW1A 1AA",
    "notes": "Test lead from dialer"
  }'
```

### Test Data

Use these test agent usernames:

- `CalebG` (Caleb Galloway)
- `DaniC` (Danielle Crutchley)
- `JakeR` (Jake Rose)
- `LeiaG` (Leia Garbitt)
- `LibbyL` (Liberty Liddle-Old)
- `ImaniU` (Roheece Imani Hines)
- `Tyler` (Tyler Gittoes-Lemm)

## Security Considerations

### Production Security (Implemented)

1. **API Key Authentication**: Required in headers (X-Dialer-Api-Key)
2. **IP Allowlisting**: Restrict access to known dialer IP addresses
3. **HMAC Signature Validation**: Prevent request tampering and replay attacks
4. **Timestamp Validation**: 5-minute window to prevent replay attacks
5. **HTTPS Only**: All communication must be over HTTPS

### Environment Variables for Security

```bash
# Required
DIALER_API_KEY=margav-dialer-2024-secure-key-12345

# Production security (recommended)
DIALER_SECRET_KEY=your-hmac-secret-key-for-signatures
DIALER_ALLOWED_IPS=77.68.78.43,192.168.1.100
```

### Secure Request Example (Production)

```javascript
// Generate HMAC signature for production
function generateSignature(data, secretKey) {
  const canonicalParams = [];
  for (const key of Object.keys(data).sort()) {
    if (!['api_key', 'signature'].includes(key)) {
      canonicalParams.push(`${key}=${data[key]}`);
    }
  }
  const canonicalString = canonicalParams.join('&');
  
  return require('crypto')
    .createHmac('sha256', secretKey)
    .update(canonicalString)
    .digest('hex');
}

// Make secure request
const timestamp = Math.floor(Date.now() / 1000);
const signature = generateSignature(leadData, 'your-hmac-secret-key');

const response = await fetch(
  "https://crm.margav.energy/api/leads/from-dialer/",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dialer-Api-Key": "margav-dialer-2024-secure-key-12345",
      "X-Dialer-Signature": signature,
      "X-Dialer-Timestamp": timestamp.toString(),
    },
    body: JSON.stringify(leadData),
  }
);
```

### Development vs Production

- **Development**: Query param `api_key` allowed for testing
- **Production**: Only header-based authentication with HMAC signatures
- **IP Allowlisting**: Configure `DIALER_ALLOWED_IPS` in production

## Support

For technical support or questions about the API integration:

- Email: tech@margav.energy
- Documentation: This file
- API Status: https://crm.margav.energy/api/

## Changelog

### Version 1.1.0

- Added energy section fields (energy_bill_amount, has_ev_charger, day_night_rate, has_previous_quotes, previous_quotes_details)
- Updated agent user mapping to real usernames (CalebG, DaniC, JakeR, etc.)
- Updated API endpoint to production URL (crm.margav.energy)
- Added comprehensive address fields support

### Version 1.0.0

- Initial API release
- Support for creating leads from dialer
- Basic error handling
