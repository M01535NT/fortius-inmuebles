import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { matchHas, prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";
import { describe, expect, test } from "vitest";
import config from "../../next.config";

/*
  El cambio (etapa D): el panel nuevo vive en /admin, el provisional en su reserva /admin-anterior
  y /panel lleva a /admin. Las redirecciones se resuelven con el mismo comparador que usa Next.
*/

type Redirect = Awaited<ReturnType<NonNullable<typeof config.redirects>>>[number];

const root = join(__dirname, "../..");
const posix = (path: string) => path.split(sep).join("/");
const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [posix(path)];
});
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pages = (carpeta: string) => walk(join(root, "src/app", carpeta)).filter(f => /\/page\.tsx?$/.test(f))
  .map(f => "/" + posix(relative(join(root, "src/app"), f)).replace(/\/?page\.tsx?$/, ""));
const patron = (route: string) => new RegExp(`^${route.split("/").map(seg => seg.startsWith("[") ? "[^/]+" : escape(seg)).join("/")}/?$`);
const nuevo = pages("admin");
const anterior = pages("admin-anterior");
const existe = (path: string) => [...nuevo, ...anterior].some(route => patron(route).test(path));

/** Un paso de redirección, como lo hace Next: la primera regla que coincide, con los parámetros y la consulta. */
function redirige(redirects: Redirect[], url: string): string | null {
  const parsed = new URL(url, "https://fortiusinmuebles.com");
  const query = Object.fromEntries(parsed.searchParams);
  const req = { headers: { host: "fortiusinmuebles.com" } } as unknown as Parameters<typeof matchHas>[0];
  for (const r of redirects) {
    const params = getPathMatch(r.source, { strict: true, removeUnnamedParams: true })(parsed.pathname);
    if (!params) continue;
    const extra = r.has || r.missing ? matchHas(req, query, r.has, r.missing) : {};
    if (!extra) continue;
    const { parsedDestination } = prepareDestination({ appendParamsToQuery: false, destination: r.destination, params: { ...params, ...extra }, query });
    const search = new URLSearchParams(parsedDestination.query as Record<string, string>).toString();
    return parsedDestination.pathname + (search ? `?${search}` : "");
  }
  return null;
}

/** Sigue las redirecciones hasta una página (máximo cinco saltos). */
function destinoFinal(redirects: Redirect[], url: string): string {
  let actual = url;
  for (let i = 0; i < 5; i++) {
    const siguiente = redirige(redirects, actual);
    if (!siguiente) return actual;
    actual = siguiente;
  }
  throw new Error(`Demasiadas redirecciones desde ${url}`);
}

describe("el cambio de /panel a /admin", () => {
  test("/panel y sus rutas llevan a /admin con la misma ruta y los mismos parámetros", async () => {
    const redirects = (await config.redirects?.()) ?? [];
    expect(redirige(redirects, "/panel")).toBe("/admin");
    expect(redirige(redirects, "/panel/asuntos?ver=abc")).toBe("/admin/asuntos?ver=abc");
    expect(redirige(redirects, "/panel/herramientas/compra")).toBe("/admin/herramientas/compra");
    expect(redirige(redirects, "/panel/formatos/d1?volver=%2Fpanel%2Fasuntos%3Fver%3De")).toBe("/admin/formatos/d1?volver=%2Fpanel%2Fasuntos%3Fver%3De");
    expect(redirige(redirects, "/panel/agenda?cita=c%201&nueva=1")).toBe("/admin/agenda?cita=c+1&nueva=1");
    // No atrapa direcciones que solo empiezan igual.
    expect(redirige(redirects, "/panelx")).toBeNull();
  });

  test("las redirecciones del cambio son temporales mientras exista la reserva", async () => {
    const redirects = (await config.redirects?.()) ?? [];
    const delCambio = redirects.filter(r => r.source.startsWith("/panel") || r.source.startsWith("/admin"));
    expect(delCambio.length).toBeGreaterThan(0);
    expect(delCambio.every(r => r.permanent === false)).toBe(true);
  });

  test("el panel nuevo abre en /admin sin redirecciones", async () => {
    const redirects = (await config.redirects?.()) ?? [];
    for (const route of nuevo.filter(r => !r.includes("["))) expect([route, redirige(redirects, route)]).toEqual([route, null]);
    expect(redirige(redirects, "/admin/asuntos?ver=abc")).toBeNull();
  });

  test("cada página del provisional abre en su reserva, también desde su dirección vieja", async () => {
    const redirects = (await config.redirects?.()) ?? [];
    for (const route of anterior) {
      const enReserva = route.replace(/\[[^\]]+\]/g, "x");
      // En la reserva abre la propia página (o la redirección que el provisional ya tenía, que lleva a una página).
      expect([enReserva, existe(destinoFinal(redirects, enReserva).split("?")[0])]).toEqual([enReserva, true]);
      // La dirección vieja, /admin/..., abre la misma pantalla en la reserva o la del panel nuevo si existe en los dos.
      const vieja = enReserva.replace(/^\/admin-anterior/, "/admin");
      const final = destinoFinal(redirects, vieja).split("?")[0];
      expect([vieja, final === destinoFinal(redirects, enReserva).split("?")[0] || nuevo.some(r => patron(r).test(final))]).toEqual([vieja, true]);
    }
  });

  test("las direcciones viejas del provisional que ya redirigían siguen llegando a su pantalla", async () => {
    const redirects = (await config.redirects?.()) ?? [];
    const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
    expect(destinoFinal(redirects, "/admin/expedientes")).toBe("/admin-anterior/operaciones");
    expect(destinoFinal(redirects, "/admin/leads")).toBe("/admin-anterior/contactos");
    expect(destinoFinal(redirects, "/admin/proceso/cierre")).toBe("/admin-anterior/operaciones?etapa=cierre-entrega");
    expect(destinoFinal(redirects, `/admin/operaciones?expediente=${id}`).split("?")[0]).toBe(`/admin-anterior/operaciones/${id}`);
    expect(destinoFinal(redirects, "/admin/operaciones/abc")).toBe("/admin-anterior/operaciones/abc");
    expect(destinoFinal(redirects, "/admin/propiedades/casa-1/editar")).toBe("/admin-anterior/propiedades/casa-1/editar");
  });
});
