import { describe, expect, it } from "vitest";
import { parseRecord, projectPublic, projectTeamProperty } from "@/lib/backend/validation";
import { publicationWarnings } from "@/lib/backend/publication-gate";
import { propiedades } from "../fixtures/propiedades";

// PUB-02 (RP-95, DEC-40): el sitio dice con quién colabora y nada más; publicar pide la autorización.
const aliado = { inmobiliaria: "Inmobiliaria Aliada de Ensayo", contacto: "Contacto de ensayo", porcentaje: 2.5,
  autorizacion: { path: "u/a.pdf", nombre: "autorizacion.pdf", fecha: "2026-11-12", firmante: "Gerente de ensayo" } };
const shared = { ...propiedades[0], origen: "compartido", aliado, publicada: true, estado: "disponible", publicadaEl: "2026-11-12" };
// Cliente mínimo: el inmueble aún no estaba publicado y no hay captación.
const client = { rpc: async () => ({ data: null, error: { code: "PGRST202" } }), from: () => { const chain = { select: () => chain, eq: () => chain, is: () => chain, maybeSingle: async () => ({ data: null, error: null }), then: (ok: (value: unknown) => void) => ok({ data: [], error: null }) }; return chain; } };

describe("inmueble compartido", () => {
  it("el sitio recibe solo la marca de colaboración, sin el nombre de la inmobiliaria", () => {
    const [projected] = projectPublic("propiedades", [{ ...shared, colaboracion: true }]);
    expect(projected).toMatchObject({ colaboracion: true });
    expect(JSON.stringify(projected)).not.toContain(aliado.inmobiliaria);
    expect(projected).not.toHaveProperty("aliado");
    expect(projected).not.toHaveProperty("origen");
    expect(JSON.stringify(projected)).not.toMatch(/Contacto de ensayo|Gerente de ensayo|autorizacion/);
  });

  it("el asesor de otro inmueble ve solo con qué inmobiliaria (COR-23)", () => {
    const seen = projectTeamProperty(shared);
    expect(seen).toMatchObject({ origen: "compartido", aliado: { inmobiliaria: aliado.inmobiliaria } });
    expect(JSON.stringify(seen)).not.toMatch(/Contacto de ensayo|Gerente de ensayo|autorizacion|porcentaje/);
  });

  it("valida los datos de la inmobiliaria al guardar", () => {
    expect(parseRecord("propiedades", shared.slug, shared)).toMatchObject({ origen: "compartido", aliado });
    expect(() => parseRecord("propiedades", shared.slug, { ...shared, origen: "prestado" })).toThrow();
    expect(() => parseRecord("propiedades", shared.slug, { ...shared, aliado: { ...aliado, porcentaje: 140 } })).toThrow();
    expect(() => parseRecord("propiedades", shared.slug, { ...shared, aliado: { ...aliado, telefonoPropietario: "664" } })).toThrow();
  });

  // Sin frenos (titular, 16/11/2026): lo que falta para publicar se avisa, no frena.
  it("con la autorización no avisa ni pide captación; sin ella, avisa qué falta", async () => {
    await expect(publicationWarnings(client as never, shared.slug, shared)).resolves.toEqual([]);
    await expect(publicationWarnings(client as never, shared.slug, { ...shared, aliado: { inmobiliaria: aliado.inmobiliaria } }))
      .resolves.toEqual(expect.arrayContaining([expect.stringContaining("Adjunta la autorización escrita")]));
    await expect(publicationWarnings(client as never, shared.slug, { ...shared, origen: undefined }))
      .resolves.toEqual(expect.arrayContaining([expect.stringContaining("captación")]));
  });
});
