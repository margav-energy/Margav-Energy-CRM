#!/usr/bin/env python3
"""
Paste this ENTIRE file into Render Web Service Shell and run it
This will import your 217 leads safely
"""

import json
import os
import sys

# Add backend to path
sys.path.append('/opt/render/project/src/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

import django
django.setup()

from leads.models import Lead
from accounts.models import User
from django.utils import timezone
from datetime import datetime

def import_leads():
    """Import leads from production_leads_export.json"""
    
    print("Loading leads from production_leads_export.json...")
    
    try:
        with open('production_leads_export.json', 'r', encoding='utf-8') as f:
            leads_data = json.load(f)
    except FileNotFoundError:
        print("ERROR: production_leads_export.json not found!")
        print("Please upload this file to your Render web service first.")
        return
    
    print(f"Found {len(leads_data)} leads to import\n")
    
    created_count = 0
    updated_count = 0
    failed_count = 0
    
    for index, lead_data in enumerate(leads_data):
        try:
            # Get agent if specified
            agent = None
            if lead_data.get('assigned_agent'):
                try:
                    agent = User.objects.get(username=lead_data['assigned_agent'])
                except User.DoesNotExist:
                    pass  # Create lead without agent
            
            # Parse dates
            created_at = None
            if lead_data.get('created_at'):
                try:
                    created_at = datetime.fromisoformat(lead_data['created_at'].replace('Z', '+00:00'))
                except:
                    created_at = None
            
            appointment_date = None
            if lead_data.get('appointment_date'):
                try:
                    appointment_date = datetime.fromisoformat(lead_data['appointment_date'].split('T')[0]).date()
                except:
                    appointment_date = None
            
            # Check if lead exists by phone
            existing_lead = Lead.objects.filter(phone=lead_data['phone']).first()
            
            if existing_lead:
                # Update existing lead
                existing_lead.full_name = lead_data['full_name']
                existing_lead.email = lead_data.get('email') or ''
                existing_lead.status = lead_data['status']
                existing_lead.address1 = lead_data.get('address1') or ''
                existing_lead.postal_code = lead_data.get('postal_code') or ''
                existing_lead.notes = lead_data.get('notes') or ''
                existing_lead.appointed_agent = agent
                if appointment_date:
                    existing_lead.appointment_date = appointment_date
                existing_lead.save(skip_audit=True)
                updated_count += 1
            else:
                # Create new lead
                lead = Lead(
                    full_name=lead_data['full_name'],
                    phone=lead_data['phone'],
                    email=lead_data.get('email') or '',
                    status=lead_data['status'],
                    address1=lead_data.get('address1') or '',
                    postal_code=lead_data.get('postal_code') or '',
                    notes=lead_data.get('notes') or '',
                    assigned_agent=agent,
                    appointment_date=appointment_date,
                    lead_number=lead_data.get('lead_number'),
                )
                if created_at:
                    lead.created_at = created_at
                lead.save(skip_audit=True)
                created_count += 1
            
            if (created_count + updated_count) % 50 == 0:
                print(f"Processed {created_count + updated_count} leads...")
                
        except Exception as e:
            failed_count += 1
            print(f"Error processing lead {index + 1}: {e}")
    
    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)
    print(f"Successfully created: {created_count} leads")
    print(f"Successfully updated: {updated_count} leads")
    print(f"Failed: {failed_count} leads")
    print(f"Total processed: {len(leads_data)} leads")
    print("=" * 60)

if __name__ == "__main__":
    import_leads()


