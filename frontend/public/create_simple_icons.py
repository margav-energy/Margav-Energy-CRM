#!/usr/bin/env python3
"""
Create simple PNG icons from base64 data
"""
import os
import base64

# Simple 1x1 blue PNG (will be resized by browser)
SIMPLE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

def create_simple_png(size, output_path):
    """Create a simple colored PNG icon"""
    # Decode the base64 PNG
    png_data = base64.b64decode(SIMPLE_PNG_BASE64)
    
    # For a proper icon, we'd need to use PIL/Pillow to create actual sized images
    # For now, create a minimal valid PNG that browsers can use
    # This is a 1x1 pixel PNG - browsers will scale it
    
    with open(output_path, 'wb') as f:
        f.write(png_data)
    
    print(f"Created {output_path}")

def main():
    """Create all icon files"""
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    print("Creating simple placeholder PNG icons...")
    
    for size in sizes:
        output_path = f'icons/icon-{size}x{size}.png'
        create_simple_png(size, output_path)
    
    print("\n✅ Created placeholder icons!")
    print("Note: These are minimal placeholders. For production, use proper icon images.")

if __name__ == "__main__":
    main()

