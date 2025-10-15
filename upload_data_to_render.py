#!/usr/bin/env python3
"""
Script to upload local database data to Render PostgreSQL database
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def main():
    print("🚀 Starting data migration to Render...")
    
    # Check if we're in the right directory
    if not os.path.exists('backend/manage.py'):
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    # Step 1: Export data from local SQLite
    print("📤 Step 1: Exporting data from local database...")
    try:
        os.chdir('backend')
        result = subprocess.run([
            'python', 'manage.py', 'dumpdata', 
            '--natural-foreign', '--natural-primary',
            '-e', 'contenttypes', '-e', 'auth.Permission',
            '-o', 'data_export.json'
        ], capture_output=True, text=True, check=True)
        
        print("✅ Data exported successfully")
        
        # Check what was exported
        with open('data_export.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"📊 Exported {len(data)} records")
        
        # Count by model type
        from collections import Counter
        model_counts = Counter([item['model'] for item in data])
        
        print("📋 Models exported:")
        for model, count in model_counts.items():
            print(f"  {model}: {count} records")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error exporting data: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    
    # Step 2: Instructions for manual upload
    print("\n📋 Step 2: Manual upload instructions")
    print("=" * 50)
    print("To upload your data to Render, you have two options:")
    print()
    print("OPTION 1: Use Render's database dashboard")
    print("1. Go to your Render dashboard")
    print("2. Click on your PostgreSQL database service")
    print("3. Go to 'Connect' tab")
    print("4. Use the external connection string")
    print("5. Connect with a PostgreSQL client (like pgAdmin or DBeaver)")
    print("6. Import the data_export.json file using Django's loaddata command")
    print()
    print("OPTION 2: Use Render's shell feature")
    print("1. Go to your Render web service")
    print("2. Click on 'Shell' tab")
    print("3. Upload the data_export.json file")
    print("4. Run: python manage.py loaddata data_export.json")
    print()
    print("OPTION 3: Use the import command (recommended)")
    print("1. Upload data_export.json to your Render service")
    print("2. Run: python manage.py import_data --file data_export.json")
    print()
    print("📁 Your data export file is ready at: backend/data_export.json")
    print(f"📏 File size: {os.path.getsize('data_export.json')} bytes")

if __name__ == '__main__':
    main()
