#!/usr/bin/env python3
"""
Clean up the JSON file to remove trailing spaces from agent names
"""

import json

def clean_json_file(json_file_path):
    """Clean up agent names in the JSON file"""
    
    print(f"Cleaning JSON file: {json_file_path}")
    
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cleaned_count = 0
    
    for lead in data:
        if 'assigned_agent' in lead and lead['assigned_agent']:
            original_name = lead['assigned_agent']
            cleaned_name = original_name.strip()
            if original_name != cleaned_name:
                lead['assigned_agent'] = cleaned_name
                cleaned_count += 1
    
    # Write back the cleaned data
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Cleaned {cleaned_count} agent names")
    print(f"Total leads: {len(data)}")
    print("JSON file cleaned and ready for upload!")

if __name__ == "__main__":
    clean_json_file("Call Centre Lead Tracker_crm_ready.json")
"""
Clean up the JSON file to remove trailing spaces from agent names
"""

import json

def clean_json_file(json_file_path):
    """Clean up agent names in the JSON file"""
    
    print(f"Cleaning JSON file: {json_file_path}")
    
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cleaned_count = 0
    
    for lead in data:
        if 'assigned_agent' in lead and lead['assigned_agent']:
            original_name = lead['assigned_agent']
            cleaned_name = original_name.strip()
            if original_name != cleaned_name:
                lead['assigned_agent'] = cleaned_name
                cleaned_count += 1
    
    # Write back the cleaned data
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Cleaned {cleaned_count} agent names")
    print(f"Total leads: {len(data)}")
    print("JSON file cleaned and ready for upload!")

if __name__ == "__main__":
    clean_json_file("Call Centre Lead Tracker_crm_ready.json")






