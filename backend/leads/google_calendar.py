"""
Google Calendar integration for appointment synchronization.
"""
import os
from datetime import datetime
from typing import Optional, Dict, Any
from django.conf import settings
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    """Service for managing Google Calendar events."""
    
    # Scopes required for calendar access
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self):
        self.service = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize the Google Calendar service."""
        try:
            # For demo purposes, we'll use a service account approach
            # In production, you'd want to implement OAuth2 flow for ella@margav.energy
            
            # Check if we have credentials
            credentials_path = getattr(settings, 'GOOGLE_CREDENTIALS_PATH', None)
            if not credentials_path:
                logger.warning("Google Calendar credentials not configured")
                return
            
            # Load credentials from file
            credentials = Credentials.from_service_account_file(
                credentials_path, 
                scopes=self.SCOPES
            )
            
            # Build the service
            self.service = build('calendar', 'v3', credentials=credentials)
            logger.info("Google Calendar service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Calendar service: {e}")
            self.service = None
    
    def create_appointment_event(self, lead, appointment_date: datetime) -> Optional[str]:
        """
        Create a calendar event for an appointment.
        
        Args:
            lead: Lead instance
            appointment_date: Appointment datetime
            
        Returns:
            Event ID if successful, None otherwise
        """
        if not self.service:
            logger.warning("Google Calendar service not available")
            return None
        
        try:
            # Prepare event details
            event = {
                'summary': f'Appointment with {lead.full_name}',
                'description': f"""
Appointment Details:
- Lead: {lead.full_name}
- Phone: {lead.phone}
- Email: {lead.email or 'N/A'}
- Agent: {lead.assigned_agent.get_full_name() if lead.assigned_agent else (lead.assigned_agent_name or 'N/A')}
- Field Sales Rep: {lead.field_sales_rep.get_full_name() if lead.field_sales_rep else 'TBD'}
- Notes: {lead.notes or 'No additional notes'}

This appointment was automatically created from the Margav Energy CRM system.
                """.strip(),
                'start': {
                    'dateTime': appointment_date.isoformat(),
                    'timeZone': 'America/New_York',  # Adjust timezone as needed
                },
                'end': {
                    'dateTime': (appointment_date.replace(hour=appointment_date.hour + 1)).isoformat(),
                    'timeZone': 'America/New_York',
                },
                'attendees': [
                    {'email': 'ella@margav.energy', 'displayName': 'Ella Margav'},
                ],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 24 hours before
                        {'method': 'email', 'minutes': 60},      # 1 hour before
                        {'method': 'popup', 'minutes': 15},      # 15 minutes before
                    ],
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': f'appointment-{lead.id}-{int(appointment_date.timestamp())}',
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                },
            }
            
            # Create the event
            created_event = self.service.events().insert(
                calendarId='primary',  # ella@margav.energy's primary calendar
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'  # Send email notifications to all attendees
            ).execute()
            
            event_id = created_event.get('id')
            logger.info(f"Created calendar event {event_id} for lead {lead.id}")
            
            return event_id
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to create calendar event: {e}")
            return None
    
    def update_appointment_event(self, lead, appointment_date: datetime) -> Optional[str]:
        """
        Update an existing calendar event.
        
        Args:
            lead: Lead instance
            appointment_date: New appointment datetime
            
        Returns:
            Event ID if successful, None otherwise
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
            
            # Update event details
            event['summary'] = f'Appointment with {lead.full_name}'
            event['description'] = f"""
Appointment Details:
- Lead: {lead.full_name}
- Phone: {lead.phone}
- Email: {lead.email or 'N/A'}
- Agent: {lead.assigned_agent.get_full_name() if lead.assigned_agent else (lead.assigned_agent_name or 'N/A')}
- Field Sales Rep: {lead.field_sales_rep.get_full_name() if lead.field_sales_rep else 'TBD'}
- Notes: {lead.notes or 'No additional notes'}

This appointment was automatically updated from the Margav Energy CRM system.
            """.strip()
            
            event['start'] = {
                'dateTime': appointment_date.isoformat(),
                'timeZone': 'America/New_York',
            }
            event['end'] = {
                'dateTime': (appointment_date.replace(hour=appointment_date.hour + 1)).isoformat(),
                'timeZone': 'America/New_York',
            }
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=lead.google_calendar_event_id,
                body=event,
                sendUpdates='all'
            ).execute()
            
            logger.info(f"Updated calendar event {lead.google_calendar_event_id} for lead {lead.id}")
            return updated_event.get('id')
            
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
            
            logger.info(f"Deleted calendar event {lead.google_calendar_event_id} for lead {lead.id}")
            return True
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to delete calendar event: {e}")
            return False


# Global instance
google_calendar_service = GoogleCalendarService()

