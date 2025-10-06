# Mock Call System for Agent Dashboard

## Overview

The Mock Call System simulates incoming calls for Agent 1, automatically triggering the Lead Form with pre-populated data. This system demonstrates how the dialer integration works in the CRM.

## Features

### 🎯 **Mock Call Simulator**

- **5 Pre-configured Mock Calls**: Realistic lead data for testing
- **Automatic Form Triggering**: Opens Lead Form after each call
- **Call Queue Management**: Shows progress and remaining calls
- **Visual Indicators**: Active call status with pulsing indicator

### 📞 **Mock Call Data**

1. **Emma Thompson** - Solar panels for 3-bedroom house in Manchester
2. **James Wilson** - Commercial property renewable energy solutions
3. **Sarah Davis** - Energy efficiency improvements for new house
4. **Michael Brown** - Small business energy cost reduction
5. **Lisa Johnson** - Heat pumps and solar combination

### 🔄 **How It Works**

1. **Start Mock Calls**: Click "Start Next Call" button
2. **Call Simulation**: Each call lasts 3-5 seconds with visual feedback
3. **Automatic Form Opening**: Lead Form opens with pre-populated data
4. **URL Parameter Setting**: Simulates dialer system behavior
5. **Form Submission**: Agent can review and submit the lead

## Usage Instructions

### For Testing Agent 1:

1. **Login as Agent 1**:

   - Username: `agent1`
   - Password: `123`

2. **Access Mock Call System**:

   - Navigate to Agent Dashboard
   - Find "Mock Call Simulator" section
   - Click "Start Next Call" to begin

3. **Complete the Workflow**:
   - Wait for call to complete (3-5 seconds)
   - Lead Form will auto-open with call data
   - Review and submit the lead
   - Repeat for next call

### Mock Call Workflow:

```
1. Click "Start Next Call"
   ↓
2. Call Active (3-5 seconds)
   ↓
3. Call Completed
   ↓
4. Lead Form Auto-Opens
   ↓
5. Review/Edit Data
   ↓
6. Submit Lead
   ↓
7. Repeat for Next Call
```

## Technical Implementation

### Components:

- **MockCall.tsx**: Main mock call simulator component
- **AgentDashboard.tsx**: Integration with existing dashboard
- **LeadForm.tsx**: Enhanced form with URL parameter support

### Key Functions:

- `handleIncomingCall()`: Processes mock call data
- `checkForDialerLead()`: Detects URL parameters
- `getUrlParams()`: Parses URL query parameters
- `getMockData()`: Provides fallback mock data

### Data Flow:

```
MockCall → handleIncomingCall() → URL Parameters → LeadForm Auto-Open
```

## Testing Scenarios

### Scenario 1: Complete Call Data

- All fields populated (name, phone, email, notes)
- Form opens with all data pre-filled
- Agent reviews and submits

### Scenario 2: Minimal Call Data

- Only name and phone provided
- Email and notes fields empty
- Agent fills missing information

### Scenario 3: Form Validation

- Test required field validation
- Test email format validation
- Test error handling

### Scenario 4: Multiple Calls

- Complete all 5 mock calls
- Verify each call triggers form
- Test call queue management

## Benefits

✅ **Realistic Testing**: Simulates real dialer system behavior
✅ **Automated Workflow**: No manual data entry required
✅ **Form Validation**: Tests all validation scenarios
✅ **User Experience**: Demonstrates seamless integration
✅ **Development Tool**: Easy testing for developers

## Integration Points

- **Django REST API**: Uses existing `/api/leads/` endpoint
- **Token Authentication**: Uses stored auth token
- **Toast Notifications**: Success/error feedback
- **URL Parameters**: Simulates dialer system integration
- **State Management**: Proper React state handling

## Future Enhancements

- **Custom Call Data**: Allow users to add their own mock calls
- **Call Analytics**: Track call success rates and timing
- **Integration Testing**: Connect with actual dialer system
- **Performance Metrics**: Measure form completion times
- **A/B Testing**: Test different form layouts and flows
