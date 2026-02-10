# 🧪 How to Test the Dialer Update

## Quick Test in Postman

### Step 1: Import the JSON Payload

1. Open Postman
2. Create a new request: **POST** `https://crm.margav.energy/api/leads/from-dialer/`

### Step 2: Set Headers

In the **Headers** tab, add:
- `Content-Type`: `application/json`
- `X-Dialer-Api-Key`: `margav-dialer-2024-secure-key-12345`

### Step 3: Set Body

1. Go to **Body** tab
2. Select **raw** and **JSON**
3. Copy and paste from `test_dialer_payload.json` or `test_dialer_payload_simple.json`

### Step 4: Send Request

Click **Send** and check the response.

## Expected Response

### ✅ Success (201 Created)

```json
{
  "success": true,
  "lead": {
    "id": 123,
    "full_name": "John Smith",
    "phone": "+447956582788",
    "email": "john.smith@example.com",
    "status": "interested",
    "assigned_agent_name": "Caleb Galloway",
    "assigned_agent_username": "CalebG",
    "created_at": "2025-11-04T12:47:00Z"
  },
  "message": "Lead created successfully"
}
```

## Test Files

### `test_dialer_payload.json`
- **Full payload** with all fields
- Includes all form sections
- Use for comprehensive testing

### `test_dialer_payload_simple.json`
- **Minimal payload** with essential fields
- Easier to modify for quick tests
- Use for basic testing

## Field Mapping

The JSON fields map to your form fields:

| Form Field | JSON Field | Type | Example |
|------------|-----------|------|---------|
| Full Name * | `full_name` | string | "John Smith" |
| Phone Number * | `phone` | string | "+44123456789" |
| Email Address | `email` | string | "john@example.com" |
| Address | `address1` | string | "123 Main Street" |
| City | `city` | string | "London" |
| Postcode * | `postal_code` | string | "SW1A 1AA" |
| Preferred Contact Time | `preferred_contact_time` | string | "afternoon" |
| Property Ownership | `property_ownership` | string | "owner" |
| Property Type | `property_type` | string | "detached" |
| Number of Bedrooms | `number_of_bedrooms` | string | "3" |
| Roof Type | `roof_type` | string | "pitched" |
| Roof Material | `roof_material` | string | "tiles" |
| Average Monthly Electricity Bill | `average_monthly_electricity_bill` | string | "150_200" |
| Energy Bill Amount | `energy_bill_amount` | number | 175.50 |
| Has EV Charger | `has_ev_charger` | boolean | true |
| Day/Night Rate | `day_night_rate` | string | "yes" |
| Current Energy Supplier | `current_energy_supplier` | string | "british_gas" |
| Electric Heating/Appliances | `electric_heating_appliances` | string | "electric_heating" |
| Energy Details | `energy_details` | string | "Additional info..." |
| Timeframe | `timeframe` | string | "within_3_months" |
| Moving Properties Next 5 Years | `moving_properties_next_five_years` | string | "no" |
| Timeframe Details | `timeframe_details` | string | "More details..." |
| Previous Quotes | `has_previous_quotes` | boolean | true |
| Previous Quotes Details | `previous_quotes_details` | string | "Details..." |
| Additional Notes | `notes` | string | "Any notes..." |

## Required Fields

Only these are **required**:
- `user` or `dialer_user_id` (agent username)
- `phone` (phone number)

All other fields are **optional**.

## Valid Values for Select Fields

### Preferred Contact Time
- `"morning"`
- `"afternoon"`
- `"evening"`
- `"anytime"`

### Property Ownership
- `"owner"`
- `"tenant"`
- `"landlord"`
- `"other"`

### Property Type
- `"detached"`
- `"semi_detached"`
- `"terraced"`
- `"flat"`
- `"bungalow"`
- `"commercial"`
- `"other"`

### Number of Bedrooms
- `"1"`, `"2"`, `"3"`, `"4"`, `"5+"`

### Roof Type
- `"pitched"`
- `"flat"`
- `"mixed"`
- `"unknown"`

### Roof Material
- `"tiles"`
- `"slate"`
- `"metal"`
- `"felt"`
- `"other"`
- `"unknown"`

### Average Monthly Electricity Bill
- `"under_50"`
- `"50_100"`
- `"100_150"`
- `"150_200"`
- `"200_300"`
- `"over_300"`
- `"unknown"`

### Has EV Charger / Previous Quotes
- `true` (Yes)
- `false` (No)

### Day/Night Rate
- `"yes"`
- `"no"`
- `"unsure"`

### Current Energy Supplier
- `"british_gas"`
- `"edf_energy"`
- `"eon"`
- `"npower"`
- `"scottish_power"`
- `"sse"`
- `"octopus_energy"`
- `"ovo_energy"`
- `"bulb"`
- `"utilita"`
- `"ecotricity"`
- `"good_energy"`
- `"green_energy_uk"`
- `"shell_energy"`
- `"utility_warehouse"`
- `"other"`
- `"unknown"`

### Electric Heating/Appliances
- `"gas_heating"`
- `"electric_heating"`
- `"heat_pump"`
- `"storage_heaters"`
- `"other"`
- `"unknown"`

### Timeframe
- `"immediately"`
- `"within_month"`
- `"within_3_months"`
- `"within_6_months"`
- `"within_year"`
- `"just_researching"`
- `"not_sure"`

### Moving Properties Next 5 Years
- `"yes"`
- `"no"`
- `"maybe"`
- `"not_sure"`

## Quick Test Checklist

- [ ] Request method is `POST`
- [ ] URL is `https://crm.margav.energy/api/leads/from-dialer/`
- [ ] Header `X-Dialer-Api-Key` is set
- [ ] Header `Content-Type` is `application/json`
- [ ] Body contains `user` or `dialer_user_id`
- [ ] Body contains `phone`
- [ ] Response is `201 Created`
- [ ] Lead appears in CRM admin

## Troubleshooting

### Error: "Missing security headers"
- **Solution**: Wait for deployment or remove `DIALER_SECRET_KEY` from Render

### Error: "Invalid API key"
- **Solution**: Check `X-Dialer-Api-Key` header value matches your `DIALER_API_KEY`

### Error: "Agent not found"
- **Solution**: Use a valid agent username like `CalebG`, `DaniC`, `JakeR`, etc.

---

**Ready to test!** 🚀

