# 🚀 Quick Integration Guide for Dialer Creator

## What You Need to Do

### 1. **API Endpoint**

```
POST https://yourdomain.com/api/leads/from-dialer/
```

### 2. **When Agent Clicks "Interested"**

```javascript
// Collect lead data from your dialer
const leadData = {
  full_name: "John Smith",
  phone: "+44123456789",
  email: "john@example.com",
  notes: "Interested in solar panels",
  agent_username: "agent1", // Get this from your agent session
};

// Call the API
const response = await fetch("https://yourdomain.com/api/leads/from-dialer/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(leadData),
});

const result = await response.json();

if (response.ok) {
  // Success! Redirect agent to CRM
  const redirectURL = `https://yourdomain.com/agent-dashboard?from_dialer=true&lead_id=${
    result.lead.id
  }&full_name=${encodeURIComponent(
    result.lead.full_name
  )}&phone=${encodeURIComponent(result.lead.phone)}&email=${encodeURIComponent(
    result.lead.email || ""
  )}&notes=${encodeURIComponent(result.lead.notes || "")}`;

  window.location.href = redirectURL;
} else {
  // Show error to agent
  alert("Failed to create lead: " + result.error);
}
```

### 3. **Required Fields**

- `full_name` (string) - Lead's full name
- `phone` (string) - Lead's phone number
- `agent_username` (string) - Username of the agent who clicked "Interested"

### 4. **Optional Fields**

- `email` (string) - Lead's email address
- `notes` (string) - Additional notes about the lead

### 5. **Response Format**

```json
{
  "success": true,
  "lead": {
    "id": 123,
    "full_name": "John Smith",
    "phone": "+44123456789",
    "email": "john@example.com",
    "status": "interested",
    "assigned_agent_name": "Agent One",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### 6. **Error Handling**

- **400 Bad Request**: Missing required fields
- **404 Not Found**: Agent username not found
- **500 Internal Server Error**: Server error

### 7. **Testing**

Use the provided `dialer_integration_example.html` file to test the integration before going live.

### 8. **Production Checklist**

- [ ] Update API URL to production domain
- [ ] Test with real agent usernames
- [ ] Implement error handling
- [ ] Add logging for debugging
- [ ] Test redirect functionality

## Questions?

Contact: tech@margav.energy

