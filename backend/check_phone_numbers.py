#!/usr/bin/env python3
"""
Check existing phone numbers to avoid IntegrityError
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

def check_phone_numbers():
    print('=== EXISTING PHONE NUMBERS ===')
    
    leads = Lead.objects.all().order_by('phone')
    print(f'Total leads: {leads.count()}')
    print()
    
    for lead in leads:
        print(f'Lead {lead.id}: {lead.full_name} - Phone: {lead.phone}')
    
    print()
    print('=== PHONE NUMBERS TO AVOID ===')
    existing_phones = [lead.phone for lead in leads]
    for phone in existing_phones:
        print(f'  - {phone}')
    
    print()
    print('=== SUGGESTED NEW PHONE NUMBERS ===')
    base_phone = '079876543'
    for i in range(10, 20):
        suggested_phone = f'{base_phone}{i}'
        if suggested_phone not in existing_phones:
            print(f'  - {suggested_phone}')

if __name__ == '__main__':
    check_phone_numbers()
