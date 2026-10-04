import { formatoById } from "@/lib/formatos/catalog";
import { valorReviewSnapshot } from "@/lib/formatos/valor";

export const comparable = (id: string, precio: number) => ({ id, seleccion: "incluir", ubicacion: `Ubicación ficticia ${id}`, fuente: `Expediente sintético/${id}`, fechaConsulta: "2026-10-04", fechaPrecio: "2026-09-30", tipoPrecio: "oferta", moneda: "MXN", precio, superficie: 100, fuenteSuperficie: "Plano sintético", fZona: 1, fUbicacion: 1, fSuperficie: 1, fNegociacion: 1, razonZona: "Igual zona de prueba", razonUbicacion: "Igual condición de prueba", razonSuperficie: "Igual superficie de prueba", razonNegociacion: "Oferta sin ajuste en este ejemplo", razonSeleccion: "Comparable sintético para comprobar aritmética" });
export const valorSample: Record<string, unknown> = {
  folio: "QA-07", fechaValor: "2026-10-04", fechaEmision: "2026-10-04", revisarAntes: "2030-10-04", fechaSolicitud: "2026-09-28", fechaInspeccion: "2026-09-30", inspeccionEstado: "realizada", operacion: "venta", estadoOperacion: "en_estudio", versionInforme: 1,
  baseMercado: "construccion", terreno: 100, construccion: 100, privativa: "NA", origenTerreno: "documentado", origenConstruccion: "documentado", fuenteTerreno: "Plano sintético", fuenteConstruccion: "Plano sintético", fuentePrivativa: "NA", terrenoDerechos: "revisado", superficiesEstado: "compatibles", superficiesEfecto: "Sin diferencia en el ejemplo", juridicaEstado: "compatible", condicionesJuridicas: "Sin impedimento en el ejemplo sintético", tipoCambio: 20, fechaCambio: "2026-10-04", fuenteCambio: "Dato sintético, no cotización real",
  pesoMercado: 50, pesoIngresos: 25, pesoFisico: 25, razonMercado: "Prueba de ponderación", razonIngresos: "Prueba de ponderación", razonFisico: "Prueba de ponderación", tipoPrecioTerreno: "oferta", tipoPrecioConstruccion: "oferta", tipoPrecioRenta: "oferta",
  comparablesTerreno: [comparable("T1", 500000), comparable("T2", 550000), comparable("T3", 450000)], comparablesConstruccion: [comparable("C1", 2000000), comparable("C2", 2100000), comparable("C3", 1900000)], comparablesRenta: [comparable("R1", 10000), comparable("R2", 11000), comparable("R3", 9000)],
  factorMercado: 1, razonFactorMercado: "Sin ajuste adicional", criterioMercado: "Media aritmética; muestra sintética homogénea", factorTerreno: 1, razonFactorTerreno: "Sin ajuste adicional", criterioTerreno: "Muestra sintética de terrenos", criterioRenta: "Muestra sintética de rentas", vacanciaPct: 10, gastosPct: 10, tasaCapPct: 6, sustentoIngresos: "Parámetros sintéticos para verificar fórmulas, no datos de mercado",
  construcciones: [{ id: "C-01", tipo: "Casa", uso: "Vivienda", superficie: 100, costoNuevo: 12000, edad: 10, vidaUtil: 50, estado: 2, fuenteCosto: "Costo sintético", fuenteEdadVida: "Parámetros sintéticos", fuenteEstado: "Estado sintético" }], inventarioFisico: "revisado", metodoFisico: "revisado", supuestosDepreciacion: "Ross-Heidecke de la plantilla, sin rescate; ejemplo sintético", obrasEstado: "incluidas", obrasFuente: "Presupuesto sintético; sin duplicación en costo nuevo", obras: [{ concepto: "Obra auxiliar", unidad: "lote", cantidad: 1, costoNuevo: 10000, factorConservacion: 0.5, fuente: "Costo sintético" }],
  redondeo: 1000, revisionEstado: "revisada", fechaRevision: "2026-10-04", versionRevisada: 1, indicadorRevisado: 1788597.2,
  fotoPrincipalId: "51000000-0000-4000-8000-000000000021", croquisId: "51000000-0000-4000-8000-000000000022", permisoImagenes: "autorizado", fotografias: [{ assetId: "51000000-0000-4000-8000-000000000021", pie: "Vista principal sintética" }],
};
valorSample.revisionDatos = valorReviewSnapshot(valorSample);

export function completeValorSample(): Record<string, unknown> {
  const fields = formatoById("07").fields;
  const data = { ...Object.fromEntries(fields.filter((field) => field.type !== "valorRows").map((field) => [field.key, field.type === "choice" ? field.options?.[0].value : field.type === "date" ? "2026-10-04" : field.type === "number" || field.type === "money" ? 1 : "Dato sintético de prueba"])), ...valorSample, privativa: "", documentosEstado: "revisados", documentos: [{ documento: "Plano sintético", fecha: "2026-09-30", referencia: "Evidencia sintética" }] };
  return { ...data, revisionDatos: valorReviewSnapshot(data) };
}

