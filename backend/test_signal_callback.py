#!/usr/bin/env python3
"""
Test if Django signals are working for automatic callback creation
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Lead, Callback
from django.contrib.auth import get_user_model

User = get_user_model()

def test_signal_callback():
    print('=== TESTING SIGNAL CALLBACK CREATION ===')
    
    # Check if signals are working by creating a new lead with callback status
    user = User.objects.filter(username='admin').first()
    if user:
        # Create a test lead with callback status
        lead = Lead.objects.create(
            full_name='Test Signal Lead',
            phone='555-8888',
            email='test@example.com',
            status='callback',
            assigned_agent=user
        )
        print(f'Created lead: {lead.full_name} (ID: {lead.id})')
        print(f'Status: {lead.status}')
        
        # Check if callback was automatically created
        callbacks = Callback.objects.filter(lead=lead)
        print(f'Callbacks for this lead: {callbacks.count()}')
        for callback in callbacks:
            print(f'  Callback {callback.id}: {callback.scheduled_time}')
        
        if callbacks.count() == 0:
            print('No callback was automatically created - signals not working')
        else:
            print('Callback was automatically created - signals working')
    else:
        print('Admin user not found')

if __name__ == '__main__':
    test_signal_callback()
