import { describe, expect, it } from "vitest";

import type { Property } from "@/data/propiedades";
import { agregarFotos, altDeArchivo, describirFoto, editarTextos, estadoPublicacion, fotoPublica, mostrarFoto, ordenarFotos, publicar, quitarDelSitio, quitarFoto, textoDescripcion } from "@/lib/panel/datos/inmueble-sitio";

const base = {
  slug: "casa-ejemplo", codigo: "FORTIUS-000010", titulo: "Casa de ejemplo", estado: "disponible", operacion: "venta",
  precio: { modalidad: "publico", monto: 2790000, moneda: "MXN" }, galeria: [], descripcion: [], direccionAproximada: "Otay",
  publicadaEl: "", publicada: false, demo: true,
} as unknown as Property;
const pub = "https://x.supabase.co/storage/v1/object/public/fortius-inmuebles-public/u/a.jpg";

describe("fotos, textos y publicación (PN-03)", () => {
  it("distingue fotos públicas de privadas", () => {
    expect(fotoPublica(pub)).toBe(true);
    expect(fotoPublica("/api/admin/files?bucket=fortius-inmuebles-private&path=a")).toBe(false);
    expect(fotoPublica("https://x.supabase.co/storage/v1/object/sign/fortius-inmuebles-staging/a.jpg")).toBe(false);
  });
  it("agrega, ordena, describe y quita fotos", () => {
    const a = agregarFotos(base, [{ src: pub, alt: "fachada" }, { src: `${pub}2`, alt: "" }]);
    expect(a.galeria).toHaveLength(2);
    const b = ordenarFotos(a, [a.galeria[1], a.galeria[0]]);
    expect(b.galeria[0].src).toBe(`${pub}2`);
    expect(describirFoto(b, `${pub}2`, " cocina ").galeria[0].alt).toBe("cocina");
    expect(quitarFoto(b, pub).galeria).toHaveLength(1);
    expect(altDeArchivo("cocina_vista-1.JPG")).toBe("cocina vista 1");
  });
  it("guarda la descripción en párrafos sin tocar la ubicación vacía", () => {
    const t = editarTextos(base, { descripcion: "Uno  dos.\n\n\nTres.", direccionAproximada: " " });
    expect(t.descripcion).toEqual(["Uno dos.", "Tres."]);
    expect(t.direccionAproximada).toBe("Otay");
    expect(textoDescripcion(t)).toBe("Uno dos.\n\nTres.");
  });
  it("bloquea solo lo que exige el servidor y avisa lo demás", () => {
    expect(estadoPublicacion(base, false).bloqueos).toEqual(["Falta al menos una foto que se muestre en el sitio."]);
    const enEval = { ...base, estado: "evaluacion" } as Property;
    expect(estadoPublicacion(enEval, true).bloqueos).toHaveLength(2);
    const listo = agregarFotos(base, [{ src: pub, alt: "fachada" }]);
    const e = estadoPublicacion(listo, false);
    expect(e.bloqueos).toEqual([]);
    expect(e.avisos).toContain("Sin propietario ligado.");
  });
  it("publica con fecha y al quitar conserva la primera fecha", () => {
    const p = publicar(base, new Date("2026-11-16T10:00:00Z"));
    expect(p).toMatchObject({ publicada: true, publicadaEl: "2026-11-16" });
    expect(publicar(p, new Date("2026-12-01T10:00:00Z")).publicadaEl).toBe("2026-11-16");
    expect(quitarDelSitio(p)).toMatchObject({ publicada: false, publicadaEl: "2026-11-16" });
  });
});

describe("Fotos sin mostrar en el sitio (DEC-54)", () => {
  it("una foto oculta no cuenta para publicar y «Mostrar en el sitio» la vuelve visible", () => {
    const p = { ...base, galeria: [{ src: pub, alt: "Fachada", oculta: true as const }] } as Property;
    expect(estadoPublicacion(p, false).bloqueos).toEqual(["Falta al menos una foto que se muestre en el sitio."]);
    const visible = mostrarFoto(p, pub);
    expect(visible.galeria[0]).toEqual({ src: pub, alt: "Fachada" });
    expect(estadoPublicacion(visible, false).bloqueos).toEqual([]);
  });
});
