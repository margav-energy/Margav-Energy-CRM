#!/usr/bin/env python3
"""
Create a callback that's due soon for testing alerts
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
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def create_due_callback_test():
    print('=== CREATING DUE CALLBACK FOR TESTING ===')
    
    # Get a lead with callback status
    lead = Lead.objects.filter(status='callback').first()
    if not lead:
        print('No lead with callback status found')
        return
    
    print(f'Found lead: {lead.full_name} (ID: {lead.id})')
    
    # Create a callback that's due in 2 minutes
    due_time = timezone.now() + timedelta(minutes=2)
    
    callback = Callback.objects.create(
        lead=lead,
        agent=lead.assigned_agent,
        scheduled_time=due_time,
        status='scheduled',
        notes='Test callback due in 2 minutes for alert testing'
    )
    
    print(f'Created callback: {callback.id}')
    print(f'Scheduled time: {callback.scheduled_time}')
    print(f'Due in: {due_time - timezone.now()}')
    print(f'Status: {callback.status}')
    
    # Also create an overdue callback
    overdue_time = timezone.now() - timedelta(minutes=5)
    
    overdue_callback = Callback.objects.create(
        lead=lead,
        agent=lead.assigned_agent,
        scheduled_time=overdue_time,
        status='scheduled',
        notes='Test overdue callback for alert testing'
    )
    
    print(f'Created overdue callback: {overdue_callback.id}')
    print(f'Scheduled time: {overdue_callback.scheduled_time}')
    print(f'Overdue by: {timezone.now() - overdue_time}')
    print(f'Status: {overdue_callback.status}')

if __name__ == '__main__':
    create_due_callback_test()
