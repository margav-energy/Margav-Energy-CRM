from django.db import models
from django.conf import settings
from django.utils import timezone
from .soft_delete import SoftDeleteModel
import logging

logger = logging.getLogger(__name__)


class Dialer(models.Model):
    """
    Dialer system for managing call distribution.
    """
    is_active = models.BooleanField(
        default=False,
        help_text='Whether the dialer is currently active'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dialer_created',
        help_text='Admin who created/activated the dialer'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Dialer - {'Active' if self.is_active else 'Inactive'}"


class Lead(SoftDeleteModel):
    """
    Lead model for CRM system.
    """
    STATUS_CHOICES = [
        ('cold_call', 'Cold Call'),
        ('interested', 'Interested'),
        ('not_interested', 'Not Interested'),
        ('tenant', 'Tenant'),
        ('other_disposition', 'Other Disposition'),
        ('sent_to_kelly', 'Sent to Kelly'),
        ('qualified', 'Qualified'),
        ('appointment_set', 'Appointment Set'),
        ('appointment_completed', 'Appointment Completed'),
        ('sale_made', 'Sale Made'),
        ('sale_lost', 'Sale Lost'),
        ('no_contact', 'No Contact'),
        ('blow_out', 'Blow Out'),
        ('callback', 'Call Back'),
        ('pass_back_to_agent', 'Pass Back to Agent'),
    ]
    
    DISPOSITION_CHOICES = [
        ('not_interested', 'Not Interested'),
        ('tenant', 'Tenant'),
        ('wrong_number', 'Wrong Number'),
        ('no_answer', 'No Answer'),
        ('callback_requested', 'Callback Requested'),
        ('do_not_call', 'Do Not Call'),
        ('other', 'Other'),
    ]
    
    full_name = models.CharField(max_length=255, help_text='Full name of the lead')
    phone = models.CharField(max_length=20, help_text='Phone number of the lead')
    email = models.EmailField(blank=True, null=True, help_text='Email address of the lead')
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='cold_call',
        help_text='Current status of the lead'
    )
    disposition = models.CharField(
        max_length=30,
        choices=DISPOSITION_CHOICES,
        blank=True,
        null=True,
        help_text='Disposition for non-interested leads'
    )
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_leads',
        help_text='Agent assigned to this lead'
    )
    notes = models.TextField(blank=True, null=True, help_text='Additional notes about the lead')
    appointment_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text='Scheduled appointment date and time'
    )
    google_calendar_event_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Google Calendar event ID for synchronization'
    )
    field_sales_rep = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='field_appointments',
        help_text='Field sales rep assigned to the appointment'
    )
    sale_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text='Sale amount if sale is made'
    )
    
    # Dialer-specific fields
    dialer_lead_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Original lead ID from dialer system'
    )
    vendor_id = models.CharField(max_length=100, blank=True, null=True)
    list_id = models.CharField(max_length=100, blank=True, null=True)
    gmt_offset_now = models.CharField(max_length=10, blank=True, null=True)
    phone_code = models.CharField(max_length=10, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    title = models.CharField(max_length=50, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    middle_initial = models.CharField(max_length=10, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    address1 = models.CharField(max_length=255, blank=True, null=True)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    address3 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    province = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country_code = models.CharField(max_length=10, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    alt_phone = models.CharField(max_length=20, blank=True, null=True)
    security_phrase = models.CharField(max_length=255, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    user = models.CharField(max_length=100, blank=True, null=True)
    campaign = models.CharField(max_length=100, blank=True, null=True)
    phone_login = models.CharField(max_length=100, blank=True, null=True)
    fronter = models.CharField(max_length=100, blank=True, null=True)
    closer = models.CharField(max_length=100, blank=True, null=True)
    group = models.CharField(max_length=100, blank=True, null=True)
    channel_group = models.CharField(max_length=100, blank=True, null=True)
    SQLdate = models.DateTimeField(blank=True, null=True)
    epoch = models.BigIntegerField(blank=True, null=True)
    uniqueid = models.CharField(max_length=255, blank=True, null=True)
    customer_zap_channel = models.CharField(max_length=100, blank=True, null=True)
    server_ip = models.GenericIPAddressField(blank=True, null=True)
    SIPexten = models.CharField(max_length=50, blank=True, null=True)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    dialed_number = models.CharField(max_length=20, blank=True, null=True)
    dialed_label = models.CharField(max_length=100, blank=True, null=True)
    rank = models.CharField(max_length=50, blank=True, null=True)
    owner = models.CharField(max_length=100, blank=True, null=True)
    camp_script = models.TextField(blank=True, null=True)
    in_script = models.TextField(blank=True, null=True)
    script_width = models.CharField(max_length=10, blank=True, null=True)
    script_height = models.CharField(max_length=10, blank=True, null=True)
    recording_file = models.CharField(max_length=255, blank=True, null=True)
    
    # Energy section fields
    energy_bill_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text='Specific energy bill amount if known'
    )
    has_ev_charger = models.BooleanField(
        blank=True,
        null=True,
        help_text='Whether the lead has an EV charger'
    )
    day_night_rate = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        choices=[
            ('yes', 'Yes'),
            ('no', 'No'),
            ('unsure', 'Unsure')
        ],
        help_text='Whether the lead has a day/night rate'
    )
    has_previous_quotes = models.BooleanField(
        blank=True,
        null=True,
        help_text='Whether the lead has had previous quotes'
    )
    previous_quotes_details = models.TextField(
        blank=True,
        null=True,
        help_text='Details about previous quotes if any'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['phone'], name='unique_phone_per_lead'),
            models.UniqueConstraint(fields=['dialer_lead_id'], name='unique_dialer_lead_id', condition=models.Q(dialer_lead_id__isnull=False))
        ]
    
    def __str__(self):
        return f"{self.full_name} ({self.get_status_display()})"
    
    @property
    def is_interested(self):
        return self.status == 'interested'
    
    @property
    def is_qualified(self):
        return self.status == 'qualified'
    
    @property
    def has_appointment(self):
        return self.status == 'appointment_set'
    
    @property
    def is_cold_call(self):
        return self.status == 'cold_call'
    
    def sync_to_google_calendar(self):
        """
        Synchronize appointment with Google Calendar.
        """
        try:
            from .google_calendar_oauth import google_calendar_oauth_service
            
            if not self.appointment_date:
                logger.warning(f"No appointment date set for lead {self.id}")
                return False
            
            # Convert to timezone-aware datetime if needed
            appointment_date = self.appointment_date
            if timezone.is_naive(appointment_date):
                appointment_date = timezone.make_aware(appointment_date)
            
            # Create or update calendar event
            if self.google_calendar_event_id:
                # Update existing event
                event_link = google_calendar_oauth_service.update_appointment_event(self, appointment_date)
            else:
                # Create new event
                event_link = google_calendar_oauth_service.create_appointment_event(self, appointment_date)
            
            if event_link:
                # Extract event ID from the link for storage
                # The OAuth service returns the full event link, but we need to store the event ID
                # For now, we'll store a placeholder and update the logic later
                self.google_calendar_event_id = "oauth_event_created"
                self.save(update_fields=['google_calendar_event_id'])
                logger.info(f"Successfully synced lead {self.id} to Google Calendar")
                return True
            else:
                logger.error(f"Failed to sync lead {self.id} to Google Calendar")
                return False
                
        except Exception as e:
            logger.error(f"Error syncing lead {self.id} to Google Calendar: {e}")
            return False
    
    def remove_from_google_calendar(self):
        """
        Remove appointment from Google Calendar.
        """
        try:
            from .google_calendar_oauth import google_calendar_oauth_service
            
            if not self.google_calendar_event_id:
                logger.warning(f"No calendar event ID for lead {self.id}")
                return True
            
            success = google_calendar_oauth_service.delete_appointment_event(self)
            if success:
                self.google_calendar_event_id = None
                self.save(update_fields=['google_calendar_event_id'])
                logger.info(f"Successfully removed lead {self.id} from Google Calendar")
                return True
            else:
                logger.error(f"Failed to remove lead {self.id} from Google Calendar")
                return False
                
        except Exception as e:
            logger.error(f"Error removing lead {self.id} from Google Calendar: {e}")
            return False


class LeadNotification(models.Model):
    """
    Notification model for lead status updates.
    """
    NOTIFICATION_TYPES = [
        ('status_update', 'Status Update'),
        ('appointment_set', 'Appointment Set'),
        ('qualification_result', 'Qualification Result'),
    ]
    
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='Lead this notification is about'
    )
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lead_notifications',
        help_text='Agent who receives this notification'
    )
    qualifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_notifications',
        help_text='Qualifier who sent this notification'
    )
    message = models.TextField(help_text='Notification message')
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES,
        default='status_update',
        help_text='Type of notification'
    )
    is_read = models.BooleanField(default=False, help_text='Whether the agent has read this notification')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Notification for {self.agent.get_full_name()}: {self.message[:50]}..."


class DialerUserLink(models.Model):
    """
    Links a dialer user (stable identifier provided by the dialer system) to a CRM user.
    Use this to reliably assign leads received from the dialer to the correct CRM agent.
    """
    dialer_user_id = models.CharField(
        max_length=255,
        unique=True,
        help_text='Stable unique identifier from dialer (e.g., user ID or login)'
    )
    dialer_username = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Optional human-readable username from dialer for reference'
    )
    crm_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dialer_link',
        help_text='Mapped CRM user'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dialer User Link'
        verbose_name_plural = 'Dialer User Links'
        ordering = ['dialer_user_id']

    def __str__(self) -> str:
        return f"{self.dialer_user_id} -> {self.crm_user.username}"

