const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple SVG-based icon generator
function createSVGIcon(size) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .circle { fill: #3333cc; stroke: #000000; stroke-width: ${Math.max(1, size/64)}; }
      .text { fill: #ffffff; font-family: Arial, sans-serif; font-size: ${size/3}px; font-weight: bold; text-anchor: middle; dominant-baseline: central; }
    </style>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - size/8}" class="circle"/>
  <text x="${size/2}" y="${size/2}" class="text">ME</text>
</svg>`;
}

// Required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Generating PWA icons for Margav Energy...\n');

sizes.forEach(size => {
    const svgContent = createSVGIcon(size);
    const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
    
    fs.writeFileSync(filename, svgContent);
    console.log(`✅ Created icon-${size}x${size}.svg`);
});

console.log('\n📱 PWA icons generated successfully!');
console.log('\n📋 Next steps:');
console.log('1. Open each SVG file in a browser or image editor');
console.log('2. Export as PNG format');
console.log('3. Replace the .svg files with .png files');
console.log('4. Your PWA will now have proper icons!');
console.log('\n🎯 Alternative: Use an online SVG to PNG converter:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');

