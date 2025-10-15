#!/usr/bin/env python3
"""
Check Lead model fields and database structure
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
from django.db import connection

def check_lead_fields():
    print('=== LEAD MODEL FIELDS ===')
    for field in Lead._meta.fields:
        print(f'{field.name}: {field.__class__.__name__}')
    
    print('\n=== DATABASE TABLE STRUCTURE ===')
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads_lead' ORDER BY ordinal_position;")
        columns = cursor.fetchall()
        for column in columns:
            print(f'{column[0]}: {column[1]}')

if __name__ == '__main__':
    check_lead_fields()
