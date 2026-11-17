import { afterEach, describe, expect, it, vi } from "vitest";

import { CARGOS_NETO, validarNeto } from "@/lib/formatos/neto";
import {
  emisionActual, esRanuraImagen, faltaParaFirmado, faltaParaSubir, fechaAlElegir, idsElegidos, opcionesDe, subirAdjunto, subirFirmado, type Adjunto,
} from "@/lib/panel/datos/formatos-adjuntos";
import { agregarFila, cambiarCelda, filaInfo, filasDe, llevaImagenes, puedeAgregar, quitarFila, tablaDe, textoAgregar } from "@/lib/panel/datos/formatos-tablas";

const adj = (id: string, kind: Adjunto["kind"], observed_on: string | null = null): Adjunto => ({ id, kind, caption: `Imagen ${id}`, source: "Asesor", observed_on, created_at: "2026-11-16T10:00:00Z" });

describe("PN-06 tablas del 19, 08 y 07", () => {
  it("19: partidas y pagos con las columnas de la plantilla; montos a número", () => {
    const partidas = tablaDe("19", "partidas")!;
    expect(partidas.max).toBe(50);
    expect(partidas.columnas.map((c) => c.key)).toEqual(["id", "area", "concepto", "tipoCosto", "unidad", "cantidad", "precioUnitario", "estado", "soporte"]);
    expect(partidas.columnas.find((c) => c.key === "precioUnitario")?.tipo).toBe("dinero");
    const filas = agregarFila(partidas, []);
    expect(cambiarCelda(partidas, filas, 0, partidas.columnas[6], "1,250.50")).toEqual([{ precioUnitario: 1250.5 }]);
    expect(tablaDe("19", "pagos")!.max).toBe(70);
    expect(textoAgregar(partidas, filas)).toBe("Agregar partida");
  });

  it("08: los nueve cargos fijos nacen «Pendiente», «No aplica» borra el importe y hay hasta dos «Otro cargo»", () => {
    const t = tablaDe("08", "erogaciones")!;
    let filas = filasDe(t, undefined);
    expect(filas).toHaveLength(CARGOS_NETO.length);
    expect(filas[0]).toEqual({ estado: "Pendiente", justificacion: "", concepto: "comision" });
    const importe = t.columnas.find((c) => c.key === "importe")!;
    const estado = t.columnas.find((c) => c.key === "estado")!;
    filas = cambiarCelda(t, filas, 0, importe, "50000");
    expect(filas[0].importe).toBe(50000);
    filas = cambiarCelda(t, filas, 0, estado, "No aplica");
    expect(filas[0]).not.toHaveProperty("importe");
    expect(quitarFila(t, filas, 0)).toHaveLength(CARGOS_NETO.length);

    expect(textoAgregar(t, filas)).toBe("Agregar otro cargo");
    filas = agregarFila(t, agregarFila(t, filas));
    expect(filas.slice(-2).map((f) => f.concepto)).toEqual(["otro1", "otro2"]);
    expect(puedeAgregar(t, filas)).toBe(false);
    expect(filaInfo(t, filas[CARGOS_NETO.length], CARGOS_NETO.length)).toMatchObject({ nombre: "Otro cargo", quitable: true });
    expect(filaInfo(t, filas[CARGOS_NETO.length], 0).columnas[0].key).toBe("descripcion");
    expect(quitarFila(t, filas, CARGOS_NETO.length).map((f) => f.concepto)).not.toContain("otro1");
    // Lo guardado vuelve a leerse igual (las opcionales se conservan) y la validación del servidor lo reconoce.
    expect(filasDe(t, filas)).toHaveLength(CARGOS_NETO.length + 2);
    expect(validarNeto({ erogaciones: filasDe(t, undefined) })).not.toContain("Erogaciones del propietario");
  });

  it("07: las fotografías se eligen entre las imágenes (columna de imagen)", () => {
    const t = tablaDe("07", "fotografias")!;
    expect(llevaImagenes(t)).toBe(true);
    expect(t.columnas.find((c) => c.key === "assetId")?.tipo).toBe("imagen");
  });
});

