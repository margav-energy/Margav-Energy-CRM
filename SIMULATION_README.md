# 🎭 Dialer Integration Simulation

This simulation tests the complete dialer integration with the CRM system, including the Django REST API endpoint and React auto-refresh functionality.

## 📁 Files Created

- `simulate_dialer_integration.py` - Main simulation script
- `agent_dashboard_simulation.html` - Visual dashboard simulator
- `setup_test.sh` - Setup script for testing
- `test_dialer_endpoint.py` - Simple endpoint test

## 🚀 Quick Start

### 1. Start Django Server

```bash
cd backend
python manage.py runserver
```

### 2. Run Setup Script

```bash
./setup_test.sh
```

### 3. Open Dashboard Simulator

Open `agent_dashboard_simulation.html` in your browser

### 4. Run Simulation

```bash
python3 simulate_dialer_integration.py
```

## 🎯 What the Simulation Tests

### Django API Endpoint (`/api/leads/from-dialer/`)

- ✅ **Field Validation**: Required fields (full_name, phone, agent_username)
- ✅ **Agent Lookup**: Finds agent by username and validates role
- ✅ **Lead Creation**: Creates lead with 'interested' status
- ✅ **Error Handling**: Proper HTTP status codes and error messages
- ✅ **Concurrency**: Multiple simultaneous requests
- ✅ **Response Format**: JSON with success flag and lead data

### React Auto-Refresh

- ✅ **Real-time Updates**: Fetches new leads every 2 seconds
- ✅ **Smart Notifications**: Shows toast only for new leads
- ✅ **No Loading States**: Auto-refresh doesn't show spinners
- ✅ **Efficient Updates**: Only updates when data changes
- ✅ **Multi-Agent Support**: Each agent sees only their leads
- ✅ **Cleanup**: Properly cleans up intervals on unmount

## 🧪 Test Scenarios

### 1. Full Simulation

Creates leads over time with realistic intervals:

- 8 sample leads with different agents
- 5-second intervals between leads
- 60-second total duration
- Random phone numbers to avoid duplicates

### 2. Validation Tests

Tests various error conditions:

- Missing required fields
- Invalid agent usernames
- Network errors
- Server errors

### 3. Visual Dashboard

Simulates the agent dashboard:

- Real-time lead display
- Auto-refresh every 2 seconds
- Toast notifications for new leads
- Agent switching
- Statistics updates

## 📊 Expected Results

### Successful API Calls

```json
{
  "success": true,
  "lead": {
    "id": 123,
    "full_name": "John Smith",
    "phone": "+1234567890",
    "email": "john.smith@email.com",
    "status": "interested",
    "assigned_agent": 1,
    "assigned_agent_name": "Agent One",
    "assigned_agent_username": "agent1",
    "notes": "Interested in solar panels",
    "created_at": "2025-01-03T20:57:52Z",
    "updated_at": "2025-01-03T20:57:52Z"
  }
}
```

### Error Responses

```json
{
  "error": "Missing required fields: full_name, phone"
}
```

### Dashboard Behavior

- New leads appear within 2 seconds
- Toast notifications show lead count
- Statistics update automatically
- No loading spinners during auto-refresh
- Smooth animations for new leads

## 🔧 Configuration

### Simulation Settings

```python
SIMULATION_DURATION = 60  # seconds
LEAD_INTERVAL = 5  # seconds between leads
```

### API Settings

```python
API_BASE_URL = "https://crm.margav.energy/api"  # Production URL
```

### Dashboard Settings

```javascript
refreshInterval = 2000; // milliseconds
```

## 🐛 Troubleshooting

### Django Server Not Running

```bash
cd backend
python manage.py runserver
```

### No Agents Found

Create test agents in Django admin or via API:

```python
# In Django shell
from accounts.models import User
User.objects.create_user(
    username='agent1',
    email='agent1@example.com',
    password='password123',
    role='agent',
    first_name='Agent',
    last_name='One'
)
```

### CORS Issues

Make sure CORS is configured in Django settings:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://crm.margav.energy",
]
```

### Network Errors

- Check if Django server is running on port 8000
- Verify firewall settings
- Check for proxy interference

## 📈 Performance Metrics

### Expected Performance

- **API Response Time**: < 200ms
- **Lead Creation Success Rate**: > 95%
- **Dashboard Refresh**: Every 2 seconds
- **Notification Delay**: < 1 second
- **Concurrent Users**: Supports multiple agents

### Monitoring

- Django server logs show API calls
- Browser console shows auto-refresh
- Network tab shows request timing
- Toast notifications confirm updates

## 🎉 Success Criteria

The simulation is successful when:

1. ✅ All API calls return proper responses
2. ✅ Leads are created and assigned correctly
3. ✅ Dashboard shows new leads within 2 seconds
4. ✅ Toast notifications appear for new leads
5. ✅ No JavaScript errors in console
6. ✅ Auto-refresh works without loading states
7. ✅ Multiple agents can work simultaneously
8. ✅ Error handling works properly

## 🔄 Integration Flow

```
Dialer System → POST /api/leads/from-dialer/ → Django API
                     ↓
              Lead Created & Assigned
                     ↓
Agent Dashboard ← GET /api/leads/my/ ← Auto-refresh (2s)
                     ↓
              New Lead Detected
                     ↓
              Toast Notification + UI Update
```

This simulation provides a complete test of the dialer integration system and demonstrates how the real-time updates work in the agent dashboard.
