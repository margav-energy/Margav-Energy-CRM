"""
Google Sheets integration service for lead data synchronization and audit logging
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.utils import timezone as django_timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from .models import Lead

logger = logging.getLogger(__name__)

class GoogleSheetsService:
    """Service for synchronizing lead data with Google Sheets"""
    
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    
    def __init__(self):
        self.client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        self.refresh_token = getattr(settings, 'GOOGLE_REFRESH_TOKEN', '')
        self.spreadsheet_id = getattr(settings, 'GOOGLE_SHEETS_SPREADSHEET_ID', '')
        # Force worksheet name to 'Leads' to match the actual spreadsheet
        self.worksheet_name = 'Leads'
        
    def get_credentials(self) -> Optional[Credentials]:
        """Get Google API credentials"""
        if not all([self.client_id, self.client_secret, self.refresh_token]):
            logger.warning("Google Sheets credentials not configured")
            return None
            
        try:
            credentials = Credentials(
                token=None,
                refresh_token=self.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.SCOPES
            )
            return credentials
        except Exception as e:
            logger.error(f"Failed to create credentials: {e}")
            return None
    
    def get_service(self):
        """Get Google Sheets service"""
        credentials = self.get_credentials()
        if not credentials:
            return None
            
        try:
            service = build('sheets', 'v4', credentials=credentials)
            return service
        except Exception as e:
            logger.error(f"Failed to create Google Sheets service: {e}")
            return None
    
    def create_spreadsheet(self, title: str = "Margav Energy CRM - Leads") -> Optional[str]:
        """Create a new Google Spreadsheet"""
        service = self.get_service()
        if not service:
            return None
            
        try:
            spreadsheet = {
                'properties': {
                    'title': title
                },
                'sheets': [{
                    'properties': {
                        'title': self.worksheet_name,
                        'gridProperties': {
                            'rowCount': 1000,
                            'columnCount': 20
                        }
                    }
                }]
            }
            
            spreadsheet = service.spreadsheets().create(body=spreadsheet).execute()
            spreadsheet_id = spreadsheet.get('spreadsheetId')
            
            # Set up headers
            self.setup_headers(spreadsheet_id)
            
            logger.info(f"Created new spreadsheet: {spreadsheet_id}")
            return spreadsheet_id
            
        except HttpError as e:
            logger.error(f"Failed to create spreadsheet: {e}")
            return None
    
    def setup_headers(self, spreadsheet_id: str) -> bool:
        """Set up column headers in the spreadsheet"""
        service = self.get_service()
        if not service:
            return False
            
        headers = [
            'ID', 'Full Name', 'Phone', 'Email', 'Address', 'City', 'Postcode',
            'Status', 'Assigned Agent', 'Field Sales Rep', 'Created Date', 'Updated Date',
            'Appointment Date', 'Notes', 
            # System Fields
            'Is Deleted', 'Deleted Date', 'Action', 'Logged At'
        ]
        
        try:
            body = {
                'values': [headers]
            }
            
            service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=f'{self.worksheet_name}!A1:R1',
                valueInputOption='RAW',
                body=body
            ).execute()
            
            logger.info("Headers set up successfully")
            return True
            
        except HttpError as e:
            logger.error(f"Failed to set up headers: {e}")
            return False
    
    def sync_lead_to_sheets(self, lead: Lead) -> bool:
        """Sync a single lead to Google Sheets"""
        if not self.spreadsheet_id:
            logger.warning("No spreadsheet ID configured")
            return False
            
        service = self.get_service()
        if not service:
            return False
            
        try:
            # Set up headers first (if not already done)
            self.setup_headers(self.spreadsheet_id)
            
            # Convert lead to row data
            row_data = self.lead_to_row(lead)
            
            # Check if lead already exists in the sheet
            existing_row = self._find_existing_row(service, lead.id)
            
            if existing_row:
                # Update existing row
                body = {
                    'values': [row_data]
                }
                
                service.spreadsheets().values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=f'{self.worksheet_name}!A{existing_row}:R{existing_row}',
                    valueInputOption='RAW',
                    body=body
                ).execute()
                
                logger.info(f"Updated existing lead {lead.id} in Google Sheets at row {existing_row}")
            else:
                # Add new row
                next_row = self.get_next_empty_row(service, self.spreadsheet_id)
                
                body = {
                    'values': [row_data]
                }
                
                service.spreadsheets().values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=f'{self.worksheet_name}!A{next_row}:R{next_row}',
                    valueInputOption='RAW',
                    body=body
                ).execute()
                
                logger.info(f"Added new lead {lead.id} to Google Sheets at row {next_row}")
            
            logger.info(f"Synced lead {lead.id} to Google Sheets")
            return True
            
        except HttpError as e:
            logger.error(f"Failed to sync lead {lead.id}: {e}")
            return False
    
    def sync_all_leads_to_sheets(self) -> Dict[str, int]:
        """Sync all leads to Google Sheets"""
        if not self.spreadsheet_id:
            logger.warning("No spreadsheet ID configured")
            return {'success': 0, 'failed': 0}
            
        service = self.get_service()
        if not service:
            return {'success': 0, 'failed': 0}
            
        try:
            # Get all leads
            leads = Lead.objects.all()
            
            # Prepare batch data
            rows_data = []
            for lead in leads:
                row_data = self.lead_to_row(lead)
                rows_data.append(row_data)
            
            if not rows_data:
                logger.info("No leads to sync")
                return {'success': 0, 'failed': 0}
            
            # Set up headers first
            self.setup_headers(self.spreadsheet_id)
            
            # DON'T clear existing data - we want to preserve deleted leads
            # Instead, we'll update existing leads and add new ones
            
            # Get existing data to find which leads are already in the sheet
            existing_data = self._get_existing_data(service, self.spreadsheet_id)
            existing_lead_ids = set()
            
            if existing_data:
                for row in existing_data:
                    if len(row) > 0 and row[0].isdigit():
                        existing_lead_ids.add(int(row[0]))
            
            # Separate new leads from existing leads
            new_leads = []
            existing_leads = []
            
            for lead in leads:
                if lead.id in existing_lead_ids:
                    existing_leads.append(lead)
                else:
                    new_leads.append(lead)
            
            # Update existing leads in place
            for lead in existing_leads:
                self.sync_lead_to_sheets(lead)
            
            # Add new leads
            if new_leads:
                new_rows_data = [self.lead_to_row(lead) for lead in new_leads]
                next_row = self.get_next_empty_row(service, self.spreadsheet_id)
                
                body = {
                    'values': new_rows_data
                }
                
                service.spreadsheets().values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=f'{self.worksheet_name}!A{next_row}:R{next_row + len(new_rows_data) - 1}',
                    valueInputOption='RAW',
                    body=body
                ).execute()
            
            total_synced = len(existing_leads) + len(new_leads)
            logger.info(f"Synced {total_synced} leads to Google Sheets ({len(existing_leads)} updated, {len(new_leads)} new)")
            return {'success': total_synced, 'failed': 0}
            
        except HttpError as e:
            logger.error(f"Failed to sync all leads: {e}")
            return {'success': 0, 'failed': leads.count()}
    
    def lead_to_row(self, lead: Lead) -> List[str]:
        """Convert a lead object to a row of data for Google Sheets"""
        # Build address from components or use notes as fallback
        address_parts = [lead.address1, lead.address2, lead.address3]
        full_address = ', '.join([part for part in address_parts if part])
        
        # If no structured address, try to extract from notes
        if not full_address and lead.notes:
            # Look for address in notes
            lines = lead.notes.split('\n')
            for line in lines:
                if 'Address:' in line:
                    full_address = line.replace('Address:', '').strip()
                    break
        
        return [
            str(lead.id),
            lead.full_name or '',
            lead.phone or '',
            lead.email or '',
            full_address,
            lead.city or '',
            lead.postal_code or '',
            lead.status or '',
            lead.assigned_agent.get_full_name() if lead.assigned_agent else (lead.assigned_agent_name or ''),
            lead.field_sales_rep.get_full_name() if lead.field_sales_rep else '',
            lead.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.created_at else '',
            lead.updated_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.updated_at else '',
            lead.appointment_date.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.appointment_date else '',
            lead.notes or '',
            # System Fields
            'Yes' if lead.is_deleted else 'No',
            lead.deleted_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.deleted_at else '',
            '',  # Action - will be filled by audit logging
            ''   # Logged At - will be filled by audit logging
        ]
    
    def _get_existing_data(self, service, spreadsheet_id: str) -> List[List[str]]:
        """Get existing data from the worksheet"""
        try:
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=f'{self.worksheet_name}!A2:R1000'  # Get all data except headers
            ).execute()
            return result.get('values', [])
        except Exception as e:
            logger.error(f"Failed to get existing data: {e}")
            return []
    
    def get_next_empty_row(self, service, spreadsheet_id: str) -> int:
        """Find the next empty row in the worksheet"""
        try:
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=f'{self.worksheet_name}!A:A'
            ).execute()
            
            values = result.get('values', [])
            return len(values) + 1
            
        except HttpError as e:
            logger.error(f"Failed to get next empty row: {e}")
            return 2  # Default to row 2 (after headers)
    
    def clear_worksheet_data(self, service, spreadsheet_id: str) -> bool:
        """Clear all data except headers"""
        try:
            # Get the range of data (excluding header row)
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=f'{self.worksheet_name}!A2:V1000'
            ).execute()
            
            values = result.get('values', [])
            if values:
                # Clear the data
                service.spreadsheets().values().clear(
                    spreadsheetId=spreadsheet_id,
                    range=f'{self.worksheet_name}!A2:Z{len(values) + 1}'
                ).execute()
            
            return True
            
        except HttpError as e:
            logger.error(f"Failed to clear worksheet data: {e}")
            return False
    
    def get_spreadsheet_url(self) -> Optional[str]:
        """Get the URL of the configured spreadsheet"""
        if not self.spreadsheet_id:
            return None
        return f"https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}"
    
    def log_crm_record_to_sheets(self, record_data: dict, action: str) -> bool:
        """
        Log CRM appointment/lead changes to Google Sheets as an audit trail.
        
        Args:
            record_data: Dictionary containing all appointment and lead details
            action: One of "CREATED", "UPDATED", "DELETED"
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.spreadsheet_id:
            logger.warning("No spreadsheet ID configured for audit logging")
            return False
            
        service = self.get_service()
        if not service:
            logger.error("Google Sheets service not available for audit logging")
            return False
            
        try:
            # Ensure headers are set up first
            self.setup_headers(self.spreadsheet_id)
            
            # Prepare row data
            row_data = self._prepare_audit_row(record_data, action)
            
            if action == "CREATED" or action == "DELETED":
                # Always create new row for CREATED and DELETED
                next_row = self.get_next_empty_row(service, self.spreadsheet_id)
                range_name = f'{self.worksheet_name}!A{next_row}:R{next_row}'
            else:  # UPDATED
                # Try to find existing row by ID
                existing_row = self._find_existing_row(service, record_data.get('id'))
                if existing_row:
                    # Update existing row
                    range_name = f'{self.worksheet_name}!A{existing_row}:R{existing_row}'
                else:
                    # Create new row if not found
                    next_row = self.get_next_empty_row(service, self.spreadsheet_id)
                    range_name = f'{self.worksheet_name}!A{next_row}:R{next_row}'
            
            # Update or append the row
            body = {
                'values': [row_data]
            }
            
            service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                valueInputOption='RAW',
                body=body
            ).execute()
            
            logger.info(f"Lead {action.lower()}: {record_data.get('id', 'unknown')} - {'Updated existing row' if action == 'UPDATED' and existing_row else 'Added new row'}")
            return True
            
        except HttpError as e:
            logger.error(f"Failed to log audit entry to Google Sheets: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error logging audit entry: {e}")
            return False
    
    def _prepare_audit_row(self, record_data: dict, action: str) -> List[str]:
        """
        Prepare a row for audit logging with all required fields.
        
        Args:
            record_data: Dictionary containing lead/appointment data
            action: Action performed (CREATED/UPDATED/DELETED)
            
        Returns:
            List of strings representing the row data
        """
        # Get current timestamp
        logged_at = timezone.now().astimezone().strftime('%Y-%m-%d %H:%M:%S')
        
        # Build address from components
        address_parts = [
            record_data.get('address1', ''),
            record_data.get('address2', ''),
            record_data.get('address3', '')
        ]
        full_address = ', '.join([part for part in address_parts if part])
        
        # Prepare the row with all existing columns plus audit fields
        row_data = [
            # Basic Information
            str(record_data.get('id', '')),
            record_data.get('full_name', ''),
            record_data.get('phone', ''),
            record_data.get('email', ''),
            full_address,
            record_data.get('city', ''),
            record_data.get('postal_code', ''),
            record_data.get('status', ''),
            record_data.get('assigned_agent_name', ''),
            record_data.get('field_sales_rep_name', ''),
            record_data.get('created_at', ''),
            record_data.get('updated_at', ''),
            record_data.get('appointment_date', ''),
            record_data.get('notes', ''),
            # System Fields
            'Yes' if record_data.get('is_deleted', False) else 'No',
            record_data.get('deleted_at', ''),
            action,  # Action performed
            logged_at  # When the log entry was made
        ]
        
        return row_data
    
    def _extract_from_notes(self, notes: str, field_name: str) -> str:
        """
        Extract a specific field value from the notes text.
        
        Args:
            notes: The notes text containing field information
            field_name: The name of the field to extract
            
        Returns:
            The extracted value or empty string if not found
        """
        if not notes:
            return ''
        
        try:
            lines = notes.split('\n')
            for line in lines:
                if field_name.lower() in line.lower():
                    # Extract the value after the colon
                    if ':' in line:
                        return line.split(':', 1)[1].strip()
            return ''
        except Exception:
            return ''
    
    def _find_existing_row(self, service, lead_id: int) -> Optional[int]:
        """
        Find the row number of an existing lead by ID.
        
        Args:
            service: Google Sheets service instance
            lead_id: Lead ID to search for
            
        Returns:
            Row number if found, None otherwise
        """
        try:
            # Get all data from the sheet
            result = service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f'{self.worksheet_name}!A:A'
            ).execute()
            
            values = result.get('values', [])
            
            # Search for the lead ID in column A (skip header row)
            for i, row in enumerate(values[1:], start=2):  # Start from row 2, skip header
                if row and row[0] == str(lead_id):
                    return i
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding existing row for lead {lead_id}: {e}")
            return None


# Global instance
google_sheets_service = GoogleSheetsService()
