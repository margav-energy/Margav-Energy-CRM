#!/usr/bin/env python3
"""
Import leads from exported JSON to production database
Run this on your Render/production server
"""

import json
import sys
import os
import django

# Setup Django environment
# Change to the backend directory first
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
if os.path.exists(backend_dir):
    os.chdir(backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from leads.models import Lead
from django.utils import timezone
from datetime import datetime

User = get_user_model()

def import_leads_from_json(json_file):
    """Import leads from exported JSON file"""
    
    # Make path absolute in case we changed directory
    if not os.path.isabs(json_file):
        # Look in parent directory (where script is)
        project_root = os.path.dirname(os.path.abspath(__file__))
        json_file = os.path.join(project_root, json_file)
    
    print(f"Loading leads from {json_file}...")
    
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        leads_data = json.load(f)
    
    print(f"Found {len(leads_data)} leads to import")
    
    created_count = 0
    updated_count = 0
    failed_count = 0
    
    for index, lead_data in enumerate(leads_data):
        try:
            # Get or create agent if specified
            agent = None
            if lead_data.get('assigned_agent'):
                try:
                    agent = User.objects.get(username=lead_data['assigned_agent'])
                except User.DoesNotExist:
                    print(f"Warning: Agent '{lead_data['assigned_agent']}' not found, creating lead without agent")
            
            # Parse dates
            created_at = None
            if lead_data.get('created_at'):
                created_at = datetime.fromisoformat(lead_data['created_at'].replace('Z', '+00:00'))
            
            appointment_date = None
            if lead_data.get('appointment_date'):
                appointment_date = datetime.fromisoformat(lead_data['appointment_date'].split('T')[0]).date()
            
            # Check if lead already exists (by phone number)
            # SAFETY: This prevents duplicates and preserves existing data
            existing_lead = Lead.objects.filter(phone=lead_data['phone']).first()
            
            if existing_lead:
                # SAFE UPDATE: Only update fields from imported data
                # Update existing lead
                existing_lead.full_name = lead_data['full_name']
                existing_lead.email = lead_data.get('email') or ''
                existing_lead.status = lead_data['status']
                existing_lead.address1 = lead_data.get('address1') or ''
                existing_lead.address2 = lead_data.get('address2') or ''
                existing_lead.city = lead_data.get('city') or ''
                existing_lead.postal_code = lead_data.get('postal_code') or ''
                existing_lead.notes = lead_data.get('notes') or ''
                existing_lead.energy_bill_amount = lead_data.get('energy_bill_amount')
                existing_lead.has_ev_charger = lead_data.get('has_ev_charger')
                existing_lead.day_night_rate = lead_data.get('day_night_rate')
                existing_lead.has_previous_quotes = lead_data.get('has_previous_quotes')
                existing_lead.previous_quotes_details = lead_data.get('previous_quotes_details') or ''
                existing_lead.appointment_date = appointment_date
                existing_lead.assigned_agent = agent
                
                if created_at:
                    existing_lead.created_at = created_at
                
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
                    address2=lead_data.get('address2') or '',
                    city=lead_data.get('city') or '',
                    postal_code=lead_data.get('postal_code') or '',
                    notes=lead_data.get('notes') or '',
                    energy_bill_amount=lead_data.get('energy_bill_amount'),
                    has_ev_charger=lead_data.get('has_ev_charger'),
                    day_night_rate=lead_data.get('day_night_rate'),
                    has_previous_quotes=lead_data.get('has_previous_quotes'),
                    previous_quotes_details=lead_data.get('previous_quotes_details') or '',
                    appointment_date=appointment_date,
                    assigned_agent=agent,
                    lead_number=lead_data.get('lead_number'),
                )
                
                if created_at:
                    lead.created_at = created_at
                
                lead.save(skip_audit=True)
                created_count += 1
            
            if (created_count + updated_count) % 50 == 0:
                print(f"   Processed {created_count + updated_count} leads...")
                
        except Exception as e:
            failed_count += 1
            print(f"Error processing lead {index + 1}: {e}")
    
    print()
    print("=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)
    print(f"Successfully created: {created_count} leads")
    print(f"Successfully updated: {updated_count} leads")
    print(f"Failed: {failed_count} leads")
    print(f"Total processed: {len(leads_data)} leads")
    
    return {
        'created': created_count,
        'updated': updated_count,
        'failed': failed_count
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_leads_to_production.py <json_file>")
        print("Example: python import_leads_to_production.py production_leads_export.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    try:
        result = import_leads_from_json(json_file)
        print(f"\nDone! {result['created']} new leads, {result['updated']} updated")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

