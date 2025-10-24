#!/usr/bin/env python3
"""
Terminal-based lead upload script for Call Centre Lead Tracker data
Handles the specific JSON format and uses proper date/time and lead numbering
"""

import os
import sys
import django
import json
from datetime import datetime
import re

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from leads.models import Lead
from django.utils import timezone

User = get_user_model()

def parse_date_time(date_time_str):
    """Parse the date/time string from the JSON format"""
    try:
        # Remove extra spaces and normalize
        date_time_str = date_time_str.strip()
        
        # Check if there's a space (indicating time is present)
        if ' ' in date_time_str:
            # Split date and time
            date_part, time_part = date_time_str.split(' ', 1)
            
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_part.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Parse time (HH.MMpm or HH.MMam) - ignore AM/PM, treat as 24-hour format
            time_match = re.match(r'(\d+)\.(\d+)(am|pm)', time_part.lower())
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2))
                
                # Use the time as-is (ignore AM/PM)
                return datetime(int(year), int(month), int(day), hour, minute)
        else:
            # Date only (no time)
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_time_str.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Return date at midnight
            return datetime(int(year), int(month), int(day), 0, 0)
        
    except Exception as e:
        print(f"Error parsing date/time '{date_time_str}': {e}")
    
    # Fallback to current time
    return timezone.now()

def map_outcome_to_status(outcome):
    """Map the outcome from JSON to CRM status"""
    outcome = outcome.strip().lower()
    
    mapping = {
        'on hold': 'qualifier_callback',
        'callback': 'callback',
        'blow out': 'blow_out',
        'interested': 'interested',
        'not interested': 'not_interested',
        'qualified': 'qualified',
        'appointment set': 'appointment_set',
        'appointment completed': 'appointment_completed',
        'sent to kelly': 'sent_to_kelly',
        'pass back to agent': 'pass_back_to_agent',
        'no contact': 'no_contact',
        'tenant': 'tenant',
        'other disposition': 'other_disposition'
    }
    
    return mapping.get(outcome, 'cold_call')

def map_agent_name(agent_name):
    """Map agent names from JSON to actual database usernames"""
    agent_name = agent_name.strip()
    
    # Mapping dictionary for agent name variations
    agent_mapping = {
        'CalebG': 'Caleb',
        'Leia': 'Leia',  # This one exists
        'Tyler': 'Tyler',  # This one exists
        'Libby': 'Libby',  # This one exists
        'Imani': 'Imani',  # This one exists
        'Jake': 'Jake',  # This one exists
        'EllaA': 'EllaA',  # This one exists
    }
    
    return agent_mapping.get(agent_name, agent_name)

