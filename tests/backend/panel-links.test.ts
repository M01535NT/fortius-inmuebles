import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "vitest";
import config from "../../next.config";

/*
  Repaso final del panel guiado: cada dirección del panel escrita en el código
  lleva a una página que existe o a una redirección. Las partes variables
  (`${…}`) se aceptan donde la ruta tiene un segmento dinámico.
*/

const root = join(__dirname, "../..");
const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pages = walk(join(root, "src/app/admin")).filter(f => /\/page\.tsx?$/.test(f)).map(f => {
  const route = "/" + relative(join(root, "src/app"), f).replace(/\/?page\.tsx?$/, "");
  const pattern = route.split("/").map(seg => seg.startsWith("[...") ? ".+" : seg.startsWith("[") ? "[^/]+" : escape(seg)).join("/");
  return { route, regex: new RegExp(`^${pattern}/?$`) };
});

async function redirectSources() {
  const redirects = (await config.redirects?.()) ?? [];
  return redirects.filter(r => r.source.startsWith("/admin")).map(r => new RegExp(`^${r.source.split("/").map(seg => seg.endsWith("*") ? ".*" : seg.startsWith(":") ? "[^/]+" : escape(seg)).join("/")}/?$`));
}

function linksInCode() {
  const found = new Map<string, string[]>();
  for (const file of walk(join(root, "src")).filter(f => /\.(tsx?|mjs)$/.test(f))) {
    // Una parte variable (`${…}`) cuenta como un segmento cualquiera.
    const text = readFileSync(file, "utf8").replace(/\$\{[^{}]*\}/g, "x");
    for (const match of text.matchAll(/["'`](\/admin(?:\/[^"'`\s?#]*)?)/g)) {
      const path = match[1].replace(/\/$/, "") || "/admin";
      found.set(path, [...(found.get(path) ?? []), relative(root, file)]);
    }
  }
  return found;
}

test("cada dirección del panel en el código existe o redirige", async () => {
  const redirects = await redirectSources();
  const broken = [...linksInCode()].filter(([path]) => !pages.some(p => p.regex.test(path)) && !redirects.some(r => r.test(path)));
  expect(broken.map(([path, files]) => `${path} ← ${[...new Set(files)].join(", ")}`)).toEqual([]);
});

test("las redirecciones del panel llevan a páginas que existen", async () => {
  const redirects = ((await config.redirects?.()) ?? []).filter(r => r.source.startsWith("/admin"));
  const targets = redirects.map(r => r.destination.split("?")[0].replace(/:[a-z]+/gi, "x"));
  expect(targets.filter(t => !pages.some(p => p.regex.test(t)))).toEqual([]);
});
