#!/usr/bin/env python3
"""
Check callback assignments
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Callback
from django.contrib.auth import get_user_model

User = get_user_model()

def check_callback_assignments():
    print('=== CALLBACK ASSIGNMENT CHECK ===')
    
    callbacks = Callback.objects.all()
    for callback in callbacks:
        print(f'Callback {callback.id}:')
        print(f'  Lead: {callback.lead.full_name} (ID: {callback.lead.id})')
        print(f'  Lead assigned agent: {callback.lead.assigned_agent.username if callback.lead.assigned_agent else "None"}')
        print(f'  Callback agent: {callback.agent.username if callback.agent else "None"}')
        print(f'  Scheduled: {callback.scheduled_time}')
        print()

if __name__ == '__main__':
    check_callback_assignments()
