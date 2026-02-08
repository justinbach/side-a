const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '../frontend/public/logo.svg');
const outputDir = path.join(__dirname, '../frontend/public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`Generated ${name}`);
  }

  // Generate maskable icon with padding (safe zone is inner 80%)
  // We add background padding so the logo sits in the safe zone
  const maskableSize = 512;
  const logoSize = Math.floor(maskableSize * 0.7); // 70% of total
  const padding = Math.floor((maskableSize - logoSize) / 2);

  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 255, g: 249, b: 245, alpha: 1 } // cream background
    }
  })
    .composite([{
      input: await sharp(svgBuffer).resize(logoSize, logoSize).toBuffer(),
      top: padding,
      left: padding,
    }])
    .png()
    .toFile(path.join(outputDir, 'icon-maskable-512.png'));
  console.log('Generated icon-maskable-512.png');
}

generateIcons().catch(console.error);