describe("PN-06 imágenes del documento", () => {
  it("toma la foto principal, el croquis y las fotos del 07, sin repetir", () => {
    expect(idsElegidos({ fotoPrincipalId: "a", croquisId: "b", fotografias: [{ assetId: "c" }, { assetId: "a" }, null, { pie: "x" }] })).toEqual(["a", "b", "c"]);
    expect(idsElegidos({})).toEqual([]);
  });

  it("cada espacio ofrece solo su tipo de imagen", () => {
    const xs = [adj("1", "foto", "2026-11-01"), adj("2", "croquis"), adj("3", "soporte")];
    expect(opcionesDe(xs, "foto")).toEqual([{ valor: "1", etiqueta: "Imagen 1 · 2026-11-01" }]);
    expect(opcionesDe(xs, "croquis").map((o) => o.valor)).toEqual(["2"]);
    expect(esRanuraImagen("croquisId")).toBe(true);
    expect(esRanuraImagen("fotografias")).toBe(false);
  });

  it("al elegir, anota la fecha de toma solo si el formato la imprime y está vacía", () => {
    const a = adj("1", "foto", "2026-11-02");
    const claves = new Set(["fotoFecha"]);
    expect(fechaAlElegir("fotoPrincipalId", a, {}, {}, claves)).toEqual({ fotoFecha: "2026-11-02" });
    expect(fechaAlElegir("fotoPrincipalId", a, {}, { fotoFecha: "2026-10-01" }, claves)).toEqual({});
    expect(fechaAlElegir("fotoPrincipalId", a, {}, {}, new Set())).toEqual({});
    expect(fechaAlElegir("croquisId", adj("2", "croquis"), {}, {}, new Set(["croquisFecha"]))).toEqual({});
  });

  it("pide lo que exige el servidor antes de subir", () => {
    const png = new File([new Uint8Array(10)], "fachada.png", { type: "image/png" });
    expect(faltaParaSubir({ descripcion: "", fuente: "", archivo: null })).toBe("Elige la imagen o toma la foto.");
    expect(faltaParaSubir({ descripcion: "Fachada", fuente: "", archivo: png })).toBe("Escribe quién la tomó o de dónde salió.");
    expect(faltaParaSubir({ descripcion: "Fachada", fuente: "Asesor", archivo: new File(["x"], "a.gif", { type: "image/gif" }) })).toBe("La imagen debe ser JPEG o PNG.");
    expect(faltaParaSubir({ descripcion: "Fachada", fuente: "Asesor", archivo: png })).toBeNull();
    expect(faltaParaFirmado(new File(["%PDF-"], "firmado.pdf", { type: "application/pdf" }))).toBeNull();
    expect(faltaParaFirmado(new File(["x"], "foto.jpg", { type: "image/jpeg" }))).toBe("Debe ser un PDF.");
  });
});

describe("PN-06 envíos multipart", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sube la imagen con tipo, descripción, fuente y fecha", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ adjunto: adj("n", "foto") }), { status: 201 }));
    vi.stubGlobal("fetch", fetch);
    const a = await subirAdjunto("doc-1", { tipo: "croquis", descripcion: " Plano ", fuente: "Catastro", fecha: "2026-11-01", archivo: new File(["x"], "p.png", { type: "image/png" }) });
    expect(a.id).toBe("n");
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/formatos/doc-1/adjuntos");
    const form = init.body as FormData;
    expect([form.get("tipo"), form.get("descripcion"), form.get("fuente"), form.get("fechaObservacion")]).toEqual(["croquis", "Plano", "Catastro", "2026-11-01"]);
  });

  it("la copia firmada va a su emisión y un error del servidor llega en lenguaje sencillo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "El archivo no es un PDF válido" }), { status: 400 })));
    await expect(subirFirmado("em-1", new File(["x"], "f.pdf", { type: "application/pdf" }))).rejects.toThrow("El archivo no es un PDF válido");
  });
});

describe("PN-06 copia firmada en Emitidos", () => {
  it("se sube al PDF de la versión actual; si no hay, al más reciente", () => {
    const e = (id: string, v: number, d: string) => ({ id, draft_version: v, created_at: d });
    const xs = [e("a", 2, "2026-11-01"), e("b", 3, "2026-11-02"), e("c", 3, "2026-11-03"), e("d", 4, "2026-11-04")];
    expect(emisionActual(xs, 3)?.id).toBe("c");
    expect(emisionActual(xs, 9)?.id).toBe("d");
    expect(emisionActual([], 1)).toBeNull();
  });
});
