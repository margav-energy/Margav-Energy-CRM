#!/usr/bin/env python3
"""
Check callback status and due/overdue status
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
from django.utils import timezone
from datetime import timedelta

def check_callback_status():
    print('=== CALLBACK STATUS CHECK ===')
    
    callback = Callback.objects.first()
    if callback:
        print(f'Callback ID: {callback.id}')
        print(f'Scheduled time: {callback.scheduled_time}')
        print(f'Current time: {timezone.now()}')
        print(f'Is overdue: {callback.is_overdue}')
        print(f'Status: {callback.status}')
        
        # Check if it's due (within 15 minutes)
        time_diff = callback.scheduled_time - timezone.now()
        print(f'Time until callback: {time_diff}')
        print(f'Minutes until callback: {time_diff.total_seconds() / 60}')
        
        # Check if it's overdue
        if callback.scheduled_time < timezone.now():
            print('CALLBACK IS OVERDUE')
        elif time_diff.total_seconds() <= 900:  # 15 minutes
            print('CALLBACK IS DUE (within 15 minutes)')
        else:
            print('Callback is not due yet')
    else:
        print('No callbacks found')

if __name__ == '__main__':
    check_callback_status()
