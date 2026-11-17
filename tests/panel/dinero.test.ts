import { describe, expect, it } from "vitest";

import type { Expediente, FilaAsunto } from "@/lib/panel/datos/asuntos";
import {
  cierresSinComision, cobradosCompletos, comisionDe, dinero, historial, ladoMenor, leerCobro, lineaCobro, pendientesDeCobro, porCobrar,
  sumaCobrada, sumaFalta, type BorradorFormato, type Cobro,
} from "@/lib/panel/datos/dinero";

const exp = (id: string, etapa: Expediente["etapa"], comision?: number, estado: "activa" | "descartada" = "activa") => ({
  id, etapa, folio: `F-${id}`,
  flujo: { version: 1, ruta: "captacion", estado, motivo: "", requisitos: {}, ...(comision !== undefined ? { cierre: { capto: "a", vendio: "b", comisionEstimada: comision, fuente: "Contrato 09" } } : {}) },
}) as unknown as Expediente;
const fila = (id: string, titulo: string) => ({ id, titulo, folio: `F-${id}` }) as FilaAsunto;
const recibo = (id: string, expediente: string, data: Record<string, unknown> | null, formato = "18"): BorradorFormato =>
  ({ id, expediente_id: expediente, formato_id: formato, data, version: 1, created_at: "", updated_at: "" });
const cobro = (id: string, expedienteId: string, importe: number, extra: Partial<Cobro> = {}): Cobro =>
  ({ id, expedienteId, numero: `F-${expedienteId}-R01`, fecha: "2026-11-10", importe, moneda: "MXN", medio: "Transferencia", concepto: "", parcial: false, emitido: true, ...extra });

describe("leerCobro", () => {
  it("lee el recibo 18 con importe, moneda, fecha y medio", () => {
    const c = leerCobro(recibo("r1", "e1", { importeRecibido: 5000, moneda: "USD", fechaPago: "2026-11-01", medioPago: " Cheque ", numeroRecibo: "F-1-R01", pagoParcialTotal: "parcial" }), true);
    expect(c).toMatchObject({ importe: 5000, moneda: "USD", fecha: "2026-11-01", medio: "Cheque", numero: "F-1-R01", parcial: true, emitido: true });
  });
  it("descarta otros formatos, sin datos o sin importe positivo", () => {
    expect(leerCobro(recibo("r", "e", { importeRecibido: 10 }, "17"), true)).toBeNull();
    expect(leerCobro(recibo("r", "e", null), true)).toBeNull();
    expect(leerCobro(recibo("r", "e", { importeRecibido: "por confirmar" }), true)).toBeNull();
    expect(leerCobro(recibo("r", "e", { importeRecibido: 0 }), true)).toBeNull();
  });
  it("una fecha mal escrita queda sin fecha y la moneda por omisión es pesos", () => {
    expect(leerCobro(recibo("r", "e", { importeRecibido: 1, fechaPago: "ayer" }), false)).toMatchObject({ fecha: null, moneda: "MXN", emitido: false });
  });
});

describe("porCobrar", () => {
  const expedientes = [exp("1", "cierre", 100000), exp("2", "entrega", 50000), exp("3", "negociacion")];
  const asuntos = [fila("1", "Venta casa Otay"), fila("2", "Renta depto")];
  it("resta solo recibos emitidos en pesos y dice lo que falta", () => {
    const cobros = [cobro("a", "1", 30000), cobro("b", "1", 20000, { emitido: false }), cobro("c", "1", 1000, { moneda: "USD" }), cobro("d", "2", 50000)];
    const filas = porCobrar(expedientes, asuntos, cobros);
    expect(filas).toHaveLength(2);
    const uno = filas.find((f) => f.asuntoId === "1")!;
    expect(uno).toMatchObject({ titulo: "Venta casa Otay", total: 100000, cobrado: 30000, falta: 70000, enDolares: 1, fuente: "Contrato 09" });
    expect(uno.recibos).toHaveLength(3);
    expect(pendientesDeCobro(filas).map((f) => f.asuntoId)).toEqual(["1"]);
    expect(cobradosCompletos(filas).map((f) => f.asuntoId)).toEqual(["2"]);
    expect(sumaFalta(pendientesDeCobro(filas))).toBe(70000);
  });
  it("nunca da un faltante negativo", () => {
    const filas = porCobrar([exp("1", "cierre", 1000)], [], [cobro("a", "1", 1500)]);
    expect(filas[0]).toMatchObject({ falta: 0, titulo: "Asunto", folio: "F-1" });
  });
  it("comisión cero o ausente no entra", () => {
    expect(comisionDe(exp("x", "cierre", 0))).toBeNull();
    expect(comisionDe(exp("x", "cierre"))).toBeNull();
  });
});

