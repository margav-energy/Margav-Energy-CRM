#!/usr/bin/env python3
"""
Import Data to PostgreSQL Script
This script imports the exported JSON data into your PostgreSQL database
"""

import os
import sys
import json
from pathlib import Path
from django.core.management import execute_from_command_line

# Add the backend directory to Python path
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from leads.models import Lead, Callback, DialerUserLink
from django.utils import timezone
from datetime import datetime

def import_users():
    """Import users from JSON backup"""
    print("📥 Importing users...")
    
    if not Path('users_backup.json').exists():
        print("❌ users_backup.json not found")
        return False
    
    with open('users_backup.json', 'r') as f:
        user_data = json.load(f)
    
    User = get_user_model()
    imported_count = 0
    
    for user_info in user_data:
        try:
            # Create or update user
            user, created = User.objects.get_or_create(
                username=user_info['username'],
                defaults={
                    'email': user_info['email'],
                    'first_name': user_info['first_name'],
                    'last_name': user_info['last_name'],
                    'is_staff': user_info.get('is_staff', False),
                    'is_superuser': user_info.get('is_superuser', False),
                }
            )
            
            # Set additional attributes
            if hasattr(user, 'is_admin'):
                user.is_admin = user_info.get('is_admin', False)
            if hasattr(user, 'is_agent'):
                user.is_agent = user_info.get('is_agent', False)
            if hasattr(user, 'is_sales_rep'):
                user.is_sales_rep = user_info.get('is_sales_rep', False)
            if hasattr(user, 'is_qualifier'):
                user.is_qualifier = user_info.get('is_qualifier', False)
            if hasattr(user, 'is_dialer_user'):
                user.is_dialer_user = user_info.get('is_dialer_user', False)
            if hasattr(user, 'dialer_id'):
                user.dialer_id = user_info.get('dialer_id')
            
            user.save()
            
            if created:
                # Set password for new users
                user.set_password('123')
                user.save()
                imported_count += 1
                
        except Exception as e:
            print(f"⚠️ Failed to import user {user_info['username']}: {str(e)}")
    
    print(f"✅ Imported {imported_count} new users")
    return True

def import_leads():
    """Import leads from JSON backup"""
    print("📥 Importing leads...")
    
    if not Path('leads_backup.json').exists():
        print("ℹ️ No leads backup found (this is normal)")
        return True
    
    with open('leads_backup.json', 'r') as f:
        lead_data = json.load(f)
    
    imported_count = 0
    
    for lead_info in lead_data:
        try:
            lead, created = Lead.objects.get_or_create(
                phone=lead_info['phone'],
                defaults={
                    'first_name': lead_info['first_name'],
                    'last_name': lead_info['last_name'],
                    'email': lead_info['email'],
                    'address': lead_info['address'],
                    'status': lead_info['status'],
                    'disposition': lead_info['disposition'],
                    'notes': lead_info['notes'],
                }
            )
            
            if created:
                imported_count += 1
                
        except Exception as e:
            print(f"⚠️ Failed to import lead {lead_info.get('first_name', 'Unknown')}: {str(e)}")
    
    print(f"✅ Imported {imported_count} leads")
    return True

def import_callbacks():
    """Import callbacks from JSON backup"""
    print("📥 Importing callbacks...")
    
    if not Path('callbacks_backup.json').exists():
        print("ℹ️ No callbacks backup found (this is normal)")
        return True
    
    with open('callbacks_backup.json', 'r') as f:
        callback_data = json.load(f)
    
    imported_count = 0
    
    for callback_info in callback_data:
        try:
            scheduled_time = None
            if callback_info.get('scheduled_time'):
                scheduled_time = datetime.fromisoformat(callback_info['scheduled_time'].replace('Z', '+00:00'))
            
            callback, created = Callback.objects.get_or_create(
                phone=callback_info['phone'],
                scheduled_time=scheduled_time,
                defaults={
                    'lead_name': callback_info['lead_name'],
                    'notes': callback_info['notes'],
                    'status': callback_info['status'],
                }
            )
            
            if created:
                imported_count += 1
                
        except Exception as e:
            print(f"⚠️ Failed to import callback {callback_info.get('lead_name', 'Unknown')}: {str(e)}")
    
    print(f"✅ Imported {imported_count} callbacks")
    return True

def import_dialer_links():
    """Import dialer user links from JSON backup"""
    print("📥 Importing dialer user links...")
    
    if not Path('dialer_links_backup.json').exists():
        print("ℹ️ No dialer links backup found (this is normal)")
        return True
    
    with open('dialer_links_backup.json', 'r') as f:
        link_data = json.load(f)
    
    imported_count = 0
    
    for link_info in link_data:
        try:
            User = get_user_model()
            user = User.objects.get(id=link_info['user_id'])
            
            link, created = DialerUserLink.objects.get_or_create(
                user=user,
                defaults={
                    'dialer_id': link_info['dialer_id'],
                    'dialer_username': link_info['dialer_username'],
                }
            )
            
            if created:
                imported_count += 1
                
        except Exception as e:
            print(f"⚠️ Failed to import dialer link for user {link_info.get('username', 'Unknown')}: {str(e)}")
    
    print(f"✅ Imported {imported_count} dialer links")
    return True

def main():
    """Main import function"""
    print("📥 Margav Energy CRM - Data Import")
    print("=" * 40)
    
    # Change to backend directory
    os.chdir("backend")
    
    try:
        # Import all data
        import_users()
        import_leads()
        import_callbacks()
        import_dialer_links()
        
        print("\n✅ Data import completed successfully!")
        print("\n📋 Next steps:")
        print("1. Start the backend server: python manage.py runserver")
        print("2. Access the admin at: http://localhost:8000/admin/")
        print("3. Login with: admin / 123")
        
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {str(e)}")
        return False

if __name__ == "__main__":
    main()
