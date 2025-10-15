#!/usr/bin/env python3
"""
Database Check Script
This script thoroughly checks the SQLite database for all data
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

import django
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model
from leads.models import Lead, Callback, DialerUserLink

def check_database_tables():
    """Check all tables in the database"""
    print("🔍 Checking database tables...")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"📊 Found {len(tables)} tables:")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"  - {table_name}: {count} records")
    
    return tables

def check_leads_detailed():
    """Check leads table in detail"""
    print("\n📋 Checking leads table in detail...")
    
    with connection.cursor() as cursor:
        # Check if leads table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='leads_lead';")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ leads_lead table does not exist")
            return False
        
        # Get table schema
        cursor.execute("PRAGMA table_info(leads_lead);")
        columns = cursor.fetchall()
        print("📝 Leads table columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Check for any data
        cursor.execute("SELECT COUNT(*) FROM leads_lead;")
        count = cursor.fetchone()[0]
        print(f"📊 Total leads: {count}")
        
        if count > 0:
            # Show sample data
            cursor.execute("SELECT * FROM leads_lead LIMIT 5;")
            rows = cursor.fetchall()
            print("📄 Sample lead data:")
            for i, row in enumerate(rows, 1):
                print(f"  Row {i}: {row}")
        
        return count > 0

def check_users_detailed():
    """Check users table in detail"""
    print("\n👥 Checking users table in detail...")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM accounts_user;")
        count = cursor.fetchone()[0]
        print(f"📊 Total users: {count}")
        
        if count > 0:
            # Show sample data
            cursor.execute("SELECT username, email, first_name, last_name, is_staff, is_superuser FROM accounts_user LIMIT 10;")
            rows = cursor.fetchall()
            print("📄 Sample user data:")
            for i, row in enumerate(rows, 1):
                print(f"  {i}. {row[0]} ({row[1]}) - {row[2]} {row[3]} - Staff: {row[4]}, Super: {row[5]}")
        
        return count

def check_callbacks():
    """Check callbacks table"""
    print("\n📞 Checking callbacks table...")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='leads_callback';")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ leads_callback table does not exist")
            return False
        
        cursor.execute("SELECT COUNT(*) FROM leads_callback;")
        count = cursor.fetchone()[0]
        print(f"📊 Total callbacks: {count}")
        
        if count > 0:
            cursor.execute("SELECT * FROM leads_callback LIMIT 5;")
            rows = cursor.fetchall()
            print("📄 Sample callback data:")
            for i, row in enumerate(rows, 1):
                print(f"  Row {i}: {row}")
        
        return count

def check_dialer_links():
    """Check dialer user links"""
    print("\n🔗 Checking dialer user links...")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='leads_dialeruserlink';")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ leads_dialeruserlink table does not exist")
            return False
        
        cursor.execute("SELECT COUNT(*) FROM leads_dialeruserlink;")
        count = cursor.fetchone()[0]
        print(f"📊 Total dialer links: {count}")
        
        if count > 0:
            cursor.execute("SELECT * FROM leads_dialeruserlink LIMIT 5;")
            rows = cursor.fetchall()
            print("📄 Sample dialer link data:")
            for i, row in enumerate(rows, 1):
                print(f"  Row {i}: {row}")
        
        return count

def main():
    """Main check function"""
    print("🔍 Margav Energy CRM - Database Check")
    print("=" * 50)
    
    # Change to backend directory
    os.chdir("backend")
    
    try:
        # Check all tables
        tables = check_database_tables()
        
        # Check each table in detail
        users_count = check_users_detailed()
        leads_count = check_leads_detailed()
        callbacks_count = check_callbacks()
        dialer_links_count = check_dialer_links()
        
        print("\n📊 SUMMARY:")
        print(f"👥 Users: {users_count}")
        print(f"📋 Leads: {leads_count}")
        print(f"📞 Callbacks: {callbacks_count}")
        print(f"🔗 Dialer Links: {dialer_links_count}")
        
        if leads_count == 0:
            print("\n⚠️  NO LEADS FOUND!")
            print("This could mean:")
            print("1. The leads were never created")
            print("2. The leads table doesn't exist")
            print("3. The leads were deleted")
            print("4. The leads are in a different table")
        
        return True
        
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")
        return False

if __name__ == "__main__":
    main()
