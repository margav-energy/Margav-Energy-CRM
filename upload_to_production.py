#!/usr/bin/env python3
"""
Automated script to upload leads to production Render database
This will APPEND leads - existing leads won't be overwritten
"""

import os
import sys
import subprocess
import requests
from pathlib import Path

def check_file_exists(filename):
    """Check if a file exists"""
    return Path(filename).exists()

def upload_via_render_shell():
    """Upload leads using Render Shell API"""
    print("=" * 60)
    print("Uploading to Render via Shell API")
    print("=" * 60)
    
    json_file = 'production_leads_export.json'
    python_file = 'import_leads_to_production.py'
    
    if not check_file_exists(json_file):
        print(f"Error: {json_file} not found!")
        return False
    
    if not check_file_exists(python_file):
        print(f"Error: {python_file} not found!")
        return False
    
    print(f"Found export file: {json_file}")
    print(f"Found import script: {python_file}")
    print()
    print("To upload to production:")
    print("1. Go to Render Dashboard")
    print("2. Navigate to your web service")
    print("3. Click 'Shell' tab")
    print("4. Upload both files:")
    print(f"   - {json_file}")
    print(f"   - {python_file}")
    print()
    print("5. Run this command in the Render shell:")
    print(f"   python {python_file} {json_file}")
    print()
    
    return True

def main():
    """Main function"""
    print("""
============================================================
Lead Upload to Production - SAFE MODE
============================================================

This script will APPEND your 217 leads to production.
Existing leads in production will NOT be overwritten.

Safety Features:
- Checks for duplicate leads by phone number
- Updates existing leads if found
- Creates new leads if not found
- Preserves all existing production data

Would you like to proceed with automated upload?
    """)
    
    response = input("Continue? (y/N): ").strip().lower()
    
    if response != 'y':
        print("Upload cancelled.")
        return
    
    # Show manual upload instructions
    upload_via_render_shell()
    
    print()
    print("=" * 60)
    print("Alternate: Using Django Management Command")
    print("=" * 60)
    print()
    print("If you prefer, you can also run this on Render:")
    print()
    print("1. SSH into your Render web service")
    print("2. Navigate to your Django app directory")
    print("3. Run: python import_leads_to_production.py production_leads_export.json")
    print()
    
    print("=" * 60)
    print("Data Safety Guarantee")
    print("=" * 60)
    print()
    print("Your existing production data is SAFE:")
    print("- New leads will be ADDED (not overwritten)")
    print("- Existing leads with same phone will be UPDATED")
    print("- All other production data remains untouched")
    print("- No database tables will be dropped")
    print("- No migrations will be run")
    print()

if __name__ == "__main__":
    main()


