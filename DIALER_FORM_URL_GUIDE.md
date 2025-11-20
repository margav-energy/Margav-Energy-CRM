# 📋 Dialer Agent Form URL Guide

## Overview

The CRM now has a dedicated agent form page that can be accessed directly from the dialer system. When an agent clicks "Interested", the dialer should redirect to this form URL with customer information pre-filled.

## Form URL

```
https://crm.margav.energy/agent-form
```

## URL Parameters

The dialer should append the following parameters to the URL:

| Parameter | Dialer Variable | Description | Example |
|-----------|----------------|-------------|---------|
| `data_list_name` | `{misc.data_list.name}` | Name of the data list/campaign | `Solar_Leads_2024` |
| `first_name` | `{contact.firstname}` | Customer's first name | `John` |
| `last_name` | `{contact.lastname}` | Customer's last name | `Smith` |
| `email` | `{contact.email}` | Customer's email address | `john.smith@example.com` |
| `phone` | `{contact.tel1}` | Customer's phone number | `+447956582788` |
| `postcode` | `{contact.postcode}` | Customer's postcode | `SW1A 1AA` |
| `agent` | `{interaction.user.display_name}` | Agent's display name | `John Doe` |
| `source` | `{misc.data_list.name}` | Source/campaign name | `Solar_Leads_2024` |

## Complete URL Example

```
https://crm.margav.energy/agent-form?data_list_name=Solar_Leads_2024&first_name=John&last_name=Smith&email=john.smith@example.com&phone=%2B447956582788&postcode=SW1A%201AA&agent=John%20Doe&source=Solar_Leads_2024
```

## How It Works

1. **Agent clicks "Interested"** on the dialer
2. **Dialer redirects** to the form URL with parameters
3. **Agent sees pre-filled form** with customer information
4. **Agent completes** additional form fields (property info, energy usage, etc.)
5. **Agent submits** the form
6. **Lead is created** in the CRM and assigned to the logged-in agent
7. **Agent is redirected** to their dashboard

## Required Parameters

**Minimum required for form to work:**
- `phone` - Customer's phone number (required)
- `first_name` OR `last_name` - At least one name field (required)

**Optional but recommended:**
- `email` - Customer's email
- `postcode` - Customer's postcode
- `agent` - Agent's display name (for reference in notes)
- `source` / `data_list_name` - Campaign/source information

## Authentication

- The form page requires the agent to be **logged in** to the CRM
- If not logged in, the agent will be redirected to the login page
- After login, they'll be redirected back to the form with parameters preserved
- The lead will be **automatically assigned** to the logged-in agent

## Form Fields

The form includes all standard lead fields:

### Contact Information
- Full Name (pre-filled from first_name + last_name)
- Phone Number (pre-filled)
- Email Address (pre-filled)
- Address
- City
- Postcode (pre-filled)

### Property Information
- Property Ownership
- Property Type
- Number of Bedrooms
- Roof Type
- Roof Material

### Energy Usage
- Average Monthly Electricity Bill
- Energy Bill Amount
- Has EV Charger
- Day/Night Rate
- Current Energy Supplier
- Electric Heating/Appliances
- Energy Details

### Timeframe & Interest
- Timeframe
- Moving Properties Next 5 Years
- Timeframe Details
- Previous Quotes
- Previous Quotes Details

### Additional Notes
- Any additional notes or comments

## Implementation in Dialer

### Example Redirect Code

```javascript
// When agent clicks "Interested" button
function handleInterestedClick(contact, interaction, misc) {
  const params = new URLSearchParams({
    data_list_name: misc.data_list.name,
    first_name: contact.firstname,
    last_name: contact.lastname,
    email: contact.email,
    phone: contact.tel1,
    postcode: contact.postcode,
    agent: interaction.user.display_name,
    source: misc.data_list.name
  });
  
  const formUrl = `https://crm.margav.energy/agent-form?${params.toString()}`;
  
  // Redirect to form
  window.location.href = formUrl;
}
```

### URL Encoding

Make sure to properly encode URL parameters:
- Spaces should be encoded as `%20` or `+`
- Special characters should be URL-encoded
- Phone numbers with `+` should be encoded as `%2B`

## Testing

### Test URL

You can test the form with this sample URL:

```
https://crm.margav.energy/agent-form?data_list_name=Test_Campaign&first_name=Jane&last_name=Doe&email=jane.doe@example.com&phone=%2B44123456789&postcode=SW1A%201AA&agent=Test%20Agent&source=Test_Campaign
```

### Expected Behavior

1. Form opens with pre-filled data
2. Agent can see customer name and phone number highlighted
3. Agent can complete remaining fields
4. Form submits successfully
5. Lead appears in agent's dashboard
6. Lead is assigned to the logged-in agent

## Benefits

✅ **Simplified Integration** - Dialer only needs to redirect with basic info  
✅ **Better UX** - Agent completes form in CRM with full validation  
✅ **No API Calls** - Dialer doesn't need to call the API endpoint  
✅ **Automatic Assignment** - Lead automatically assigned to logged-in agent  
✅ **Full Form Support** - All form fields available for agent to complete  
✅ **Secure** - Requires authentication, prevents unauthorized access  

## Alternative: API Endpoint (Still Available)

If you prefer to use the API endpoint instead, it's still available:

```
POST https://crm.margav.energy/api/leads/from-dialer/
```

See `DIALER_API_DOCUMENTATION.md` for API details.

## Support

For questions or issues:
- Check the form URL is correct: `https://crm.margav.energy/agent-form`
- Ensure required parameters are included (phone + name)
- Verify agent is logged in to CRM
- Check browser console for any errors

---

**Ready to integrate!** 🚀

