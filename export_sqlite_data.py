#!/usr/bin/env python3
"""
Export SQLite Data Script
This script exports all data from your current SQLite database to JSON files
so you can restore it after setting up PostgreSQL
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
from django.core import serializers

def export_users():
    """Export all users to JSON"""
    print("📤 Exporting users...")
    User = get_user_model()
    users = User.objects.all()
    
    user_data = []
    for user in users:
        user_data.append({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_admin': getattr(user, 'is_admin', False),
            'is_agent': getattr(user, 'is_agent', False),
            'is_sales_rep': getattr(user, 'is_sales_rep', False),
            'is_qualifier': getattr(user, 'is_qualifier', False),
            'is_dialer_user': getattr(user, 'is_dialer_user', False),
            'dialer_id': getattr(user, 'dialer_id', None),
        })
    
    with open('users_backup.json', 'w') as f:
        json.dump(user_data, f, indent=2)
    
    print(f"✅ Exported {len(user_data)} users to users_backup.json")
    return user_data

def export_leads():
    """Export all leads to JSON"""
    print("📤 Exporting leads...")
    leads = Lead.objects.all()
    
    lead_data = []
    for lead in leads:
        lead_data.append({
            'first_name': lead.first_name,
            'last_name': lead.last_name,
            'email': lead.email,
            'phone': lead.phone,
            'address': lead.address,
            'status': lead.status,
            'disposition': lead.disposition,
            'notes': lead.notes,
            'created_at': lead.created_at.isoformat() if lead.created_at else None,
            'updated_at': lead.updated_at.isoformat() if lead.updated_at else None,
        })
    
    with open('leads_backup.json', 'w') as f:
        json.dump(lead_data, f, indent=2)
    
    print(f"✅ Exported {len(lead_data)} leads to leads_backup.json")
    return lead_data

def export_callbacks():
    """Export all callbacks to JSON"""
    print("📤 Exporting callbacks...")
    callbacks = Callback.objects.all()
    
    callback_data = []
    for callback in callbacks:
        callback_data.append({
            'lead_name': callback.lead_name,
            'phone': callback.phone,
            'scheduled_time': callback.scheduled_time.isoformat() if callback.scheduled_time else None,
            'notes': callback.notes,
            'status': callback.status,
            'created_at': callback.created_at.isoformat() if callback.created_at else None,
        })
    
    with open('callbacks_backup.json', 'w') as f:
        json.dump(callback_data, f, indent=2)
    
    print(f"✅ Exported {len(callback_data)} callbacks to callbacks_backup.json")
    return callback_data

def export_dialer_links():
    """Export dialer user links to JSON"""
    print("📤 Exporting dialer user links...")
    links = DialerUserLink.objects.all()
    
    link_data = []
    for link in links:
        link_data.append({
            'user_id': link.user.id,
            'username': link.user.username,
            'dialer_id': link.dialer_id,
            'dialer_username': link.dialer_username,
        })
    
    with open('dialer_links_backup.json', 'w') as f:
        json.dump(link_data, f, indent=2)
    
    print(f"✅ Exported {len(link_data)} dialer links to dialer_links_backup.json")
    return link_data

def main():
    """Main export function"""
    print("💾 Margav Energy CRM - Data Export")
    print("=" * 40)
    
    # Change to backend directory
    os.chdir("backend")
    
    try:
        # Export all data
        users = export_users()
        leads = export_leads()
        callbacks = export_callbacks()
        dialer_links = export_dialer_links()
        
        print("\n📊 Export Summary:")
        print(f"- Users: {len(users)}")
        print(f"- Leads: {len(leads)}")
        print(f"- Callbacks: {len(callbacks)}")
        print(f"- Dialer Links: {len(dialer_links)}")
        
        print("\n✅ All data exported successfully!")
        print("📁 Backup files created:")
        print("- users_backup.json")
        print("- leads_backup.json")
        print("- callbacks_backup.json")
        print("- dialer_links_backup.json")
        
        return True
        
    except Exception as e:
        print(f"❌ Export failed: {str(e)}")
        return False

if __name__ == "__main__":
    main()
