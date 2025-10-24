#!/usr/bin/env python
"""
Fix signature and photos validation
"""

# Read the serializers file
with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and comment out signature validation
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if this is the start of validate_signature method
    if 'def validate_signature(self, value):' in line:
        # Comment out this method (next 5-6 lines)
        new_lines.append('    # Signature is optional - validation removed\n')
        new_lines.append('    # ' + line)
        i += 1
        # Comment out the next few lines until we hit the next method or blank line
        while i < len(lines):
            next_line = lines[i]
            if next_line.strip() and not next_line.strip().startswith('#'):
                if 'def ' in next_line and 'validate' in next_line:
                    # Hit next method, stop
                    break
                if next_line.strip().startswith('return'):
                    new_lines.append('    # ' + next_line)
                    i += 1
                    break
                new_lines.append('    # ' + next_line)
            else:
                new_lines.append(next_line)
            i += 1
    else:
        new_lines.append(line)
        i += 1

# Write back
with open('leads/serializers.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Successfully removed signature validation!")
print("   Signature is now optional.")

"""
Fix signature and photos validation
"""

# Read the serializers file
with open('leads/serializers.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and comment out signature validation
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if this is the start of validate_signature method
    if 'def validate_signature(self, value):' in line:
        # Comment out this method (next 5-6 lines)
        new_lines.append('    # Signature is optional - validation removed\n')
        new_lines.append('    # ' + line)
        i += 1
        # Comment out the next few lines until we hit the next method or blank line
        while i < len(lines):
            next_line = lines[i]
            if next_line.strip() and not next_line.strip().startswith('#'):
                if 'def ' in next_line and 'validate' in next_line:
                    # Hit next method, stop
                    break
                if next_line.strip().startswith('return'):
                    new_lines.append('    # ' + next_line)
                    i += 1
                    break
                new_lines.append('    # ' + next_line)
            else:
                new_lines.append(next_line)
            i += 1
    else:
        new_lines.append(line)
        i += 1

# Write back
with open('leads/serializers.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Successfully removed signature validation!")
print("   Signature is now optional.")