def upload_leads_from_json(json_file_path):
    """Upload leads from the converted JSON file"""
    
    print(f"Loading JSON file: {json_file_path}")
    
    # Load JSON data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        leads_data = json.load(f)
    
    print(f"Found {len(leads_data)} leads to process")
    
    # Track results
    created_count = 0
    failed_count = 0
    failed_leads = []
    
    # Start lead numbering from MS001
    lead_number = 1
    
    for index, lead_data in enumerate(leads_data):
        try:
            # Extract and clean data
            agent_name = lead_data.get('Agent', '').strip()
            date_time_str = lead_data.get('Date & Time ', '')
            customer_name = lead_data.get('Customer Name', '').strip()
            customer_number = lead_data.get('Customer Number', '').strip()
            customer_address = lead_data.get('Customer address ', '').strip()
            customer_postcode = lead_data.get('Customer Postcode', '').strip()
            contact_notes = lead_data.get('Contact Centre Notes ', '').strip()
            outcome = lead_data.get('Outcome', '').strip()
            kelly_notes = lead_data.get('Kelly Notes ', '').strip()
            data_source = lead_data.get('Data Source ', '').strip()
            
            # Handle multiple phone numbers - take the first one and note others
            primary_phone = customer_number
            additional_phones = ""
            if '/' in customer_number:
                phones = [phone.strip() for phone in customer_number.split('/')]
                primary_phone = phones[0]
                additional_phones = " / ".join(phones[1:])
            
            # Truncate phone number if too long (max 20 characters)
            if len(primary_phone) > 20:
                primary_phone = primary_phone[:20]
            
            # Validate required fields
            if not customer_name or not primary_phone:
                failed_leads.append({
                    'index': index + 1,
                    'name': customer_name or 'Unknown',
                    'phone': primary_phone or 'Unknown',
                    'error': 'Missing required fields (name or phone)'
                })
                failed_count += 1
                continue
            
            # Find agent (trim whitespace and map to correct username)
            agent = None
            if agent_name:
                agent_name_trimmed = agent_name.strip()
                agent_name_mapped = map_agent_name(agent_name_trimmed)
                
                if agent_name_trimmed != agent_name_mapped:
                    print(f"Mapped agent name: '{agent_name_trimmed}' -> '{agent_name_mapped}'")
                elif agent_name != agent_name_trimmed:
                    print(f"Trimmed agent name: '{agent_name}' -> '{agent_name_trimmed}'")
                
                try:
                    agent = User.objects.get(username=agent_name_mapped)
                    print(f"Found agent: '{agent_name_mapped}' for lead {customer_name}")
                except User.DoesNotExist:
                    print(f"Warning: Agent '{agent_name_mapped}' not found, creating lead without assigned agent")
            
            # Parse date/time
            created_at = parse_date_time(date_time_str) if date_time_str else timezone.now()
            
            # Map outcome to status
            status = map_outcome_to_status(outcome)
            
            # Combine notes and handle length limits
            combined_notes = f"Contact Centre Notes: {contact_notes}"
            if kelly_notes:
                combined_notes += f"\n\nKelly Notes: {kelly_notes}"
            if data_source:
                combined_notes += f"\n\nData Source: {data_source}"
            if additional_phones:
                combined_notes += f"\n\nAdditional Phone Numbers: {additional_phones}"
            
            # Truncate notes if too long (max 1000 characters to be safe)
            if len(combined_notes) > 1000:
                combined_notes = combined_notes[:997] + "..."
            
            # Debug: Print the parsed date
            if date_time_str:
                print(f"Parsed '{date_time_str}' -> {created_at}")
            
            # Debug: Print phone number handling
            if '/' in customer_number:
                print(f"Multiple phones for {customer_name}: '{customer_number}' -> Primary: '{primary_phone}', Additional: '{additional_phones}'")
            
            # Debug: Print notes length
            if len(combined_notes) > 500:
                print(f"Long notes for {customer_name}: {len(combined_notes)} characters")
            
            # Create lead with custom lead number
            lead = Lead.objects.create(
                full_name=customer_name,
                phone=primary_phone,
                address1=customer_address,
                postal_code=customer_postcode,
                notes=combined_notes,
                status=status,
                assigned_agent=agent
            )
            
            # Set custom lead number and timestamps after creation
            lead.lead_number = f"MS{lead_number:03d}"
            lead.created_at = created_at
            lead.updated_at = created_at
            lead.save()
            
            created_count += 1
            lead_number += 1
            
            if created_count % 50 == 0:
                print(f"Processed {created_count} leads...")
            
        except Exception as e:
            failed_leads.append({
                'index': index + 1,
                'name': lead_data.get('Customer Name', 'Unknown'),
                'phone': lead_data.get('Customer Number', 'Unknown'),
                'error': str(e)
            })
            failed_count += 1
            print(f"Error processing lead {index + 1}: {e}")
    
    # Print results
    print(f"\n{'='*60}")
    print(f"UPLOAD COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Successfully created: {created_count} leads")
    print(f"❌ Failed to create: {failed_count} leads")
    print(f"📊 Total processed: {len(leads_data)} leads")
    
    if failed_leads:
        print(f"\n❌ FAILED LEADS:")
        print(f"{'='*60}")
        for failed in failed_leads[:10]:  # Show first 10 failures
            print(f"Lead {failed['index']}: {failed['name']} ({failed['phone']}) - {failed['error']}")
        
        if len(failed_leads) > 10:
            print(f"... and {len(failed_leads) - 10} more failures")
    
    return {
        'created_count': created_count,
        'failed_count': failed_count,
        'failed_leads': failed_leads
    }