describe("cierresSinComision", () => {
  it("cuenta asuntos al cierre sin comisión anotada, sin los descartados", () => {
    expect(cierresSinComision([exp("1", "cierre"), exp("2", "cerrado", 10), exp("3", "negociacion"), exp("4", "entrega", undefined, "descartada"), exp("5", "postventa")])).toBe(2);
  });
});

describe("historial y textos", () => {
  it("lo más reciente primero y lo sin fecha al final", () => {
    const h = historial([cobro("a", "1", 1, { fecha: "2026-10-01" }), cobro("b", "1", 1, { fecha: null }), cobro("c", "1", 1, { fecha: "2026-11-01" })]);
    expect(h.map((c) => c.id)).toEqual(["c", "a", "b"]);
  });
  it("suma solo lo emitido de la moneda pedida", () => {
    const cs = [cobro("a", "1", 100.5), cobro("b", "1", 50, { emitido: false }), cobro("c", "1", 10, { moneda: "USD" })];
    expect(sumaCobrada(cs)).toBe(100.5);
    expect(sumaCobrada(cs, "USD")).toBe(10);
  });
  it("formatos de dinero y líneas", () => {
    expect(dinero(70000)).toMatch(/^\$70,000$/);
    expect(dinero(10, "USD")).toMatch(/USD$/);
    expect(lineaCobro(cobro("a", "1", 1, { parcial: true, emitido: false }))).toBe("Recibo F-1-R01 · parcial · Transferencia · sin entregar: todavía no cuenta como cobrado");
    expect(ladoMenor({ cobrado: 0, total: 10 })).toBeUndefined();
    expect(ladoMenor({ cobrado: 5, total: 10 })).toMatch(/^de \$10$/);
  });
});

describe("Reglas del titular para contar lo cobrado (DEC-53)", () => {
  it("un recibo de pago total salda la cuenta y la diferencia es descuento", () => {
    const [f] = porCobrar([exp("1", "cierre", 100000)], [], [cobro("a", "1", 90000, { total: true })]);
    expect(f).toMatchObject({ cobrado: 90000, falta: 0, descuento: 10000 });
    const [p] = porCobrar([exp("1", "cierre", 100000)], [], [cobro("a", "1", 90000, { parcial: true })]);
    expect(p).toMatchObject({ falta: 10000, descuento: 0 });
  });
  it("los dólares van aparte y no descuentan de la comisión en pesos", () => {
    const [f] = porCobrar([exp("1", "cierre", 100000)], [], [cobro("a", "1", 2000, { moneda: "USD", total: true })]);
    expect(f).toMatchObject({ cobrado: 0, falta: 100000, descuento: 0, cobradoDolares: 2000, enDolares: 1 });
  });
  it("si el recibo cambió después de su PDF, cuenta lo del último PDF", () => {
    const b = recibo("r1", "e1", { importeRecibido: 999, pagoParcialTotal: "parcial" });
    const c = leerCobro(b, false, { version: 1, importe: 5000, moneda: "MXN", total: true })!;
    expect(c).toMatchObject({ importe: 5000, total: true, emitido: true, cambiosSinPdf: true });
    expect(lineaCobro(c)).toContain("con cambios sin PDF");
    expect(leerCobro(b, false, null)).toMatchObject({ importe: 999, emitido: false });
    expect(leerCobro(recibo("r2", "e1", null), false, { version: 2, importe: 300, moneda: "USD", total: false })).toMatchObject({ importe: 300, moneda: "USD", emitido: true });
  });
});
