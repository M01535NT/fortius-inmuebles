import { describe, expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { camposParrafoPromesa, mostrarCampoPromesa, PROMESA_TABLES, promesaParagraphs, validarPromesa } from "@/lib/formatos/promesa";
import { PROMESA_ORIGINAL } from "@/lib/formatos/promesa-text";
import { promesaSample } from "./fixtures/promesa";

/* M-05 (titular, 14/11/2026): la promesa 15 no se emite si se pagaría en efectivo 8,025 UMA o más. */
const LIMITE = "La ley prohíbe recibir en efectivo";
const pago = (importe: number, medio: string) => ({ importe, fecha: "2026-12-01", medio, beneficiario: "Ana Ejemplo", cuenta: "Cuenta de muestra" });
const conPagos = (...pagos: ReturnType<typeof pago>[]) => ({ ...promesaSample, pagosPrecio: pagos });
const bloqueo = (data: Record<string, unknown>) => validarPromesa(data, false).filter(e => e.startsWith(LIMITE) || e.includes("tipo de cambio"));

describe("promesa 15: pago en efectivo (LFPIORPI art. 32)", () => {
  it("el medio de pago se elige de una lista", () => {
    const medio = PROMESA_TABLES.pagosPrecio.columns.find(c => c.key === "medio")!;
    expect("options" in medio && medio.options.map(o => o.value)).toEqual(["transferencia", "cheque", "credito", "efectivo", "otro"]);
    expect(validarPromesa(conPagos(pago(1000000, "por definir")), false)).toContain("pago del precio: fila incompleta o inválida");
    // Un borrador anterior a la lista con «Transferencia» o «Efectivo» escrito a mano sigue valiendo.
    expect(validarPromesa(conPagos(pago(1000000, "Transferencia")), false)).not.toContain("pago del precio: fila incompleta o inválida");
    expect(promesaParagraphs(conPagos(pago(1000000, "Transferencia electrónica"))).join("\n")).toContain("por transferencia electrónica, a Ana Ejemplo");
  });

  it("imprime el medio elegido con su nombre", () => {
    expect(promesaParagraphs(conPagos(pago(1000000, "transferencia"))).join("\n")).toContain("por transferencia electrónica, a Ana Ejemplo");
  });

  it("impide emitir con 8,025 UMA o más en efectivo, aunque se reparta en varios pagos", () => {
    expect(bloqueo(conPagos(pago(1000000, "transferencia")))).toEqual([]);
    expect(bloqueo(conPagos(pago(900000, "efectivo"), pago(100000, "transferencia")))).toEqual([]);
    expect(bloqueo(conPagos(pago(500000, "efectivo"), pago(500000, "efectivo")))[0]).toMatch(/^La ley prohíbe recibir en efectivo \$941,412\.75 o más/);
    expect(validateFormato("15", conPagos(pago(1000000, "efectivo"))).some(e => e.startsWith(LIMITE))).toBe(true);
  });

  it("en dólares con un pago en efectivo pide el tipo de cambio del día del pago", () => {
    const usd = { ...conPagos(pago(60000, "efectivo")), moneda: "USD", precio: 60000, recursosPropios: 60000, credito: 0 };
    expect(mostrarCampoPromesa("tipoCambio", promesaSample)).toBe(false);
    expect(mostrarCampoPromesa("tipoCambio", usd)).toBe(true);
    // Lo pide su campo, una sola vez.
    expect(bloqueo(usd)).toEqual([]);
    expect(validarPromesa(usd, false)).toContain(formatoById("15").fields.find(f => f.key === "tipoCambio")!.label);
    expect(bloqueo({ ...usd, tipoCambio: 15 })).toEqual([]);
    expect(bloqueo({ ...usd, tipoCambio: 18 })[0]).toMatch(new RegExp(`^${LIMITE}`));
  });

  it("la garantía tiene medio de pago y cuenta como un pago más", () => {
    const garantia = { ...conPagos(pago(500000, "efectivo"), pago(500000, "transferencia")), garantia: 500000, fechaGarantia: "2026-11-01", receptorGarantia: promesaSample.vendedor, cuentaGarantia: "Cuenta de muestra", custodioTipo: "parte" };
    expect(mostrarCampoPromesa("medioGarantia", promesaSample)).toBe(false);
    expect(mostrarCampoPromesa("medioGarantia", garantia)).toBe(true);
    expect(validarPromesa(garantia, false)).toContain(formatoById("15").fields.find(f => f.key === "medioGarantia")!.label);
    expect(bloqueo({ ...garantia, medioGarantia: "transferencia" })).toEqual([]);
    // Con el calendario incompleto, la garantía en efectivo sí se suma al efectivo del precio.
    expect(bloqueo({ ...garantia, pagosPrecio: [pago(500000, "efectivo")], medioGarantia: "efectivo" })[0]).toMatch(new RegExp(`^${LIMITE}`));
  });

  it("si el calendario ya cubre el precio, la garantía que se abona al precio no se cuenta dos veces", () => {
    // Ejemplo de Metodología: garantía de $300,000 en efectivo ya incluida en el calendario; efectivo real $700,000.
    const abonada = { ...conPagos(pago(300000, "efectivo"), pago(400000, "efectivo"), pago(300000, "transferencia")), garantia: 300000, fechaGarantia: "2026-11-01", medioGarantia: "efectivo", receptorGarantia: promesaSample.vendedor, cuentaGarantia: "Cuenta de muestra", custodioTipo: "parte" };
    expect(mostrarCampoPromesa("garantiaAbonaPrecio", abonada)).toBe(true);
    expect(mostrarCampoPromesa("garantiaAbonaPrecio", { ...abonada, medioGarantia: "transferencia" })).toBe(false);
    expect(validarPromesa(abonada, false)).toContain(formatoById("15").fields.find(f => f.key === "garantiaAbonaPrecio")!.label);
    expect(bloqueo({ ...abonada, garantiaAbonaPrecio: "si" })).toEqual([]);
    expect(validarPromesa({ ...abonada, garantiaAbonaPrecio: "si" }, false).some(e => e.startsWith(LIMITE))).toBe(false);
  });

  it("si la garantía en efectivo se restituye en vez de aplicarse al precio, se suma al efectivo", () => {
    const restituida = { ...conPagos(pago(700000, "efectivo"), pago(300000, "transferencia")), garantia: 300000, fechaGarantia: "2026-11-01", medioGarantia: "efectivo", garantiaAbonaPrecio: "no", receptorGarantia: promesaSample.vendedor, cuentaGarantia: "Cuenta de muestra", custodioTipo: "parte" };
    expect(bloqueo(restituida)[0]).toMatch(new RegExp(`^${LIMITE}`));
    expect(bloqueo({ ...restituida, garantiaAbonaPrecio: "si" })).toEqual([]);
  });

  it("el medio de la garantía y el tipo de cambio se capturan desde sus cláusulas", () => {
    const garantiaKeys = camposParrafoPromesa(PROMESA_ORIGINAL.find(p => p.startsWith("La garantía pactada es"))!);
    const pagosKeys = camposParrafoPromesa(PROMESA_ORIGINAL.find(p => p.includes("[CALENDARIO, IMPORTES, MEDIO Y BENEFICIARIO DE PAGO]"))!);
    expect(garantiaKeys).toEqual(expect.arrayContaining(["medioGarantia", "garantiaAbonaPrecio"]));
    expect(pagosKeys).toContain("tipoCambio");
  });
});
