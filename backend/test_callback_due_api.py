#!/usr/bin/env python3
"""
Test the callback due API
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
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def test_callback_due_api():
    print('=== TESTING CALLBACK DUE API ===')
    
    # Get the admin user
    user = User.objects.filter(username='admin').first()
    if not user:
        print('Admin user not found')
        return
    
    print(f'Testing for user: {user.username}')
    
    # Get callbacks for this user
    callbacks = Callback.objects.filter(lead__assigned_agent=user, status='scheduled').order_by('scheduled_time')
    print(f'Total callbacks for user: {callbacks.count()}')
    
    due_callbacks = []
    overdue_callbacks = []
    
    for callback in callbacks:
        if callback.is_overdue:
            overdue_callbacks.append(callback)
        elif (callback.scheduled_time - timezone.now()).total_seconds() <= 900:  # 15 minutes
            due_callbacks.append(callback)
    
    print(f'Due callbacks: {len(due_callbacks)}')
    for callback in due_callbacks:
        time_diff = callback.scheduled_time - timezone.now()
        print(f'  - Callback {callback.id}: Due in {time_diff}')
    
    print(f'Overdue callbacks: {len(overdue_callbacks)}')
    for callback in overdue_callbacks:
        time_diff = timezone.now() - callback.scheduled_time
        print(f'  - Callback {callback.id}: Overdue by {time_diff}')

if __name__ == '__main__':
    test_callback_due_api()
