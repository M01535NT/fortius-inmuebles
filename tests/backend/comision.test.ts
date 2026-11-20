import { describe, expect, it } from "vitest";

import type { Concepto } from "@/lib/backend/apartados-contrato";
import { comisionDelAsunto, llevaReparto } from "@/lib/backend/comision";

// La comisión al vuelo (SPEC.md, «Reparto de comisión») y cuándo se anota quién captó y quién vendió. Solo datos de ejemplo.
const significado = (r: string) => ({ se_logro: "logrado", no_se_dio: "no_logrado" } as Record<string, string>)[r] ?? null;
const casa = { id: "i-1", precio: 2_000_000, moneda: "MXN" as const };
const concepto = (extra: Partial<Concepto>): Concepto => ({
  id: "c", clase: "honorario", concepto: "Honorarios", monto: null, moneda: "MXN", porcentaje: null,
  base_inmueble_id: null, inmueble_id: null, tercero: null, version: 1, ...extra,
});
const base = {
  encargos: ["comercializar"], en_que_va: "cerrado", resultado: "se_logro", capto_id: "ana", vendio_id: "beto", inmuebles: [casa],
  presupuestos: [
    { numero: 2, estado: "aceptado" as const, conceptos: [concepto({ monto: 100_000 }), concepto({ monto: 5_000, moneda: "USD" }), concepto({ clase: "tercero", monto: 9_999 })] },
    { numero: 1, estado: "rechazado" as const, conceptos: [concepto({ monto: 1 })] },
  ],
};

describe("quién captó y quién vendió", () => {
  it("se anota si se comercializó y se logró", () => {
    expect(llevaReparto(["comercializar"], "se_logro", significado)).toBe(true);
    // Un resultado nuevo del catálogo sin significado cuenta como logrado, como en la pantalla.
    expect(llevaReparto(["comercializar"], "otro_nuevo", significado)).toBe(true);
  });
  it("no se anota si no se comercializó, no se logró o aún no hay resultado", () => {
    expect(llevaReparto(["revisar"], "se_logro", significado)).toBe(false);
    expect(llevaReparto(["comercializar"], "no_se_dio", significado)).toBe(false);
    expect(llevaReparto(["comercializar"], null, significado)).toBe(false);
  });
});

describe("la comisión al vuelo", () => {
  it("25 % para quien captó y 25 % para quien vendió, por moneda, del presupuesto aceptado", () => {
    expect(comisionDelAsunto(base, significado)).toEqual({
      cuenta: true, presupuesto_numero: 2, honorario: [{ moneda: "MXN", monto: 100_000 }, { moneda: "USD", monto: 5_000 }], por_calcular: 0,
      reparto: [
        { asesor_id: "ana", papel: "capto", porcentaje: 25, montos: [{ moneda: "MXN", monto: 25_000 }, { moneda: "USD", monto: 1_250 }] },
        { asesor_id: "beto", papel: "vendio", porcentaje: 25, montos: [{ moneda: "MXN", monto: 25_000 }, { moneda: "USD", monto: 1_250 }] },
      ],
    });
  });
  it("si es la misma persona, 50 % en una sola fila", () => {
    expect(comisionDelAsunto({ ...base, vendio_id: "ana" }, significado)?.reparto).toEqual([
      { asesor_id: "ana", papel: "ambos", porcentaje: 50, montos: [{ moneda: "MXN", monto: 50_000 }, { moneda: "USD", monto: 2_500 }] },
    ]);
  });
  it("solo quien se anotó; sin nadie anotado no hay comisión", () => {
    expect(comisionDelAsunto({ ...base, vendio_id: null }, significado)?.reparto.map((r) => r.papel)).toEqual(["capto"]);
    expect(comisionDelAsunto({ ...base, capto_id: null, vendio_id: null }, significado)).toBeNull();
  });
  it("un honorario en porcentaje se calcula sobre el precio de su inmueble; sin base queda por calcular", () => {
    const c = comisionDelAsunto({ ...base, presupuestos: [{ numero: 1, estado: "aceptado", conceptos: [
      concepto({ porcentaje: 5, base_inmueble_id: "i-1" }), concepto({ porcentaje: 5 }), concepto({ porcentaje: 5, base_inmueble_id: "otro" }),
    ] }] }, significado);
    expect(c).toMatchObject({ honorario: [{ moneda: "MXN", monto: 100_000 }], por_calcular: 2 });
  });
  it("sin presupuesto aceptado no hay montos; abierto o no logrado, aún no cuenta", () => {
    expect(comisionDelAsunto({ ...base, presupuestos: [{ numero: 1, estado: "enviado", conceptos: [concepto({ monto: 10 })] }] }, significado))
      .toMatchObject({ presupuesto_numero: null, honorario: [], reparto: [{ montos: [] }, { montos: [] }] });
    expect(comisionDelAsunto({ ...base, en_que_va: "en_marcha" }, significado)?.cuenta).toBe(false);
    expect(comisionDelAsunto({ ...base, resultado: "no_se_dio" }, significado)?.cuenta).toBe(false);
  });
});
