import type { FormatoField } from "./catalog";

/*
  07 · Opinión de valor comercial. Los campos son exactamente las celdas de captura que
  imprime la plantilla del titular (07_OpinionValor.xlsx, decisión del 17/10/2026): ni más
  ni menos. Las opciones de las listas son las de la propia plantilla. Ningún campo es
  obligatorio: el PDF y el Excel se generan con lo que haya.
*/

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text"): FormatoField => ({ section, key, label, type, required: false });
const choice = (section: string, key: string, label: string, values: string[]): FormatoField => ({ ...field(section, key, label, "choice"), options: values.map((value) => ({ value, label: value })) });

const S2 = "02 / Antecedentes", S3 = "03 / Características urbanas de la zona", S4 = "04 / Características del inmueble";
const S5 = "05 / Comparables de terreno", S6 = "06 / Comparables de inmuebles construidos", S7 = "07 / Ingresos", S8 = "08 / Enfoque físico", S9 = "09 / Conciliación", S10 = "10 / Reporte fotográfico";

/** Listas de la plantilla (validaciones de datos de la hoja «2. Antecedentes»). */
export const TIPOS_INMUEBLE = ["Terreno", "Casa", "Departamento", "Oficina", "Local", "Nave o bodega", "Plaza o conjunto"];
/** La entrevista guarda claves en minúsculas; el 07 usa las palabras de la plantilla (COR-02). «por_definir» no tiene equivalente. */
export const TIPO_INMUEBLE_DESDE_ENTREVISTA: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina", "nave-industrial": "Nave o bodega", nave: "Nave o bodega", plaza: "Plaza o conjunto",
};
export const OPERACIONES = ["Venta", "Renta", "Administración", "Desarrollo"];
export const BASES_MERCADO = ["Terreno", "Construcción", "Privativa"];
export const INSPECCION = ["Realizada", "No realizada"];

/** Textos que la plantilla trae escritos; el asesor puede cambiarlos. */
export const VALOR_DEFAULTS: Record<string, string | number> = {
  objeto: "Estimar el valor comercial del inmueble.",
  empresa: "Fortius Real Estate & Investments",
  contacto: "Tel. +52 664 406 6999 | fortiusinmuebles.com",
  operacion: "Venta",
  factorTerreno: 1, factorMercado: 1,
  limites: [
    "1. La opinión distingue datos documentados, observados y declarados. Las fuentes y reservas se identifican en el informe.",
    "2. Los precios corresponden a sus fechas registradas; oferta y cierre no son equivalentes. El mercado puede cambiar.",
    "3. No se certifica cumplimiento normativo ni condición de sistemas ocultos; se declaran el alcance de inspección y los límites técnicos.",
    "4. Las condiciones jurídicas y su efecto se describen en antecedentes; no se suponen resueltas.",
    "5. La fecha de revisión se fija para el caso. Cambios del inmueble, operación o mercado requieren actualizar la opinión.",
    "6. Es una referencia comercial, no garantía de venta ni sustituto de un avalúo exigido por autoridad, banco o contrato.",
  ].join("\n"),
};

