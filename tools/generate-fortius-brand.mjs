// Fortius wordmark with a bull-shaped O inspired by the supplied reference.
// Usage: node tools/generate-fortius-brand.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import fontkit from '@pdf-lib/fontkit';
const root = resolve(import.meta.dirname, '..');
const navy = '#061F3F', burgundy = '#8A1634';
const symbol = [
  'M224 105C210 100 194 101 180 110C191 129 206 137 220 133L232 118Z',
  'M360 105C374 100 390 101 404 110C393 129 378 137 364 133L352 118Z',
  'M236 99C212 99 194 87 190 72C186 59 192 46 204 40C202 56 212 65 226 67C237 69 249 65 259 61L269 85C254 88 243 94 236 99Z',
  'M292 50C332 50 360 73 369 109C378 150 358 200 329 220C310 234 274 234 255 220C226 200 206 150 215 109C224 73 252 50 292 50ZM292 96C268 96 251 114 251 139C251 166 268 184 292 184C316 184 333 166 333 139C333 114 316 96 292 96Z',
  'M348 99C372 99 390 87 394 72C398 59 392 46 380 40C382 56 372 65 358 67C347 69 335 65 325 61L315 85C330 88 341 94 348 99Z',
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
await writeFile(resolve(root, 'src/components/brand/brand-paths.ts'), `// Shared Fortius vector geometry; bull-shaped O inspired by the supplied reference.\nexport const fortiusPaths = ${JSON.stringify(geometry, null, 2)} as const;\n`);
function svg(variant = 'full', inverse = false) {
  const ink = inverse ? '#FFFFFF' : navy, accent = inverse ? '#E5829B' : burgundy;
  const viewBox = variant === 'symbol' ? '176 36 232 200' : variant === 'compact' ? '-4 -4 1275 250' : '-4 -4 1275 324';
  const paths = symbol.map((d, i) => `<path fill="${i < symbol.length - 1 ? ink : accent}" d="${d}"/>`).join('') + (variant === 'symbol' ? '' : wordmark.map(d => `<path fill="${ink}" d="${d}"/>`).join('')) + (variant === 'full' ? descriptor.map(p => `<path fill="${ink}" d="${p.d}" transform="${p.transform}"/>`).join('') : '');
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
