import { describe, expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { inventarioRentaDocumento } from "@/lib/formatos/documento/inventario-renta";
import { mostrarCampoInventario, saldoDeposito } from "@/lib/formatos/inventario-renta";
import { requirementFormato } from "@/lib/formatos/operation-workflow";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import type { Block } from "@/lib/formatos/documento/modelo";

/* 23: inventario de entrega y devolución del arrendamiento (Anexo 2 del 20), aprobado por el titular el 13/11/2026. */
const texto = (blocks: Block[]) => blocks.map(b => "text" in b ? b.text : b.kind === "table" ? b.rows.map(r => r.join(" | ")).join("\n") : b.kind === "signatures" ? b.parties.map(p => `${p.role} ${p.name}`).join(" ") : "").join("\n");

export const INVENTARIO_ENTREGA = {
  folio: "EXP-2026-0070", fechaContrato: "2026-11-28", arrendador: "Persona Arrendadora de Ejemplo", arrendatario: "Persona Arrendataria de Ejemplo", inmueble: "Calle Muestra 10, Tijuana, B.C.",
  fechaEntrega: "2026-12-01", horaEntrega: "10:00", presentes: "Las partes y la asesora",
  espacios: [{ espacio: "Sala", elemento: "Piso de loseta", estado: "bueno", observaciones: "Sin daños" }, { espacio: "Cocina", elemento: "Tarja y mezcladora", estado: "regular", observaciones: "Mezcladora con sarro" }],
  bienesEstado: "registrados", bienes: [{ bien: "Refrigerador", cantidad: "1", descripcion: "Marca de ejemplo, blanco", estado: "bueno" }],
  medidorLuz: "M-1", lecturaLuz: "12345 kWh", luzCorriente: "si", medidorAgua: "A-1", lecturaAgua: "456 m³", aguaCorriente: "si", tieneGas: "no",
  accesos: [{ concepto: "Llave de la puerta principal", cantidad: "2" }, { concepto: "Control del portón", cantidad: "1" }],
  numeroFotos: 40, medioFotos: "la carpeta del expediente", diasObservaciones: 5, intervieneFortius: "si", asesor: "Persona Asesora de Ejemplo",
};

describe("inventario de la renta (23)", () => {
  it("está en el catálogo, listo para emitir, y con la entrega capturada no le falta nada", () => {
    expect(formatoById("23")).toMatchObject({ title: "Inventario de entrega y devolución del arrendamiento", readyForEmission: true });
    expect(validateFormato("23", INVENTARIO_ENTREGA)).toEqual([]);
  });

  it("la entrega imprime espacios, bienes, medidores, accesos y quién lo elaboró; sin gas no sale el gas", () => {
    const t = texto(inventarioRentaDocumento(INVENTARIO_ENTREGA).blocks);
    expect(t).toContain("Cocina | Tarja y mezcladora | Regular | Mezcladora con sarro");
    expect(t).toContain("Refrigerador | 1 | Marca de ejemplo, blanco | Bueno");
    expect(t).toContain("Luz | M-1 | 12345 kWh | Sí");
    expect(t).toContain("Control del portón | 1");
    expect(t).toContain("Tiene 5 días naturales para informar por escrito");
    expect(t).toContain("Elaboró el inventario: Persona Asesora de Ejemplo, de Fortius Inmuebles");
    expect(t).not.toMatch(/Gas \||Gas:/);
  });

  it("la devolución compara con la entrega y liquida el depósito con comprobantes", () => {
    const d = { ...INVENTARIO_ENTREGA, espacios: [{ ...INVENTARIO_ENTREGA.espacios[0], salida: "dano", danoSalida: "Loseta rota junto a la puerta" }, { ...INVENTARIO_ENTREGA.espacios[1], salida: "desgaste" }],
      fechaDevolucion: "2027-11-30", deposito: 15000, rentasPendientes: 0, serviciosPendientes: 800, comprobanteServicios: "Recibo de luz de noviembre", reparaciones: 2500, comprobanteReparaciones: "Presupuesto 12", diasDevolucion: 30, formaDevolucion: "transferencia" };
    expect(validateFormato("23", d)).toEqual([]);
    expect(saldoDeposito(d)).toBe(11700);
    const t = texto(inventarioRentaDocumento(d).blocks);
    expect(t).toContain("Sala: Piso de loseta | Bueno | Con daño | Loseta rota junto a la puerta");
    expect(t).toContain("Cocina: Tarja y mezcladora | Regular | Desgaste normal | —");
    expect(t).toContain("Servicios y cuotas pendientes | - $800.00 | Recibo de luz de noviembre");
    expect(t).toContain("Saldo a devolver al Arrendatario | $11,700.00");
    expect(t).not.toContain("adeuda");
  });

  it("la liquidación con descuentos también sale en PDF", async () => {
    const pdf = await createFormatoPdf("23", { ...INVENTARIO_ENTREGA, deposito: 15000, serviciosPendientes: 800, comprobanteServicios: "Recibo", reparaciones: 2500, comprobanteReparaciones: "Presupuesto" });
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("si los descuentos superan el depósito, dice cuánto adeuda el arrendatario y pide el plazo", () => {
    const d = { ...INVENTARIO_ENTREGA, deposito: 10000, rentasPendientes: 12000, comprobanteRentas: "Estado de cuenta" };
    expect(saldoDeposito(d)).toBe(-2000);
    expect(mostrarCampoInventario("plazoPagoDiferencia", d)).toBe(true);
    expect(texto(inventarioRentaDocumento({ ...d, plazoPagoDiferencia: "diez días" }).blocks)).toContain("El Arrendatario adeuda $2,000.00, que pagará en diez días.");
  });

  it("revisa tablas, daño sin describir, enteros y fechas en orden", () => {
    const errores = validateFormato("23", { ...INVENTARIO_ENTREGA, espacios: [{ espacio: "Sala", elemento: "Piso", estado: "bueno", observaciones: "x", salida: "dano" }], accesos: [], numeroFotos: 2.5, fechaEntrega: "2026-11-01" });
    expect(errores).toEqual(expect.arrayContaining(["Cada elemento con daño al devolver: describe el daño", "Llaves, controles y accesos", "Número de fotografías en número entero", "La entrega no puede ser anterior al contrato"]));
    expect(validateFormato("23", { ...INVENTARIO_ENTREGA, bienesEstado: "ninguno" })).toContain("Bienes que se rentan con el inmueble");
  });

  it("en la renta del propietario la entrega se respalda con el 23; en la venta, con el 16", () => {
    expect(requirementFormato("inventario_entrega", "arrendador")).toBe("23");
    expect(requirementFormato("inventario_entrega", "captacion")).toBe("16");
  });

  it("sin datos sale con líneas en blanco, sin romperse, y genera su PDF", async () => {
    expect(texto(inventarioRentaDocumento({}).blocks)).toContain("____");
    const pdf = await createFormatoPdf("23", INVENTARIO_ENTREGA);
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
