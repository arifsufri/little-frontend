/**
 * Icon Generation Script
 * 
 * This script helps generate the required PNG icons from your SVG logo.
 * You'll need to run this manually or use an online converter.
 * 
 * Required icons:
 * - icon-192.png (192x192px)
 * - icon-512.png (512x512px)
 * - icon-maskable-192.png (192x192px with safe zone)
 * - icon-maskable-512.png (512x512px with safe zone)
 * 
 * Steps:
 * 1. Use an online SVG to PNG converter like:
 *    - https://convertio.co/svg-png/
 *    - https://cloudconvert.com/svg-to-png
 *    - https://www.svgtopng.com/
 * 
 * 2. Convert your LITTLE-BARBERSHOP-LOGO.svg to:
 *    - 192x192px PNG (save as icon-192.png)
 *    - 512x512px PNG (save as icon-512.png)
 * 
 * 3. For maskable icons, add padding (safe zone) around the logo:
 *    - The logo should occupy only 80% of the icon space
 *    - 20% padding around all edges
 *    - Save as icon-maskable-192.png and icon-maskable-512.png
 * 
 * 4. Place all generated PNG files in: public/images/
 * 
 * Alternative: Use this Node.js script if you have sharp installed:
 * npm install sharp
 * node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
try {
  const sharp = require('sharp');
  
  const svgPath = path.join(__dirname, '../public/images/LITTLE-BARBERSHOP-LOGO.svg');
  const outputDir = path.join(__dirname, '../public/images/');
  
  if (!fs.existsSync(svgPath)) {
    console.log('SVG file not found at:', svgPath);
    process.exit(1);
  }
  
  const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 192, name: 'icon-maskable-192.png', maskable: true },
    { size: 512, name: 'icon-maskable-512.png', maskable: true }
  ];
  
  async function generateIcons() {
    for (const { size, name, maskable } of sizes) {
      try {
        let pipeline = sharp(svgPath).resize(size, size);
        
        if (maskable) {
          // Add padding for maskable icons (safe zone)
          const logoSize = Math.round(size * 0.8);
          const padding = Math.round((size - logoSize) / 2);
          
          pipeline = sharp(svgPath)
            .resize(logoSize, logoSize)
            .extend({
              top: padding,
              bottom: padding,
              left: padding,
              right: padding,
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            });
        }
        
        await pipeline.png().toFile(path.join(outputDir, name));
        console.log(`✅ Generated: ${name}`);
      } catch (error) {
        console.error(`❌ Error generating ${name}:`, error.message);
      }
    }
  }
  
  generateIcons().then(() => {
    console.log('\n🎉 Icon generation complete!');
    console.log('All icons have been saved to public/images/');
  });
  
} catch (error) {
  console.log('\n📋 Manual Icon Generation Instructions:');
  console.log('Since sharp is not installed, please generate icons manually:');
  console.log('\n1. Go to https://convertio.co/svg-png/');
  console.log('2. Upload your LITTLE-BARBERSHOP-LOGO.svg');
  console.log('3. Convert to PNG at these sizes:');
  console.log('   - 192x192px → save as icon-192.png');
  console.log('   - 512x512px → save as icon-512.png');
  console.log('\n4. For maskable icons, add 20% padding around the logo:');
  console.log('   - 192x192px with padding → save as icon-maskable-192.png');
  console.log('   - 512x512px with padding → save as icon-maskable-512.png');
  console.log('\n5. Place all PNG files in: public/images/');
  console.log('\nAlternatively, install sharp: npm install sharp');
  console.log('Then run: node scripts/generate-icons.js');
}
