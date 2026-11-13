import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { calendarioPagos, exigeEscritura, mostrarCampoCompraventaPlazos, sumarMeses, UMBRAL_ESCRITURA } from "@/lib/formatos/compraventa-plazos";
import { compraventaPlazosDocumento } from "@/lib/formatos/documento/compraventa-plazos";
import { crearMaquetador, type Maqueta } from "@/lib/formatos/documento/pdf";
import type { Block, Documento } from "@/lib/formatos/documento/modelo";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { loadLetterhead } from "@/lib/letterhead-server";

/* 24: compraventa a plazos con reserva de dominio (DOC-14, RP-97), aprobada por el titular el 13/11/2026. */
const texto = (blocks: Block[]) => blocks.map(b => "text" in b ? b.text : b.kind === "table" || b.kind === "grid" ? b.rows.map(r => r.join(" | ")).join("\n") : b.kind === "signatures" ? b.parties.map(p => `${p.role} ${p.name}`).join(" ") : "").join("\n");

export const COMPRAVENTA_PLAZOS = {
  folio: "EXP-2026-0080", vendedorTipo: "fisica", vendedor: "Persona Vendedora de Ejemplo", vendedorNacionalidad: "mexicana", vendedorIdentificacion: "INE 0000000000", vendedorRfc: "XAXX010101000", vendedorEstadoCivil: "soltera",
  consentimientoConyuge: "no", tituloPropiedad: "escritura 1,000 de ejemplo", datosRegistrales: "partida de ejemplo", gravamen: "libre", certificadoGravamen: "de ejemplo del 1 de noviembre de 2026",
  vendedorDomicilio: "Calle Uno 1, Tijuana, B.C.", vendedorCorreo: "vendedor@example.com",
  compradorTipo: "fisica", comprador: "Persona Compradora de Ejemplo", compradorNacionalidad: "mexicana", compradorIdentificacion: "INE 1111111111", compradorRfc: "XAXX010101000", compradorEstadoCivil: "casada", porCuentaDeOtro: "no",
  compradorDomicilio: "Calle Dos 2, Tijuana, B.C.", compradorCorreo: "comprador@example.com",
  inmueble: "Calle Muestra 10, Tijuana, B.C.", superficieTerreno: 120, superficieConstruccion: 95, claveCatastral: "XX-000-000", accesorios: "ninguno", condominio: "no", intervieneFortius: "si",
  moneda: "MXN", precio: 1000000, enganche: 200000, enganchePagado: "firma", numeroMensualidades: 12, fechaPrimeraMensualidad: "2027-01-31", intereses: "no", moratorio: "si", tasaMoratoria: 1.5, banco: "Banco de ejemplo", cuentaVendedor: "000000000000000000",
  formalizacion: "privado", diasRatificacion: 15, diasCancelacion: 30, entrega: "firma", seguro: "no",
  mensualidadesRescindir: 3, diasGracia: 15, diasDesocupacion: 30, rentaCompensatoria: 7000, penaRescision: 10, penaVendedor: 10, diasDevolucion: 30, gastos: "comprador",
  municipioJurisdiccion: "Tijuana", municipioFirma: "Tijuana", fechaFirma: "2026-12-15", testigo1: "Testigo Uno de Ejemplo", testigo2: "Testigo Dos de Ejemplo",
};

let maquetar: (doc: Documento) => Promise<Maqueta>;
beforeAll(async () => {
  const [regular, bold] = await Promise.all([readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")), readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf"))]);
  maquetar = await crearMaquetador({ regular, bold, ...await loadLetterhead() });
});
/** Datos que la validación pide y que no tienen zona en la hoja (no se podrían capturar). */
async function pendientesSinZona(data: Record<string, unknown>) {
  const byLabel = new Map(formatoById("24").fields.map(f => [f.label, f.key]));
  const covered = new Set((await maquetar(compraventaPlazosDocumento(data))).zonas.flatMap(z => z.keys));
  return validateFormato("24", data).map(label => byLabel.get(label)).filter((key): key is string => !!key && key !== "folio" && !covered.has(key));
}

