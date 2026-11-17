import { describe, expect, it } from "vitest";

import { estadosPara, datosDeInmueble, editarInmueble, faltaParaInmueble, nuevoInmueble, slugDe, type DatosInmueble } from "@/lib/panel/datos/inmuebles-acciones";

const d: DatosInmueble = {
  titulo: "Casa en Playas (ejemplo)", tipo: "casa", operacion: "venta", precio: "3,500,000", moneda: "MXN", zona: "Playas de Tijuana", referencia: "Cerca del Malecón",
  terreno: "160", construccion: "210.5", recamaras: "3", banos: "2", estacionamientos: "", estado: "disponible",
};

describe("alta y edición de inmuebles (PN-03)", () => {
  it("pide nombre y zona", () => {
    expect(faltaParaInmueble({ titulo: "", zona: "" })?.campo).toBe("titulo");
    expect(faltaParaInmueble({ titulo: "Casa", zona: " " })?.campo).toBe("zona");
    expect(faltaParaInmueble({ titulo: "Casa", zona: "Otay" })).toBeNull();
  });
  it("nace privado, sin publicar, sin folio (lo pone la base) y a nombre de quien la da de alta", () => {
    const p = nuevoInmueble(d, "as-a");
    expect(p).toMatchObject({ codigo: "", publicadaEl: "", estado: "evaluacion", publicada: false, demo: false, asesorId: "as-a", creditoDisponible: true,
      precio: { modalidad: "publico", monto: 3500000, moneda: "MXN" }, ficha: { terrenoM2: 160, construccionM2: 210.5, recamaras: 3, banos: 2 } });
    expect(p.slug).toMatch(/^casa-en-playas-ejemplo-[0-9a-f]{6}$/);
    expect(p.ficha).not.toHaveProperty("estacionamientos");
  });
  it("sin precio queda «a consulta»; en renta es mensual y sin crédito", () => {
    expect(nuevoInmueble({ ...d, precio: "" }, null).precio).toEqual({ modalidad: "consulta" });
    const r = nuevoInmueble({ ...d, operacion: "renta", precio: "18000" }, null);
    expect(r.precio).toEqual({ modalidad: "publico", monto: 18000, moneda: "MXN", periodo: "mensual" });
    expect(r.creditoDisponible).toBe(false);
  });
  it("editar no toca la publicación, el folio ni la galería, y vuelve a leer lo mismo", () => {
    const p = { ...nuevoInmueble(d, "as-a"), codigo: "FORTIUS-000010", publicada: true, galeria: [{ src: "/x.jpg", alt: "x" }] } as ReturnType<typeof nuevoInmueble>;
    const e = editarInmueble(p, { ...datosDeInmueble(p), precio: "3,400,000", estado: "apartada", recamaras: "" });
    expect(e).toMatchObject({ codigo: "FORTIUS-000010", publicada: true, estado: "apartada", precio: { monto: 3400000 } });
    expect(e.galeria).toHaveLength(1);
    expect(e.ficha).not.toHaveProperty("recamaras");
    expect(datosDeInmueble(e).precio).toBe("3,400,000");
  });
  it("ofrece solo estados de la operación y no regresa a captación lo publicado", () => {
    expect(estadosPara("venta", false)).toEqual(["evaluacion", "disponible", "apartada", "vendida"]);
    expect(estadosPara("renta", true)).toEqual(["disponible", "apartada", "rentada"]);
    expect(editarInmueble(nuevoInmueble(d, null), { ...d, operacion: "renta", estado: "vendida" }).estado).toBe("evaluacion");
  });
  it("el slug no lleva acentos ni signos", () => {
    expect(slugDe("Departamento en Zona Río · 2", "abc123")).toBe("departamento-en-zona-rio-2-abc123");
    expect(slugDe("***", "abc123")).toBe("inmueble-abc123");
  });
});
