import { afterEach, expect, test, vi } from "vitest";

import { HOME_TEXT_KEYS } from "@/data/home-copy";
import type { Post, SiteContent } from "@/lib/domain/records";
import { deshacerBorrado, leerEntradasEliminadas, quitarRepetidas, type EntradaEliminada } from "@/lib/panel/sitio/api";
import {
  bloques, borradorDe, cuantas, enlaceSeguro, enPortada, entradaAGuardar, filtrarEntradas, hayCambios, minutosDeLectura,
  slugDesdeTitulo, trozos, validarEntrada,
} from "@/lib/panel/sitio/blog";
import {
  aMedias, contenidoAGuardar, GRUPOS_INICIO, hayCambiosTextos, largoSeo, mover, nuevaPregunta, nuevoTestimonio, testimonioSale,
  textosDe, validarTextos,
} from "@/lib/panel/sitio/textos";

const post = (d: Partial<Post> = {}): Post => ({
  id: "p1", slug: "guia-para-comprar", titulo: "Guía para comprar", resumen: "Lo básico.", contenido: "Hola.", estado: "borrador",
  actualizadoEl: "2026-11-10T10:00:00.000Z", ...d,
});

afterEach(() => { vi.unstubAllGlobals(); });

// ── Blog ──────────────────────────────────────────────────────────────────────────────────────
test("blog: la dirección sugerida sale del título, sin acentos ni signos", () => {
  expect(slugDesdeTitulo("¿Cuánto vale mi casa en Tijuana?")).toBe("cuanto-vale-mi-casa-en-tijuana");
  expect(slugDesdeTitulo("Año 2026: niños y señales")).toBe("ano-2026-ninos-y-senales");
  expect(slugDesdeTitulo("   ")).toBe("");
});

test("blog: valida lo que el servidor rechazaría, incluida la dirección repetida", () => {
  const b = { ...borradorDe(null), slug: "guia-para-comprar", titulo: "T", resumen: "R", contenido: "C" };
  expect(validarEntrada(b, [post()], null).slug).toMatch(/Ya hay/);
  expect(validarEntrada(b, [post()], "p1")).toEqual({});
  expect(validarEntrada({ ...b, slug: "Con Espacios" }, [], null).slug).toMatch(/minúsculas/);
  expect(validarEntrada({ ...b, slug: "-mal-" }, [], null).slug).toBeTruthy();
  const vacio = validarEntrada(borradorDe(null), [], null);
  expect(Object.keys(vacio).sort()).toEqual(["contenido", "resumen", "slug", "titulo"]);
  expect(validarEntrada({ ...b, titulo: "x".repeat(161) }, [], null).titulo).toMatch(/160/);
  expect(validarEntrada({ ...b, fuenteUrl: "javascript:alert(1)" }, [], null).fuenteUrl).toBeTruthy();
  expect(validarEntrada({ ...b, fuenteUrl: "https://www.gob.mx/shf" }, [], null).fuenteUrl).toBeUndefined();
});

test("blog: guardar conserva la dirección y lo que el panel no edita; publicar es una decisión aparte", () => {
  const previa = post({ estado: "publicado", publicadoEl: "2026-10-01T00:00:00.000Z", categoria: "comprar" });
  const b = { ...borradorDe(previa), slug: "otra-cosa", titulo: "  Nuevo título ", categoria: "" as const, publicada: false };
  const g = entradaAGuardar(b, previa, "p1", "2026-11-19T00:00:00.000Z");
  expect(g.slug).toBe("guia-para-comprar");
  expect(g.titulo).toBe("Nuevo título");
  expect(g.estado).toBe("borrador");
  expect(g.publicadoEl).toBe("2026-10-01T00:00:00.000Z");
  expect(g).not.toHaveProperty("categoria");
  const nueva = entradaAGuardar({ ...borradorDe(null), slug: " mi-guia ", titulo: "T", resumen: "R", contenido: "C\n\n", publicada: true }, null, "n1");
  expect(nueva).toMatchObject({ id: "n1", slug: "mi-guia", estado: "publicado", contenido: "C", formato: "guia", destacado: false });
});

