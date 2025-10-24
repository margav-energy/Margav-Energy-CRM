#!/usr/bin/env python3
"""
Test the date parsing function
"""

import os
import sys
import django
from datetime import datetime
import re

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.utils import timezone

def parse_date_time(date_time_str):
    """Parse the date/time string from the JSON format"""
    try:
        # Remove extra spaces and normalize
        date_time_str = date_time_str.strip()
        
        # Check if there's a space (indicating time is present)
        if ' ' in date_time_str:
            # Split date and time
            date_part, time_part = date_time_str.split(' ', 1)
            
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_part.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Parse time (HH.MMpm or HH.MMam) - ignore AM/PM, treat as 24-hour format
            time_match = re.match(r'(\d+)\.(\d+)(am|pm)', time_part.lower())
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2))
                
                # Use the time as-is (ignore AM/PM)
                return datetime(int(year), int(month), int(day), hour, minute)
        else:
            # Date only (no time)
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_time_str.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Return date at midnight
            return datetime(int(year), int(month), int(day), 0, 0)
        
    except Exception as e:
        print(f"Error parsing date/time '{date_time_str}': {e}")
    
    # Fallback to current time
    return timezone.now()

def test_date_parsing():
    """Test the date parsing with sample data"""
    
    test_dates = [
        "16.09.2025 15.15pm",
        "22.09.2025 15.49pm", 
        "23.09.2025 15.00pm",
        "24.09.2025 11.18am",
        "25.09.2025 09.30am",
        "01.10.2025",  # Date only
        "15.10.2025",  # Date only
        "30.12.2025"   # Date only
    ]
    
    print("Testing date parsing:")
    print("=" * 50)
    
    for date_str in test_dates:
        parsed = parse_date_time(date_str)
        print(f"'{date_str}' -> {parsed}")
    
    print("\nCurrent time for comparison:")
    print(f"Now: {timezone.now()}")

if __name__ == "__main__":
    test_date_parsing()

Test the date parsing function
"""

import os
import sys
import django
from datetime import datetime
import re

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.utils import timezone

def parse_date_time(date_time_str):
    """Parse the date/time string from the JSON format"""
    try:
        # Remove extra spaces and normalize
        date_time_str = date_time_str.strip()
        
        # Check if there's a space (indicating time is present)
        if ' ' in date_time_str:
            # Split date and time
            date_part, time_part = date_time_str.split(' ', 1)
            
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_part.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Parse time (HH.MMpm or HH.MMam) - ignore AM/PM, treat as 24-hour format
            time_match = re.match(r'(\d+)\.(\d+)(am|pm)', time_part.lower())
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2))
                
                # Use the time as-is (ignore AM/PM)
                return datetime(int(year), int(month), int(day), hour, minute)
        else:
            # Date only (no time)
            # Parse date (DD.MM.YYYY) and convert to DD/MM/YYYY format
            day, month, year = date_time_str.split('.')
            formatted_date = f"{day}/{month}/{year}"
            
            # Return date at midnight
            return datetime(int(year), int(month), int(day), 0, 0)
        
    except Exception as e:
        print(f"Error parsing date/time '{date_time_str}': {e}")
    
    # Fallback to current time
    return timezone.now()

def test_date_parsing():
    """Test the date parsing with sample data"""
    
    test_dates = [
        "16.09.2025 15.15pm",
        "22.09.2025 15.49pm", 
        "23.09.2025 15.00pm",
        "24.09.2025 11.18am",
        "25.09.2025 09.30am",
        "01.10.2025",  # Date only
        "15.10.2025",  # Date only
        "30.12.2025"   # Date only
    ]
    
    print("Testing date parsing:")
    print("=" * 50)
    
    for date_str in test_dates:
        parsed = parse_date_time(date_str)
        print(f"'{date_str}' -> {parsed}")
    
    print("\nCurrent time for comparison:")
    print(f"Now: {timezone.now()}")

if __name__ == "__main__":
    test_date_parsing()
