#!/usr/bin/env python3
"""
Excel to JSON Converter for Margav Energy CRM Lead Database
Converts Excel files to JSON format compatible with the lead upload API
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime

def excel_to_json(excel_file_path, json_file_path=None, sheet_name=0):
    """
    Converts an Excel file to JSON format compatible with Margav Energy CRM
    
    Args:
        excel_file_path (str): Path to the input Excel file
        json_file_path (str): Path for the output JSON file (optional)
        sheet_name (str or int): Name or index of the sheet to read (default: 0)
    
    Returns:
        str: Path to the created JSON file
    """
    
    try:
        print(f"Reading Excel file: {excel_file_path}")
        
        # Read the Excel file
        df = pd.read_excel(excel_file_path, sheet_name=sheet_name)
        
        print(f"Successfully loaded {len(df)} rows from Excel")
        print(f"Columns found: {list(df.columns)}")
        
        # Clean the data
        df = df.dropna(how='all')  # Remove completely empty rows
        df = df.fillna('')  # Replace NaN with empty strings
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict(orient='records')
        
        # Generate output filename if not provided
        if not json_file_path:
            base_name = os.path.splitext(os.path.basename(excel_file_path))[0]
            json_file_path = f"{base_name}_converted.json"
        
        # Write to JSON file
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully converted to: {json_file_path}")
        print(f"Created {len(data)} lead records")
        
        return json_file_path
        
    except FileNotFoundError:
        print(f"Error: Excel file not found at '{excel_file_path}'")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

def validate_json_for_crm(json_file_path):
    """
    Validates the JSON file to ensure it's compatible with the CRM lead structure
    
    Args:
        json_file_path (str): Path to the JSON file to validate
    """
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("Warning: JSON file is empty")
            return
        
        # Check for required fields
        required_fields = ['full_name', 'phone']
        optional_fields = ['email', 'address1', 'city', 'postal_code', 'notes', 'status']
        
        print(f"\nValidating {len(data)} records...")
        
        missing_required = []
        for i, record in enumerate(data):
            for field in required_fields:
                if field not in record or not record[field]:
                    missing_required.append(f"Row {i+1}: Missing '{field}'")
        
        if missing_required:
            print("Validation errors found:")
            for error in missing_required[:10]:  # Show first 10 errors
                print(f"   {error}")
            if len(missing_required) > 10:
                print(f"   ... and {len(missing_required) - 10} more errors")
        else:
            print("All records have required fields (full_name, phone)")
        
        # Show field mapping suggestions
        print(f"\nField mapping suggestions:")
        print(f"   Required: full_name, phone")
        print(f"   Optional: email, address1, city, postal_code, notes, status")
        
        # Show sample record
        if data:
            print(f"\nSample record:")
            sample = {k: v for k, v in data[0].items() if v}
            for key, value in sample.items():
                print(f"   {key}: {value}")
        
    except Exception as e:
        print(f"Error validating JSON: {e}")

def main():
    """Main function to handle command line arguments"""
    
    print("Margav Energy CRM - Excel to JSON Converter")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("Usage: python excel_to_json_converter.py <excel_file> [json_file]")
        print("\nExample:")
        print("  python excel_to_json_converter.py leads_data.xlsx")
        print("  python excel_to_json_converter.py leads_data.xlsx output.json")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    json_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Check if Excel file exists
    if not os.path.exists(excel_file):
        print(f"❌ Error: Excel file '{excel_file}' not found")
        sys.exit(1)
    
    # Convert Excel to JSON
    json_path = excel_to_json(excel_file, json_file)
    
    # Validate the JSON
    validate_json_for_crm(json_path)
    
    print(f"\nConversion complete!")
    print(f"JSON file ready: {json_path}")
    print(f"\nNext steps:")
    print(f"   1. Upload the JSON file to your CRM admin panel")
    print(f"   2. Or use the API endpoint: POST /api/leads/upload-json/")
    print(f"   3. Check the admin panel for any import errors")

if __name__ == "__main__":
    main()

Excel to JSON Converter for Margav Energy CRM Lead Database
Converts Excel files to JSON format compatible with the lead upload API
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime

def excel_to_json(excel_file_path, json_file_path=None, sheet_name=0):
    """
    Converts an Excel file to JSON format compatible with Margav Energy CRM
    
    Args:
        excel_file_path (str): Path to the input Excel file
        json_file_path (str): Path for the output JSON file (optional)
        sheet_name (str or int): Name or index of the sheet to read (default: 0)
    
    Returns:
        str: Path to the created JSON file
    """
    
    try:
        print(f"Reading Excel file: {excel_file_path}")
        
        # Read the Excel file
        df = pd.read_excel(excel_file_path, sheet_name=sheet_name)
        
        print(f"Successfully loaded {len(df)} rows from Excel")
        print(f"Columns found: {list(df.columns)}")
        
        # Clean the data
        df = df.dropna(how='all')  # Remove completely empty rows
        df = df.fillna('')  # Replace NaN with empty strings
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict(orient='records')
        
        # Generate output filename if not provided
        if not json_file_path:
            base_name = os.path.splitext(os.path.basename(excel_file_path))[0]
            json_file_path = f"{base_name}_converted.json"
        
        # Write to JSON file
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully converted to: {json_file_path}")
        print(f"Created {len(data)} lead records")
        
        return json_file_path
        
    except FileNotFoundError:
        print(f"Error: Excel file not found at '{excel_file_path}'")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

def validate_json_for_crm(json_file_path):
    """
    Validates the JSON file to ensure it's compatible with the CRM lead structure
    
    Args:
        json_file_path (str): Path to the JSON file to validate
    """
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("Warning: JSON file is empty")
            return
        
        # Check for required fields
        required_fields = ['full_name', 'phone']
        optional_fields = ['email', 'address1', 'city', 'postal_code', 'notes', 'status']
        
        print(f"\nValidating {len(data)} records...")
        
        missing_required = []
        for i, record in enumerate(data):
            for field in required_fields:
                if field not in record or not record[field]:
                    missing_required.append(f"Row {i+1}: Missing '{field}'")
        
        if missing_required:
            print("Validation errors found:")
            for error in missing_required[:10]:  # Show first 10 errors
                print(f"   {error}")
            if len(missing_required) > 10:
                print(f"   ... and {len(missing_required) - 10} more errors")
        else:
            print("All records have required fields (full_name, phone)")
        
        # Show field mapping suggestions
        print(f"\nField mapping suggestions:")
        print(f"   Required: full_name, phone")
        print(f"   Optional: email, address1, city, postal_code, notes, status")
        
        # Show sample record
        if data:
            print(f"\nSample record:")
            sample = {k: v for k, v in data[0].items() if v}
            for key, value in sample.items():
                print(f"   {key}: {value}")
        
    except Exception as e:
        print(f"Error validating JSON: {e}")

def main():
    """Main function to handle command line arguments"""
    
    print("Margav Energy CRM - Excel to JSON Converter")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("Usage: python excel_to_json_converter.py <excel_file> [json_file]")
        print("\nExample:")
        print("  python excel_to_json_converter.py leads_data.xlsx")
        print("  python excel_to_json_converter.py leads_data.xlsx output.json")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    json_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Check if Excel file exists
    if not os.path.exists(excel_file):
        print(f"❌ Error: Excel file '{excel_file}' not found")
        sys.exit(1)
    
    # Convert Excel to JSON
    json_path = excel_to_json(excel_file, json_file)
    
    # Validate the JSON
    validate_json_for_crm(json_path)
    
    print(f"\nConversion complete!")
    print(f"JSON file ready: {json_path}")
    print(f"\nNext steps:")
    print(f"   1. Upload the JSON file to your CRM admin panel")
    print(f"   2. Or use the API endpoint: POST /api/leads/upload-json/")
    print(f"   3. Check the admin panel for any import errors")

if __name__ == "__main__":
    main()
