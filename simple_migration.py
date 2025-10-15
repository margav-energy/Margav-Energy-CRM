#!/usr/bin/env python3
"""
Simple Django Migration Script
Just handles the data migration part
"""

import os
import sys
import json
from pathlib import Path

# Change to backend directory
os.chdir("backend")

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

# Import Django
import django
django.setup()

from django.contrib.auth import get_user_model
from leads.models import Lead, Callback, DialerUserLink

def export_sqlite_data():
    """Export data from SQLite"""
    print("Exporting SQLite data...")
    
    User = get_user_model()
    users = User.objects.all()
    
    # Export users
    user_data = []
    for user in users:
        user_data.append({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'phone': user.phone,
        })
    
    with open('../sqlite_users_backup.json', 'w', encoding='utf-8') as f:
        json.dump(user_data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(user_data)} users")
    return user_data

def main():
    print("Simple Migration - Exporting SQLite Data")
    print("=" * 50)
    
    try:
        # Export data
        users = export_sqlite_data()
        
        print(f"\nSUCCESS: Exported {len(users)} users to sqlite_users_backup.json")
        print("Now you can run Django migrations manually:")
        print("1. python manage.py migrate")
        print("2. python manage.py create_dialer_users")
        print("3. python manage.py create_users")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    main()
