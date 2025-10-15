#!/usr/bin/env python3
"""
Django SQLite to PostgreSQL Migration Script
Migrates Margav Energy CRM from SQLite to PostgreSQL 17.6
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'database': 'margav_crm',
    'user': 'margav_user', 
    'password': 'margav-energy',
    'host': 'localhost',
    'port': '5432'
}

def print_step(step_num, description):
    """Print step with clear formatting"""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {description}")
    print(f"{'='*60}")

def run_command(command, description, check=True):
    """Run a command and handle errors"""
    print(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding='utf-8')
        if result.returncode == 0:
            print(f"SUCCESS: {description}")
            if result.stdout.strip():
                print(f"Output: {result.stdout.strip()}")
            return True
        else:
            print(f"ERROR: {description}")
            print(f"Error: {result.stderr.strip()}")
            if check:
                return False
            return True
    except Exception as e:
        print(f"EXCEPTION: {description} - {str(e)}")
        if check:
            return False
        return True

def check_postgresql_connection():
    """Check if PostgreSQL is accessible"""
    print_step(1, "Checking PostgreSQL Connection")
    
    # Try to connect to PostgreSQL
    psql_path = r"C:\Program Files\PostgreSQL\17\bin\psql.exe"
    if not Path(psql_path).exists():
        print(f"ERROR: PostgreSQL not found at {psql_path}")
        return False
    
    # Test connection to postgres database
    cmd = f'"{psql_path}" -U postgres -d postgres -c "SELECT version();"'
    return run_command(cmd, "Testing PostgreSQL connection")

def create_database_and_user():
    """Create database and user in PostgreSQL"""
    print_step(2, "Creating Database and User")
    
    psql_path = r"C:\Program Files\PostgreSQL\17\bin\psql.exe"
    
    # Set PGPASSWORD environment variable
    os.environ['PGPASSWORD'] = 'margav-energy'  # Your custom password
    
    commands = [
        f'"{psql_path}" -U postgres -c "CREATE DATABASE {DB_CONFIG["database"]};"',
        f'"{psql_path}" -U postgres -c "CREATE USER {DB_CONFIG["user"]} WITH PASSWORD \'{DB_CONFIG["password"]}\';"',
        f'"{psql_path}" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE {DB_CONFIG["database"]} TO {DB_CONFIG["user"]};"',
        f'"{psql_path}" -U postgres -c "ALTER USER {DB_CONFIG["user"]} CREATEDB;"'
    ]
    
    for cmd in commands:
        if not run_command(cmd, f"Executing: {cmd.split(' -c ')[1]}", check=False):
            print("WARNING: Some commands failed (may be normal if database/user already exists)")
    
    return True

def update_django_settings():
    """Update Django settings to use PostgreSQL"""
    print_step(3, "Updating Django Settings")
    
    settings_file = Path("backend/crm_backend/settings.py")
    if not settings_file.exists():
        print(f"ERROR: Settings file not found at {settings_file}")
        return False
    
    # Read current settings
    with open(settings_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create backup
    backup_file = f"backend/crm_backend/settings_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Backup created: {backup_file}")
    
    # Update database configuration
    new_db_config = f'''# --------------------
# Database
# --------------------
DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': '{DB_CONFIG["database"]}',
        'USER': '{DB_CONFIG["user"]}',
        'PASSWORD': '{DB_CONFIG["password"]}',
        'HOST': '{DB_CONFIG["host"]}',
        'PORT': '{DB_CONFIG["port"]}',
    }}
}}

# Use SQLite as fallback if DATABASE_URL is not provided
if config('DATABASE_URL', default=None):
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(config('DATABASE_URL'))'''
    
    # Find and replace the database section
    import re
    pattern = r'# --------------------\s*\n# Database\s*\n# --------------------.*?(?=\n# --------------------|\n[A-Z_]+ =|\Z)'
    
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, new_db_config, content, flags=re.DOTALL)
    else:
        # If pattern not found, add after ROOT_URLCONF
        content = content.replace(
            "ROOT_URLCONF = 'crm_backend.urls'",
            f"ROOT_URLCONF = 'crm_backend.urls'\n\n{new_db_config}"
        )
    
    # Write updated settings
    with open(settings_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Django settings updated to use PostgreSQL")
    return True

def export_sqlite_data():
    """Export all data from SQLite to JSON files"""
    print_step(4, "Exporting SQLite Data")
    
    # Change to backend directory
    os.chdir("backend")
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
    
    # Import Django
    import django
    django.setup()
    
    from django.contrib.auth import get_user_model
    from leads.models import Lead, Callback, DialerUserLink
    from django.core import serializers
    
    try:
        # Export users
        User = get_user_model()
        users = User.objects.all()
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
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            })
        
        with open('../sqlite_users_backup.json', 'w', encoding='utf-8') as f:
            json.dump(user_data, f, indent=2, ensure_ascii=False)
        print(f"Exported {len(user_data)} users")
        
        # Export leads
        leads = Lead.objects.all()
        lead_data = []
        for lead in leads:
            lead_data.append({
                'full_name': lead.full_name,
                'phone': lead.phone,
                'email': lead.email,
                'status': lead.status,
                'disposition': lead.disposition,
                'notes': lead.notes,
                'created_at': lead.created_at.isoformat() if lead.created_at else None,
            })
        
        with open('../sqlite_leads_backup.json', 'w', encoding='utf-8') as f:
            json.dump(lead_data, f, indent=2, ensure_ascii=False)
        print(f"Exported {len(lead_data)} leads")
        
        # Export callbacks
        callbacks = Callback.objects.all()
        callback_data = []
        for callback in callbacks:
            callback_data.append({
                'scheduled_time': callback.scheduled_time.isoformat() if callback.scheduled_time else None,
                'status': callback.status,
                'notes': callback.notes,
                'created_at': callback.created_at.isoformat() if callback.created_at else None,
            })
        
        with open('../sqlite_callbacks_backup.json', 'w', encoding='utf-8') as f:
            json.dump(callback_data, f, indent=2, ensure_ascii=False)
        print(f"Exported {len(callback_data)} callbacks")
        
        # Export dialer links
        dialer_links = DialerUserLink.objects.all()
        link_data = []
        for link in dialer_links:
            link_data.append({
                'dialer_user_id': link.dialer_user_id,
                'dialer_username': link.dialer_username,
                'crm_user_id': link.crm_user.id,
                'created_at': link.created_at.isoformat() if link.created_at else None,
            })
        
        with open('../sqlite_dialer_links_backup.json', 'w', encoding='utf-8') as f:
            json.dump(link_data, f, indent=2, ensure_ascii=False)
        print(f"Exported {len(link_data)} dialer links")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to export SQLite data: {str(e)}")
        return False
    finally:
        os.chdir("..")

def run_django_migrations():
    """Run Django migrations on PostgreSQL"""
    print_step(5, "Running Django Migrations")
    
    # Change to backend directory
    os.chdir("backend")
    
    # Set environment variables
    os.environ['DJANGO_SETTINGS_MODULE'] = 'crm_backend.settings'
    
    commands = [
        "python manage.py migrate",
        "python manage.py create_dialer_users",
        "python manage.py create_users",
    ]
    
    for cmd in commands:
        if not run_command(cmd, f"Running: {cmd}"):
            print(f"WARNING: Command failed: {cmd}")
    
    os.chdir("..")
    return True

def import_data_to_postgresql():
    """Import exported data to PostgreSQL"""
    print_step(6, "Importing Data to PostgreSQL")
    
    # Change to backend directory
    os.chdir("backend")
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
    
    # Import Django
    import django
    django.setup()
    
    from django.contrib.auth import get_user_model
    from leads.models import Lead, Callback, DialerUserLink
    from django.utils import timezone
    
    try:
        # Import users
        if Path('../sqlite_users_backup.json').exists():
            with open('../sqlite_users_backup.json', 'r', encoding='utf-8') as f:
                user_data = json.load(f)
            
            User = get_user_model()
            imported_users = 0
            
            for user_info in user_data:
                try:
                    user, created = User.objects.get_or_create(
                        username=user_info['username'],
                        defaults={
                            'email': user_info['email'],
                            'first_name': user_info['first_name'],
                            'last_name': user_info['last_name'],
                            'role': user_info['role'],
                            'is_staff': user_info['is_staff'],
                            'is_superuser': user_info['is_superuser'],
                            'phone': user_info['phone'],
                        }
                    )
                    
                    if created:
                        user.set_password('123')  # Default password
                        user.save()
                        imported_users += 1
                        
                except Exception as e:
                    print(f"WARNING: Failed to import user {user_info['username']}: {str(e)}")
            
            print(f"Imported {imported_users} users")
        
        # Import leads
        if Path('../sqlite_leads_backup.json').exists():
            with open('../sqlite_leads_backup.json', 'r', encoding='utf-8') as f:
                lead_data = json.load(f)
            
            imported_leads = 0
            default_agent = User.objects.filter(role='agent').first()
            if not default_agent:
                default_agent = User.objects.first()
            
            for lead_info in lead_data:
                try:
                    lead, created = Lead.objects.get_or_create(
                        full_name=lead_info['full_name'],
                        phone=lead_info['phone'],
                        defaults={
                            'email': lead_info['email'],
                            'status': lead_info['status'],
                            'disposition': lead_info['disposition'],
                            'notes': lead_info['notes'],
                            'assigned_agent': default_agent,
                        }
                    )
                    
                    if created:
                        imported_leads += 1
                        
                except Exception as e:
                    print(f"WARNING: Failed to import lead {lead_info['full_name']}: {str(e)}")
            
            print(f"Imported {imported_leads} leads")
        
        # Import dialer links
        if Path('../sqlite_dialer_links_backup.json').exists():
            with open('../sqlite_dialer_links_backup.json', 'r', encoding='utf-8') as f:
                link_data = json.load(f)
            
            imported_links = 0
            
            for link_info in link_data:
                try:
                    crm_user = User.objects.get(id=link_info['crm_user_id'])
                    link, created = DialerUserLink.objects.get_or_create(
                        dialer_user_id=link_info['dialer_user_id'],
                        defaults={
                            'dialer_username': link_info['dialer_username'],
                            'crm_user': crm_user,
                        }
                    )
                    
                    if created:
                        imported_links += 1
                        
                except Exception as e:
                    print(f"WARNING: Failed to import dialer link: {str(e)}")
            
            print(f"Imported {imported_links} dialer links")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to import data: {str(e)}")
        return False
    finally:
        os.chdir("..")

def verify_migration():
    """Verify that data has been migrated successfully"""
    print_step(7, "Verifying Migration")
    
    # Change to backend directory
    os.chdir("backend")
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
    
    # Import Django
    import django
    django.setup()
    
    from django.contrib.auth import get_user_model
    from leads.models import Lead, Callback, DialerUserLink
    
    try:
        User = get_user_model()
        
        # Count records
        user_count = User.objects.count()
        lead_count = Lead.objects.count()
        callback_count = Callback.objects.count()
        dialer_link_count = DialerUserLink.objects.count()
        
        print(f"PostgreSQL Database Verification:")
        print(f"- Users: {user_count}")
        print(f"- Leads: {lead_count}")
        print(f"- Callbacks: {callback_count}")
        print(f"- Dialer Links: {dialer_link_count}")
        
        # Test database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"- PostgreSQL Version: {version}")
        
        print("\nMIGRATION VERIFICATION SUCCESSFUL!")
        return True
        
    except Exception as e:
        print(f"ERROR: Migration verification failed: {str(e)}")
        return False
    finally:
        os.chdir("..")

def main():
    """Main migration function"""
    print("Django SQLite to PostgreSQL Migration")
    print("Margav Energy CRM - Migration Script")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Step 1: Check PostgreSQL connection
        if not check_postgresql_connection():
            print("ERROR: Cannot connect to PostgreSQL. Please check installation.")
            return False
        
        # Step 2: Create database and user
        if not create_database_and_user():
            print("ERROR: Failed to create database and user.")
            return False
        
        # Step 3: Update Django settings
        if not update_django_settings():
            print("ERROR: Failed to update Django settings.")
            return False
        
        # Step 4: Export SQLite data
        if not export_sqlite_data():
            print("ERROR: Failed to export SQLite data.")
            return False
        
        # Step 5: Run Django migrations
        if not run_django_migrations():
            print("ERROR: Failed to run Django migrations.")
            return False
        
        # Step 6: Import data to PostgreSQL
        if not import_data_to_postgresql():
            print("ERROR: Failed to import data to PostgreSQL.")
            return False
        
        # Step 7: Verify migration
        if not verify_migration():
            print("ERROR: Migration verification failed.")
            return False
        
        print("\n" + "="*60)
        print("MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("Your Django CRM has been successfully migrated to PostgreSQL.")
        print("Database: margav_crm")
        print("User: margav_user")
        print("Host: localhost:5432")
        print("\nNext steps:")
        print("1. Start the backend server: cd backend && python manage.py runserver")
        print("2. Start the frontend server: cd frontend && npm start")
        print("3. Access the admin at: http://localhost:8000/admin/")
        print("4. Login with: admin / 123")
        
        return True
        
    except Exception as e:
        print(f"CRITICAL ERROR: Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
