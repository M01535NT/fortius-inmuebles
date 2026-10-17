import { formatoById } from "@/lib/formatos/catalog";

/*
  Opinión de valor 07 sintética con cifras verificables a mano (fórmulas de la plantilla):
  - mercado construido: 20,000 $/m² × 100 m² = 2,000,000
  - terreno: 5,000 $/m² × 100 m² = 500,000
  - ingresos: 100 $/m²/mes × 100 m² = 10,000/mes; 120,000/año; −5 % = 114,000; −10 % gastos = 102,600; ÷ 8 % = 1,282,500
  - físico: 500,000 + construcción 100 m² × 12,000 × (1 − 0.12) × (1 − 0.0252) = 1,029,388.80 → 1,529,388.80
  - conciliación 50/25/25: 1,000,000 + 320,625 + 382,347.20 = 1,702,972.20 → redondeo a 1,000 = 1,703,000
*/

export const comparable = (id: string, precio: number) => ({ ubicacion: `Ubicación ficticia ${id}`, superficie: 100, precio, moneda: "MXN", fZona: 1, fUbicacion: 1, fSuperficie: 1, fNegociacion: 1, fuente: `https://ejemplo.test/${id}`, fechaPrecio: "2026-09-30" });
export const valorSample: Record<string, unknown> = {
  folio: "QA-07", fechaValor: "2026-10-04", fechaEmision: "2026-10-04", revisarAntes: "2027-04-04", fechaSolicitud: "2026-09-28", fechaInspeccion: "2026-09-30",
  inspeccionEstado: "Realizada", operacion: "Venta", baseMercado: "Construcción", tipoInmueble: "Casa", solicitante: "Persona sintética", propietario: "Persona sintética",
  terreno: 100, construccion: 100, tipoCambio: 18,
  comparablesTerreno: [comparable("T1", 500000), comparable("T2", 550000), comparable("T3", 450000)],
  comparablesConstruccion: [comparable("C1", 2000000), comparable("C2", 2100000), comparable("C3", 1900000)],
  comparablesRenta: [comparable("R1", 10000), comparable("R2", 11000), comparable("R3", 9000)],
  factorMercado: 1, factorTerreno: 1, vacanciaPct: 5, gastosPct: 10, tasaCapPct: 8,
  construcciones: [{ id: "C-01", tipo: "Casa", uso: "Vivienda", superficie: 100, costoNuevo: 12000, edad: 10, vidaUtil: 50, estado: 2 }], obras: [],
  pesoMercado: 50, pesoIngresos: 25, pesoFisico: 25, redondeo: 1000,
  fotoPrincipalId: "51000000-0000-4000-8000-000000000021", croquisId: "51000000-0000-4000-8000-000000000022", fotografias: [{ assetId: "51000000-0000-4000-8000-000000000021", pie: "Vista principal sintética" }],
};

/** Todos los campos del 07 con un dato, más la muestra con cifras conocidas. */
export function completeValorSample(): Record<string, unknown> {
  const fields = formatoById("07").fields;
  const data = Object.fromEntries(fields.filter((field) => field.type !== "valorRows").map((field) => [field.key, field.type === "choice" ? field.options?.[0].value : field.type === "date" ? "2026-10-04" : field.type === "number" ? 1 : "Dato sintético de prueba"]));
  return { ...data, documentos: [{ documento: "Escritura sintética" }], ...valorSample };
}
