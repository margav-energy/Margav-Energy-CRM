"""
API views for appointment email functionality.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from leads.models import Lead
from leads.email_service import send_appointment_confirmation_email, send_appointment_reminder_email
from leads.google_calendar import google_calendar_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_appointment_email(request):
    """
    Send appointment confirmation email to a lead.
    
    Expected payload:
    {
        "lead_id": 123,
        "appointment_date": "2025-10-25T14:30:00Z",
        "appointment_time": "14:30",
        "notes": "Optional notes about the appointment"
    }
    """
    try:
        lead_id = request.data.get('lead_id')
        appointment_date = request.data.get('appointment_date')
        appointment_time = request.data.get('appointment_time')
        notes = request.data.get('notes', '')
        
        if not lead_id:
            return Response(
                {'error': 'lead_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not appointment_date:
            return Response(
                {'error': 'appointment_date is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the lead
        lead = get_object_or_404(Lead, id=lead_id)
        
        # Check if lead has email
        if not lead.email:
            return Response(
                {'error': 'Lead does not have an email address'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send the appointment confirmation email
        email_success = send_appointment_confirmation_email(
            lead=lead,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            notes=notes
        )
        
        # Create Google Calendar event
        calendar_event_id = None
        calendar_success = False
        try:
            # Convert appointment_date to datetime object for calendar
            if isinstance(appointment_date, str):
                appointment_datetime = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
            else:
                appointment_datetime = appointment_date
            
            # Set time if provided
            if appointment_time:
                if isinstance(appointment_time, str):
                    try:
                        time_obj = datetime.strptime(appointment_time, '%H:%M').time()
                        appointment_datetime = appointment_datetime.replace(hour=time_obj.hour, minute=time_obj.minute)
                    except ValueError:
                        pass
            
            calendar_event_id = google_calendar_service.create_appointment_event(lead, appointment_datetime)
            if calendar_event_id:
                calendar_success = True
                # Save the calendar event ID to the lead
                lead.google_calendar_event_id = calendar_event_id
                lead.save()
        except Exception as e:
            logger.error(f"Failed to create Google Calendar event: {str(e)}")
        
        if email_success:
            response_data = {
                'message': f'Appointment confirmation email sent successfully to {lead.email}',
                'lead_name': lead.full_name,
                'email': lead.email,
                'appointment_date': appointment_date,
                'appointment_time': appointment_time,
                'email_sent': True,
                'calendar_event_created': calendar_success,
                'calendar_event_id': calendar_event_id
            }
            
            if not calendar_success:
                response_data['warning'] = 'Email sent but calendar event creation failed'
            
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to send appointment confirmation email'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error in send_appointment_email: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_appointment_reminder(request):
    """
    Send appointment reminder email to a lead.
    
    Expected payload:
    {
        "lead_id": 123,
        "appointment_date": "2025-10-25T14:30:00Z",
        "appointment_time": "14:30"
    }
    """
    try:
        lead_id = request.data.get('lead_id')
        appointment_date = request.data.get('appointment_date')
        appointment_time = request.data.get('appointment_time')
        
        if not lead_id:
            return Response(
                {'error': 'lead_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not appointment_date:
            return Response(
                {'error': 'appointment_date is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the lead
        lead = get_object_or_404(Lead, id=lead_id)
        
        # Check if lead has email
        if not lead.email:
            return Response(
                {'error': 'Lead does not have an email address'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send the appointment reminder email
        email_success = send_appointment_reminder_email(
            lead=lead,
            appointment_date=appointment_date,
            appointment_time=appointment_time
        )
        
        if email_success:
            return Response({
                'message': f'Appointment reminder email sent successfully to {lead.email}',
                'lead_name': lead.full_name,
                'email': lead.email,
                'appointment_date': appointment_date,
                'appointment_time': appointment_time,
                'email_sent': True
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to send appointment reminder email'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error in send_appointment_reminder: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