test("blog: sabe si hay cambios sin guardar", () => {
  const p = post();
  expect(hayCambios(borradorDe(p), p)).toBe(false);
  expect(hayCambios({ ...borradorDe(p), titulo: "Otro" }, p)).toBe(true);
  expect(hayCambios(borradorDe(null), null)).toBe(false);
});

test("blog: filtra por estado y texto, lo más reciente arriba", () => {
  const ps = [
    post({ id: "a", slug: "a", titulo: "Rentar un local", estado: "publicado", actualizadoEl: "2026-11-01T00:00:00Z" }),
    post({ id: "b", slug: "b", titulo: "Vender con hipoteca", actualizadoEl: "2026-11-05T00:00:00Z" }),
    post({ id: "c", slug: "c", titulo: "Trámites de sucesión", estado: "publicado", actualizadoEl: "2026-11-03T00:00:00Z" }),
  ];
  expect(filtrarEntradas(ps, "todas").map((p) => p.id)).toEqual(["b", "c", "a"]);
  expect(filtrarEntradas(ps, "publicadas").map((p) => p.id)).toEqual(["c", "a"]);
  expect(filtrarEntradas(ps, "borradores").map((p) => p.id)).toEqual(["b"]);
  expect(filtrarEntradas(ps, "todas", "tramites").map((p) => p.id)).toEqual(["c"]);
  expect(filtrarEntradas(ps, "eliminadas")).toEqual([]);
  expect(cuantas(ps)).toEqual({ publicadas: 2, borradores: 1 });
});

test("blog: en portada va la destacada publicada más reciente; sin destacadas, la última publicada", () => {
  const a = post({ id: "a", estado: "publicado", publicadoEl: "2026-11-01T00:00:00Z" });
  const b = post({ id: "b", estado: "publicado", publicadoEl: "2026-11-09T00:00:00Z" });
  const c = post({ id: "c", estado: "publicado", publicadoEl: "2026-10-01T00:00:00Z", destacado: true });
  const borrador = post({ id: "d", destacado: true, actualizadoEl: "2026-12-01T00:00:00Z" });
  expect(enPortada([a, b])?.id).toBe("b");
  expect(enPortada([a, b, c, borrador])?.id).toBe("c");
  expect(enPortada([borrador])).toBeNull();
});

test("blog: la vista previa lee el mismo formato que el sitio", () => {
  const r = bloques("Intro\nsigue\n\n## Título\n- uno\n- dos\n\n1. a\n2. b\n### Sub");
  expect(r).toEqual([
    { tipo: "p", texto: "Intro\nsigue" }, { tipo: "h2", texto: "Título" }, { tipo: "ul", items: ["uno", "dos"] },
    { tipo: "ol", items: ["a", "b"] }, { tipo: "h3", texto: "Sub" },
  ]);
  // Una línea en blanco corta la lista aunque siga otra del mismo tipo.
  expect(bloques("- a\n\n- b").filter((x) => x.tipo === "ul")).toHaveLength(2);
  expect(trozos("Ver [guía](/blog/x) y [malo](javascript:x) fin")).toEqual([
    { texto: "Ver " }, { texto: "guía", enlace: "/blog/x" }, { texto: " y " }, { texto: "[malo](javascript:x)" }, { texto: " fin" },
  ]);
  expect(enlaceSeguro("//otro.com")).toBe(false);
  expect(enlaceSeguro("https://sitio.com/a")).toBe(true);
  expect(minutosDeLectura("")).toBe(1);
  expect(minutosDeLectura("palabra ".repeat(450))).toBe(3);
});

