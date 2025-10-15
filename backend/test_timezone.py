#!/usr/bin/env python3
"""
Test timezone handling in Django
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
from datetime import datetime
import pytz

def test_timezone():
    print('=== TIMEZONE TEST ===')
    
    # Get current time in different timezones
    utc_now = timezone.now()
    london_tz = pytz.timezone('Europe/London')
    london_now = utc_now.astimezone(london_tz)
    
    print(f'UTC time: {utc_now}')
    print(f'London time: {london_now}')
    print(f'Timezone offset: {london_now.utcoffset()}')
    
    # Check a callback
    callback = Callback.objects.first()
    if callback:
        print(f'\\n=== CALLBACK TIMEZONE TEST ===')
        print(f'Callback scheduled_time: {callback.scheduled_time}')
        print(f'Callback timezone: {callback.scheduled_time.tzinfo}')
        
        # Convert to London time
        london_callback = callback.scheduled_time.astimezone(london_tz)
        print(f'Callback in London time: {london_callback}')
        
        # Check if it's the same as what the frontend would see
        print(f'\\n=== FRONTEND SIMULATION ===')
        # Simulate what the frontend would do
        from datetime import datetime
        frontend_date = datetime.fromisoformat(str(callback.scheduled_time).replace('Z', '+00:00'))
        print(f'Frontend would receive: {frontend_date}')
        
        # Test the timezone conversion
        london_frontend = frontend_date.astimezone(london_tz)
        print(f'Frontend London time: {london_frontend}')

if __name__ == '__main__':
    test_timezone()
