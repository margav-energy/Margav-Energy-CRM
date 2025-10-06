# 📞 Dialer Integration API Documentation

## Overview

This API allows the dialer system to create leads in the Margav Energy CRM when agents click "Interested" during calls. The API now supports comprehensive dialer data with all fields from the dialer system.

## Base URL

```
https://yourdomain.com/api
```

## Authentication

In production, the endpoint requires an API key.

- Header: `X-Dialer-Api-Key: <YOUR_API_KEY>`
- If the key is missing or invalid, the API responds with `401 Unauthorized`.

## Endpoints

### Create Lead from Dialer

**POST** `/leads/from-dialer/`

Creates a new lead or updates an existing one when an agent clicks "Interested" on the dialer.

#### Request Headers

```
Content-Type: application/json
X-Dialer-Api-Key: <YOUR_API_KEY>
```

#### Request Body

The API accepts comprehensive dialer data. Preferred identity fields are shown first.

```json
{
  // Core identification (one required)
  "dialer_user_id": "string (preferred - stable dialer user ID)",
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
  "recording_file": "string (optional)"
}
```

#### Field Descriptions

**Required Fields:**

- One of: `dialer_user_id` (preferred) or `user` (username)

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
    "assigned_agent_name": "Agent One",
    "assigned_agent_username": "agent1",
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
  "error": "Agent with username 'agent1' not found"
}
```

## Integration Examples

### JavaScript/Node.js

```javascript
async function createLeadFromDialer(leadData) {
  try {
    const response = await fetch(
      "https://yourdomain.com/api/leads/from-dialer/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dialer-Api-Key": process.env.DIALER_API_KEY,
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
  dialer_user_id: "vicidial_user_123", // preferred
  // user: "agent1", // fallback if mapping not available
  full_name: "John Smith",
  phone: "+44123456789",
  email: "john@example.com",
  notes: "Interested in solar panels",
};

createLeadFromDialer(leadData);
```

### Python

```python
import requests
import json

def create_lead_from_dialer(lead_data):
    url = "https://yourdomain.com/api/leads/from-dialer/"

    try:
        response = requests.post(url, json=lead_data, headers={"X-Dialer-Api-Key": "YOUR_API_KEY"})
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
    "full_name": "John Smith",
    "phone": "+44123456789",
    "email": "john@example.com",
    "notes": "Interested in solar panels",
    "agent_username": "agent1"
}

create_lead_from_dialer(lead_data)
```

### PHP

```php
<?php
function createLeadFromDialer($leadData) {
    $url = 'https://yourdomain.com/api/leads/from-dialer/';

    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\nX-Dialer-Api-Key: YOUR_API_KEY\r\n",
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
    'full_name' => 'John Smith',
    'phone' => '+44123456789',
    'email' => 'john@example.com',
    'notes' => 'Interested in solar panels',
    'agent_username' => 'agent1'
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
   https://yourdomain.com/agent-dashboard?from_dialer=true&lead_id=123&full_name=John%20Smith&phone=%2B44123456789&email=john%40example.com&notes=Interested%20in%20solar%20panels
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
curl -X POST https://yourdomain.com/api/leads/from-dialer/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Lead",
    "phone": "+44123456789",
    "email": "test@example.com",
    "notes": "Test lead from dialer",
    "agent_username": "agent1"
  }'
```

### Test Data

Use these test agent usernames:

- `agent1`
- `agent2`
- `agent3`

## Security Considerations

### For Production

1. **API Key Authentication**: Implement API key authentication
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **IP Whitelisting**: Restrict access to known IP addresses
4. **HTTPS Only**: Ensure all communication is over HTTPS

### Example with API Key

```javascript
const response = await fetch("https://yourdomain.com/api/leads/from-dialer/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Dialer-Api-Key": process.env.DIALER_API_KEY || "YOUR_API_KEY",
  },
  body: JSON.stringify(leadData),
});
```

## Support

For technical support or questions about the API integration:

- Email: tech@margav.energy
- Documentation: [Link to your documentation]
- API Status: [Link to status page]

## Changelog

### Version 1.0.0

- Initial API release
- Support for creating leads from dialer
- Basic error handling
