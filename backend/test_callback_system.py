#!/usr/bin/env python3
"""
Test the callback system
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Callback, Lead
from django.contrib.auth import get_user_model

User = get_user_model()

def test_callback_system():
    print('=== TESTING CALLBACK SYSTEM ===')
    
    # Check the callback we created
    callback = Callback.objects.first()
    if callback:
        print(f'Callback ID: {callback.id}')
        print(f'Lead: {callback.lead.full_name} (ID: {callback.lead.id})')
        print(f'Agent: {callback.agent.username if callback.agent else "None"}')
        print(f'Scheduled time: {callback.scheduled_time}')
        print(f'Status: {callback.status}')
        print(f'Notes: {callback.notes}')
        
        # Test the API filtering
        print(f'\n=== API FILTERING TEST ===')
        user = callback.lead.assigned_agent
        if user:
            callbacks_for_user = Callback.objects.filter(lead__assigned_agent=user)
            print(f'Callbacks for user {user.username}: {callbacks_for_user.count()}')
            for cb in callbacks_for_user:
                print(f'  - Callback {cb.id}: {cb.lead.full_name} at {cb.scheduled_time}')
        else:
            print('No assigned agent found')
    else:
        print('No callbacks found')

if __name__ == '__main__':
    test_callback_system()
