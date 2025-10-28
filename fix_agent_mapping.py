"""
Fix agent mapping for import script
This updates the JSON file to use correct usernames
"""

import json
import sys

# Mapping of old usernames to new usernames
AGENT_MAPPING = {
    'Leia': 'LeiaG',
    'Caleb': 'CalebG',
    'Jake': 'JakeR',
    'Elliot': 'Elliott',
    'Jane': 'Jane'  # Keep as-is or update if different
}

def fix_agent_names(json_file):
    """Update agent names in the exported leads"""
    
    print(f"Loading {json_file}...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        leads_data = json.load(f)
    
    print(f"Found {len(leads_data)} leads")
    
    updated_count = 0
    
    for lead in leads_data:
        if 'assigned_agent' in lead and lead['assigned_agent']:
            old_name = lead['assigned_agent']
            new_name = AGENT_MAPPING.get(old_name)
            
            if new_name and new_name != old_name:
                print(f"Updating {old_name} -> {new_name}")
                lead['assigned_agent'] = new_name
                updated_count += 1
    
    # Save updated data
    output_file = json_file.replace('.json', '_fixed.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(leads_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated {updated_count} leads")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fix_agent_mapping.py <json_file>")
        sys.exit(1)
    
    fix_agent_names(sys.argv[1])