export const valorFields: FormatoField[] = [
  // Hoja 2 · Antecedentes (más los datos de control que la plantilla imprime: folio, fecha de valor, operación, base, tipo de cambio e inspección)
  field(S2, "folio", "Folio"), field(S2, "fechaValor", "Fecha de valor", "date"),
  field(S2, "solicitante", "Solicitante"), field(S2, "relacionSolicitante", "Relación del solicitante con el inmueble"), field(S2, "propietario", "Propietario del inmueble"),
  choice(S2, "tipoInmueble", "Inmueble objeto de la opinión", TIPOS_INMUEBLE), field(S2, "usoActual", "Uso o destino actual"), field(S2, "regimen", "Régimen de propiedad"),
  field(S2, "cuentaCatastral", "Cuenta catastral"), field(S2, "inmueble", "Ubicación del inmueble", "long"), field(S2, "fechaSolicitud", "Fecha de solicitud", "date"),
  choice(S2, "operacion", "Operación", OPERACIONES), choice(S2, "baseMercado", "Base de mercado", BASES_MERCADO), field(S2, "tipoCambio", "MXN por 1 USD", "number"),
  field(S2, "objeto", "Objeto de la opinión de valor", "long"), field(S2, "proposito", "Propósito / uso previsto", "long"),
  choice(S2, "inspeccionEstado", "Inspección", INSPECCION), field(S2, "fechaInspeccion", "Fecha de inspección", "date"),
  field(S2, "fechaEmision", "Fecha de emisión", "date"), field(S2, "revisarAntes", "Vigencia (válida hasta)", "date"),
  field(S2, "alcance", "Alcance y condiciones limitantes", "long"),
  field(S2, "empresa", "Empresa inmobiliaria"), field(S2, "asesor", "Asesor que emite la opinión"), field(S2, "contacto", "Contacto (correo / teléfono)"),
  field(S2, "documentos", "Documentos que se tuvieron a la vista", "valorRows"),
  // Hoja 3 · Características urbanas de la zona
  field(S3, "clasificacionZona", "Clasificación de la zona", "long"), field(S3, "zonificacion", "Uso del suelo (zonificación)"), field(S3, "saturacion", "Índice de saturación de la zona"),
  field(S3, "dinamicaMercado", "Dinámica de oferta y demanda"), field(S3, "usoPredominante", "Uso predominante (vivienda, mixto, etc.)"),
  field(S3, "servicios", "Servicios públicos disponibles", "long"),
  field(S3, "educacion", "Escuelas / centros educativos"), field(S3, "comercios", "Comercios y abasto"), field(S3, "salud", "Salud / hospitales"), field(S3, "transporte", "Transporte público"),
  field(S3, "vialidades", "Vías primarias y secundarias", "long"),
  field(S3, "latitud", "Latitud"), field(S3, "longitud", "Longitud"), field(S3, "altitud", "Altitud (msnm)"), field(S3, "orientacion", "Orientación"),
  field(S3, "croquisId", "Croquis de localización"),
  // Hoja 4 · Características del inmueble
  field(S4, "terreno", "Superficie del terreno (m²)", "number"), field(S4, "frente", "Frente (m)"), field(S4, "indiviso", "Indiviso (%)"), field(S4, "loteTipo", "Sup. lote tipo (m²)"),
  field(S4, "forma", "Forma / configuración"), field(S4, "topografia", "Topografía"), field(S4, "linderos", "Medidas y colindancias", "long"), field(S4, "restricciones", "Servidumbres y restricciones"),
  field(S4, "construccion", "Superficie construida (m²)", "number"), field(S4, "privativa", "Área privativa (m²)", "number"),
  field(S4, "niveles", "Niveles"), field(S4, "recamaras", "Recámaras"), field(S4, "banos", "Baños"), field(S4, "estacionamientos", "Estacionamientos"), field(S4, "edad", "Edad (años)"),
  field(S4, "conservacion", "Estado de conservación"), field(S4, "calidadProyecto", "Calidad del proyecto"), field(S4, "descripcion", "Descripción de la propiedad", "long"),
  field(S4, "construcciones", "Tipos de construcción", "valorRows"),
  ...([["cimentacion", "Cimentación"], ["estructura", "Estructura"], ["muros", "Muros"], ["entrepisos", "Entrepisos y losas"], ["azoteas", "Azoteas"], ["acabados", "Aplanados y acabados"], ["pisos", "Pisos"], ["carpinteria", "Carpintería / herrería"], ["hidrosanitaria", "Instalación hidrosanitaria"], ["electrica", "Instalación eléctrica"], ["especiales", "Instalaciones especiales"]] as const).map(([key, label]) => field(S4, key, label)),
  // Hojas 5 a 8 · Enfoques
  field(S5, "comparablesTerreno", "Comparables de terrenos", "valorRows"), field(S5, "factorTerreno", "Factor adicional", "number"), field(S5, "razonFactorTerreno", "Motivo del factor (si es distinto de 1)"), field(S5, "criterioTerreno", "Criterios de selección y ajuste de comparables", "long"),
  field(S6, "comparablesConstruccion", "Comparables de inmuebles construidos", "valorRows"), field(S6, "factorMercado", "Factor adicional", "number"), field(S6, "razonFactorMercado", "Motivo del factor (si es distinto de 1)"), field(S6, "criterioMercado", "Criterios de selección y ajuste de comparables", "long"),
  field(S7, "comparablesRenta", "Comparables de renta", "valorRows"), field(S7, "vacanciaPct", "Vacancia y cobranza (%)", "number"), field(S7, "gastosPct", "Gastos de operación (%)", "number"), field(S7, "tasaCapPct", "Tasa de capitalización (%)", "number"), field(S7, "sustentoIngresos", "Sustento de vacancia, gastos y tasa neta", "long"),
  field(S8, "obras", "Instalaciones especiales, elementos accesorios y obras complementarias", "valorRows"), field(S8, "fuenteCosto", "Costo nuevo: fuente, fecha y ajuste", "long"), field(S8, "fuenteEdadVida", "Edad y vida útil: fuente", "long"), field(S8, "supuestosDepreciacion", "Método y supuestos de depreciación", "long"),
  // Hoja 9 · Conciliación
  field(S9, "pesoMercado", "Peso del enfoque comparativo de mercado (%)", "number"), field(S9, "pesoIngresos", "Peso del enfoque de ingresos (%)", "number"), field(S9, "pesoFisico", "Peso del enfoque físico (%)", "number"),
  field(S9, "redondeo", "Redondear a múltiplos de (MXN)", "number"), field(S9, "justificacion", "Justificación de la opinión de valor", "long"), field(S9, "limites", "Supuestos, condiciones limitantes y vigencia", "long"),
  // Hoja 10 · Reporte fotográfico (y la fotografía principal de la portada)
  field(S10, "fotoPrincipalId", "Fotografía principal (portada)"), field(S10, "fotografias", "Fotografías", "valorRows"),
];

