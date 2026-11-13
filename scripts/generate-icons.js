import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Crisp modern weather icon: stylized sun & cloud over sky gradient
function getSvg(size, maskable = false) {
  const pad = maskable ? size * 0.15 : 0;
  const innerSize = size - pad * 2;
  const scale = innerSize / 512;

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </linearGradient>
      <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fde047"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
      <linearGradient id="cloud" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25"/>
      </filter>
    </defs>

    ${maskable ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>` : `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>`}

    <g transform="translate(${pad}, ${pad}) scale(${scale})">
      <!-- Sun -->
      <circle cx="340" cy="180" r="75" fill="url(#sun)" filter="url(#shadow)" />
      
      <!-- Sun rays -->
      <g stroke="#f59e0b" stroke-width="10" stroke-linecap="round" opacity="0.8">
        <line x1="340" y1="70" x2="340" y2="90" />
        <line x1="340" y1="270" x2="340" y2="290" />
        <line x1="230" y1="180" x2="250" y2="180" />
        <line x1="430" y1="180" x2="450" y2="180" />
        <line x1="262" y1="102" x2="276" y2="116" />
        <line x1="404" y1="244" x2="418" y2="258" />
        <line x1="262" y1="258" x2="276" y2="244" />
        <line x1="404" y1="116" x2="418" y2="102" />
      </g>

      <!-- Front Cloud -->
      <path d="M 180 370
               A 60 60 0 0 1 180 250
               A 85 85 0 0 1 330 220
               A 75 75 0 0 1 400 300
               A 55 55 0 0 1 390 370
               Z"
            fill="url(#cloud)" filter="url(#shadow)"/>
    </g>
  </svg>
  `;
}

async function run() {
  const sizes = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'maskable-512.png', size: 512, maskable: true },
    { name: 'apple-touch-180.png', size: 180, maskable: false },
  ];

  for (const s of sizes) {
    const svg = Buffer.from(getSvg(s.size, s.maskable));
    await sharp(svg).png().toFile(path.join(outDir, s.name));
    console.log(`Generated ${s.name}`);
  }

  // Also save favicon.svg
  fs.writeFileSync(path.join(outDir, 'favicon.svg'), getSvg(64, false));
  console.log('Generated favicon.svg');
}

run().catch(console.error);
