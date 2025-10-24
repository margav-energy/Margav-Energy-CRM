#!/usr/bin/env python
"""
Fix FieldSubmissionSerializer to remove old field names
"""

with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the FieldSubmissionSerializer fields list (around line 496)
new_lines = []
in_fields_list = False
skip_until_bracket = False

for i, line in enumerate(lines):
    # Look for the specific FieldSubmissionSerializer (not the Create one)
    if "'city'," in line and in_fields_list:
        # Skip this line (remove city)
        continue
    elif "'monthly_bill'," in line and in_fields_list:
        # Replace old field names with new ones
        new_lines.append("            'average_monthly_bill',\n")
        new_lines.append("            'energy_type',\n")
        continue
    elif "'heating_type'," in line or "'hot_water_type'," in line or "'insulation_type'," in line or "'windows_type'," in line or "'property_age'," in line or "'occupancy'," in line:
        if in_fields_list:
            # Skip old fields that don't exist anymore
            continue
    
    # Track when we're in a fields list
    if "fields = [" in line:
        in_fields_list = True
    elif in_fields_list and "]" in line and "fields" not in line:
        in_fields_list = False
    
    new_lines.append(line)

# Write back
with open('leads/serializers.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Fixed FieldSubmissionSerializer fields!")

"""
Fix FieldSubmissionSerializer to remove old field names
"""

with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the FieldSubmissionSerializer fields list (around line 496)
new_lines = []
in_fields_list = False
skip_until_bracket = False

for i, line in enumerate(lines):
    # Look for the specific FieldSubmissionSerializer (not the Create one)
    if "'city'," in line and in_fields_list:
        # Skip this line (remove city)
        continue
    elif "'monthly_bill'," in line and in_fields_list:
        # Replace old field names with new ones
        new_lines.append("            'average_monthly_bill',\n")
        new_lines.append("            'energy_type',\n")
        continue
    elif "'heating_type'," in line or "'hot_water_type'," in line or "'insulation_type'," in line or "'windows_type'," in line or "'property_age'," in line or "'occupancy'," in line:
        if in_fields_list:
            # Skip old fields that don't exist anymore
            continue
    
    # Track when we're in a fields list
    if "fields = [" in line:
        in_fields_list = True
    elif in_fields_list and "]" in line and "fields" not in line:
        in_fields_list = False
    
    new_lines.append(line)

# Write back
with open('leads/serializers.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Fixed FieldSubmissionSerializer fields!")