describe("compraventa a plazos con reserva de dominio (24)", () => {
  it("está en el catálogo, lista para emitir, y con todo capturado no le falta nada", () => {
    expect(formatoById("24")).toMatchObject({ title: "Compraventa a plazos con reserva de dominio", readyForEmission: true });
    expect(validateFormato("24", COMPRAVENTA_PLAZOS)).toEqual([]);
  });

  it("sin intereses reparte el saldo en partes iguales; la última absorbe los centavos y las fechas se ajustan al fin de mes", () => {
    const pagos = calendarioPagos(COMPRAVENTA_PLAZOS)!;
    expect(pagos).toHaveLength(12);
    expect(pagos[0]).toMatchObject({ numero: 1, fecha: "2027-01-31", importe: 66666.66, interes: 0 });
    expect(pagos[1].fecha).toBe("2027-02-28");
    expect(pagos[2].fecha).toBe("2027-03-31");
    expect(pagos[11]).toMatchObject({ importe: 66666.74, saldo: 0 });
    expect(pagos.reduce((acc, p) => acc + Math.round(p.importe * 100), 0)).toBe(80000000);
  });

  it("con intereses calcula un pago fijo sobre saldos insolutos y termina en cero", () => {
    const pagos = calendarioPagos({ ...COMPRAVENTA_PLAZOS, precio: 300000, enganche: 200000, intereses: "si", tasaAnual: 12 })!;
    expect(pagos[0]).toMatchObject({ importe: 8884.88, interes: 1000, capital: 7884.88 });
    expect(pagos.at(-1)!.saldo).toBe(0);
    expect(pagos.reduce((acc, p) => acc + Math.round(p.capital * 100), 0)).toBe(10000000);
  });

  it("sin datos suficientes no inventa el calendario", () => {
    expect(calendarioPagos({ ...COMPRAVENTA_PLAZOS, enganche: 1000000 })).toBeNull();
    expect(calendarioPagos({ ...COMPRAVENTA_PLAZOS, numeroMensualidades: undefined })).toBeNull();
    expect(calendarioPagos({ ...COMPRAVENTA_PLAZOS, intereses: "si", tasaAnual: undefined })).toBeNull();
    expect(sumarMeses("2028-01-31", 1)).toBe("2028-02-29");
  });

  it("por encima de 10,000 UMA o en dólares va en escritura pública, aunque se haya elegido el documento privado", () => {
    expect(UMBRAL_ESCRITURA).toBe(1173100);
    expect(exigeEscritura({ precio: 1173100 })).toBe(false);
    expect(exigeEscritura({ precio: 1173100.01 })).toBe(true);
    expect(exigeEscritura({ moneda: "USD", precio: 100000 })).toBe(true);
    const caro = { ...COMPRAVENTA_PLAZOS, precio: 2500000, notario: "Notaría 1 de Tijuana", fechaEscritura: "2027-01-15" };
    expect(mostrarCampoCompraventaPlazos("formalizacion", caro)).toBe(false);
    expect(mostrarCampoCompraventaPlazos("testigo1", caro)).toBe(false);
    expect(validateFormato("24", caro)).toEqual([]);
    const t = texto(compraventaPlazosDocumento(caro).blocks);
    expect(t).toContain("en escritura pública ante el notario Notaría 1 de Tijuana");
    expect(t).not.toContain("TESTIGO");
  });

  it("el documento privado lleva testigos, ratificación y el calendario; sin intereses no habla de ellos", () => {
    const t = texto(compraventaPlazosDocumento(COMPRAVENTA_PLAZOS).blocks);
    expect(t).toContain("se otorga en documento privado ante dos testigos");
    expect(t).toContain("TESTIGO Testigo Uno de Ejemplo");
    expect(t).toContain("en 12 mensualidades que vencen el día 31 de cada mes, a partir del 31 de enero de 2027");
    expect(t).toContain("cada mensualidad es de $66,666.66");
    expect(t).toContain("La última mensualidad es de $66,666.74");
    expect(t).toContain("12 | 31 de diciembre de 2027 | $66,666.74 | $0.00");
    expect(t).toContain("Fortius no es parte de este contrato, no recibe ni custodia pagos");
    expect(t).not.toMatch(/intereses ordinarios pagados/);
    expect(t).not.toMatch(/NaN|undefined|\[object Object\]/);
  });

  it("revisa congruencia: enganche menor que el precio, tasas, mensualidades y fechas en orden", () => {
    expect(validateFormato("24", { ...COMPRAVENTA_PLAZOS, enganche: 1000000 })).toContain("El enganche debe ser menor que el precio");
    expect(validateFormato("24", { ...COMPRAVENTA_PLAZOS, numeroMensualidades: 400 })).toContain("Número de mensualidades entre 1 y 360");
    expect(validateFormato("24", { ...COMPRAVENTA_PLAZOS, intereses: "si", tasaAnual: 0 })).toContain("Interés ordinario mayor que cero, o elige sin intereses");
    expect(validateFormato("24", { ...COMPRAVENTA_PLAZOS, mensualidadesRescindir: 13 })).toContain("Las mensualidades para rescindir no pueden ser más que el total");
    expect(validateFormato("24", { ...COMPRAVENTA_PLAZOS, fechaPrimeraMensualidad: "2026-12-01" })).toContain("La primera mensualidad no puede ser anterior a la firma");
    expect(validateFormato("24", { ...COMPRAVENTA_PLAZOS, compradorCorreo: "sin-arroba" })).toContain("Correo del comprador");
  });

  it("cada dato que se pide tiene dónde capturarse, con cualquier combinación de opciones", async () => {
    expect(await pendientesSinZona({})).toEqual([]);
    expect(await pendientesSinZona({ vendedorTipo: "moral", compradorTipo: "moral", gravamen: "cancelar", porCuentaDeOtro: "si" })).toEqual([]);
    expect(await pendientesSinZona({ vendedorTipo: "fisica", consentimientoConyuge: "si", enganchePagado: "despues", intereses: "si", moratorio: "si" })).toEqual([]);
    expect(await pendientesSinZona({ formalizacion: "privado", entrega: "fecha", seguro: "si" })).toEqual([]);
    expect(await pendientesSinZona({ formalizacion: "escritura", precio: 3000000 })).toEqual([]);
  });

  it("vacío sale con líneas en blanco y el PDF se genera, con y sin intereses", async () => {
    expect(texto(compraventaPlazosDocumento({}).blocks)).not.toMatch(/NaN|undefined/);
    for (const data of [COMPRAVENTA_PLAZOS, { ...COMPRAVENTA_PLAZOS, intereses: "si", tasaAnual: 12, vendedorTipo: "moral", vendedorActa: "Acta de ejemplo", vendedorRepresentante: "Representante de ejemplo", vendedorPoder: "Poder de ejemplo", gravamen: "cancelar", gravamenDescripcion: "una hipoteca", acreedorGravamen: "Banco de ejemplo", seguro: "si", sumaAsegurada: 1000000 }]) {
      const pdf = await createFormatoPdf("24", data);
      expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
    }
  });
});
