#!/usr/bin/env python3
"""
Simple Database Check Script
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

def main():
    print("Database Check - Margav Energy CRM")
    print("=" * 40)
    
    # Change to backend directory
    os.chdir("backend")
    
    try:
        with connection.cursor() as cursor:
            # Get all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            print(f"Found {len(tables)} tables:")
            for table in tables:
                table_name = table[0]
                cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
                count = cursor.fetchone()[0]
                print(f"  - {table_name}: {count} records")
                
                # If it's the leads table, show more details
                if table_name == 'leads_lead':
                    print(f"    -> This is the LEADS table with {count} records!")
                    if count > 0:
                        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
                        rows = cursor.fetchall()
                        print("    -> Sample data:")
                        for i, row in enumerate(rows, 1):
                            print(f"       Row {i}: {row}")
        
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    main()
