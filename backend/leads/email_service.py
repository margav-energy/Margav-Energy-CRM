"""
Email service for sending appointment confirmation emails with calendar invites.
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)

def create_calendar_invite(lead, appointment_date, appointment_time=None, notes=None):
    """
    Create an ICS calendar invite for the appointment.
    
    Args:
        lead: Lead object with customer information
        appointment_date: Date of the appointment
        appointment_time: Time of the appointment (optional)
        notes: Additional notes for the appointment (optional)
    
    Returns:
        str: ICS calendar invite content
    """
    # Format the appointment date and time
    if isinstance(appointment_date, str):
        appointment_date = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
    
    # Set time if provided
    if appointment_time:
        if isinstance(appointment_time, str):
            try:
                time_obj = datetime.strptime(appointment_time, '%H:%M').time()
                appointment_date = appointment_date.replace(hour=time_obj.hour, minute=time_obj.minute)
            except ValueError:
                pass  # Keep original time if parsing fails
    
    # Create end time (1 hour after start)
    end_date = appointment_date + timedelta(hours=1)
    
    # Generate unique ID
    event_id = str(uuid.uuid4())
    
    # Format dates for ICS
    start_utc = appointment_date.astimezone(timezone.utc)
    end_utc = end_date.astimezone(timezone.utc)
    
    start_str = start_utc.strftime('%Y%m%dT%H%M%SZ')
    end_str = end_utc.strftime('%Y%m%dT%H%M%SZ')
    now_str = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    
    # Create ICS content
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Margav Energy//Appointment//EN
BEGIN:VEVENT
UID:{event_id}@margav.energy
DTSTART:{start_str}
DTEND:{end_str}
DTSTAMP:{now_str}
SUMMARY:Appointment with Margav Energy - {lead.full_name}
DESCRIPTION:Appointment Details:\\n- Lead: {lead.full_name}\\n- Phone: {lead.phone}\\n- Email: {lead.email or 'N/A'}\\n- Property: {lead.address1 or 'To be confirmed'}\\n- Notes: {notes or 'No additional notes'}\\n\\nThis appointment was scheduled through Margav Energy CRM.
LOCATION:{lead.address1 or 'To be confirmed'}
ORGANIZER:MAILTO:sales@margav.energy
ATTENDEE:MAILTO:{lead.email}
ATTENDEE:MAILTO:sales@margav.energy
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:EMAIL
DESCRIPTION:Appointment Reminder
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:EMAIL
DESCRIPTION:Appointment Reminder
END:VALARM
END:VEVENT
END:VCALENDAR"""
    
    return ics_content

def send_appointment_confirmation_email(lead, appointment_date, appointment_time=None, notes=None):
    """
    Send appointment confirmation email to the lead with calendar invite.
    
    Args:
        lead: Lead object with customer information
        appointment_date: Date of the appointment
        appointment_time: Time of the appointment (optional)
        notes: Additional notes for the appointment (optional)
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Format the appointment date and time
        if isinstance(appointment_date, str):
            appointment_date = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
        
        formatted_date = appointment_date.strftime('%A, %B %d, %Y')
        formatted_time = ''
        if appointment_time:
            if isinstance(appointment_time, str):
                # Handle time format (e.g., "14:30" or "2:30 PM")
                try:
                    time_obj = datetime.strptime(appointment_time, '%H:%M').time()
                    formatted_time = time_obj.strftime('%I:%M %p')
                except ValueError:
                    formatted_time = appointment_time
            else:
                formatted_time = appointment_time.strftime('%I:%M %p')
        
        # Prepare email content
        subject = f"Appointment Confirmation - Margav Energy"
        
        # Create email body
        email_body = f"""
Dear {lead.full_name},

Thank you for your interest in Margav Energy's solar solutions. We are pleased to confirm your scheduled consultation appointment.

