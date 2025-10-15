#!/usr/bin/env python3
"""
Recover Leads from Admin Logs
This script attempts to recover lead data from Django admin logs
"""

import os
import sys
from pathlib import Path
import json
from datetime import datetime

# Add the backend directory to Python path
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

import django
django.setup()

from django.contrib.admin.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from leads.models import Lead
from django.contrib.auth import get_user_model

def recover_leads_from_logs():
    """Attempt to recover lead data from admin logs"""
    print("Recovering leads from admin logs...")
    
    User = get_user_model()
    lead_ct = ContentType.objects.get_for_model(Lead)
    
    # Get all lead-related admin logs
    logs = LogEntry.objects.filter(content_type=lead_ct).order_by('-action_time')
    
    print(f"Found {logs.count()} lead-related admin logs")
    
    recovered_leads = []
    
    for log in logs:
        try:
            # Parse the object representation to extract lead info
            object_repr = log.object_repr
            print(f"Processing log: {log.action_time} - {log.action_flag} - {object_repr}")
            
            # Extract name and status from object_repr
            # Format is usually "Name (Status)"
            if '(' in object_repr and ')' in object_repr:
                name_part = object_repr.split('(')[0].strip()
                status_part = object_repr.split('(')[1].split(')')[0].strip()
                
                # Try to split name into first and last name
                name_parts = name_part.split()
                first_name = name_parts[0] if name_parts else "Unknown"
                last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Unknown"
                
                # Create lead data structure
                lead_data = {
                    'first_name': first_name,
                    'last_name': last_name,
                    'status': status_part,
                    'created_at': log.action_time,
                    'action_flag': log.action_flag,
                    'user': log.user.username if log.user else 'Unknown',
                    'original_log': str(log)
                }
                
                recovered_leads.append(lead_data)
                
        except Exception as e:
            print(f"Error processing log {log.id}: {str(e)}")
            continue
    
    # Save recovered data
    with open('recovered_leads.json', 'w') as f:
        json.dump(recovered_leads, f, indent=2, default=str)
    
    print(f"Recovered {len(recovered_leads)} leads from admin logs")
    print("Data saved to recovered_leads.json")
    
    return recovered_leads

def create_leads_from_recovered_data():
    """Create actual Lead objects from recovered data"""
    print("Creating leads from recovered data...")
    
    if not Path('recovered_leads.json').exists():
        print("No recovered_leads.json file found")
        return False
    
    with open('recovered_leads.json', 'r') as f:
        recovered_data = json.load(f)
    
    created_count = 0
    
    for lead_data in recovered_data:
        try:
            # Create lead with basic info
            lead, created = Lead.objects.get_or_create(
                first_name=lead_data['first_name'],
                last_name=lead_data['last_name'],
                defaults={
                    'status': lead_data['status'],
                    'phone': f"555-{created_count:04d}",  # Generate placeholder phone
                    'email': f"{lead_data['first_name'].lower()}.{lead_data['last_name'].lower()}@example.com",
                    'notes': f"Recovered from admin logs - Original action: {lead_data['action_flag']} by {lead_data['user']}",
                }
            )
            
            if created:
                created_count += 1
                print(f"Created lead: {lead.first_name} {lead.last_name} ({lead.status})")
                
        except Exception as e:
            print(f"Error creating lead {lead_data['first_name']}: {str(e)}")
            continue
    
    print(f"Successfully created {created_count} leads from recovered data")
    return True

def main():
    print("Lead Recovery from Admin Logs")
    print("=" * 40)
    
    # Change to backend directory
    os.chdir("backend")
    
    try:
        # Step 1: Recover data from logs
        recovered_data = recover_leads_from_logs()
        
        if recovered_data:
            print(f"\nRecovered {len(recovered_data)} lead records from admin logs")
            
            # Show sample of recovered data
            print("\nSample recovered leads:")
            for i, lead in enumerate(recovered_data[:5], 1):
                print(f"  {i}. {lead['first_name']} {lead['last_name']} - {lead['status']} ({lead['created_at']})")
            
            # Ask if user wants to create actual Lead objects
            print(f"\nDo you want to create {len(recovered_data)} Lead objects in the database?")
            print("This will recreate the leads that were deleted.")
            
            # For now, let's just show what we found
            print("\nTo create the leads, run:")
            print("python create_leads_from_recovered_data.py")
            
        else:
            print("No lead data could be recovered from admin logs")
        
        return True
        
    except Exception as e:
        print(f"Recovery failed: {str(e)}")
        return False

if __name__ == "__main__":
    main()
