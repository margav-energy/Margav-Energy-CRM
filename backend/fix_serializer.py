#!/usr/bin/env python
"""
Quick script to fix the FieldSubmissionCreateSerializer
"""

import re

# Read the serializers file
with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the second FieldSubmissionCreateSerializer fields list
# We'll replace from line ~575 to ~598

old_fields = '''        fields = [
            'customer_name',
            'phone',
            'email',
            'address',
            'city',
            'postal_code',
            'property_type',
            'roof_type',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'monthly_bill',
            'heating_type',
            'hot_water_type',
            'insulation_type',
            'windows_type',
            'property_age',
            'occupancy',
            'notes',
            'photos',
            'signature',
            'timestamp'
        ]'''

new_fields = '''        fields = [
            # Canvasser Info
            'canvasser_name',
            'assessment_date',
            'assessment_time',
            # Customer Information
            'customer_name',
            'phone',
            'email',
            'address',
            'postal_code',
            'preferred_contact_time',
            # Property Information
            'owns_property',
            'property_type',
            'number_of_bedrooms',
            'roof_type',
            'roof_material',
            'roof_condition',
            'roof_age',
            # Energy Usage
            'average_monthly_bill',
            'energy_type',
            'current_energy_supplier',
            'uses_electric_heating',
            'electric_heating_details',
            # Timeframe and Interest
            'has_received_other_quotes',
            'is_decision_maker',
            'moving_in_5_years',
            # Media and Notes
            'notes',
            'photos',
            'signature',
            'timestamp'
        ]'''

# Replace the last occurrence (the newer serializer)
parts = content.rsplit(old_fields, 1)
if len(parts) == 2:
    content = parts[0] + new_fields + parts[1]
    
    # Write back
    with open('leads/serializers.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Successfully updated FieldSubmissionCreateSerializer!")
else:
    print("❌ Could not find the exact fields list to replace")

"""
Quick script to fix the FieldSubmissionCreateSerializer
"""

import re

# Read the serializers file
with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the second FieldSubmissionCreateSerializer fields list
# We'll replace from line ~575 to ~598

old_fields = '''        fields = [
            'customer_name',
            'phone',
            'email',
            'address',
            'city',
            'postal_code',
            'property_type',
            'roof_type',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'monthly_bill',
            'heating_type',
            'hot_water_type',
            'insulation_type',
            'windows_type',
            'property_age',
            'occupancy',
            'notes',
            'photos',
            'signature',
            'timestamp'
        ]'''

new_fields = '''        fields = [
            # Canvasser Info
            'canvasser_name',
            'assessment_date',
            'assessment_time',
            # Customer Information
            'customer_name',
            'phone',
            'email',
            'address',
            'postal_code',
            'preferred_contact_time',
            # Property Information
            'owns_property',
            'property_type',
            'number_of_bedrooms',
            'roof_type',
            'roof_material',
            'roof_condition',
            'roof_age',
            # Energy Usage
            'average_monthly_bill',
            'energy_type',
            'current_energy_supplier',
            'uses_electric_heating',
            'electric_heating_details',
            # Timeframe and Interest
            'has_received_other_quotes',
            'is_decision_maker',
            'moving_in_5_years',
            # Media and Notes
            'notes',
            'photos',
            'signature',
            'timestamp'
        ]'''

# Replace the last occurrence (the newer serializer)
parts = content.rsplit(old_fields, 1)
if len(parts) == 2:
    content = parts[0] + new_fields + parts[1]
    
    # Write back
    with open('leads/serializers.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Successfully updated FieldSubmissionCreateSerializer!")
else:
    print("❌ Could not find the exact fields list to replace")







