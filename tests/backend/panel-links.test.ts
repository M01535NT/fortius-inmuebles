import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { expect, test } from "vitest";
import config from "../../next.config";

/*
  Repaso final del panel guiado: cada dirección del panel escrita en el código
  lleva a una página que existe o a una redirección. Las partes variables
  (`${…}`) se aceptan donde la ruta tiene un segmento dinámico.
  Desde el cambio (etapa D) cubre los dos paneles: el nuevo en /admin y el
  provisional en su reserva, /admin-anterior.
*/

const root = join(__dirname, "../..");
// Rutas siempre con «/», también en Windows, para que los patrones de abajo valgan igual.
const posix = (path: string) => path.split(sep).join("/");
const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [posix(path)];
});
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pages = ["src/app/admin", "src/app/admin-anterior"].flatMap(carpeta => walk(join(root, carpeta))).filter(f => /\/page\.tsx?$/.test(f)).map(f => {
  const route = "/" + posix(relative(join(root, "src/app"), f)).replace(/\/?page\.tsx?$/, "");
  const pattern = route.split("/").map(seg => seg.startsWith("[...") ? ".+" : seg.startsWith("[") ? "[^/]+" : escape(seg)).join("/");
  return { route, regex: new RegExp(`^${pattern}/?$`) };
});

/** Un segmento de origen como expresión: `:x(a|b)` acepta solo esas opciones; `:x*` y `:x+`, varios segmentos. */
const segmento = (seg: string) => {
  const grupo = /^:\w+\((.+)\)$/.exec(seg);
  if (grupo) return `(?:${grupo[1]})`;
  if (seg.endsWith("*")) return ".*";
  if (seg.endsWith("+")) return ".+";
  return seg.startsWith(":") ? "[^/]+" : escape(seg);
};

async function redirectSources() {
  const redirects = (await config.redirects?.()) ?? [];
  return redirects.filter(r => r.source.startsWith("/admin")).map(r => new RegExp(`^${r.source.split("/").map(segmento).join("/")}/?$`));
}

function linksInCode() {
  const found = new Map<string, string[]>();
  for (const file of walk(join(root, "src")).filter(f => /\.(tsx?|mjs)$/.test(f))) {
    // Una parte variable (`${…}`) cuenta como un segmento cualquiera.
    const text = readFileSync(file, "utf8").replace(/\$\{[^{}]*\}/g, "x");
    for (const match of text.matchAll(/["'`](\/admin(?:-anterior)?(?:\/[^"'`\s?#]*)?)/g)) {
      const path = match[1].replace(/\/$/, "") || "/admin";
      found.set(path, [...(found.get(path) ?? []), posix(relative(root, file))]);
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
  // Las que mandan una sección entera del provisional a su reserva (`:seccion(a|b)`) las prueba página por página
  // tests/backend/cambio-admin.test.ts con el comparador de Next.
  const redirects = ((await config.redirects?.()) ?? []).filter(r => r.source.startsWith("/admin") && !r.source.includes("("));
  const targets = redirects.map(r => r.destination.split("?")[0].replace(/:[a-z]+/gi, "x"));
  expect(targets.filter(t => !pages.some(p => p.regex.test(t)))).toEqual([]);
});

test("el panel nuevo y el provisional no comparten dirección", () => {
  const nuevo = pages.filter(p => !p.route.startsWith("/admin-anterior"));
  expect(nuevo.length).toBeGreaterThan(0);
  expect(nuevo.every(p => p.route === "/admin" || p.route.startsWith("/admin/"))).toBe(true);
});
