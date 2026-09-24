import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import assert from "node:assert/strict";

const manifest = ".next/server/app/inventario/[slug]/ficha-tecnica/route.js.nft.json";
const { files } = JSON.parse(readFileSync(manifest, "utf8"));
const library = files.filter(file => /libvips-cpp.*\.(so|dll|dylib)/.test(file));
assert(library.length > 0, "PDF function must include the native libvips shared library");
if (process.platform === "linux") assert(library.some(file => file.includes(".so")), "Linux PDF bundle must contain libvips .so");
for (const file of library) assert(existsSync(resolve(dirname(manifest), file)), `Missing native library: ${file}`);
assert(files.some(file => file.endsWith("public/hero/casa-playa.webp")), "PDF function must include local gallery images");
for (const name of ["Archivo-Regular.ttf", "Archivo-SemiBold.ttf", "IBMPlexMono-Medium.ttf"]) {
  assert(files.some(file => file.endsWith(`public/fonts/${name}`)), `PDF function must include ${name}`);
}
console.log("PDF deployment bundle includes native image libraries, gallery assets and brand fonts.");
