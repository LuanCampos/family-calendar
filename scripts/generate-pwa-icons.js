import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const svgPath = resolve(publicDir, 'favicon.svg');

if (!existsSync(svgPath)) {
  console.error('favicon.svg não encontrado em public/');
  process.exit(1);
}

const svgContent = readFileSync(svgPath, 'utf-8');

const COLORS = {
  darkPrimary: 'hsl(43, 74%, 49%)', // header primary on dark theme
  lightPrimary: 'hsl(221, 83%, 53%)', // header primary on light theme
  darkBg: '#181614',
  transparent: 'transparent',
};

const stripSvg = (content) => content.replace(/<\?xml[^?]*\?>|<svg[^>]*>|<\/svg>/gi, '');

async function generatePng({ size, fileName, stroke, background, cornerRadius = 0.15 }) {
  const iconSize = Math.round(size * 0.6);
  const padding = Math.round((size - iconSize) / 2);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      ${background !== 'transparent' ? `<rect width="${size}" height="${size}" fill="${background}" rx="${Math.round(size * cornerRadius)}"/>` : ''}
      <g transform="translate(${padding}, ${padding}) scale(${iconSize / 24})" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${stripSvg(svgContent)}
      </g>
    </svg>
  `;

  const outputPath = resolve(publicDir, fileName);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`  ✓ ${fileName}`);
}

async function generateIcons() {
  console.log('Gerando ícones PWA + favicons...');

  // Favicons that swap with theme (transparent background)
  await generatePng({ size: 64, fileName: 'favicon-dark.png', stroke: COLORS.darkPrimary, background: COLORS.transparent, cornerRadius: 0 });
  await generatePng({ size: 64, fileName: 'favicon-light.png', stroke: COLORS.lightPrimary, background: COLORS.transparent, cornerRadius: 0 });

  // PWA icons (dark background, primary stroke)
  await generatePng({ size: 192, fileName: 'pwa-192x192.png', stroke: COLORS.darkPrimary, background: COLORS.darkBg });
  await generatePng({ size: 512, fileName: 'pwa-512x512.png', stroke: COLORS.darkPrimary, background: COLORS.darkBg });

  // Apple touch icon
  await generatePng({ size: 180, fileName: 'apple-touch-icon.png', stroke: COLORS.darkPrimary, background: COLORS.darkBg });

  console.log('\nÍcones gerados com sucesso!');
  console.log('NOTA: Screenshots devem ser criados manualmente.');
}

generateIcons().catch(console.error);