def main():
    """Main function"""
    print("Call Centre Lead Tracker - Terminal Upload")
    print("=" * 50)
    
    # Check if JSON file exists
    json_file_path = "Call Centre Lead Tracker_converted.json"
    
    if not os.path.exists(json_file_path):
        print(f"❌ Error: JSON file '{json_file_path}' not found!")
        print("Please make sure the file is in the current directory.")
        return
    
    # Confirm upload
    print(f"📁 Found JSON file: {json_file_path}")
    print(f"📊 This will upload leads with:")
    print(f"   - Lead numbers starting from MS001")
    print(f"   - Original date/time from the data")
    print(f"   - Proper status mapping")
    print(f"   - Agent assignments")
    
    response = input("\n🤔 Do you want to proceed with the upload? (y/N): ")
    if response.lower() != 'y':
        print("❌ Upload cancelled.")
        return
    
    # Perform upload
    try:
        result = upload_leads_from_json(json_file_path)
        
        if result['created_count'] > 0:
            print(f"\n🎉 SUCCESS! {result['created_count']} leads uploaded successfully!")
            print(f"📈 You can now view them in the admin panel or frontend.")
        
        if result['failed_count'] > 0:
            print(f"\n⚠️  {result['failed_count']} leads failed to upload.")
            print(f"Check the error messages above for details.")
    
    except Exception as e:
        print(f"❌ Upload failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

Terminal-based lead upload script for Call Centre Lead Tracker data
Handles the specific JSON format and uses proper date/time and lead numbering
"""

import os
import sys
import django
import json
from datetime import datetime
import re

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from leads.models import Lead
from django.utils import timezone

User = get_user_model()

def parse_date_time(date_time_str):
    """Parse the date/time string from the JSON format"""
    try:
        # Remove extra spaces and normalize
        date_time_str = date_time_str.strip()
        
        # Check if there's a space (indicating time is present)
        if ' ' in date_time_str:
            # Split date and time
            date_part, time_part = date_time_str.split(' ', 1)
            
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_part.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Parse time (HH.MMpm or HH.MMam) - ignore AM/PM, treat as 24-hour format
            time_match = re.match(r'(\d+)\.(\d+)(am|pm)', time_part.lower())
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2))
                
                # Use the time as-is (ignore AM/PM)
                return datetime(int(year), int(month), int(day), hour, minute)
        else:
            # Date only (no time)
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_time_str.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Return date at midnight
            return datetime(int(year), int(month), int(day), 0, 0)
        
    except Exception as e:
        print(f"Error parsing date/time '{date_time_str}': {e}")
    
    # Fallback to current time
    return timezone.now()

def map_outcome_to_status(outcome):
    """Map the outcome from JSON to CRM status"""
    outcome = outcome.strip().lower()
    
    mapping = {
        'on hold': 'qualifier_callback',
        'callback': 'callback',
        'blow out': 'blow_out',
        'interested': 'interested',
        'not interested': 'not_interested',
        'qualified': 'qualified',
        'appointment set': 'appointment_set',
        'appointment completed': 'appointment_completed',
        'sent to kelly': 'sent_to_kelly',
        'pass back to agent': 'pass_back_to_agent',
        'no contact': 'no_contact',
        'tenant': 'tenant',
        'other disposition': 'other_disposition'
    }
    
    return mapping.get(outcome, 'cold_call')

def map_agent_name(agent_name):
    """Map agent names from JSON to actual database usernames"""
    agent_name = agent_name.strip()
    
    # Mapping dictionary for agent name variations
    agent_mapping = {
        'CalebG': 'Caleb',
        'Leia': 'Leia',  # This one exists
        'Tyler': 'Tyler',  # This one exists
        'Libby': 'Libby',  # This one exists
        'Imani': 'Imani',  # This one exists
        'Jake': 'Jake',  # This one exists
        'EllaA': 'EllaA',  # This one exists
    }
    
    return agent_mapping.get(agent_name, agent_name)

def upload_leads_from_json(json_file_path):
    """Upload leads from the converted JSON file"""
    
    print(f"Loading JSON file: {json_file_path}")
    
    # Load JSON data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        leads_data = json.load(f)
    
    print(f"Found {len(leads_data)} leads to process")
    
    # Track results
    created_count = 0
    failed_count = 0
    failed_leads = []
    
    # Start lead numbering from MS001
    lead_number = 1
    
    for index, lead_data in enumerate(leads_data):
        try:
            # Extract and clean data
            agent_name = lead_data.get('Agent', '').strip()
            date_time_str = lead_data.get('Date & Time ', '')
            customer_name = lead_data.get('Customer Name', '').strip()
            customer_number = lead_data.get('Customer Number', '').strip()
            customer_address = lead_data.get('Customer address ', '').strip()
            customer_postcode = lead_data.get('Customer Postcode', '').strip()
            contact_notes = lead_data.get('Contact Centre Notes ', '').strip()
            outcome = lead_data.get('Outcome', '').strip()
            kelly_notes = lead_data.get('Kelly Notes ', '').strip()
            data_source = lead_data.get('Data Source ', '').strip()
            
            # Handle multiple phone numbers - take the first one and note others
            primary_phone = customer_number
            additional_phones = ""
            if '/' in customer_number:
                phones = [phone.strip() for phone in customer_number.split('/')]
                primary_phone = phones[0]
                additional_phones = " / ".join(phones[1:])
            
            # Truncate phone number if too long (max 20 characters)
            if len(primary_phone) > 20:
                primary_phone = primary_phone[:20]
            
            # Validate required fields
            if not customer_name or not primary_phone:
                failed_leads.append({
                    'index': index + 1,
                    'name': customer_name or 'Unknown',
                    'phone': primary_phone or 'Unknown',
                    'error': 'Missing required fields (name or phone)'
                })
                failed_count += 1
                continue
            
            # Find agent (trim whitespace and map to correct username)
            agent = None
            if agent_name:
                agent_name_trimmed = agent_name.strip()
                agent_name_mapped = map_agent_name(agent_name_trimmed)
                
                if agent_name_trimmed != agent_name_mapped:
                    print(f"Mapped agent name: '{agent_name_trimmed}' -> '{agent_name_mapped}'")
                elif agent_name != agent_name_trimmed:
                    print(f"Trimmed agent name: '{agent_name}' -> '{agent_name_trimmed}'")
                
                try:
                    agent = User.objects.get(username=agent_name_mapped)
                    print(f"Found agent: '{agent_name_mapped}' for lead {customer_name}")
                except User.DoesNotExist:
                    print(f"Warning: Agent '{agent_name_mapped}' not found, creating lead without assigned agent")
            
            # Parse date/time
            created_at = parse_date_time(date_time_str) if date_time_str else timezone.now()
            
            # Map outcome to status
            status = map_outcome_to_status(outcome)
            
            # Combine notes and handle length limits
            combined_notes = f"Contact Centre Notes: {contact_notes}"
            if kelly_notes:
                combined_notes += f"\n\nKelly Notes: {kelly_notes}"
            if data_source:
                combined_notes += f"\n\nData Source: {data_source}"
            if additional_phones:
                combined_notes += f"\n\nAdditional Phone Numbers: {additional_phones}"
            
            # Truncate notes if too long (max 1000 characters to be safe)
            if len(combined_notes) > 1000:
                combined_notes = combined_notes[:997] + "..."
            
            # Debug: Print the parsed date
            if date_time_str:
                print(f"Parsed '{date_time_str}' -> {created_at}")
            
            # Debug: Print phone number handling
            if '/' in customer_number:
                print(f"Multiple phones for {customer_name}: '{customer_number}' -> Primary: '{primary_phone}', Additional: '{additional_phones}'")
            
            # Debug: Print notes length
            if len(combined_notes) > 500:
                print(f"Long notes for {customer_name}: {len(combined_notes)} characters")
            
            # Create lead with custom lead number
            lead = Lead.objects.create(
                full_name=customer_name,
                phone=primary_phone,
                address1=customer_address,
                postal_code=customer_postcode,
                notes=combined_notes,
                status=status,
                assigned_agent=agent
            )
            
            # Set custom lead number and timestamps after creation
            lead.lead_number = f"MS{lead_number:03d}"
            lead.created_at = created_at
            lead.updated_at = created_at
            lead.save()
            
            created_count += 1
            lead_number += 1
            
            if created_count % 50 == 0:
                print(f"Processed {created_count} leads...")
            
        except Exception as e:
            failed_leads.append({
                'index': index + 1,
                'name': lead_data.get('Customer Name', 'Unknown'),
                'phone': lead_data.get('Customer Number', 'Unknown'),
                'error': str(e)
            })
            failed_count += 1
            print(f"Error processing lead {index + 1}: {e}")
    
    # Print results
    print(f"\n{'='*60}")
    print(f"UPLOAD COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Successfully created: {created_count} leads")
    print(f"❌ Failed to create: {failed_count} leads")
    print(f"📊 Total processed: {len(leads_data)} leads")
    
    if failed_leads:
        print(f"\n❌ FAILED LEADS:")
        print(f"{'='*60}")
        for failed in failed_leads[:10]:  # Show first 10 failures
            print(f"Lead {failed['index']}: {failed['name']} ({failed['phone']}) - {failed['error']}")
        
        if len(failed_leads) > 10:
            print(f"... and {len(failed_leads) - 10} more failures")
    
    return {
        'created_count': created_count,
        'failed_count': failed_count,
        'failed_leads': failed_leads
    }

def main():
    """Main function"""
    print("Call Centre Lead Tracker - Terminal Upload")
    print("=" * 50)
    
    # Check if JSON file exists
    json_file_path = "Call Centre Lead Tracker_converted.json"
    
    if not os.path.exists(json_file_path):
        print(f"❌ Error: JSON file '{json_file_path}' not found!")
        print("Please make sure the file is in the current directory.")
        return
    
    # Confirm upload
    print(f"📁 Found JSON file: {json_file_path}")
    print(f"📊 This will upload leads with:")
    print(f"   - Lead numbers starting from MS001")
    print(f"   - Original date/time from the data")
    print(f"   - Proper status mapping")
    print(f"   - Agent assignments")
    
    response = input("\n🤔 Do you want to proceed with the upload? (y/N): ")
    if response.lower() != 'y':
        print("❌ Upload cancelled.")
        return
    
    # Perform upload
    try:
        result = upload_leads_from_json(json_file_path)
        
        if result['created_count'] > 0:
            print(f"\n🎉 SUCCESS! {result['created_count']} leads uploaded successfully!")
            print(f"📈 You can now view them in the admin panel or frontend.")
        
        if result['failed_count'] > 0:
            print(f"\n⚠️  {result['failed_count']} leads failed to upload.")
            print(f"Check the error messages above for details.")
    
    except Exception as e:
        print(f"❌ Upload failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
