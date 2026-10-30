import Decimal from "decimal.js";
import type { FormatoField } from "./catalog";
import { TIPOS_INMUEBLE } from "@/lib/inmueble-tipos";

/*
  10 · Plan de comercialización con la plantilla del titular del 26/10/2026
  (04_Metodologia/02_Comercializacion/10_PlanComercializacion.docx), aprobada el 29/10/2026:
  un formulario con casillas en lugar del plan en prosa anterior. Cada campo es un espacio que
  la plantilla imprime; los textos fijos (AIDA, canales sugeridos, revisiones, responsabilidades)
  los pone el documento. El tipo de inmueble usa la lista única de siete (DEC-32) en lugar de
  las cuatro casillas del Word. El precio promedio por m² y el precio técnico los calcula el panel.
*/

type Option = { value: string; label: string };
const options = (values: readonly string[]): Option[] => values.map(value => ({ value, label: value }));
type PlanColumn = { key: string; label: string; type?: "money" | "number" | "date"; options?: Option[] };
export type PlanRow = Record<string, string | number | undefined>;

/** Renglones fijos de las tablas de la plantilla (materiales, canales, decisiones). */
export const MATERIALES = [
  ["fotografias", "Fotografías profesionales (interior y fachada)"], ["video", "Video de recorrido"], ["recorrido", "Recorrido virtual 360° o fotografía aérea"],
  ["plano", "Plano de distribución"], ["ficha", "Ficha comercial en PDF"], ["vertical", "Contenido vertical para redes sociales"],
] as const;
export const CANALES = [
  ["portales", "Portales inmobiliarios", "Ficha completa, fotografías suficientes, precio y contacto, en la categoría correcta", "Revisión cada 7 a 14 días"],
  ["sitio", "Sitio web de Fortius", "Ficha con galería, datos técnicos y formulario de contacto", "Al lanzamiento y con cada cambio"],
  ["redes", "Redes sociales de Fortius", "Recorrido en video, galería e información clave", "Según calendario acordado"],
  ["whatsapp", "WhatsApp y contacto directo", "Envío de la ficha a quien ya solicitó información. No se envían mensajes masivos", "Al lanzamiento y a los 30 días"],
  ["referidos", "Red de referidos", "Aviso a asesores aliados y clientes con perfil compatible", "Primeras dos semanas"],
  ["letrero", "Letrero en el inmueble", "Instalación solo con autorización del propietario", "Al lanzamiento"],
] as const;
export const DECISIONES = [["difusion", "Precio, canales y materiales"], ["presupuesto", "Presupuesto, acceso y datos de contacto"], ["pendientes", "Pendientes, responsable y fecha"]] as const;

export const PLAN_TABLES: Record<string, { label: string; columns: PlanColumn[]; fixed: readonly { key: string; label: string }[]; max: number }> = {
  comparables: { label: "Inmuebles comparables", max: 5, fixed: [], columns: [
    { key: "direccion", label: "Dirección o referencia" }, { key: "terreno", label: "m² terreno", type: "number" }, { key: "construccion", label: "m² const.", type: "number" },
    { key: "recamaras", label: "Rec.", type: "number" }, { key: "banos", label: "Baños", type: "number" }, { key: "precio", label: "Precio", type: "money" }, { key: "fuente", label: "Fuente y fecha" },
  ] },
  materiales: { label: "Materiales de difusión", max: MATERIALES.length, fixed: MATERIALES.map(([key, label]) => ({ key, label })), columns: [
    { key: "incluye", label: "Incluye o no aplica", options: options(["Incluye", "No aplica"]) }, { key: "alcance", label: "Alcance" }, { key: "responsable", label: "Responsable" }, { key: "fecha", label: "Fecha", type: "date" },
  ] },
  canales: { label: "Dónde se publicará", max: CANALES.length, fixed: CANALES.map(([key, label]) => ({ key, label })), columns: [
    { key: "autorizado", label: "Autorizado", options: options(["Sí", "No"]) },
  ] },
  extras: { label: "Publicidad pagada (opcional)", max: 6, fixed: [], columns: [
    { key: "concepto", label: "Concepto y periodo" }, { key: "importe", label: "Total MXN", type: "money" }, { key: "pagador", label: "A cargo de" }, { key: "autorizacion", label: "Autorización" },
  ] },
  decisiones: { label: "Decisiones para iniciar", max: DECISIONES.length, fixed: DECISIONES.map(([key, label]) => ({ key, label })), columns: [
    { key: "alcance", label: "Alcance aprobado o pendiente" },
  ] },
};
export type PlanTable = keyof typeof PLAN_TABLES;

