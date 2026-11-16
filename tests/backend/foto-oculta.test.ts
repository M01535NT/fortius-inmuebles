import { describe, expect, it } from "vitest";
import { projectPublic } from "@/lib/backend/validation";
import { propiedades } from "../fixtures/propiedades";

// DEC-54: una foto que entra «oculta» (desde la Bandeja a un inmueble publicado) no sale en el sitio.
describe("foto oculta", () => {
  const publicado = { ...propiedades[0], publicada: true, estado: "disponible", publicadaEl: "2026-11-16" };
  it("el sitio no recibe la foto oculta y conserva las visibles", () => {
    const [visible] = publicado.galeria;
    const oculta = { src: visible.src.replace(/(\.\w+)$/, "-nueva$1"), alt: "Foto nueva", oculta: true };
    const [p] = projectPublic("propiedades", [{ ...publicado, galeria: [visible, oculta] }]);
    expect((p.galeria as { src: string }[]).map((g) => g.src)).toEqual([visible.src]);
  });
  it("si todas sus fotos están ocultas, el inmueble no sale en el sitio", () => {
    const todas = publicado.galeria.map((g) => ({ ...g, oculta: true }));
    expect(projectPublic("propiedades", [{ ...publicado, galeria: todas }])).toEqual([]);
  });
});
