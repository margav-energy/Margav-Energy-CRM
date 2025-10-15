#!/usr/bin/env python3
"""
Create Leads from Recovered Data - Fixed Version
"""

import os
import sys
import json
from pathlib import Path

# Add the backend directory to Python path
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

import django
django.setup()

from leads.models import Lead
from django.contrib.auth import get_user_model
import random

def create_leads_from_recovered_data():
    """Create actual Lead objects from recovered data"""
    print("Creating leads from recovered data...")
    
    if not Path('recovered_leads.json').exists():
        print("No recovered_leads.json file found")
        return False
    
    with open('recovered_leads.json', 'r') as f:
        recovered_data = json.load(f)
    
    # Get a default agent to assign leads to
    User = get_user_model()
    default_agent = User.objects.filter(role='agent').first()
    if not default_agent:
        default_agent = User.objects.filter(is_staff=True).first()
    if not default_agent:
        default_agent = User.objects.first()
    
    if not default_agent:
        print("No users found to assign leads to")
        return False
    
    print(f"Assigning leads to agent: {default_agent.username}")
    
    created_count = 0
    skipped_count = 0
    
    # Sample phone numbers for realistic data
    phone_prefixes = ['555', '123', '456', '789', '321', '654', '987']
    
    for i, lead_data in enumerate(recovered_data):
        try:
            # Generate realistic phone number
            phone_prefix = random.choice(phone_prefixes)
            phone_suffix = f"{random.randint(1000, 9999)}"
            phone = f"{phone_prefix}-{phone_suffix}"
            
            # Generate email
            email = f"{lead_data['first_name'].lower()}.{lead_data['last_name'].lower()}@example.com"
            
            # Create full name
            full_name = f"{lead_data['first_name']} {lead_data['last_name']}"
            
            # Create lead with recovered data
            lead, created = Lead.objects.get_or_create(
                full_name=full_name,
                phone=phone,
                defaults={
                    'status': lead_data['status'],
                    'email': email,
                    'assigned_agent': default_agent,
                    'notes': f"Recovered from admin logs - Original action: {lead_data['action_flag']} by {lead_data['user']} on {lead_data['created_at']}",
                }
            )
            
            if created:
                created_count += 1
                print(f"Created lead: {lead.full_name} ({lead.status}) - {lead.phone}")
            else:
                skipped_count += 1
                print(f"Skipped existing lead: {lead.full_name}")
                
        except Exception as e:
            print(f"Error creating lead {lead_data['first_name']}: {str(e)}")
            continue
    
    print(f"\nSummary:")
    print(f"Created: {created_count} leads")
    print(f"Skipped: {skipped_count} leads (already existed)")
    print(f"Total processed: {len(recovered_data)} leads")
    
    return True

def main():
    print("Lead Creation from Recovered Data - Fixed")
    print("=" * 50)
    
    # Change to backend directory
    os.chdir("backend")
    
    try:
        success = create_leads_from_recovered_data()
        
        if success:
            print("\nLead recovery completed successfully!")
            print("\nNext steps:")
            print("1. Check the admin dashboard: http://localhost:8000/admin/")
            print("2. View leads in the CRM: http://localhost:3000")
            
            # Show current lead count
            from leads.models import Lead
            total_leads = Lead.objects.count()
            print(f"\nCurrent lead count: {total_leads}")
        
        return success
        
    except Exception as e:
        print(f"Lead creation failed: {str(e)}")
        return False

if __name__ == "__main__":
    main()
