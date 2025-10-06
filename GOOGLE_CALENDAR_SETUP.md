# Google Calendar Integration Setup

This guide explains how to set up Google Calendar integration for appointment synchronization.

## Prerequisites

1. A Google Cloud Project with Calendar API enabled
2. Service account credentials for ella@margav.energy's calendar

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create a service account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name like "Margav CRM Calendar Service"
   - Grant it "Editor" role
5. Create and download the service account key (JSON file)

### 2. Calendar Sharing

1. Open Google Calendar for ella@margav.energy
2. Go to Settings > "Share with specific people"
3. Add the service account email (found in the JSON file as "client_email")
4. Give it "Make changes to events" permission

### 3. Environment Configuration

1. Copy the service account JSON file to your backend directory
2. Update your `.env` file with the path to the credentials:

```bash
GOOGLE_CREDENTIALS_PATH=/path/to/your/service-account-credentials.json
GOOGLE_CALENDAR_EMAIL=ella@margav.energy
```

### 4. Install Dependencies

The required Google Calendar dependencies are already added to `requirements.txt`:

```bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib google-auth
```

### 5. Test the Integration

1. Start your Django backend
2. Create a lead and set an appointment
3. Check ella@margav.energy's calendar for the new event
4. Verify that email notifications are sent

## Features

- **Automatic Event Creation**: When a lead is qualified and an appointment is set, a calendar event is automatically created
- **Email Notifications**: ella@margav.energy receives email notifications 24 hours and 1 hour before appointments
- **Event Updates**: If appointment details change, the calendar event is automatically updated
- **Event Deletion**: If an appointment is cancelled, the calendar event is removed
- **Rich Event Details**: Events include lead information, agent details, and notes

## Troubleshooting

### Common Issues

1. **"Calendar service not available"**: Check that the credentials file path is correct and the service account has calendar access
2. **"Permission denied"**: Ensure the service account email has been shared with ella@margav.energy's calendar
3. **"API not enabled"**: Verify that the Google Calendar API is enabled in your Google Cloud project

### Logs

Check the Django logs for detailed error messages:

- Logs are written to `backend/logs/django.log`
- Console output also shows calendar integration status

### Manual Testing

You can test the integration by:

1. Creating a test lead
2. Setting its status to "appointment_set" with an appointment date
3. Checking the calendar for the new event
4. Verifying email notifications are received

## Security Notes

- Keep the service account credentials file secure
- Never commit credentials to version control
- Use environment variables for sensitive configuration
- Regularly rotate service account keys in production

