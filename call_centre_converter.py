#!/usr/bin/env python3
"""
Custom Excel to JSON Converter for Call Centre Lead Tracker
Maps the specific column names from your Excel file to CRM format
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime

def convert_call_centre_excel(excel_file_path, json_file_path=None):
    """
    Converts Call Centre Lead Tracker Excel file to JSON format compatible with Margav Energy CRM
    
    Args:
        excel_file_path (str): Path to the Call Centre Lead Tracker Excel file
        json_file_path (str): Path for the output JSON file (optional)
    
    Returns:
        str: Path to the created JSON file
    """
    
    try:
        print(f"Reading Call Centre Lead Tracker: {excel_file_path}")
        
        # Read the Excel file
        df = pd.read_excel(excel_file_path)
        
        print(f"Successfully loaded {len(df)} rows from Excel")
        print(f"Columns found: {list(df.columns)}")
        
        # Clean the data
        df = df.dropna(how='all')  # Remove completely empty rows
        df = df.fillna('')  # Replace NaN with empty strings
        
        # Map Excel columns to CRM fields
        converted_data = []
        
        for index, row in df.iterrows():
            # Skip rows that don't have customer name (likely headers or empty rows)
            if not row.get('Customer Name') or str(row.get('Customer Name')).strip() == '':
                continue
                
            # Map the fields
            lead_data = {
                'full_name': str(row.get('Customer Name', '')).strip(),
                'phone': str(row.get('Customer Number', '')).strip(),
                'email': '',  # Not available in your Excel
                'address1': str(row.get('Customer address ', '')).strip(),
                'city': '',  # Not available in your Excel
                'postal_code': str(row.get('Customer Postcode', '')).strip(),
                'notes': f"Agent: {row.get('Agent', '')}\nDate: {row.get('Date & Time ', '')}\nContact Centre Notes: {row.get('Contact Centre Notes ', '')}\nKelly Notes: {row.get('Kelly Notes ', '')}\nData Source: {row.get('Data Source ', '')}",
                'status': map_outcome_to_status(row.get('Outcome', '')),
                'assigned_agent': str(row.get('Agent', '')).strip()
            }
            
            # Only add if we have required fields
            if lead_data['full_name'] and lead_data['phone']:
                converted_data.append(lead_data)
        
        print(f"Converted {len(converted_data)} valid lead records")
        
        # Generate output filename if not provided
        if not json_file_path:
            base_name = os.path.splitext(os.path.basename(excel_file_path))[0]
            json_file_path = f"{base_name}_crm_ready.json"
        
        # Write to JSON file
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(converted_data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully converted to: {json_file_path}")
        
        return json_file_path
        
    except FileNotFoundError:
        print(f"Error: Excel file not found at '{excel_file_path}'")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

def map_outcome_to_status(outcome):
    """
    Maps the 'Outcome' field from Excel to CRM status values
    """
    if not outcome:
        return 'cold_call'
    
    outcome_str = str(outcome).lower().strip()
    
    # Map common outcomes to CRM statuses
    if 'interested' in outcome_str:
        return 'interested'
    elif 'not interested' in outcome_str or 'not_interested' in outcome_str:
        return 'not_interested'
    elif 'on hold' in outcome_str or 'callback' in outcome_str:
        return 'on_hold'
    elif 'qualified' in outcome_str:
        return 'qualified'
    elif 'appointment' in outcome_str:
        return 'appointment_set'
    elif 'sold' in outcome_str:
        return 'sold'
    elif 'blow out' in outcome_str:
        return 'blow_out'
    elif 'pass back' in outcome_str:
        return 'pass_back_to_agent'
    else:
        return 'cold_call'  # Default status

def validate_converted_json(json_file_path):
    """
    Validates the converted JSON file
    """
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("Warning: JSON file is empty")
            return
        
        print(f"\nValidating {len(data)} records...")
        
        # Check for required fields
        missing_required = []
        for i, record in enumerate(data):
            if not record.get('full_name'):
                missing_required.append(f"Row {i+1}: Missing 'full_name'")
            if not record.get('phone'):
                missing_required.append(f"Row {i+1}: Missing 'phone'")
        
        if missing_required:
            print("Validation errors found:")
            for error in missing_required[:10]:  # Show first 10 errors
                print(f"   {error}")
            if len(missing_required) > 10:
                print(f"   ... and {len(missing_required) - 10} more errors")
        else:
            print("All records have required fields (full_name, phone)")
        
        # Show sample record
        if data:
            print(f"\nSample record:")
            sample = data[0]
            for key, value in sample.items():
                if value:  # Only show non-empty fields
                    print(f"   {key}: {value}")
        
    except Exception as e:
        print(f"Error validating JSON: {e}")

def main():
    """Main function"""
    
    print("Call Centre Lead Tracker - Excel to CRM JSON Converter")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("Usage: python call_centre_converter.py <excel_file> [json_file]")
        print("\nExample:")
        print("  python call_centre_converter.py 'Call Centre Lead Tracker.xlsx'")
        print("  python call_centre_converter.py 'Call Centre Lead Tracker.xlsx' leads.json")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    json_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Check if Excel file exists
    if not os.path.exists(excel_file):
        print(f"Error: Excel file '{excel_file}' not found")
        sys.exit(1)
    
    # Convert Excel to JSON
    json_path = convert_call_centre_excel(excel_file, json_file)
    
    # Validate the JSON
    validate_converted_json(json_path)
    
    print(f"\nConversion complete!")
    print(f"JSON file ready: {json_path}")
    print(f"\nNext steps:")
    print(f"   1. Upload the JSON file to your CRM admin panel")
    print(f"   2. Or use the API endpoint: POST /api/leads/upload-json/")
    print(f"   3. Check the admin panel for any import errors")
    print(f"\nNote: Agent assignments will need to be mapped to existing CRM users")

if __name__ == "__main__":
    main()
"""
Custom Excel to JSON Converter for Call Centre Lead Tracker
Maps the specific column names from your Excel file to CRM format
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime

