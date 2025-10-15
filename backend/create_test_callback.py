#!/usr/bin/env python3
"""
Create a test callback for debugging
"""

import os
import sys
import django
from datetime import timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Callback, Lead
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def create_test_callback():
    print('=== CREATING TEST CALLBACK ===')
    
    # Get the lead with callback status
    lead = Lead.objects.filter(status='callback').first()
    if not lead:
        print('No lead with callback status found')
        return
    
    print(f'Found lead: {lead.full_name} (ID: {lead.id})')
    
    # Get the assigned agent
    agent = lead.assigned_agent
    if not agent:
        print('No assigned agent found for this lead')
        return
    
    print(f'Assigned agent: {agent.username}')
    
    # Create a callback for this lead
    callback = Callback.objects.create(
        lead=lead,
        agent=agent,
        scheduled_time=timezone.now() + timedelta(hours=2),
        status='scheduled',
        notes='Test callback created for debugging'
    )
    
    print(f'Created callback: {callback.id} for {callback.lead.full_name}')
    print(f'Scheduled time: {callback.scheduled_time}')
    print(f'Status: {callback.status}')
    print(f'Notes: {callback.notes}')
    
    # Verify the callback was created
    callbacks = Callback.objects.filter(lead=lead)
    print(f'Total callbacks for this lead: {callbacks.count()}')

if __name__ == '__main__':
    create_test_callback()