export const SERVICIOS = ["Escuelas", "Hospitales o clínicas", "Supermercados y comercios", "Transporte y vialidades", "Centros comerciales", "Zona con vigilancia"];
export const AJUSTES = ["Remodelación", "Vista o esquina", "Equipamiento", "Antigüedad", "Zona", "Situación legal"];
export const MOTIVOS = ["Primera vivienda", "Segunda", "Inversión", "Cambio de hogar"];
export const PREPARACION = [
  "Retirar objetos personales y documentos a la vista", "Limpiar la fachada y la entrada principal", "Limpieza profunda de todas las áreas",
  "Cortar el pasto y podar plantas, si hay jardín", "Encender luces y abrir cortinas para aprovechar la luz natural", "Retirar vehículos y objetos de la vista exterior",
  "Ordenar clósets y guardar utensilios pequeños de cocina", "Verificar focos y luminarias", "Dejar espacios despejados y reducir la decoración excesiva", "Evitar personas y mascotas en las tomas",
];

const S0 = "Datos del encargo", S1 = "1 / El inmueble", S2 = "2 / Precio de salida", S3 = "3 / A quién se dirigirá", S4 = "4 / Del anuncio a la oferta", S5 = "5 / Preparación y materiales", S6 = "6 / Dónde se publicará", S7 = "7 / Calendario y revisiones", S8 = "8 / Seguimiento", S9 = "9 / Decisiones y aprobación";
const f = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = false): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, values: Option[], required = false): FormatoField => ({ ...f(section, key, label, "choice", required), options: values });
const multi = (section: string, key: string, label: string, values: readonly string[]): FormatoField => ({ ...f(section, key, label, "multi"), options: options(values) });

export const planFields: FormatoField[] = [
  f(S0, "folio", "Folio del expediente", "text", true), f(S0, "inmueble", "Inmueble", "text", true), f(S0, "propietario", "Propietario", "text", true), f(S0, "folioReal", "Folio real"),
  f(S0, "contrato09", "Contrato de intermediación (folio y fecha)"), f(S0, "asesor", "Asesor responsable", "text", true), f(S0, "fecha", "Fecha de elaboración", "date", true),
  choice(S0, "operacion", "Operación", options(["Venta", "Renta"]), true),

  choice(S1, "tipoInmueble", "Tipo de inmueble", TIPOS_INMUEBLE.map(tipo => ({ value: tipo.key, label: tipo.label })), true), f(S1, "claveCatastral", "Clave catastral"),
  f(S1, "terreno", "Terreno (m²)", "number"), f(S1, "construccion", "Construcción (m²)", "number"), f(S1, "anioConstruccion", "Año de construcción"),
  f(S1, "recamaras", "Recámaras", "number"), f(S1, "banos", "Baños completos", "number"), f(S1, "mediosBanos", "Medios baños", "number"), f(S1, "estacionamientos", "Estacionamientos", "number"),
  choice(S1, "situacionLegal", "Situación legal", [{ value: "escriturado", label: "Escriturado" }, { value: "tramite", label: "En trámite" }, { value: "posesion", label: "Posesión" }]),
  choice(S1, "gravamen", "Gravámenes o hipotecas", [{ value: "no", label: "No" }, { value: "si", label: "Sí" }]), f(S1, "montoGravamen", "Monto del gravamen", "money"),
  choice(S1, "regimen", "Régimen de propiedad", [{ value: "individual", label: "Individual" }, { value: "condominio", label: "Condominio" }]), f(S1, "cuotaMantenimiento", "Cuota de mantenimiento", "money"),
  multi(S1, "servicios", "Servicios y entorno cercano", SERVICIOS),

  f(S2, "comparables", "Inmuebles comparables", "planRows"),
  multi(S2, "ajustes", "Ajustes considerados", AJUSTES),
  f(S2, "valorReferencia07", "Valor de referencia de la opinión de valor", "money"), f(S2, "precioRecomendado", "Precio de salida recomendado por Fortius", "money"),
  f(S2, "precioSalida", "Precio de salida autorizado por el propietario", "money", true), f(S2, "margen", "Margen de negociación acordado y motivo", "long"),

  f(S3, "perfil1Quien", "Perfil principal: quién es"), f(S3, "perfil2Quien", "Perfil secundario: quién es"),
  f(S3, "perfil1Pago", "Perfil principal: capacidad y forma de pago"), f(S3, "perfil2Pago", "Perfil secundario: capacidad y forma de pago"),
  multi(S3, "perfil1Motivo", "Perfil principal: motivo de compra", MOTIVOS), multi(S3, "perfil2Motivo", "Perfil secundario: motivo de compra", MOTIVOS),
  f(S3, "perfil1Destacar", "Perfil principal: característica a destacar"), f(S3, "perfil2Destacar", "Perfil secundario: característica a destacar"),
  f(S3, "perfil1Objeciones", "Perfil principal: objeciones y cómo se atenderán", "long"), f(S3, "perfil2Objeciones", "Perfil secundario: objeciones y cómo se atenderán", "long"),
  f(S3, "perfil1Mensaje", "Perfil principal: mensaje del anuncio", "long"), f(S3, "perfil2Mensaje", "Perfil secundario: mensaje del anuncio", "long"),

  f(S4, "mediosConsulta", "Las consultas se responden por"), f(S4, "plazoRespuesta", "Plazo de respuesta"), f(S4, "horariosVisita", "Días y horarios de visita"),

  multi(S5, "preparacion", "Antes de la sesión fotográfica", PREPARACION), f(S5, "materiales", "Materiales de difusión", "planRows"),

  f(S6, "canales", "Dónde se publicará", "planRows"), f(S6, "contactoPublico", "Contacto público que aparecerá en el anuncio"), f(S6, "ubicacionPublicable", "Ubicación que puede difundirse"),
  f(S6, "extras", "Publicidad pagada (opcional)", "planRows"),

  f(S7, "fechaInicio", "Fecha de inicio de la campaña (día 1)", "date", true), f(S7, "responsableCampana", "Responsable de la campaña"),
  f(S7, "corte7", "Corte del día 7", "date"), f(S7, "corte14", "Corte del día 14", "date"), f(S7, "corte21", "Corte del día 21", "date"),

  f(S8, "medioReporte", "Medio de reporte"), f(S8, "frecuenciaReporte", "Frecuencia pactada"), f(S8, "proximoReporte", "Próximo reporte", "date"), f(S8, "responsableReporte", "Responsable del reporte"),

  f(S9, "decisiones", "Decisiones para iniciar", "planRows"),
  f(S9, "aceptadoPor", "Plan aceptado por"), f(S9, "fechaAceptacion", "Fecha de aceptación", "date"), f(S9, "medioAceptacion", "Medio de aceptación"),
  f(S9, "siguienteAccion", "Siguiente acción"), f(S9, "responsableSiguiente", "Responsable de la siguiente acción"), f(S9, "fechaSiguiente", "Fecha de la siguiente acción", "date"),
];

