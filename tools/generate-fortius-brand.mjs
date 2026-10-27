// Vector reconstruction of the user's architectural Fortius logo.
// Usage: node tools/generate-fortius-brand.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import fontkit from '@pdf-lib/fontkit';
const root = resolve(import.meta.dirname, '..');
const navy = '#061F3F', burgundy = '#8A1634';
const symbol = [
  'M178 65L282 0V50L224 87V203L178 177Z',
  'M233 97L282 66V242L233 213Z',
  'M294 0L398 65V177L352 203V87L294 50Z',
  'M294 66L343 97V213L294 242Z',
];
const wordmark = [
  'M0 32H164V64H46V104H146L122 136H46V228H0Z',
  'M424 32H525Q605 32 605 90Q605 144 533 148L615 228H546L424 120H522Q562 120 562 90Q562 64 522 64H424Z',
  'M623 32H791V65H729V228H685V65H623Z',
  'M818 32H862V228H818Z',
  'M886 32H930V145Q930 194 983 194Q1035 194 1035 145V32H1079V145Q1079 231 983 231Q886 231 886 145Z',
  'M1260 32L1227 65H1194Q1155 65 1155 89Q1155 108 1195 114L1214 117Q1267 126 1267 174Q1267 228 1195 228H1105L1139 194H1191Q1224 194 1224 174Q1224 156 1185 150L1166 147Q1111 137 1111 89Q1111 32 1194 32Z',
];
const font = fontkit.create(await readFile(resolve(root, 'public/fonts/Archivo-Regular.ttf')));
const run = font.layout('REAL ESTATE & INVESTMENTS');
const size = 37, scale = size / font.unitsPerEm, tracking = 24;
const textWidth = run.positions.reduce((n, p) => n + p.xAdvance * scale, 0) + tracking * (run.glyphs.length - 1);
let offset = (1267 - textWidth) / 2;
const descriptor = run.glyphs.map((glyph, i) => {
  const p = run.positions[i];
  const result = { d: glyph.path.toSVG(), transform: `translate(${offset + p.xOffset * scale} ${308 - p.yOffset * scale}) scale(${scale} ${-scale})` };
  offset += p.xAdvance * scale + tracking;
  return result;
});
const geometry = { symbol, wordmark, descriptor };
await writeFile(resolve(root, 'src/components/brand/brand-paths.ts'), `// Shared vector geometry, reconstructed from the Fortius reference image.\nexport const fortiusPaths = ${JSON.stringify(geometry, null, 2)} as const;\n`);
function svg(variant = 'full', inverse = false) {
  const ink = inverse ? '#FFFFFF' : navy, accent = burgundy;
  const viewBox = variant === 'symbol' ? '174 -4 228 250' : variant === 'compact' ? '-4 -4 1275 250' : '-4 -4 1275 324';
  const paths = symbol.map((d, i) => `<path fill="${i < 2 ? ink : accent}" d="${d}"/>`).join('') + (variant === 'symbol' ? '' : wordmark.map(d => `<path fill="${ink}" d="${d}"/>`).join('')) + (variant === 'full' ? descriptor.map(p => `<path fill="${ink}" d="${p.d}" transform="${p.transform}"/>`).join('') : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Fortius — Real Estate &amp; Investments">${paths}</svg>\n`;
}
for (const variant of ['full', 'compact', 'symbol']) {
  const name = variant === 'full' ? 'fortius-logo' : `fortius-${variant}`;
  for (const inverse of [false, true]) {
    await writeFile(resolve(root, `public/brand/${name}${inverse ? '-inverse' : ''}.svg`), svg(variant, inverse));
  }
}
await sharp(Buffer.from(svg())).resize({ width: 2550 }).png().toFile(resolve(root, 'public/brand/fortius-logo.png'));
await sharp(Buffer.from(svg('symbol'))).resize(128, 128, { fit: 'contain' }).png().toFile(resolve(root, 'src/app/icon.png'));
const shareLogo = await sharp(Buffer.from(svg('full', true))).resize({ width: 880 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: navy } }).composite([{ input: shareLogo, left: 160, top: 203 }]).png().toFile(resolve(root, 'src/app/opengraph-image.png'));
console.log('Generated Fortius vectors, report logo, browser icon and sharing image.');
