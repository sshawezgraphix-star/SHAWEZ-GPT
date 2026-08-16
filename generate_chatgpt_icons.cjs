const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const chatGptPath = 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1239 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6672zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

function getSvg(size, isRound = false) {
  const r = isRound ? size / 2 : size * 0.22;
  const padding = size * 0.20;
  const iconSize = size - padding * 2;
  const scale = iconSize / 24;
  const offset = padding;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10a37f" />
      <stop offset="100%" stop-color="#0a7b5e" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#grad)" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})" fill="#ffffff">
    <path d="${chatGptPath}" />
  </g>
</svg>
  `.trim();
}

function getSplashSvg(width, height) {
  const iconSize = Math.min(width, height) * 0.35;
  const scale = iconSize / 24;
  const offsetX = (width - iconSize) / 2;
  const offsetY = (height - iconSize) / 2 - 20;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0f172a" />
  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})" fill="#10a37f">
    <path d="${chatGptPath}" />
  </g>
</svg>
  `.trim();
}

async function generateAll() {
  console.log('Generating ChatGPT-style brand assets...');

  // 1. Favicon SVG
  fs.writeFileSync('public/favicon.svg', getSvg(64));
  console.log('✓ Generated public/favicon.svg');

  // 2. Web App Icons
  await sharp(Buffer.from(getSvg(192))).png().toFile('public/icon-192.png');
  await sharp(Buffer.from(getSvg(512))).png().toFile('public/icon-512.png');
  console.log('✓ Generated PWA icons (192px, 512px)');

  // 3. Android Mipmap Icons
  const densities = [
    { name: 'mdpi', size: 48 },
    { name: 'hdpi', size: 72 },
    { name: 'xhdpi', size: 96 },
    { name: 'xxhdpi', size: 144 },
    { name: 'xxxhdpi', size: 192 }
  ];

  for (const d of densities) {
    const dir = 'android/app/src/main/res/mipmap-' + d.name;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(Buffer.from(getSvg(d.size, false))).png().toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(Buffer.from(getSvg(d.size, true))).png().toFile(path.join(dir, 'ic_launcher_round.png'));
    await sharp(Buffer.from(getSvg(d.size, false))).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
    console.log(`✓ Generated mipmap-${d.name} icons (${d.size}x${d.size})`);
  }

  // 4. Android Splash screens
  const splashDir = 'android/app/src/main/res/drawable';
  if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });
  await sharp(Buffer.from(getSplashSvg(1024, 1024))).png().toFile(path.join(splashDir, 'splash.png'));
  console.log('✓ Generated drawable/splash.png');

  // Land and Port splash screens
  const landDirs = [
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1080 },
  ];
  const portDirs = [
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1080, h: 1920 },
  ];

  for (const item of [...landDirs, ...portDirs]) {
    const targetDir = 'android/app/src/main/res/' + item.dir;
    if (fs.existsSync(targetDir)) {
      await sharp(Buffer.from(getSplashSvg(item.w, item.h))).png().toFile(path.join(targetDir, 'splash.png'));
    }
  }

  console.log('🎉 All ChatGPT-style Android launcher & splash icons generated successfully!');
}

generateAll().catch(console.error);
