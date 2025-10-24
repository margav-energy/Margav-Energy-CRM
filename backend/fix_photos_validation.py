#!/usr/bin/env python
"""
Fix photos and signature validation in serializers
"""

# Read the serializers file
with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old validation code for photos (appears twice)
old_photos_validation = '''    def validate_photos(self, value):
        if not value or not isinstance(value, list):
            raise serializers.ValidationError("At least one photo is required.")
        
        if len(value) == 0:
            raise serializers.ValidationError("At least one photo is required.")
        
        # Validate that photos are base64 strings
        for i, photo in enumerate(value):
            if not isinstance(photo, str) or not photo.startswith('data:image/'):
                raise serializers.ValidationError(f"Photo {i+1} must be a valid base64 image.")
        
        return value'''

# New validation that accepts dict format
new_photos_validation = '''    def validate_photos(self, value):
        # Accept both dict (new format) and list (old format)
        if isinstance(value, dict):
            # New format: {roof: "...", frontRear: "...", energyBill: "..."}
            # All three photos are required
            required = ['roof', 'frontRear', 'energyBill']
            for key in required:
                if not value.get(key):
                    raise serializers.ValidationError(f"{key} photo is required.")
            return value
        elif isinstance(value, list):
            # Old format: array of base64 strings
            if len(value) == 0:
                raise serializers.ValidationError("At least one photo is required.")
            return value
        else:
            raise serializers.ValidationError("Photos must be provided.")'''

# Replace all occurrences
content = content.replace(old_photos_validation, new_photos_validation)

# Remove signature validation (make it optional)
old_sig_validation = '''    def validate_signature(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer signature is required.")
        
        if not value.startswith('data:image/'):
            raise serializers.ValidationError("Signature must be a valid base64 image.")
        
        return value.strip()'''

new_sig_validation = '''    # Signature is optional - no validation required'''

content = content.replace(old_sig_validation, new_sig_validation)

# Write back
with open('leads/serializers.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated serializers!")
print("   - Photos now accept dict format {roof, frontRear, energyBill}")
print("   - Signature is now optional")

"""
Fix photos and signature validation in serializers
"""

# Read the serializers file
with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old validation code for photos (appears twice)
old_photos_validation = '''    def validate_photos(self, value):
        if not value or not isinstance(value, list):
            raise serializers.ValidationError("At least one photo is required.")
        
        if len(value) == 0:
            raise serializers.ValidationError("At least one photo is required.")
        
        # Validate that photos are base64 strings
        for i, photo in enumerate(value):
            if not isinstance(photo, str) or not photo.startswith('data:image/'):
                raise serializers.ValidationError(f"Photo {i+1} must be a valid base64 image.")
        
        return value'''

# New validation that accepts dict format
new_photos_validation = '''    def validate_photos(self, value):
        # Accept both dict (new format) and list (old format)
        if isinstance(value, dict):
            # New format: {roof: "...", frontRear: "...", energyBill: "..."}
            # All three photos are required
            required = ['roof', 'frontRear', 'energyBill']
            for key in required:
                if not value.get(key):
                    raise serializers.ValidationError(f"{key} photo is required.")
            return value
        elif isinstance(value, list):
            # Old format: array of base64 strings
            if len(value) == 0:
                raise serializers.ValidationError("At least one photo is required.")
            return value
        else:
            raise serializers.ValidationError("Photos must be provided.")'''

# Replace all occurrences
content = content.replace(old_photos_validation, new_photos_validation)

# Remove signature validation (make it optional)
old_sig_validation = '''    def validate_signature(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer signature is required.")
        
        if not value.startswith('data:image/'):
            raise serializers.ValidationError("Signature must be a valid base64 image.")
        
        return value.strip()'''

new_sig_validation = '''    # Signature is optional - no validation required'''

content = content.replace(old_sig_validation, new_sig_validation)

# Write back
with open('leads/serializers.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated serializers!")
print("   - Photos now accept dict format {roof, frontRear, energyBill}")
print("   - Signature is now optional")







