# Google Calendar OAuth 2.0 Integration Setup

This guide will help you set up Google Calendar OAuth 2.0 integration for your Django CRM backend.

## 📋 Prerequisites

- Django backend running
- Google Cloud Console project with Calendar API enabled
- OAuth 2.0 credentials JSON file (CRM.json)

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up OAuth Credentials

```bash
# Copy your CRM.json file to the backend directory
cp /path/to/CRM.json backend/

# Run the setup command
python manage.py setup_google_calendar --json-file CRM.json
```

### 3. Start the Server

```bash
python manage.py runserver
```

### 4. Complete OAuth Flow

Visit: http://localhost:8000/api/calendar/setup/

This will guide you through the OAuth authentication process.

## 🔧 Manual Setup

If you prefer to set up manually:

### 1. Update .env File

Add these variables to your `backend/.env` file:

```env
# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=
```

### 2. Complete OAuth Authentication

1. Visit: http://localhost:8000/api/auth/google/
2. Sign in with `sales@margav.energy`
3. Grant calendar permissions
4. You'll be redirected back with a success message

## 📚 API Endpoints

### Authentication
- `GET /api/auth/google/` - Start OAuth flow
- `GET /api/auth/google/callback/` - OAuth callback handler
- `GET /api/calendar/status/` - Check authentication status

### Calendar Operations
- `GET /api/calendar/test/` - Test integration
- `POST /api/calendar/events/` - Create calendar event

### Setup Page
- `GET /api/calendar/setup/` - Interactive setup page

## 🎯 Usage Examples

### Create a Calendar Event

```python
# Using the reusable function
from leads.google_calendar_oauth import google_calendar_oauth_service
from datetime import datetime

event_link = google_calendar_oauth_service.create_calendar_event(
    summary="Meeting with John Doe",
    start_datetime=datetime(2024, 1, 15, 10, 0),
    end_datetime=datetime(2024, 1, 15, 11, 0),
    description="Sales meeting",
    attendees=["sales@margav.energy"]
)
```

### API Request Example

```bash
curl -X POST http://localhost:8000/api/calendar/events/ \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Meeting with John Doe",
    "start_datetime": "2024-01-15T10:00:00",
    "end_datetime": "2024-01-15T11:00:00",
    "description": "Sales meeting",
    "attendees": ["sales@margav.energy"]
  }'
```

## 🔄 Lead Integration

The system automatically syncs appointments to Google Calendar when:

1. A lead's status is set to `appointment_set`
2. An appointment date is set
3. The `sync_to_google_calendar()` method is called

### Example Lead Integration

```python
# In your Django views or signals
lead = Lead.objects.get(id=1)
lead.status = 'appointment_set'
lead.appointment_date = datetime(2024, 1, 15, 10, 0)
lead.save()

# Sync to Google Calendar
if lead.sync_to_google_calendar():
    print("Appointment synced to Google Calendar!")
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Google OAuth credentials not properly configured"**
   - Check your `.env` file has all required variables
   - Ensure the JSON file is properly formatted

2. **"Failed to authenticate with Google Calendar"**
   - Make sure you're using the correct Google account
   - Check that the redirect URI matches your configuration

3. **"Google Calendar service not available"**
   - Complete the OAuth flow first
   - Check that the refresh token is stored

### Debug Commands

```bash
# Check OAuth configuration
python manage.py shell -c "
from leads.google_calendar_oauth import google_calendar_oauth_service
print('Client ID:', google_calendar_oauth_service.client_id)
print('Has refresh token:', bool(google_calendar_oauth_service.refresh_token))
"

# Test calendar integration
curl http://localhost:8000/api/calendar/test/
```

## 🔒 Security Notes

- The refresh token is stored in the `.env` file
- Never commit the `.env` file to version control
- Use environment variables in production
- Consider using Django's secret management for production

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID | `your_google_client_id_here` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `your_google_client_secret_here` |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | `http://localhost:8000/api/auth/google/callback` |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token | `1//04...` (auto-generated) |

## 🎉 Success!

Once set up, your Django backend will be able to:

- ✅ Authenticate with Google Calendar using OAuth 2.0
- ✅ Create calendar events for appointments
- ✅ Update existing calendar events
- ✅ Delete calendar events
- ✅ Automatically sync lead appointments

The integration is now ready to use! 🚀