/** El monto del gravamen solo se pide si lo hay. */
export function mostrarCampoPlan(key: string, data: Record<string, unknown>): boolean {
  if (key === "montoGravamen") return data.gravamen === "si";
  return true;
}

const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const nonnegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const filas = (value: unknown): PlanRow[] => Array.isArray(value) ? value.filter((row): row is PlanRow => !!row && typeof row === "object" && !Array.isArray(row)) : [];

/**
  Cálculo de la plantilla: el precio promedio por m² construido de los comparables que traen
  precio y m² construidos, y el precio técnico (ese promedio por la construcción del inmueble).
*/
export function calcularPrecioTecnico(data: Record<string, unknown>): { promedio: number | null; tecnico: number | null; usados: number } {
  const unitarios = filas(data.comparables).filter(row => positive(row.precio) && positive(row.construccion)).map(row => new Decimal(row.precio as number).div(row.construccion as number));
  if (!unitarios.length) return { promedio: null, tecnico: null, usados: 0 };
  const promedio = unitarios.reduce((sum, value) => sum.plus(value), new Decimal(0)).div(unitarios.length);
  return { promedio: promedio.toDecimalPlaces(2).toNumber(), tecnico: positive(data.construccion) ? promedio.mul(data.construccion).toDecimalPlaces(2).toNumber() : null, usados: unitarios.length };
}

/** Total de la publicidad pagada registrada. */
export function calcularExtras(rows: PlanRow[]) {
  return { total: rows.reduce((sum, row) => sum.plus(nonnegative(row.importe) ? row.importe : 0), new Decimal(0)).toNumber() };
}

export function validarPlan(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (data.precioSalida === 0) errors.push("Precio de salida autorizado por el propietario");
  for (const key of ["corte7", "corte14", "corte21"] as const) if (typeof data.fechaInicio === "string" && typeof data[key] === "string" && String(data[key]) < data.fechaInicio) errors.push("Cortes de los días 7, 14 y 21");
  if (typeof data.corte7 === "string" && typeof data.corte14 === "string" && typeof data.corte21 === "string" && !(data.corte7 < data.corte14 && data.corte14 < data.corte21)) errors.push("Cortes de los días 7, 14 y 21");
  for (const [key, config] of Object.entries(PLAN_TABLES)) {
    const value = data[key];
    if (value === undefined) continue;
    if (!Array.isArray(value) || value.length > config.max) { errors.push(config.label); continue; }
    for (const row of value) {
      if (!row || typeof row !== "object" || Array.isArray(row)) { errors.push(config.label); continue; }
      if (config.fixed.length && !config.fixed.some(item => item.key === (row as PlanRow).concepto)) errors.push(config.label);
      for (const column of config.columns) {
        const cell = (row as PlanRow)[column.key];
        if (cell === undefined || cell === "") continue;
        if ((column.type === "money" || column.type === "number") && !nonnegative(cell)) errors.push(config.label);
        if (column.options && !column.options.some(option => option.value === cell)) errors.push(config.label);
      }
    }
  }
  return [...new Set(errors)];
}
