#!/usr/bin/env python3
"""
Simple PWA Icon Generator
Creates basic PNG icons for Margav Energy PWA using base64 encoded PNG data.
"""

import base64
import os

# Margav Energy color scheme
PRIMARY_COLOR = "#3333cc"
BLACK = "#000000"
WHITE = "#ffffff"

def create_simple_png_base64(size):
    """Create a simple PNG icon as base64 string"""
    # This is a minimal PNG with a blue circle and "ME" text
    # For a 72x72 icon, we'll create a simple design
    
    # Create a simple PNG header and data
    # This is a very basic approach - in production you'd want proper PNG generation
    
    # For now, let's create a simple colored square as placeholder
    # The actual implementation would require proper PNG encoding
    
    # Return a simple 1x1 pixel PNG as base64 (placeholder)
    # In a real implementation, you'd generate proper PNG data
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

def create_icon_file(size):
    """Create an icon file for the given size"""
    # For now, let's create a simple text file that can be converted
    # This is a placeholder approach
    
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .circle {{ fill: {PRIMARY_COLOR}; stroke: {BLACK}; stroke-width: {max(1, size//64)}; }}
      .text {{ fill: {WHITE}; font-family: Arial, sans-serif; font-size: {size//3}px; font-weight: bold; text-anchor: middle; dominant-baseline: central; }}
    </style>
  </defs>
  <circle cx="{size//2}" cy="{size//2}" r="{size//2 - size//8}" class="circle"/>
  <text x="{size//2}" y="{size//2}" class="text">ME</text>
</svg>'''
    
    return svg_content

def main():
    """Generate all required PWA icons"""
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    # Required icon sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("🎨 Generating PWA icons for Margav Energy...")
    print("📱 Creating SVG icons that can be converted to PNG...\n")
    
    for size in sizes:
        svg_content = create_icon_file(size)
        filename = f'icons/icon-{size}x{size}.svg'
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"✅ Created {filename}")
    
    print(f"\n📋 Next steps:")
    print(f"1. Open the SVG files in a browser or image editor")
    print(f"2. Export each as PNG format")
    print(f"3. Replace the .svg files with .png files")
    print(f"4. Your PWA will have proper icons!")
    
    print(f"\n🌐 Quick conversion options:")
    print(f"- Use the svg-to-png-converter.html file in your browser")
    print(f"- Online converters: https://convertio.co/svg-png/")
    print(f"- Image editors: GIMP, Photoshop, Canva")
    
    print(f"\n🎯 Alternative: Use your existing favicon.ico")
    print(f"- Convert favicon.ico to PNG using online tools")
    print(f"- Resize to all required sizes")
    print(f"- Replace the generated SVG files")

if __name__ == "__main__":
    main()

