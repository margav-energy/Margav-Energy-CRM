"""
Google Calendar OAuth 2.0 integration for appointment synchronization.
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.cache import cache
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class GoogleCalendarOAuthService:
    """Service for managing Google Calendar events using OAuth 2.0."""
    
    # Scopes required for calendar access
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self):
        self.service = None
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI')
        self.refresh_token = os.getenv('GOOGLE_REFRESH_TOKEN')
        
        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            logger.error("Google OAuth credentials not properly configured in .env file")
    
    def get_authorization_url(self) -> str:
        """
        Generate the Google OAuth authorization URL.
        
        Returns:
            Authorization URL for Google OAuth consent page
        """
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES
            )
            flow.redirect_uri = self.redirect_uri
            
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'  # Force consent to get refresh token
            )
            
            # Store only the state in cache (not the flow object)
            cache.set('oauth_state', state, timeout=600)  # 10 minutes
            
            return authorization_url
            
        except Exception as e:
            logger.error(f"Failed to generate authorization URL: {e}")
            raise
    
    def handle_oauth_callback(self, authorization_code: str) -> bool:
        """
        Handle the OAuth callback and exchange code for tokens.
        
        Args:
            authorization_code: Authorization code from Google
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create a new flow for the callback
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES
            )
            flow.redirect_uri = self.redirect_uri
            
            # Exchange authorization code for tokens
            flow.fetch_token(code=authorization_code)
            credentials = flow.credentials
            
            # Store the refresh token in .env file
            self._update_env_file('GOOGLE_REFRESH_TOKEN', credentials.refresh_token)
            
            # Initialize the service with new credentials
            self.refresh_token = credentials.refresh_token
            self._initialize_service()
            
            logger.info("Successfully handled OAuth callback and stored refresh token")
            return True
            
        except Exception as e:
            logger.error(f"Failed to handle OAuth callback: {e}")
            return False
    
    def _update_env_file(self, key: str, value: str):
        """Update the .env file with new values."""
        try:
            env_file_path = os.path.join(settings.BASE_DIR, '.env')
            
            # Read existing .env file
            env_lines = []
            if os.path.exists(env_file_path):
                with open(env_file_path, 'r') as f:
                    env_lines = f.readlines()
            
            # Update or add the key-value pair
            key_found = False
            for i, line in enumerate(env_lines):
                if line.startswith(f"{key}="):
                    env_lines[i] = f"{key}={value}\n"
                    key_found = True
                    break
            
            if not key_found:
                env_lines.append(f"{key}={value}\n")
            
            # Write back to .env file
            with open(env_file_path, 'w') as f:
                f.writelines(env_lines)
                
        except Exception as e:
            logger.error(f"Failed to update .env file: {e}")
    
    def _initialize_service(self):
        """Initialize the Google Calendar service with stored credentials."""
        try:
            if not self.refresh_token:
                logger.warning("No refresh token available")
                return
            
            # Create credentials from stored refresh token
            credentials = Credentials(
                token=None,  # Will be refreshed automatically
                refresh_token=self.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.SCOPES
            )
            
            # Build the service
            self.service = build('calendar', 'v3', credentials=credentials)
            logger.info("Google Calendar service initialized with OAuth credentials")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Calendar service: {e}")
            self.service = None
    
    def create_calendar_event(self, summary: str, start_datetime: datetime, end_datetime: datetime, 
                             description: str = "", attendees: list = None) -> Optional[str]:
        """
        Create a calendar event in the sales@margav.energy calendar.
        
        Args:
            summary: Event title
            start_datetime: Event start time
            end_datetime: Event end time
            description: Event description
            attendees: List of attendee email addresses
            
        Returns:
            Google Calendar event link if successful, None otherwise
        """
        if not self.service:
            logger.warning("Google Calendar service not available")
            return None
        
        try:
            # Prepare event details
            event = {
                'summary': summary,
                'description': description,
                'start': {
                    'dateTime': start_datetime.isoformat(),
                    'timeZone': 'Europe/London',  # UK timezone
                },
                'end': {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': 'Europe/London',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 24 hours before
                        {'method': 'email', 'minutes': 60},      # 1 hour before
                        {'method': 'popup', 'minutes': 15},      # 15 minutes before
                    ],
                },
            }
            
            # Add attendees if provided
            if attendees:
                event['attendees'] = [{'email': email} for email in attendees]
            
            # Create the event
            created_event = self.service.events().insert(
                calendarId='primary',  # sales@margav.energy's primary calendar
                body=event,
                sendUpdates='all'  # Send email notifications to all attendees
            ).execute()
            
            event_id = created_event.get('id')
            event_link = created_event.get('htmlLink')
            
            logger.info(f"Created calendar event {event_id}")
            return event_link
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to create calendar event: {e}")
            return None
    
    def create_appointment_event(self, lead, appointment_date: datetime) -> Optional[str]:
        """
        Create a calendar event for an appointment.
        
        Args:
            lead: Lead instance
            appointment_date: Appointment datetime
            
        Returns:
            Event link if successful, None otherwise
        """
        if not self.service:
            logger.warning("Google Calendar service not available")
            return None
        
        try:
            # Calculate end time (1 hour duration)
            end_datetime = appointment_date + timedelta(hours=1)
            
            # Prepare event details
            summary = f'Appointment with {lead.full_name}'
            description = f"""
Appointment Details:
- Lead: {lead.full_name}
- Phone: {lead.phone}
- Email: {lead.email or 'N/A'}
- Agent: {lead.assigned_agent.get_full_name() if lead.assigned_agent else 'N/A'}
- Field Sales Rep: {lead.field_sales_rep.get_full_name() if lead.field_sales_rep else 'TBD'}
- Notes: {lead.notes or 'No additional notes'}

This appointment was automatically created from the Margav Energy CRM system.
            """.strip()
            
            # Create the event
            event_link = self.create_calendar_event(
                summary=summary,
                start_datetime=appointment_date,
                end_datetime=end_datetime,
                description=description,
                attendees=['sales@margav.energy']
            )
            
            return event_link
            
        except Exception as e:
            logger.error(f"Failed to create appointment event: {e}")
            return None
    
    def update_appointment_event(self, lead, appointment_date: datetime) -> Optional[str]:
        """
        Update an existing calendar event.
        
        Args:
            lead: Lead instance
            appointment_date: New appointment datetime
            
        Returns:
            Event link if successful, None otherwise
        """
        if not self.service or not lead.google_calendar_event_id:
            logger.warning("Google Calendar service not available or no event ID")
            return None
        
        try:
            # Get the existing event
            event = self.service.events().get(
                calendarId='primary',
                eventId=lead.google_calendar_event_id
            ).execute()
            
            # Calculate end time (1 hour duration)
            end_datetime = appointment_date + timedelta(hours=1)
            
            # Update event details
            event['summary'] = f'Appointment with {lead.full_name}'
            event['description'] = f"""
Appointment Details:
- Lead: {lead.full_name}
- Phone: {lead.phone}
- Email: {lead.email or 'N/A'}
- Agent: {lead.assigned_agent.get_full_name() if lead.assigned_agent else 'N/A'}
- Field Sales Rep: {lead.field_sales_rep.get_full_name() if lead.field_sales_rep else 'TBD'}
- Notes: {lead.notes or 'No additional notes'}

This appointment was automatically updated from the Margav Energy CRM system.
            """.strip()
            
            event['start'] = {
                'dateTime': appointment_date.isoformat(),
                'timeZone': 'Europe/London',
            }
            event['end'] = {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'Europe/London',
            }
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=lead.google_calendar_event_id,
                body=event,
                sendUpdates='all'
            ).execute()
            
            logger.info(f"Updated calendar event {lead.google_calendar_event_id}")
            return updated_event.get('htmlLink')
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to update calendar event: {e}")
            return None
    
    def delete_appointment_event(self, lead) -> bool:
        """
        Delete a calendar event.
        
        Args:
            lead: Lead instance
            
        Returns:
            True if successful, False otherwise
        """
        if not self.service or not lead.google_calendar_event_id:
            logger.warning("Google Calendar service not available or no event ID")
            return False
        
        try:
            self.service.events().delete(
                calendarId='primary',
                eventId=lead.google_calendar_event_id,
                sendUpdates='all'
            ).execute()
            
            logger.info(f"Deleted calendar event {lead.google_calendar_event_id}")
            return True
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to delete calendar event: {e}")
            return False


# Global instance
google_calendar_oauth_service = GoogleCalendarOAuthService()
