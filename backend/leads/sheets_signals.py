"""
Django signals for automatic Google Sheets synchronization
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import Lead
from .google_sheets_service import google_sheets_service

logger = logging.getLogger(__name__)

# @receiver(post_save, sender=Lead)
# def sync_lead_to_sheets(sender, instance, created, **kwargs):
#     """Automatically sync lead to Google Sheets when created or updated"""
#     # DISABLED: This was causing duplicate entries
#     # Manual audit logging is handled in the Lead model's save method
#     pass

@receiver(post_delete, sender=Lead)
def handle_lead_deletion(sender, instance, **kwargs):
    """Handle lead deletion in Google Sheets"""
    # Only sync if Google Sheets is configured
    if not getattr(settings, 'GOOGLE_SHEETS_SPREADSHEET_ID', ''):
        return
    
    try:
        # For now, we'll just log the deletion
        # In a full implementation, you might want to mark the row as deleted
        # or move it to a separate "Deleted Leads" worksheet
        logger.info(f"Lead {instance.id} deleted - consider updating Google Sheets manually")
        
    except Exception as e:
        logger.error(f"Error handling lead deletion {instance.id}: {e}")
