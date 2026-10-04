// Generate web derivatives from the approved transparent Mint leaf.
// Usage: node tools/generate-mint-brand.mjs [source.png]
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import fontkit from "@pdf-lib/fontkit";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(process.argv[2] || resolve(root, "public/brand/mint-leaf.png"));
const leaf = await sharp(source).resize(512, 512, {
  fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 },
}).png().toBuffer();
await writeFile(resolve(root, "public/brand/mint-leaf.png"), leaf);
await sharp(leaf).resize(64, 64).png().toFile(resolve(root, "src/app/icon.png"));

function outlines(font, text, size, x, y) {
  const run = font.layout(text);
  const scale = size / font.unitsPerEm;
  let offset = 0;
  return run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    const path = `<path d="${glyph.path.toSVG()}" transform="translate(${x + (offset + position.xOffset) * scale} ${y - position.yOffset * scale}) scale(${scale} ${-scale})"/>`;
    offset += position.xAdvance;
    return path;
  }).join("");
}
const bold = fontkit.create(await readFile(resolve(root, "public/fonts/Archivo-SemiBold.ttf")));
const regular = fontkit.create(await readFile(resolve(root, "public/fonts/Archivo-Regular.ttf")));
const lettering = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><g fill="#ffffff">
  ${outlines(bold, "Mint", 132, 460, 324)}
  ${outlines(regular, "Inmuebles", 36, 466, 384)}
</g></svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#101B16" } })
  .composite([
    { input: await sharp(leaf).resize(240, 240).png().toBuffer(), left: 184, top: 195 },
    { input: lettering, left: 0, top: 0 },
  ]).png().toFile(resolve(root, "src/app/opengraph-image.png"));
console.log("Generated Mint leaf, browser icon and sharing image.");
