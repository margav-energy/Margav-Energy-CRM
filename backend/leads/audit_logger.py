"""
Audit logging module for CRM record changes
"""
import logging
from typing import Dict, Any
from django.utils import timezone
from .google_sheets_service import google_sheets_service
from .models import Lead

logger = logging.getLogger(__name__)

def log_crm_record_to_sheets(record_data: Dict[str, Any], action: str) -> bool:
    """
    Log CRM appointment/lead changes to Google Sheets as an audit trail.
    
    This function provides a simple interface for logging CRM record changes
    to Google Sheets, creating a permanent audit trail.
    
    Args:
        record_data: Dictionary containing all appointment and lead details
        action: One of "CREATED", "UPDATED", "DELETED"
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure we have a valid action
        if action not in ["CREATED", "UPDATED", "DELETED"]:
            logger.error(f"Invalid action '{action}'. Must be one of: CREATED, UPDATED, DELETED")
            return False
        
        # Use the Google Sheets service to log the record
        return google_sheets_service.log_crm_record_to_sheets(record_data, action)
        
    except Exception as e:
        logger.error(f"Failed to log CRM record to sheets: {e}")
        return False

def prepare_lead_data_for_audit(lead: Lead) -> Dict[str, Any]:
    """
    Prepare lead data for audit logging by converting Lead model to dictionary.
    
    Args:
        lead: Lead model instance
        
    Returns:
        Dictionary containing all lead data for audit logging
    """
    return {
        'id': lead.id,
        'full_name': lead.full_name or '',
        'phone': lead.phone or '',
        'email': lead.email or '',
        'address': f"{lead.address1 or ''} {lead.address2 or ''} {lead.address3 or ''}".strip() or '',
        'city': lead.city or '',
        'state': lead.state or '',
        'postal_code': lead.postal_code or '',
        'status': lead.status or '',
        'assigned_agent_name': lead.assigned_agent.get_full_name() if lead.assigned_agent else (lead.assigned_agent_name or ''),
        'field_sales_rep_name': lead.field_sales_rep.get_full_name() if lead.field_sales_rep else '',
        'created_at': lead.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.created_at else '',
        'updated_at': lead.updated_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.updated_at else '',
        'appointment_date': lead.appointment_date.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.appointment_date else '',
        'sale_amount': lead.sale_amount or '',
        'notes': lead.notes or '',
        'is_deleted': lead.is_deleted,
        'deleted_at': lead.deleted_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.deleted_at else '',
    }

def log_lead_created(lead: Lead) -> bool:
    """Log when a lead is created"""
    record_data = prepare_lead_data_for_audit(lead)
    return log_crm_record_to_sheets(record_data, "CREATED")

def log_lead_updated(lead: Lead) -> bool:
    """Log when a lead is updated"""
    record_data = prepare_lead_data_for_audit(lead)
    return log_crm_record_to_sheets(record_data, "UPDATED")

def log_lead_deleted(lead: Lead) -> bool:
    """Log when a lead is deleted"""
    record_data = prepare_lead_data_for_audit(lead)
    return log_crm_record_to_sheets(record_data, "DELETED")