type ValorColumn = { key: string; label: string; type?: "number" | "date" | "long" | "asset"; options?: [string, string][] };
const comps = (precio: string, conservacion: string): ValorColumn[] => [
  { key: "ubicacion", label: "Ubicación / referencia" }, { key: "superficie", label: "Base m²", type: "number" },
  { key: "precio", label: precio, type: "number" }, { key: "moneda", label: "Moneda", options: [["MXN", "MXN"], ["USD", "USD"]] },
  { key: "fZona", label: "Factor zona", type: "number" }, { key: "fUbicacion", label: conservacion, type: "number" }, { key: "fSuperficie", label: "Factor superficie", type: "number" }, { key: "fNegociacion", label: "Factor negociación", type: "number" },
  { key: "fuente", label: "Referencia / URL" }, { key: "fechaPrecio", label: "Fecha del precio", type: "date" },
];
export const VALOR_TABLES: Record<string, { singular: string; max: number; columns: ValorColumn[] }> = {
  documentos: { singular: "documento", max: 5, columns: [{ key: "documento", label: "Documento" }] },
  comparablesTerreno: { singular: "comparable de terreno", max: 5, columns: comps("Precio sin IVA", "Factor ubicación") },
  comparablesConstruccion: { singular: "comparable de inmueble construido", max: 5, columns: comps("Precio sin IVA", "Factor conservación") },
  comparablesRenta: { singular: "comparable de renta", max: 5, columns: comps("Renta mensual sin IVA", "Factor conservación") },
  construcciones: { singular: "tipo de construcción", max: 4, columns: [{ key: "id", label: "Clave" }, { key: "tipo", label: "Tipo" }, { key: "uso", label: "Uso" }, { key: "estado", label: "Estado de conservación 1–6", type: "number" }, { key: "edad", label: "Edad (años)", type: "number" }, { key: "vidaUtil", label: "Vida útil (años)", type: "number" }, { key: "superficie", label: "Superficie m²", type: "number" }, { key: "costoNuevo", label: "Valor de reposición nuevo $/m²", type: "number" }] },
  obras: { singular: "obra complementaria", max: 3, columns: [{ key: "concepto", label: "Concepto" }, { key: "unidad", label: "Unidad" }, { key: "cantidad", label: "Cantidad", type: "number" }, { key: "costoNuevo", label: "Valor de reposición nuevo $", type: "number" }, { key: "factorConservacion", label: "Factor de conservación 0–1", type: "number" }] },
  fotografias: { singular: "fotografía", max: 8, columns: [{ key: "assetId", label: "Fotografía", type: "asset" }, { key: "pie", label: "Pie", type: "long" }] },
};

/** La fecha de inspección solo se pide si la inspección se realizó. */
export function mostrarCampoValor(key: string, data: Record<string, unknown>) {
  if (key === "fechaInspeccion") return data.inspeccionEstado !== "No realizada";
  return true;
}