APPOINTMENT DETAILS:
• Date: {formatted_date}
• Time: {formatted_time if formatted_time else 'To be confirmed'}
• Property Address: {lead.address1 or 'To be confirmed'}
• Contact Number: {lead.phone}

"""
        
        if notes:
            email_body += f"Additional Notes: {notes}\n\n"
        
        email_body += f"""
WHAT TO EXPECT:
Our solar energy specialist will conduct a comprehensive property assessment including:
• Roof evaluation and solar panel placement analysis
• Energy usage review and system sizing
• Detailed quotation for your solar energy system
• Discussion of financing options and available incentives

PREPARATION:
• Please ensure access to your property at the scheduled time
• Have recent energy bills available for review
• Prepare any questions about solar energy systems

If you need to reschedule or have any questions, please contact us:
• Email: sales@margav.energy
• Phone: [Your contact number]

We look forward to helping you transition to clean, renewable solar energy.

Best regards,
The Margav Energy Team
sales@margav.energy

---
Margav Energy
Leading the way in renewable energy solutions
        """
        
        # Create email with calendar invite
        email = EmailMultiAlternatives(
            subject=subject,
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[lead.email] if lead.email else [],
        )
        
        # Add calendar invite as attachment
        calendar_content = create_calendar_invite(lead, appointment_date, appointment_time, notes)
        email.attach(
            filename='appointment.ics',
            content=calendar_content,
            mimetype='text/calendar'
        )
        
        # Send the email
        email.send(fail_silently=False)
        
        logger.info(f"Appointment confirmation email with calendar invite sent successfully to {lead.full_name} ({lead.email})")
        return True
            
    except Exception as e:
        logger.error(f"Error sending appointment confirmation email to {lead.full_name}: {str(e)}")
        return False

def send_appointment_reminder_email(lead, appointment_date, appointment_time=None):
    """
    Send appointment reminder email to the lead.
    
    Args:
        lead: Lead object with customer information
        appointment_date: Date of the appointment
        appointment_time: Time of the appointment (optional)
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Format the appointment date and time
        if isinstance(appointment_date, str):
            appointment_date = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
        
        formatted_date = appointment_date.strftime('%A, %B %d, %Y')
        formatted_time = ''
        if appointment_time:
            if isinstance(appointment_time, str):
                try:
                    time_obj = datetime.strptime(appointment_time, '%H:%M').time()
                    formatted_time = time_obj.strftime('%I:%M %p')
                except ValueError:
                    formatted_time = appointment_time
            else:
                formatted_time = appointment_time.strftime('%I:%M %p')
        
        subject = f"Appointment Reminder - Margav Energy"
        
        email_body = f"""
Dear {lead.full_name},

This is a friendly reminder about your upcoming solar energy consultation appointment with Margav Energy.

APPOINTMENT REMINDER:
• Date: {formatted_date}
• Time: {formatted_time if formatted_time else 'To be confirmed'}
• Property Address: {lead.address1 or 'To be confirmed'}

Please ensure you have access to your property at the scheduled time. If you need to reschedule, please contact us as soon as possible.

Contact Information:
• Email: sales@margav.energy
• Phone: [Your contact number]

We look forward to meeting with you and discussing your solar energy needs.

Best regards,
The Margav Energy Team
sales@margav.energy
        """
        
        # Create email with calendar invite
        email = EmailMultiAlternatives(
            subject=subject,
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[lead.email] if lead.email else [],
        )
        
        # Add calendar invite as attachment
        calendar_content = create_calendar_invite(lead, appointment_date, appointment_time)
        email.attach(
            filename='appointment-reminder.ics',
            content=calendar_content,
            mimetype='text/calendar'
        )
        
        email.send(fail_silently=False)
        
        logger.info(f"Appointment reminder email sent successfully to {lead.full_name} ({lead.email})")
        return True
            
    except Exception as e:
        logger.error(f"Error sending appointment reminder email to {lead.full_name}: {str(e)}")
        return False