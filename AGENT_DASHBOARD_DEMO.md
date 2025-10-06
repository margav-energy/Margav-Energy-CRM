# Agent Dashboard - Lead Form Auto-Opening Demo

## Overview

The Agent Dashboard now automatically opens the Lead Form when receiving leads from the dialer system. This is achieved through URL query parameters that pre-populate the form with lead data.

## How It Works

### 1. URL Query Parameters

When the dialer system has a lead for an agent, it redirects to the Agent Dashboard with query parameters:

```
https://crm.margav.energy/agent-dashboard?full_name=John%20Smith&phone=07123456789&email=john@example.com&notes=Interested%20in%20solar%20panels
```

### 2. Automatic Form Opening

The Agent Dashboard detects these parameters and:

- Automatically opens the Lead Form
- Pre-populates fields with the provided data
- Shows a "Auto-opened from dialer" indicator
- Displays a success toast notification

### 3. Mock Data Fallback

If no URL parameters are provided, the form uses mock data:

- John Smith (07123456789) - Solar panels interest
- Sarah Johnson (07987654321) - Energy efficiency solutions
- Michael Brown (07555123456) - Commercial renewable energy

### 4. Form Validation

The form validates:

- **Required fields**: Full name and phone number
- **Email format**: Validates email format if provided
- **Inline errors**: Shows validation errors with warning icons
- **Real-time validation**: Clears errors as user types

### 5. API Integration

- Uses existing Django REST API (`/api/leads/`)
- Token authentication from localStorage
- Success/error toast notifications using react-hot-toast
- Updates lead list after successful submission

## Testing the Feature

### Test URL Examples:

1. **Complete lead data:**

   ```
   https://crm.margav.energy/agent-dashboard?full_name=Alice%20Johnson&phone=07999888777&email=alice@example.com&notes=Very%20interested%20in%20renewable%20energy
   ```

2. **Minimal lead data:**

   ```
   https://crm.margav.energy/agent-dashboard?full_name=Bob%20Wilson&phone=07111222333
   ```

3. **No parameters (uses mock data):**
   ```
   https://crm.margav.energy/agent-dashboard
   ```

### Manual Testing Steps:

1. **Start the application:**

   ```bash
   cd frontend && npm start
   cd backend && python manage.py runserver
   ```

2. **Login as an agent** (username: agent1, password: 123)

3. **Test with URL parameters:**

   - Copy one of the test URLs above
   - Paste in browser address bar
   - Form should auto-open with pre-populated data

4. **Test form validation:**

   - Try submitting with empty required fields
   - Try invalid email format
   - Verify error messages appear

5. **Test form submission:**
   - Fill valid data
   - Submit form
   - Verify success toast and lead appears in list

## Key Features Implemented

✅ **URL Query Parameter Support**

- Parses `full_name`, `phone`, `email`, `notes` from URL
- Handles URL encoding/decoding automatically

✅ **Mock Data Fallback**

- 3 different mock lead profiles
- Random selection when no URL params provided

✅ **Automatic Form Opening**

- Detects dialer parameters on page load
- Auto-opens form with visual indicator
- Success toast notification

✅ **Enhanced Form Validation**

- Required field validation (name, phone)
- Email format validation (if provided)
- Inline error display with icons
- Real-time error clearing

✅ **API Integration**

- Uses existing Django REST API
- Token authentication
- Success/error handling with toast notifications

✅ **Form State Management**

- Handles both create and edit modes
- Proper state cleanup on cancel/submit
- URL parameter clearing on cancel

✅ **Responsive Design**

- Matches existing card styling
- Tailwind CSS classes
- Mobile-friendly layout

## Code Structure

### LeadForm.tsx Updates:

- Added `autoOpen` prop for dialer indication
- URL parameter parsing with `getUrlParams()`
- Mock data generation with `getMockData()`
- Enhanced validation with better error messages
- react-hot-toast integration for notifications

### AgentDashboard.tsx Updates:

- Added `autoOpenFromDialer` state
- `checkForDialerLead()` function for URL detection
- Enhanced form handling with proper state management
- Separate handlers for create/update operations

## Browser Compatibility

- Modern browsers with URLSearchParams support
- React 18+ with hooks
- TypeScript for type safety
- Tailwind CSS for styling
