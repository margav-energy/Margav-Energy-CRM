#!/usr/bin/env python3
"""
Export leads from local PostgreSQL database for production deployment
"""

import os
import sys
import django
import json
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Lead
from django.db.models import Q

def export_leads_to_json(output_file='production_leads_export.json'):
    """Export all leads to a JSON file for production import"""
    
    print("Exporting leads from local database...")
    
    # Get all non-deleted leads
    leads = Lead.objects.filter(is_deleted=False).order_by('id')
    
    print(f"Found {leads.count()} leads to export")
    
    # Export lead data
    exported_data = []
    
    for lead in leads:
        lead_data = {
            'id': lead.id,
            'lead_number': lead.lead_number,
            'full_name': lead.full_name,
            'phone': lead.phone,
            'email': lead.email or '',
            'status': lead.status,
            'address1': lead.address1 or '',
            'address2': lead.address2 or '',
            'city': lead.city or '',
            'postal_code': lead.postal_code or '',
            'notes': lead.notes or '',
            'energy_bill_amount': float(lead.energy_bill_amount) if lead.energy_bill_amount else None,
            'has_ev_charger': lead.has_ev_charger,
            'day_night_rate': lead.day_night_rate,
            'has_previous_quotes': lead.has_previous_quotes,
            'previous_quotes_details': lead.previous_quotes_details or '',
            'appointment_date': lead.appointment_date.isoformat() if lead.appointment_date else None,
            'created_at': lead.created_at.isoformat() if lead.created_at else None,
            'updated_at': lead.updated_at.isoformat() if lead.updated_at else None,
            'assigned_agent': lead.assigned_agent.username if lead.assigned_agent else None,
        }
        exported_data.append(lead_data)
    
    # Save to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(exported_data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"Exported {len(exported_data)} leads to {output_file}")
    print(f"File size: {os.path.getsize(output_file):,} bytes")
    
    # Print summary
    print("\nExport Summary:")
    print(f"   Total leads: {len(exported_data)}")
    
    # Group by status
    status_counts = {}
    for lead in exported_data:
        status = lead['status']
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print("\n   By Status:")
    for status, count in sorted(status_counts.items()):
        print(f"   - {status}: {count}")
    
    return output_file

def main():
    """Main function"""
    print("=" * 60)
    print("Lead Export for Production")
    print("=" * 60)
    print()
    
    output_file = 'production_leads_export.json'
    
    try:
        export_leads_to_json(output_file)
        
        print()
        print("=" * 60)
        print("Export Complete!")
        print("=" * 60)
        print()
        print("Next Steps:")
        print()
        print("1. To upload to production database:")
        print("   - Go to your Render dashboard")
        print("   - Navigate to your PostgreSQL database")
        print("   - Connect via psql or pgAdmin")
        print()
        print("2. Or use Django management command on production:")
        print("   - Upload the JSON file to your production server")
        print("   - Run: python import_leads_to_production.py production_leads_export.json")
        print()
        print(f"Export file: {output_file}")
        print()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

