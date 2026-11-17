import { expect, test } from "vitest";

import type { Lead } from "@/lib/domain/records";
import { enlaceWhatsApp, filaConsulta, filtrarConsultas, ordenar, partirPorAntiguedad, pestanaDe, respuestaSugerida, tiempo, urgencia } from "@/lib/panel/datos/consultas";

const AHORA = Date.parse("2026-11-16T18:00:00Z");
const hace = (min: number) => new Date(AHORA - min * 60_000).toISOString();
const lead = (o: Partial<Lead>): Lead => ({ id: "l1", nombre: "Ana Ruiz", telefono: "664 123 4567", origen: "contacto", estado: "nuevo", creadoEl: hace(10), notas: [], ...o });
const titulo = (s: string) => (s === "casa-1" ? "Casa en Playas" : undefined);

test("PN-05 consultas: cada estado cae en su pestaña", () => {
  expect(pestanaDe({ estado: "nuevo" })).toBe("por_atender");
  expect(pestanaDe({ estado: "contactado" })).toBe("seguimiento");
  expect(pestanaDe({ estado: "activo" })).toBe("seguimiento");
  expect(pestanaDe({ estado: "descartado" })).toBe("cerradas");
});

test("PN-05 consultas: pasada una hora es ámbar y pasadas dos, rojo", () => {
  expect(urgencia(59 * 60_000)).toBe("normal");
  expect(urgencia(60 * 60_000)).toBe("aviso");
  expect(urgencia(120 * 60_000)).toBe("error");
  expect(tiempo(90 * 60_000)).toBe("1 hora");
  expect(tiempo(3 * 24 * 3600_000)).toBe("3 días");
});

test("PN-05 consultas: la que más espera va primero; si regresó, cuenta desde que volvió", () => {
  const filas = [
    filaConsulta(lead({ id: "a", creadoEl: hace(30) }), AHORA, titulo),
    filaConsulta(lead({ id: "b", creadoEl: hace(300) }), AHORA, titulo),
    filaConsulta(lead({ id: "c", creadoEl: hace(5000), reabiertoEl: hace(70) }), AHORA, titulo),
    filaConsulta(lead({ id: "d", estado: "contactado" }), AHORA, titulo),
  ];
  expect(ordenar(filas, "por_atender").map((f) => f.id)).toEqual(["b", "c", "a"]);
  expect(filas.find((f) => f.id === "c")?.urgencia).toBe("aviso");
  expect(filas.find((f) => f.id === "d")?.urgencia).toBe("normal");
});

test("PN-05 consultas: la respuesta lleva nombre e inmueble y WhatsApp toma el número de México", () => {
  const f = filaConsulta(lead({ propiedadSlug: "casa-1", canal: "whatsapp" }), AHORA, titulo);
  expect(f.canal).toBe("WhatsApp");
  expect(f.inmueble).toBe("Casa en Playas");
  const texto = respuestaSugerida(f);
  expect(texto).toContain("Hola Ana");
  expect(texto).toContain("por Casa en Playas");
  expect(enlaceWhatsApp("664 123 4567", "hola")).toBe("https://wa.me/526641234567?text=hola");
  expect(enlaceWhatsApp("123", "hola")).toBeNull();
  expect(filtrarConsultas([f], "playas")).toHaveLength(1);
  expect(filtrarConsultas([f], "zona rio")).toHaveLength(0);
});

test("PN-05 consultas: «En seguimiento» se ordena por la fecha para volver a contactar y avisa lo atrasado (AUD-03, C2)", () => {
  const ahora = Date.parse("2026-11-16T18:00:00");
  const l = (id: string, proximo?: string) => ({ id, estado: "contactado", creadoEl: "2026-11-01T10:00:00", nombre: id, telefono: "", perfil: proximo ? { proximoContacto: proximo } : undefined }) as unknown as Lead;
  const filas = [l("sin"), l("lejos", "2026-11-30"), l("tarde", "2026-11-12"), l("hoy", "2026-11-16")].map((x) => filaConsulta(x, ahora, () => undefined));
  expect(ordenar(filas, "seguimiento").map((f) => f.id)).toEqual(["tarde", "hoy", "lejos", "sin"]);
  const por = Object.fromEntries(filas.map((f) => [f.id, f]));
  expect(por.tarde).toMatchObject({ urgencia: "error", detalle: "Tocaba contactar el jueves 12 nov" });
  expect(por.hoy).toMatchObject({ urgencia: "aviso", detalle: "Contactar hoy" });
  expect(por.sin.detalle).toContain("sin fecha para volver a contactar");
});

test("PN-05 consultas: las cerradas dicen cómo terminaron (AUD-03, C3)", () => {
  const ahora = Date.now();
  const l = (o: Partial<Lead>) => ({ id: "x", creadoEl: "2026-11-01T10:00:00", nombre: "x", telefono: "", ...o }) as Lead;
  expect(filaConsulta(l({ estado: "descartado" }), ahora, () => undefined).detalle).toBe("No es cliente");
  expect(filaConsulta(l({ estado: "cerrado", clienteId: "c1" }), ahora, () => undefined).detalle).toBe("Ya es cliente");
  expect(filaConsulta(l({ estado: "cerrado" }), ahora, () => undefined).detalle).toBe("Sin operación");
});

test("PN-05 consultas: separa lo de las últimas 24 horas de lo que lleva días y no muestra canal sin dato", () => {
  const filas = [lead({ id: "a", creadoEl: hace(40) }), lead({ id: "b", creadoEl: hace(60 * 30) })].map((l) => filaConsulta(l, AHORA, titulo));
  const { recientes, viejas } = partirPorAntiguedad(filas);
  expect(recientes.map((f) => f.id)).toEqual(["a"]);
  expect(viejas.map((f) => f.id)).toEqual(["b"]);
  expect(filaConsulta(lead({ origen: undefined }), AHORA, titulo).canal).not.toBe("Sin canal");
});
