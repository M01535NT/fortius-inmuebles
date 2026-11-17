import { describe, expect, it } from "vitest";

import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { datosLlaves, desligarPropietario, guardarLlaves, ligarPropietario, prestarLlaves, propietariosDe, regresaronLlaves } from "@/lib/panel/datos/inmueble-seguimiento";

const p = { slug: "casa-ejemplo", codigo: "FORTIUS-000010", titulo: "Casa de ejemplo" } as unknown as Property;
const c: Cliente = { id: "c1", nombre: "Persona de ejemplo", telefono: "6640000000", tipo: "comprador", notas: "", creadoEl: "2026-11-01", actualizadoEl: "2026-11-01" };

describe("propietario y llaves (PN-03)", () => {
  it("liga y quita al propietario desde la persona", () => {
    const ligada = ligarPropietario(c, "casa-ejemplo");
    expect(ligada).toMatchObject({ propiedadSlug: "casa-ejemplo", tipo: "propietario" });
    expect(propietariosDe([ligada, c], "casa-ejemplo").map((x) => x.id)).toEqual(["c1"]);
    expect(desligarPropietario(ligada)).not.toHaveProperty("propiedadSlug");
  });
  it("guarda dónde están las llaves, presta y registra el regreso", () => {
    const a = guardarLlaves(p, { lugar: "oficina", copias: 2, detalle: " llavero azul " });
    expect(datosLlaves(a)).toMatchObject({ lugar: "oficina", copias: 2, detalle: "llavero azul", prestadas: [] });
    const b = prestarLlaves(a, { persona: "Asesor de ejemplo", regresoPrevisto: "2026-11-17" }, "Dirección", new Date("2026-11-16T10:00:00Z"));
    const [prestamo] = datosLlaves(b).prestadas;
    expect(prestamo).toMatchObject({ persona: "Asesor de ejemplo", regresoPrevisto: "2026-11-17", registradoPor: "Dirección" });
    const r = regresaronLlaves(b, prestamo.id, "Dirección", new Date("2026-11-16T18:00:00Z"));
    expect(datosLlaves(r).prestadas).toEqual([]);
    expect(datosLlaves(guardarLlaves(r, { detalle: "" })).lugar).toBeUndefined();
  });
});
