import { afterEach, expect, test, vi } from "vitest";

import { unirConsulta } from "@/lib/panel/datos/consultas-persona";
import { armarRespuesta, asuntoDeCorreo, conFirmaDeCorreo, plantillaInicial, plantillasDe, type DatosRespuesta } from "@/lib/panel/datos/consultas-respuesta";

const base: DatosRespuesta = { nombre: "Ana Ruiz", aMano: false, pestana: "por_atender" };

test("PN-05 respuesta: por atender arranca con la primera respuesta, con nombre, inmueble y quien firma", () => {
  const d = { ...base, inmueble: "Casa en Playas", firmante: "Laura Gómez", operacion: "comprar" as const };
  expect(plantillaInicial(d)).toBe("primera");
  const t = armarRespuesta("primera", d);
  expect(t).toContain("Hola Ana");
  expect(t).toContain("soy Laura, de Fortius Inmuebles");
  expect(t).toContain("por Casa en Playas");
  expect(t).toContain("crédito");
});

test("PN-05 respuesta: el texto cambia con lo que busca", () => {
  expect(armarRespuesta("datos", { ...base, operacion: "vender" })).toContain("Dónde está tu inmueble");
  expect(armarRespuesta("datos", { ...base, operacion: "rentar" })).toContain("renta al mes");
  expect(armarRespuesta("datos", { ...base, operacion: "invertir" })).toContain("inversión");
  expect(armarRespuesta("datos", base)).toBe("Hola Ana, te escribo de Fortius Inmuebles. ¿Qué estás buscando: zona, tipo de inmueble y presupuesto? Con eso te preparo opciones.");
  expect(armarRespuesta("primera", { ...base, nombre: "Sin nombre" })).toMatch(/^Hola, te escribo de Fortius Inmuebles\./);
});

test("PN-05 respuesta: anotada a mano no lleva «gracias por escribir» y la visita solo sale con inmueble", () => {
  expect(plantillasDe({ aMano: true })).toEqual(["datos", "sin_respuesta"]);
  expect(plantillasDe({ aMano: false, inmueble: "Casa" })).toEqual(["primera", "visita", "datos", "sin_respuesta"]);
  expect(plantillaInicial({ aMano: true, inmueble: "Casa", pestana: "seguimiento" })).toBe("visita");
  expect(plantillaInicial({ aMano: false, pestana: "seguimiento" })).toBe("datos");
  expect(armarRespuesta("sin_respuesta", base)).not.toContain("Gracias");
});

test("PN-05 respuesta: por correo lleva firma y el asunto nombra el inmueble", () => {
  expect(conFirmaDeCorreo("Hola Ana.", "Laura Gómez")).toBe("Hola Ana.\n\nSaludos,\nLaura Gómez\nFortius Inmuebles");
  expect(conFirmaDeCorreo("Hola.")).toBe("Hola.\n\nSaludos,\nFortius Inmuebles");
  expect(asuntoDeCorreo("Casa en Playas")).toBe("Fortius Inmuebles · Casa en Playas");
});

afterEach(() => { vi.unstubAllGlobals(); });

test("PN-05 unir: si el servidor todavía no sabe unir, responde «pendiente» sin error", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>404</html>", { status: 404 })));
  await expect(unirConsulta("l1", "c1", 3)).resolves.toEqual({ estado: "pendiente" });
});

test("PN-05 unir: manda la versión que se leyó y avisa si la consulta cambió (409)", async () => {
  const llamada = vi.fn(async () => Response.json({ cliente: { id: "c1" } }));
  vi.stubGlobal("fetch", llamada);
  await expect(unirConsulta("l1", "c1", 3)).resolves.toEqual({ estado: "unida", clienteId: "c1" });
  const [url, init] = llamada.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("/api/admin/leads/l1/unir");
  expect(JSON.parse(String(init.body))).toEqual({ clienteId: "c1", version: 3 });
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "x" }, { status: 409 })));
  await expect(unirConsulta("l1", "c1", 3)).rejects.toMatchObject({ estado: 409 });
});
