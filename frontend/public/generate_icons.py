#!/usr/bin/env python3
"""
Generate PWA icons from favicon.ico
This script creates placeholder PNG icons for the PWA manifest.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Margav Energy color scheme
PRIMARY_COLOR = (51, 51, 204)  # #3333cc
BLACK = (0, 0, 0)  # #000000
WHITE = (255, 255, 255)  # #ffffff
GREEN = (102, 204, 102)  # #66cc66

def create_icon(size, filename):
    """Create a simple icon with Margav Energy branding"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw background circle
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill=PRIMARY_COLOR, outline=BLACK, width=max(1, size//64))
    
    # Add text "ME" for Margav Energy
    try:
        # Try to use a font, fallback to default if not available
        font_size = size // 3
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Calculate text position
    text = "ME"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Draw text
    draw.text((x, y), text, fill=WHITE, font=font)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    """Generate all required PWA icons"""
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    # Required icon sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("Generating PWA icons from favicon...")
    
    for size in sizes:
        filename = f'icons/icon-{size}x{size}.png'
        create_icon(size, filename)
    
    print("\n✅ All PWA icons generated successfully!")
    print("Icons created:")
    for size in sizes:
        print(f"  - icons/icon-{size}x{size}.png")
    
    print("\n📱 Your PWA is now ready with proper icons!")
    print("You can replace these with converted versions of your favicon.ico later.")

if __name__ == "__main__":
    main()

