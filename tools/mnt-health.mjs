#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { performance } from "node:perf_hooks";

const args = process.argv.slice(2);
const jsonIndex = args.indexOf("--json");
let reportPath;
if (jsonIndex >= 0) {
  const candidate = args[jsonIndex + 1];
  reportPath = candidate && !candidate.startsWith("--") ? candidate : ".superpowers/mnt-health.json";
  args.splice(jsonIndex, candidate && !candidate.startsWith("--") ? 2 : 1);
}
assert.ok(args.length <= 1, "Usage: npm run health -- [origin] [--json [path-under-.superpowers]]");
const origin = args[0] || process.env.MNT_TEST_URL;
assert.ok(origin, "MNT_TEST_URL or an origin argument is required");
const base = new URL(origin);
assert.equal(base.origin, origin, "Origin must not contain a path, query, credentials or trailing slash");
assert.ok(!base.username && !base.password, "Origin credentials are forbidden");
const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
assert.ok(base.protocol === "https:" || (base.protocol === "http:" && loopback), "Use HTTPS, except for an HTTP loopback origin");

const timings = [];
const statuses = new Map();
const htmlBodies = [];
async function request(url, expected = 200, follow = true) {
  let current = new URL(url, origin);
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    assert.equal(current.origin, origin, `External origin refused: ${current.origin}`);
    const started = performance.now();
    const response = await fetch(current, { redirect: "manual", headers: { "user-agent": "mnt-health/1.0" } });
    timings.push(performance.now() - started);
    statuses.set(response.status, (statuses.get(response.status) || 0) + 1);
    if (follow && [301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      assert.ok(location, `Redirect without Location at ${current.pathname}`);
      current = new URL(location, current);
      continue;
    }
    if (expected !== null) assert.equal(response.status, expected, `${current.pathname}: expected ${expected}, received ${response.status}`);
    const body = await response.text();
    if ((response.headers.get("content-type") || "").includes("text/html")) htmlBodies.push({ path: current.pathname, body });
    return { response, body, url: current };
  }
  throw new Error(`Too many redirects at ${current.pathname}`);
}

const health = await request("/api/health");
assert.equal(JSON.parse(health.body).status, "ok", "Health payload status is not ok");
const sitemap = await request("/sitemap.xml");
const locations = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].replaceAll("&amp;", "&"));
assert.ok(locations.length > 0, "Sitemap has no loc entries");
assert.ok(locations.length <= 500, "Sitemap exceeds the 500-route health-check limit");
assert.equal(new Set(locations).size, locations.length, "Sitemap contains duplicate loc entries");
for (const location of locations) {
  const url = new URL(location);
  assert.equal(url.origin, origin, `Sitemap external origin refused: ${url.origin}`);
  assert.ok(url.protocol === "https:" || loopback, `Sitemap route is not HTTPS: ${url.pathname}`);
  await request(url);
}
for (const path of ["/admin", "/contacto", "/blog"]) await request(path);
const missingSuffix = Date.now();
await request(`/inventario/mnt-health-missing-${missingSuffix}`, 404);
await request(`/blog/mnt-health-missing-${missingSuffix}`, 404);
const legacyPdf = await request("/descargas/checklist-venta-cota.pdf", null, false);
assert.ok([301, 308].includes(legacyPdf.response.status), `Legacy PDF: expected 301/308, received ${legacyPdf.response.status}`);
const redirectTarget = new URL(legacyPdf.response.headers.get("location"), origin);
assert.equal(redirectTarget.origin, origin, "Legacy PDF redirects externally");
assert.equal(redirectTarget.pathname, "/descargas/checklist-venta-mnt.pdf");
await request(redirectTarget);

const legacyBrand = /(^|[^\p{L}\p{N}])cota([^\p{L}\p{N}]|$)/iu;
for (const page of htmlBodies) assert.ok(!legacyBrand.test(page.body), `Visible/meta legacy brand found in ${page.path}`);

const sorted = [...timings].sort((a, b) => a - b);
const percentile = (ratio) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
const report = {
  status: "ok",
  origin,
  sitemapRoutes: locations.length,
  requests: timings.length,
  responseStatuses: Object.fromEntries([...statuses].sort(([a], [b]) => a - b)),
  timingMs: { median: Number(percentile(0.5).toFixed(1)), p95: Number(percentile(0.95).toFixed(1)) },
  checkedAt: new Date().toISOString(),
};
if (reportPath) {
  const root = resolve(".superpowers");
  const target = resolve(reportPath);
  const inside = relative(root, target);
  assert.ok(!isAbsolute(inside) && inside !== ".." && !inside.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`), "JSON report must remain under .superpowers");
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify(report));
