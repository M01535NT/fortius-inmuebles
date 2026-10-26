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
assert(files.some(file => file.endsWith("public/brand/fortius-logo.png")), "PDF function must include the Fortius logo");
console.log("PDF deployment bundle includes native image libraries, gallery assets and brand fonts.");

const appManifest = ".next/server/app/api/admin/apps/runs/[id]/export/route.js.nft.json";
const appFiles = JSON.parse(readFileSync(appManifest, "utf8")).files;
for (const name of ["Archivo-Regular.ttf", "Archivo-SemiBold.ttf"]) {
  const matches = appFiles.filter(file => file.endsWith(`public/fonts/${name}`));
  assert(matches.length > 0, `Adviser app PDF must include ${name}`);
  for (const file of matches) assert(existsSync(resolve(dirname(appManifest), file)), `Missing app PDF font: ${file}`);
}
const appLibraries = appFiles.filter(file => /libvips-cpp.*\.(so|dll|dylib)/.test(file));
assert(appLibraries.length > 0, "Adviser app PDF must include native image support");
if (process.platform === "linux") assert(appLibraries.some(file => file.includes(".so")), "Adviser app PDF needs the Linux libvips library");
for (const file of appLibraries) assert(existsSync(resolve(dirname(appManifest), file)), `Missing app PDF image library: ${file}`);
assert(appFiles.some(file => file.endsWith("public/hero/casa-playa.webp")), "Adviser app PDF must include local gallery images");
console.log("Adviser app PDF bundle includes its fonts, gallery assets and native image libraries.");

for(const route of [
  'inventario/[slug]/ficha-tecnica', 'avisos/[documento]',
  'api/admin/apps/runs/[id]/export', 'api/admin/apps/runs/[id]/documento',
  'api/admin/formatos/[id]/emitir', 'api/admin/comercial/[id]/emitir',
]) {
  const trace=`.next/server/app/${route}/route.js.nft.json`;
  const tracedFiles=JSON.parse(readFileSync(trace,'utf8')).files;
  for(const name of ['membrete-encabezado.png','membrete-pie.png']) {
    const matches=tracedFiles.filter(file=>file.endsWith(`public/brand/${name}`));
    assert(matches.length>0,`${route} must bundle ${name}`);
    for(const file of matches) assert(existsSync(resolve(dirname(trace),file)),`Missing letterhead: ${file}`);
  }
}
console.log('All six PDF server routes include both approved letterhead graphics.');
