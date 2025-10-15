try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None
import re
from datetime import datetime
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Lead

User = get_user_model()


class ExcelLeadParser:
    """
    Parser for Excel files containing lead data.
    Handles the specific format from Google Sheets.
    """
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def parse_excel_file(self, file_path):
        """
        Parse Excel file and return list of lead data.
        """
        if not PANDAS_AVAILABLE:
            self.errors.append("Pandas is not available. Excel parsing is disabled.")
            return []
        
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            
            # Define column mappings for flexibility
            column_mappings = {
                'Agent': ['Agent', 'agent', 'AGENT'],
                'Date & Time': ['Date & Time', 'Date', 'Time', 'Date Time', 'DateTime', 'Created Date', 'date & time'],
                'Customer Name': ['Customer Name', 'Name', 'Full Name', 'customer name', 'CUSTOMER NAME'],
                'Customer Number': ['Customer Number', 'Phone', 'Phone Number', 'Number', 'customer number', 'CUSTOMER NUMBER'],
                'Customer address': ['Customer address', 'Address', 'Customer Address', 'Street Address', 'Full Address', 'customer address', 'CUSTOMER ADDRESS'],
                'Customer Postcode': ['Customer Postcode', 'Postcode', 'Postal Code', 'Zip Code', 'customer postcode', 'CUSTOMER POSTCODE'],
                'Contact Centre Notes': ['Contact Centre Notes', 'Notes', 'Contact Notes', 'Centre Notes', 'Call Notes', 'contact centre notes', 'CONTACT CENTRE NOTES'],
                'Outcome': ['Outcome', 'Status', 'Result', 'outcome', 'OUTCOME'],
                'Kelly Notes': ['Kelly Notes', 'Kelly', 'Additional Notes', 'Follow-up Notes', 'Qualifier Notes', 'kelly notes', 'KELLY NOTES'],
                'Data Source': ['Data Source', 'Source', 'Lead Source', 'Origin', 'Campaign', 'data source', 'DATA SOURCE']
            }
            
            # First, clean column names by stripping whitespace
            df.columns = df.columns.str.strip()
            
            # Map columns to standard names
            df_mapped = df.copy()
            column_mapping = {}
            
            for standard_name, variations in column_mappings.items():
                found_column = None
                for variation in variations:
                    if variation in df.columns:
                        found_column = variation
                        break
                
                if found_column:
                    column_mapping[found_column] = standard_name
                else:
                    self.errors.append(f"Missing required column: {standard_name} (tried: {', '.join(variations)})")
            
            if self.errors:
                return []
            
            # Rename columns to standard names
            df_mapped = df_mapped.rename(columns=column_mapping)
            
            leads_data = []
            
            for index, row in df_mapped.iterrows():
                try:
                    lead_data = self._parse_lead_row(row, index + 2)  # +2 because Excel is 1-indexed and we skip header
                    if lead_data:
                        leads_data.append(lead_data)
                except Exception as e:
                    self.errors.append(f"Row {index + 2}: {str(e)}")
                    continue
            
            return leads_data
            
        except Exception as e:
            self.errors.append(f"Error reading Excel file: {str(e)}")
            return []
    
    def _parse_lead_row(self, row, row_number):
        """
        Parse a single row of lead data.
        """
        try:
            # Extract basic information
            agent_name = str(row['Agent']).strip() if pd.notna(row['Agent']) else ''
            customer_name = str(row['Customer Name']).strip() if pd.notna(row['Customer Name']) else ''
            customer_number = str(row['Customer Number']).strip() if pd.notna(row['Customer Number']) else ''
            customer_address = str(row['Customer address']).strip() if pd.notna(row['Customer address']) else ''
            customer_postcode = str(row['Customer Postcode']).strip() if pd.notna(row['Customer Postcode']) else ''
            contact_notes = str(row['Contact Centre Notes']).strip() if pd.notna(row['Contact Centre Notes']) else ''
            outcome = str(row['Outcome']).strip() if pd.notna(row['Outcome']) else ''
            kelly_notes = str(row['Kelly Notes']).strip() if pd.notna(row['Kelly Notes']) else ''
            data_source = str(row['Data Source']).strip() if pd.notna(row['Data Source']) else ''
            
            # Parse date and time
            date_time_str = str(row['Date & Time']).strip() if pd.notna(row['Date & Time']) else ''
            parsed_datetime = self._parse_datetime(date_time_str)
            
            # Validate required fields
            if not customer_name:
                raise ValueError("Customer Name is required")
            if not customer_number:
                raise ValueError("Customer Number is required")
            
            # Clean phone number
            cleaned_phone = self._clean_phone_number(customer_number)
            if not cleaned_phone:
                raise ValueError("Invalid phone number format")
            
            # Map outcome to lead status
            lead_status = self._map_outcome_to_status(outcome)
            
            # Find or create agent
            agent = self._find_agent(agent_name)
            if not agent:
                self.warnings.append(f"Row {row_number}: Agent '{agent_name}' not found, will assign to admin")
                agent = User.objects.filter(is_admin=True).first()
                if not agent:
                    raise ValueError("No admin user found to assign leads")
            
            # Build notes
            notes_parts = []
            if contact_notes:
                notes_parts.append(f"Contact Centre Notes: {contact_notes}")
            if kelly_notes:
                notes_parts.append(f"Kelly Notes: {kelly_notes}")
            if data_source:
                notes_parts.append(f"Data Source: {data_source}")
            if parsed_datetime:
                notes_parts.append(f"Original Date: {parsed_datetime.strftime('%Y-%m-%d %H:%M')}")
            
            notes = "\n\n".join(notes_parts) if notes_parts else ""
            
            # Create lead data
            lead_data = {
                'full_name': customer_name,
                'phone': cleaned_phone,
                'email': '',  # Not provided in sample
                'address1': customer_address,
                'postal_code': customer_postcode,
                'status': lead_status,
                'notes': notes,
                'assigned_agent': agent,  # Pass the User instance, not the ID
                'created_at': parsed_datetime or timezone.now(),
            }
            
            return lead_data
            
        except Exception as e:
            raise ValueError(f"Error parsing row {row_number}: {str(e)}")
    
    def _parse_datetime(self, date_time_str):
        """
        Parse date and time string from various formats.
        """
        if not date_time_str or date_time_str.lower() in ['nan', 'none', '']:
            return None
        
        try:
            # Try different date formats
            formats = [
                '%d.%m.%Y %H.%M%p',  # 16.09.2025 15.15pm
                '%d.%m.%Y %H.%M',    # 16.09.2025 15.15
                '%d/%m/%Y %H:%M',    # 16/09/2025 15:15
                '%Y-%m-%d %H:%M',    # 2025-09-16 15:15
                '%d-%m-%Y %H:%M',    # 16-09-2025 15:15
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_time_str, fmt)
                except ValueError:
                    continue
            
            # If none of the formats work, try pandas parsing
            return pd.to_datetime(date_time_str)
            
        except Exception:
            return None
    
    def _clean_phone_number(self, phone):
        """
        Clean and validate phone number.
        """
        if not phone:
            return None
        
        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d+]', '', str(phone))
        
        # Remove leading zeros and format
        if cleaned.startswith('0'):
            cleaned = '44' + cleaned[1:]  # Convert UK format
        elif not cleaned.startswith('+'):
            cleaned = '+' + cleaned
        
        # Validate length (should be 10-15 digits)
        digits_only = re.sub(r'[^\d]', '', cleaned)
        if len(digits_only) < 10 or len(digits_only) > 15:
            return None
        
        return cleaned
    
    def _map_outcome_to_status(self, outcome):
        """
        Map outcome to lead status.
        """
        outcome_lower = outcome.lower() if outcome else ''
        
        if 'on hold' in outcome_lower or 'callback' in outcome_lower:
            return 'callback'
        elif 'pass back' in outcome_lower:
            return 'pass_back_to_agent'
        elif 'blow out' in outcome_lower or 'not interested' in outcome_lower:
            return 'blow_out'
        elif 'interested' in outcome_lower:
            return 'interested'
        elif 'appointment' in outcome_lower:
            return 'appointment_set'
        elif 'qualified' in outcome_lower:
            return 'qualified'
        else:
            return 'interested'  # Default status
    
    def _find_agent(self, agent_name):
        """
        Find agent by name (first name or full name).
        """
        if not agent_name:
            return None
        
        # Try exact match first
        try:
            return User.objects.get(username__iexact=agent_name)
        except User.DoesNotExist:
            pass
        
        # Try first name match
        try:
            return User.objects.get(first_name__iexact=agent_name)
        except User.DoesNotExist:
            pass
        
        # Try full name match
        try:
            return User.objects.get(first_name__iexact=agent_name.split()[0])
        except (User.DoesNotExist, IndexError):
            pass
        
        return None
    
    def create_leads_from_data(self, leads_data):
        """
        Create Lead objects from parsed data.
        """
        created_leads = []
        failed_leads = []
        
        for lead_data in leads_data:
            try:
                # Check if lead already exists by phone
                existing_lead = Lead.objects.filter(phone=lead_data['phone']).first()
                if existing_lead:
                    self.warnings.append(f"Lead with phone {lead_data['phone']} already exists (ID: {existing_lead.id})")
                    continue
                
                # Create the lead
                lead = Lead.objects.create(**lead_data)
                created_leads.append(lead)
                
            except Exception as e:
                failed_leads.append({
                    'data': lead_data,
                    'error': str(e)
                })
                self.errors.append(f"Failed to create lead for {lead_data.get('full_name', 'Unknown')}: {str(e)}")
        
        return {
            'created_leads': created_leads,
            'failed_leads': failed_leads,
            'errors': self.errors,
            'warnings': self.warnings
        }
