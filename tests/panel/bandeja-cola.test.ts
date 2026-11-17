import { describe, expect, it } from "vitest";

import {
  anotadoEnLista, conVersion, desdeCola, destinoCola, enMemoria, hayPendientes, nuevoArchivo, perdido, subido, textoEstado, unirCola,
  vistaBandeja, type ArchivoBandeja, type FilaBandeja,
} from "@/lib/panel/datos/bandeja";

const fila = (id: string, extra: Partial<FilaBandeja> = {}): FilaBandeja => ({
  id, nombre: `${id}.pdf`, tipo: "application/pdf", bytes: 2048, estado: "por_confirmar", destino: null, version: 1,
  creadoEl: "2026-11-16T10:00:00.000Z", venceEl: "2026-11-23T10:00:00.000Z", ...extra,
});
const local = (id: string, ahora = 5): ArchivoBandeja => nuevoArchivo(id, { name: `${id}.pdf`, type: "application/pdf", size: 10 }, ahora);
const anotado = (id: string, colaId: string, version = 1): ArchivoBandeja => ({ ...subido(local(id), { ticket: "t", expira: 99 }), cola: { id: colaId, version } });

describe("desdeCola", () => {
  it("entra Por confirmar, sin bytes aquí ni permiso, con su fila y la fecha de creación", () => {
    const a = desdeCola(fila("c1", { version: 3 }));
    expect(a).toMatchObject({ id: "c1", nombre: "c1.pdf", estado: "por-confirmar", carga: null, enMemoria: false, cola: { id: "c1", version: 3 } });
    expect(a.agregadoEl).toBe(Date.parse("2026-11-16T10:00:00.000Z"));
    expect(textoEstado(a)).toMatch(/^Por confirmar/);
  });
  it("una fecha ilegible toma la hora de ahora", () => {
    expect(desdeCola(fila("c1", { creadoEl: "x" }), 42).agregadoEl).toBe(42);
  });
  it("un archivo nuevo de la página está en memoria y sin cola", () => {
    expect(local("a")).toMatchObject({ cola: null, enMemoria: true });
  });
});

describe("unirCola", () => {
  it("agrega lo del servidor que no está en la página y conserva lo local", () => {
    const l = [local("a")];
    const r = unirCola(l, [fila("c1"), fila("c2")]);
    expect(r.map((x) => x.id)).toEqual(["a", "c1", "c2"]);
    expect(r[0]).toBe(l[0]);
  });
  it("no duplica lo que ya está anotado desde esta página (por id de cola) ni lo ya recuperado", () => {
    const r = unirCola([anotado("a", "c1"), desdeCola(fila("c2"))], [fila("c1"), fila("c2"), fila("c3")]);
    expect(r.map((x) => x.id)).toEqual(["a", "c2", "c3"]);
  });
  it("toma la versión del servidor solo si es mayor", () => {
    const r = unirCola([anotado("a", "c1", 2), anotado("b", "c2", 5)], [fila("c1", { version: 4 }), fila("c2", { version: 3 })]);
    expect(r.map((x) => x.cola?.version)).toEqual([4, 5]);
  });
  it("del servidor solo entra lo que sigue por confirmar", () => {
    expect(unirCola([], [fila("c1", { estado: "guardado" }), fila("c2", { estado: "descartado" }), fila("c3")]).map((x) => x.id)).toEqual(["c3"]);
  });
  it("lo recuperado se ordena antes que lo recién subido", () => {
    const r = unirCola([local("a", Date.parse("2026-11-16T12:00:00.000Z"))], [fila("c1")]);
    expect(vistaBandeja(r, "pendientes").map((x) => x.id)).toEqual(["c1", "a"]);
  });
});

describe("anotadoEnLista", () => {
  it("guarda la fila en el archivo de la página", () => {
    const r = anotadoEnLista([local("a"), local("b")], "a", { id: "c1", version: 1 });
    expect(r.map((x) => x.cola)).toEqual([{ id: "c1", version: 1 }, null]);
  });
  it("quita la copia recuperada si la lectura de la cola llegó antes", () => {
    const r = anotadoEnLista([desdeCola(fila("c1")), local("a"), desdeCola(fila("c2"))], "a", { id: "c1", version: 1 });
    expect(r.map((x) => x.id)).toEqual(["a", "c2"]);
  });
  it("nunca quita un archivo con sus bytes en la página", () => {
    const otro = { ...local("b"), cola: { id: "c1", version: 1 } };
    expect(anotadoEnLista([otro, local("a")], "a", { id: "c1", version: 2 }).map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("cambios con la cola", () => {
  it("conVersion cambia solo la versión y no toca un archivo sin cola", () => {
    expect(conVersion(anotado("a", "c1", 1), 2).cola).toEqual({ id: "c1", version: 2 });
    const sin = local("a");
    expect(conVersion(sin, 2)).toBe(sin);
  });
  it("perdido deja el error y sin permiso; enMemoria marca los bytes aquí", () => {
    const p = perdido({ ...desdeCola(fila("c1")), carga: { ticket: "t", expira: 9 } }, "Ya no está");
    expect(p).toMatchObject({ estado: "error", carga: null, error: "Ya no está" });
    expect(textoEstado(p)).toBe("Ya no está");
    expect(enMemoria(desdeCola(fila("c1"))).enMemoria).toBe(true);
  });
  it("destinoCola: el asunto (también el de una persona) por su id; el inmueble por su slug", () => {
    expect(destinoCola({ clase: "asunto", expedienteId: "e1", archivoId: "x", titulo: "INE", texto: "", href: "", porPersona: "Ana" })).toEqual({ clase: "asunto", ref: "e1" });
    expect(destinoCola({ clase: "inmueble", slug: "casa-centro", src: "s", texto: "", href: "" })).toEqual({ clase: "inmueble", ref: "casa-centro" });
  });
});

describe("hayPendientes con la cola", () => {
  it("sin servidor, todo lo que espera destino se perdería", () => {
    expect(hayPendientes([anotado("a", "c1")])).toBe(true);
    expect(hayPendientes([anotado("a", "c1")], false)).toBe(true);
  });
  it("con servidor, solo lo que no alcanzó a anotarse", () => {
    expect(hayPendientes([anotado("a", "c1"), desdeCola(fila("c2"))], true)).toBe(false);
    expect(hayPendientes([anotado("a", "c1"), local("b")], true)).toBe(true);
  });
});
