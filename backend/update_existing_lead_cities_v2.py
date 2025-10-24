#!/usr/bin/env python
"""
Script to update existing leads with parsed city data from address field.
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Lead

def update_lead_cities():
    """Update city field for leads that have address but empty city."""
    # Get leads with null city values
    leads_to_update = Lead.objects.filter(city__isnull=True).exclude(address1__isnull=True).exclude(address1='')
    
    print(f"Found {leads_to_update.count()} leads with null city to update")
    
    updated_count = 0
    for lead in leads_to_update[:10]:  # Only process first 10 for testing
        print(f"Lead {lead.id}: {lead.full_name}")
        print(f"  Address: '{lead.address1}'")
        print(f"  Current city: '{lead.city}'")
        if lead.address1:
            address_parts = lead.address1.split(',')
            print(f"  Address parts: {address_parts}")
            if len(address_parts) >= 2:
                parsed_city = address_parts[1].strip()
                print(f"  Parsed city: '{parsed_city}'")
                if parsed_city and parsed_city != 'Not provided':
                    lead.city = parsed_city
                    lead.save()
                    updated_count += 1
                    print(f"  ✅ Updated city to: {parsed_city}")
                else:
                    print(f"  ❌ Skipped - city is empty or 'Not provided'")
            else:
                print(f"  ❌ Skipped - not enough address parts")
        print()
    
    print(f"Updated {updated_count} leads with city data")

if __name__ == '__main__':
    update_lead_cities()
