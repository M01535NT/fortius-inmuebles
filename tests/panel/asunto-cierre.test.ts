import { describe, expect, it } from "vitest";

import { emptyWorkflow } from "@/lib/formatos/operation-workflow";
import { armarCierre, cierrePropuesto, comisionDelContrato, conCierre, llevaCierre, type Expediente } from "@/lib/panel/datos/asuntos";

const exp = (extra: Partial<Expediente> = {}): Expediente => ({
  id: "a", cliente_id: "c1", asesor_id: "as-1", propiedad_slug: "casa", folio: "F-a", operacion: "venta", etapa: "negociacion",
  fecha_objetivo: null, flujo: emptyWorkflow("captacion"), checklist: null, version: 3, created_at: "2026-11-01", updated_at: "2026-11-01", ...extra,
});
const contrato09 = { formato_id: "09", version: 2, data: { precioAutorizado: 2_320_000, ivaVenta: 320_000, penaMaxima: 50_000, comisionPorcentaje: 5, ivaComisionTasa: 8 } };

describe("Cierre del asunto (COR-22) en el panel nuevo", () => {
  it("solo aplica del lado del propietario", () => {
    expect(llevaCierre(exp())).toBe(true);
    expect(llevaCierre(exp({ operacion: "renta", flujo: emptyWorkflow("arrendador") }))).toBe(true);
    expect(llevaCierre(exp({ flujo: emptyWorkflow("compra") }))).toBe(false);
  });

  it("la comisión sale del contrato de intermediación más reciente, sin IVA", () => {
    expect(comisionDelContrato([{ formato_id: "04", data: {} }, contrato09, { ...contrato09, version: 1 }], false))
      .toEqual({ comision: 100_000, fuente: "Contrato de intermediación · versión 2" });
    expect(comisionDelContrato([contrato09], true)).toBeNull();
    expect(comisionDelContrato([{ formato_id: "09", data: {} }], false)).toBeNull();
  });

  it("propone al asesor que captó y al que lo lleva, y guarda o quita el cierre", () => {
    const e = exp({ flujo: { ...emptyWorkflow("captacion"), captadoPor: "as-0" } });
    expect(cierrePropuesto(e)).toEqual({ capto: "as-0", vendio: "as-1" });
    const guardar = conCierre(e, armarCierre("as-0", "as-1", { comision: 100_000, fuente: "x" }));
    expect(guardar.flujo?.cierre).toEqual({ capto: "as-0", vendio: "as-1", comisionEstimada: 100_000, fuente: "x" });
    expect(guardar.version).toBe(3);
    const sinComision = armarCierre("as-0", "as-1", null);
    expect(sinComision).toEqual({ capto: "as-0", vendio: "as-1" });
    const quitar = conCierre(exp({ flujo: guardar.flujo }), undefined);
    expect(quitar.flujo && "cierre" in quitar.flujo).toBe(false);
  });
});
