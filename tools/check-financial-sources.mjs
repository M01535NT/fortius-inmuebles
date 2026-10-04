import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const manifest = JSON.parse(
  await readFile(new URL("./financial-sources.json", import.meta.url), "utf8"),
);
const report = {
  checkedAt: new Date().toISOString(),
  version: manifest.version,
  issues: [],
  sources: [],
};
if (new Date().getUTCFullYear() !== manifest.year)
  report.issues.push(
    "Snapshot fiscal vencido: revisar leyes y UMA del año actual.",
  );
async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}
const results = await Promise.allSettled(
  manifest.sources.map(async (source) => {
    const response = await get(source.url),
      bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw new Error(`${source.key}: no devolvió PDF`);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== source.sha256)
      report.issues.push(
        `${source.key}: el PDF cambió; requiere revisión de vigencia y contenido.`,
      );
    return { key: source.key, sha256, matches: sha256 === source.sha256 };
  }),
);
results.forEach((r, i) => {
  if (r.status === "fulfilled") report.sources.push(r.value);
  else
    report.issues.push(
      `${manifest.sources[i].key}: no verificable (${r.reason.message}); reintentar y verificar manualmente.`,
    );
});
try {
  const html = await (await get(manifest.catalog)).text();
  for (const source of manifest.sources.filter((s) => s.catalogStem)) {
    const filenames = [
      ...html.matchAll(/(?:href\s*=\s*["'])[^"']*\/([^/"']+\.PDF)(?:["'])/gi),
    ]
      .map((m) => m[1])
      .filter((f) => f.includes(source.catalogStem));
    const expected = source.url.split("/").at(-1);
    if (!filenames.includes(expected))
      report.issues.push(
        `${source.key}: la versión verificada ya no aparece en el catálogo vigente.`,
      );
    if (filenames.some((f) => f.slice(0, 8) > expected.slice(0, 8)))
      report.issues.push(
        `${source.key}: el catálogo tiene una versión más reciente.`,
      );
  }
} catch (e) {
  report.issues.push(`Catálogo no verificable: ${e.message}`);
}
await writeFile(
  "financial-source-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (report.issues.length) process.exitCode = 1;
