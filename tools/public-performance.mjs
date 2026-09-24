import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { resolve, sep } from "node:path";

const target = new URL(process.argv[2] || "http://127.0.0.1:3100");
if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw new Error("Usa una URL pública o local sin credenciales.");
const outputRoot = resolve("tmp/performance");
await mkdir(outputRoot, { recursive: true });
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const runs = [];
for (let index = 1; index <= 3; index++) {
  const profile = await mkdtemp(resolve(outputRoot, "browser-"));
  const chrome = await launch({ chromePath: process.platform === "win32" && existsSync(edge) ? edge : undefined, chromeFlags: ["--headless", "--no-sandbox"], userDataDir: profile, logLevel: "silent" });
  try {
    const result = await lighthouse(target.href, { port: chrome.port, output: "json", onlyCategories: ["performance"], logLevel: "error" });
    const report = result.lhr;
    if (report.runtimeError) throw new Error(report.runtimeError.message);
    await writeFile(resolve(outputRoot, "home-" + index + ".json"), JSON.stringify(report));
    runs.push({ lcp: report.audits['largest-contentful-paint'].numericValue, cls: report.audits['cumulative-layout-shift'].numericValue, tbt: report.audits['total-blocking-time'].numericValue });
  } finally {
    await chrome.kill();
    if (!resolve(profile).startsWith(outputRoot + sep)) throw new Error("Perfil temporal fuera de la carpeta de auditoría");
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => console.warn("El navegador mantiene bloqueado su perfil temporal en tmp/performance."));
  }
}
const median = (key) => runs.map((run) => run[key]).sort((a, b) => a - b)[1];
const summary = { url: target.href, profile: "Lighthouse mobile; three cold loads", lcp: median("lcp"), cls: median("cls"), tbt: median("tbt"), limits: { lcp: 2500, cls: 0.1, tbt: 200 } };
await writeFile(resolve(outputRoot, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (summary.lcp > summary.limits.lcp || summary.cls > summary.limits.cls || summary.tbt > summary.limits.tbt) process.exitCode = 1;