def convert_call_centre_excel(excel_file_path, json_file_path=None):
    """
    Converts Call Centre Lead Tracker Excel file to JSON format compatible with Margav Energy CRM
    
    Args:
        excel_file_path (str): Path to the Call Centre Lead Tracker Excel file
        json_file_path (str): Path for the output JSON file (optional)
    
    Returns:
        str: Path to the created JSON file
    """
    
    try:
        print(f"Reading Call Centre Lead Tracker: {excel_file_path}")
        
        # Read the Excel file
        df = pd.read_excel(excel_file_path)
        
        print(f"Successfully loaded {len(df)} rows from Excel")
        print(f"Columns found: {list(df.columns)}")
        
        # Clean the data
        df = df.dropna(how='all')  # Remove completely empty rows
        df = df.fillna('')  # Replace NaN with empty strings
        
        # Map Excel columns to CRM fields
        converted_data = []
        
        for index, row in df.iterrows():
            # Skip rows that don't have customer name (likely headers or empty rows)
            if not row.get('Customer Name') or str(row.get('Customer Name')).strip() == '':
                continue
                
            # Map the fields
            lead_data = {
                'full_name': str(row.get('Customer Name', '')).strip(),
                'phone': str(row.get('Customer Number', '')).strip(),
                'email': '',  # Not available in your Excel
                'address1': str(row.get('Customer address ', '')).strip(),
                'city': '',  # Not available in your Excel
                'postal_code': str(row.get('Customer Postcode', '')).strip(),
                'notes': f"Agent: {row.get('Agent', '')}\nDate: {row.get('Date & Time ', '')}\nContact Centre Notes: {row.get('Contact Centre Notes ', '')}\nKelly Notes: {row.get('Kelly Notes ', '')}\nData Source: {row.get('Data Source ', '')}",
                'status': map_outcome_to_status(row.get('Outcome', '')),
                'assigned_agent': str(row.get('Agent', '')).strip()
            }
            
            # Only add if we have required fields
            if lead_data['full_name'] and lead_data['phone']:
                converted_data.append(lead_data)
        
        print(f"Converted {len(converted_data)} valid lead records")
        
        # Generate output filename if not provided
        if not json_file_path:
            base_name = os.path.splitext(os.path.basename(excel_file_path))[0]
            json_file_path = f"{base_name}_crm_ready.json"
        
        # Write to JSON file
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(converted_data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully converted to: {json_file_path}")
        
        return json_file_path
        
    except FileNotFoundError:
        print(f"Error: Excel file not found at '{excel_file_path}'")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

def map_outcome_to_status(outcome):
    """
    Maps the 'Outcome' field from Excel to CRM status values
    """
    if not outcome:
        return 'cold_call'
    
    outcome_str = str(outcome).lower().strip()
    
    # Map common outcomes to CRM statuses
    if 'interested' in outcome_str:
        return 'interested'
    elif 'not interested' in outcome_str or 'not_interested' in outcome_str:
        return 'not_interested'
    elif 'on hold' in outcome_str or 'callback' in outcome_str:
        return 'on_hold'
    elif 'qualified' in outcome_str:
        return 'qualified'
    elif 'appointment' in outcome_str:
        return 'appointment_set'
    elif 'sold' in outcome_str:
        return 'sold'
    elif 'blow out' in outcome_str:
        return 'blow_out'
    elif 'pass back' in outcome_str:
        return 'pass_back_to_agent'
    else:
        return 'cold_call'  # Default status

def validate_converted_json(json_file_path):
    """
    Validates the converted JSON file
    """
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("Warning: JSON file is empty")
            return
        
        print(f"\nValidating {len(data)} records...")
        
        # Check for required fields
        missing_required = []
        for i, record in enumerate(data):
            if not record.get('full_name'):
                missing_required.append(f"Row {i+1}: Missing 'full_name'")
            if not record.get('phone'):
                missing_required.append(f"Row {i+1}: Missing 'phone'")
        
        if missing_required:
            print("Validation errors found:")
            for error in missing_required[:10]:  # Show first 10 errors
                print(f"   {error}")
            if len(missing_required) > 10:
                print(f"   ... and {len(missing_required) - 10} more errors")
        else:
            print("All records have required fields (full_name, phone)")
        
        # Show sample record
        if data:
            print(f"\nSample record:")
            sample = data[0]
            for key, value in sample.items():
                if value:  # Only show non-empty fields
                    print(f"   {key}: {value}")
        
    except Exception as e:
        print(f"Error validating JSON: {e}")

def main():
    """Main function"""
    
    print("Call Centre Lead Tracker - Excel to CRM JSON Converter")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("Usage: python call_centre_converter.py <excel_file> [json_file]")
        print("\nExample:")
        print("  python call_centre_converter.py 'Call Centre Lead Tracker.xlsx'")
        print("  python call_centre_converter.py 'Call Centre Lead Tracker.xlsx' leads.json")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    json_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Check if Excel file exists
    if not os.path.exists(excel_file):
        print(f"Error: Excel file '{excel_file}' not found")
        sys.exit(1)
    
    # Convert Excel to JSON
    json_path = convert_call_centre_excel(excel_file, json_file)
    
    # Validate the JSON
    validate_converted_json(json_path)
    
    print(f"\nConversion complete!")
    print(f"JSON file ready: {json_path}")
    print(f"\nNext steps:")
    print(f"   1. Upload the JSON file to your CRM admin panel")
    print(f"   2. Or use the API endpoint: POST /api/leads/upload-json/")
    print(f"   3. Check the admin panel for any import errors")
    print(f"\nNote: Agent assignments will need to be mapped to existing CRM users")

if __name__ == "__main__":
    main()