test("blog: Eliminadas usa el historial y cuenta solo el borrado más reciente de cada entrada", async () => {
  const e = (id: string, record: string, fecha: string): EntradaEliminada => ({ id, record_id: record, titulo: "T", created_at: fecha, actor_id: null });
  expect(quitarRepetidas([e("1", "a", "2026-11-01"), e("2", "a", "2026-11-05"), e("3", "b", "2026-11-02")]).map((x) => x.id)).toEqual(["2", "3"]);

  const urls: string[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    urls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.startsWith("/api/admin/historial?")) return new Response(JSON.stringify({ entries: [e("h1", "p1", "2026-11-05")], hasMore: false }), { status: 200 });
    return new Response(JSON.stringify({ record: { id: "p1" } }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  expect((await leerEntradasEliminadas()).map((x) => x.id)).toEqual(["h1"]);
  expect(urls[0]).toBe("GET /api/admin/historial?deleted=1&collection=posts&offset=0");
  await deshacerBorrado("p1");
  expect(urls.at(-2)).toBe("GET /api/admin/historial?deleted=1&collection=posts&record=p1");
  expect(urls.at(-1)).toBe("POST /api/admin/historial");
  expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toEqual({ historyId: "h1" });
});

// ── Textos del sitio ─────────────────────────────────────────────────────────────────────────
const guardado = (d: Partial<SiteContent> = {}): SiteContent => ({
  heroTitulo: "Titular guardado", heroSubtitulo: "Sub", manifiestoTitulo: "Por qué", manifiestoTexto: "Porque sí",
  seoTitle: "Fortius", seoDescription: "Desc", ...d,
});

test("textos: los grupos del inicio cubren todos los textos, sin repetir", () => {
  const claves = GRUPOS_INICIO.flatMap((g) => g.claves);
  expect(claves.sort()).toEqual([...HOME_TEXT_KEYS].sort());
  expect(GRUPOS_INICIO.map((g) => g.titulo)).toContain("Método");
});

test("textos: guardar conserva lo que esta pantalla no toca y deja fuera lo que está a medias", () => {
  const t = textosDe(guardado());
  t.preguntas = [{ ...nuevaPregunta("q1"), pregunta: " ¿Cobran por adelantado? ", respuesta: " No. " }, { ...nuevaPregunta("q2"), pregunta: "Sin respuesta" }];
  t.testimonios = [{ ...nuevoTestimonio("t1"), texto: "Muy bien", nombre: "Ana (ejemplo)" }, { ...nuevoTestimonio("t2"), texto: "Sin nombre" }];
  expect(aMedias(t)).toBe(2);
  const g = contenidoAGuardar(t, guardado());
  expect(g.heroTitulo).toBe("Titular guardado");
  expect(g.preguntas).toEqual([{ id: "q1", grupo: "vender", pregunta: "¿Cobran por adelantado?", respuesta: "No." }]);
  expect(g.testimonios?.map((x) => x.id)).toEqual(["t1"]);
  expect(Object.keys(g.homeTexts ?? {}).sort()).toEqual([...HOME_TEXT_KEYS].sort());
});

test("textos: sin nada guardado se ven los textos con los que sale hoy el sitio", () => {
  const t = textosDe(null);
  expect(t.manifiestoTitulo.trim()).not.toBe("");
  expect(HOME_TEXT_KEYS.every((k) => typeof t.inicio[k] === "string")).toBe(true);
  expect(hayCambiosTextos(t, null)).toBe(false);
  expect(hayCambiosTextos({ ...t, seoTitle: "Otro" }, null)).toBe(true);
});

test("textos: obligatorios y largo para buscadores", () => {
  const t = textosDe(guardado());
  expect(validarTextos(t)).toEqual({});
  expect(Object.keys(validarTextos({ ...t, manifiestoTitulo: " ", seoTitle: "" })).sort()).toEqual(["manifiestoTitulo", "seoTitle"]);
  expect(validarTextos({ ...t, seoDescription: "x".repeat(501) }).seoDescription).toMatch(/500/);
  expect(largoSeo("x".repeat(40), 50, 60)).toBe("corto");
  expect(largoSeo("x".repeat(55), 50, 60)).toBe("bien");
  expect(largoSeo("x".repeat(70), 50, 60)).toBe("largo");
});

test("textos: un testimonio sale solo con autorización, texto y nombre", () => {
  const x = { ...nuevoTestimonio("t"), texto: "Bien", nombre: "Ana" };
  expect(testimonioSale(x)).toBe(false);
  expect(testimonioSale({ ...x, autorizado: true })).toBe(true);
  expect(testimonioSale({ ...x, autorizado: true, nombre: " " })).toBe(false);
});

test("textos: subir y bajar no se sale de la lista", () => {
  expect(mover(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
  expect(mover(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  expect(mover(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
});
