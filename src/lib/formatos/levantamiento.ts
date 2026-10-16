import type { FormatoField } from "./catalog";

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: { value: string; label: string }[]): FormatoField => ({ section, key, label, type: "choice", required: true, options });

export const LEVANTAMIENTO_TABLES = {
  respaldos: { columns: [{ key: "id", label: "ID de fuente o fotografía" }, { key: "descripcion", label: "Documento o zona y descripción" }, { key: "fecha", label: "Fecha" }, { key: "archivo", label: "Ubicación o referencia del archivo" }] },
  discrepancias: { columns: [{ key: "zona", label: "Dato o zona" }, { key: "contraste", label: "Declarado frente a observado o documento" }, { key: "accion", label: "Acción" }, { key: "responsable", label: "Responsable" }] },
  unidades: { columns: [{ key: "id", label: "ID de unidad" }, { key: "tipo", label: "Tipo" }, { key: "uso", label: "Uso actual" }, { key: "area", label: "Área en m², NV o NA" }, { key: "base", label: "Base y referencia del área" }, { key: "ocupacion", label: "Ocupación" }, { key: "accesoMedidor", label: "Acceso o medidor" }] },
} as const;
export type LevantamientoTable = keyof typeof LEVANTAMIENTO_TABLES;
export type LevantamientoRow = Record<string, string>;

const surface = (key: string, label: string): FormatoField[] => [
  field("03 / Superficies y fuentes", `${key}Declarada`, `${label}: superficie declarada en m² o NV`),
  field("03 / Superficies y fuentes", `${key}Documental`, `${label}: superficie documental en m² o NV`),
  field("03 / Superficies y fuentes", `${key}Medida`, `${label}: medida orientativa en m² o NV`),
  field("03 / Superficies y fuentes", `${key}Fuente`, `${label}: documento, página, fecha o método y responsable`, "long"),
];

const service = (key: string, label: string): FormatoField[] => [
  field("06 / Infraestructura disponible", `${key}Situacion`, `${label}: punto de conexión, distancia y situación`, "long"),
  field("06 / Infraestructura disponible", `${key}Base`, `${label}: base y evidencia`, "long"),
];

export const terrenoFields: FormatoField[] = [
  field("Identificación", "folio", "ID de operación o expediente"),
  field("Identificación", "idInmueble", "ID del inmueble"),
  field("Identificación", "unidad", "Unidad o conjunto; NA si es independiente"),
  field("Identificación", "inmueble", "Domicilio observado o referencia física"),
  field("Identificación", "colonia", "Colonia o zona"),
  field("Identificación", "municipioEstado", "Municipio y estado"),
  field("Identificación", "codigoPostal", "Código postal o NV"),
  field("01 / Fotografía principal", "fotoPrincipalId", "Fotografía principal adjunta"),
  field("01 / Fotografía principal", "fechaFoto", "Fecha de la toma", "date"),
  field("01 / Fotografía principal", "horaFoto", "Hora de la toma", "time"),
  field("01 / Fotografía principal", "direccionFoto", "Dirección de la toma"),
  field("01 / Fotografía principal", "usoActual", "Uso actual y base"),
  field("01 / Fotografía principal", "formaPendiente", "Forma y pendiente aparente"),
  field("01 / Fotografía principal", "accesoFisico", "Acceso físico observado"),
  field("02 / Control de la visita", "fechaVisita", "Fecha de visita", "date"),
  field("02 / Control de la visita", "horaInicio", "Hora de inicio", "time"),
  field("02 / Control de la visita", "horaTermino", "Hora de término", "time"),
  field("02 / Control de la visita", "asesor", "Asesor responsable"),
  field("02 / Control de la visita", "finalidad", "Finalidad del levantamiento"),
  field("02 / Control de la visita", "ocupacion", "Ocupación y alcance", "long"),
  field("02 / Control de la visita", "accesoAutorizado", "Acceso autorizado y acompañante por rol", "long"),
  choice("02 / Control de la visita", "permisoFoto", "Permiso para fotografía", [{ value: "autorizado", label: "Autorizado" }, { value: "no_autorizado", label: "No autorizado" }, { value: "NV", label: "No verificado" }]),
  choice("02 / Control de la visita", "permisoMedicion", "Permiso para medición", [{ value: "autorizado", label: "Autorizado" }, { value: "no_autorizado", label: "No autorizado" }, { value: "NV", label: "No verificado" }]),
  field("02 / Control de la visita", "referenciaPermiso", "Referencia de la autorización"),
  ...surface("terreno", "Terreno"),
  ...surface("construcciones", "Construcciones existentes"),
  ...surface("afectacion", "Afectación referida"),
  field("04 / Terreno y entorno físico", "frente", "Frente en metros y base"),
  field("04 / Terreno y entorno físico", "fondo", "Fondo en metros y base"),
  field("04 / Terreno y entorno físico", "otrosFrentes", "Otros frentes en metros o NA"),
  field("04 / Terreno y entorno físico", "orientacion", "Orientación y base"),
  field("04 / Terreno y entorno físico", "linderos", "Linderos visibles frente a documentos", "long"),
  field("04 / Terreno y entorno físico", "cercas", "Cercas, bardas y ocupaciones", "long"),
  field("04 / Terreno y entorno físico", "relieve", "Relieve, taludes, cortes, rellenos, vegetación y escurrimientos", "long"),
  field("05 / Uso de suelo y restricciones", "usoPretendido", "Uso pretendido"),
  field("05 / Uso de suelo y restricciones", "usoAutorizado", "Uso autorizado según documento o NV"),
  field("05 / Uso de suelo y restricciones", "documentoUso", "Documento de uso o zonificación y condiciones o NV", "long"),
  field("05 / Uso de suelo y restricciones", "indices", "COS, CUS, altura o densidad documentados o NV", "long"),
  field("05 / Uso de suelo y restricciones", "afectaciones", "Afectaciones, pasos o líneas visibles o ninguno observado", "long"),
  ...service("agua", "Agua y drenaje"),
  ...service("electricidad", "Electricidad y alumbrado"),
  ...service("vialidad", "Vialidad y pavimento"),
  field("07 / Croquis de ubicación y acceso", "croquisId", "Croquis adjunto"),
  field("07 / Croquis de ubicación y acceso", "coordenadas", "Coordenadas y punto de referencia"),
  field("07 / Croquis de ubicación y acceso", "fuenteCroquis", "Fuente del croquis y fecha"),
  field("07 / Croquis de ubicación y acceso", "accesoEntorno", "Acceso, vialidad y entorno inmediato", "long"),
  choice("08 / Respaldo", "respaldosEstado", "Documentos y fotografías de respaldo", [{ value: "registrados", label: "Hay registros" }, { value: "sin_respaldo", label: "Sin respaldo disponible" }]),
  field("08 / Respaldo", "respaldos", "Fuentes de respaldo", "levantamientoRows", false),
  choice("09 / Discrepancias y pendientes", "discrepanciasEstado", "Discrepancias detectadas", [{ value: "registradas", label: "Hay discrepancias" }, { value: "ninguna", label: "Ninguna detectada dentro del alcance" }]),
  field("09 / Discrepancias y pendientes", "discrepancias", "Discrepancias y acciones", "levantamientoRows", false),
  field("09 / Discrepancias y pendientes", "areasNoAccesibles", "Áreas no accesibles", "long"),
  field("09 / Discrepancias y pendientes", "indiciosEspecialista", "Indicios que requieren especialista", "long"),
  field("09 / Discrepancias y pendientes", "incidentes", "Incidente, suspensión o cambio de alcance", "long"),
  field("09 / Discrepancias y pendientes", "elaboro", "Elaboró la captura"),
  field("09 / Discrepancias y pendientes", "reviso", "Revisó la captura"),
  field("09 / Discrepancias y pendientes", "siguienteAccion", "Siguiente acción"),
  field("09 / Discrepancias y pendientes", "siguienteFecha", "Fecha de la siguiente acción", "date"),
];

export const LEVANTAMIENTO_TITLES = { "04A": "Levantamiento de terreno", "04B": "Levantamiento de casa habitación", "04C": "Levantamiento de departamento", "04D": "Levantamiento de oficina", "04E": "Levantamiento de local comercial", "04F": "Levantamiento de nave o bodega", "04G": "Levantamiento de plaza o conjunto" } as const;
export type LevantamientoId = keyof typeof LEVANTAMIENTO_TITLES;
export const isLevantamiento = (id: string): id is LevantamientoId => Object.hasOwn(LEVANTAMIENTO_TITLES, id);

const BASE_OPTIONS = [{ value: "D", label: "D · Declarado" }, { value: "O", label: "O · Observado" }, { value: "M", label: "M · Medido orientativamente" }, { value: "C", label: "C · Comprobado con evidencia" }, { value: "NV", label: "NV · No verificado" }, { value: "NA", label: "NA · No aplica" }];
const NUMERIC_TECHNICAL_KEYS = new Set(["niveles", "estacionamientos", "numeroUnidades", "recamaras", "banos", "mediosBanos", "cocinas", "cajonesTechados", "cajonesDescubiertos", "cajones", "privados", "salas", "sanitarios", "alturaLibre", "aforo", "frente", "fondo", "alturaTotal", "claroColumnas", "andenes", "rampas", "puertasCarga", "profundidadPatio", "fases", "voltaje", "transformadorKva", "demandaKw"]);
const technical = (section: string, key: string, label: string): FormatoField[] => [field(section, key, label), choice(section, `${key}Base`, `Base de ${label.toLowerCase()}`, BASE_OPTIONS), field(section, `${key}Referencia`, `Referencia de ${label.toLowerCase()}`, "long")];
const textFields = (section: string, items: [string, string][]): FormatoField[] => items.map(([key, label]) => field(section, key, label, "long"));
const technicalFields = (section: string, items: [string, string][]): FormatoField[] => items.flatMap(([key, label]) => technical(section, key, label));
const conditionFields = ["muros", "pisos", "puertas"].flatMap((key, index) => [field("05 / Componentes y condición visible", `${key}Condicion`, `${["Muros y estructura aparente", "Pisos y cubierta", "Puertas y ventanas"][index]}: material o acabado y estado visible`, "long"), field("05 / Componentes y condición visible", `${key}Evidencia`, `${["Muros y estructura aparente", "Pisos y cubierta", "Puertas y ventanas"][index]}: base y evidencia`, "long")]);
const installations = (items: [string, string][], section = "06 / Servicios e instalaciones", detail = "Características y estado de disponibilidad"): FormatoField[] => items.flatMap(([key, label]) => [field(section, `${key}Situacion`, `${label}: ${detail.toLowerCase()}`, "long"), field(section, `${key}Base`, `${label}: base y referencia`, "long")]);
const SURFACES: Record<LevantamientoId, [string, string][]> = {
  "04A": [["terreno", "Terreno"], ["construcciones", "Construcciones existentes"], ["afectacion", "Afectación referida"]],
  "04B": [["terreno", "Terreno"], ["construccion", "Construcción total"], ["patio", "Patio o terraza, precisar"]],
  "04C": [["privativa", "Privativa"], ["construccion", "Construcción"], ["terraza", "Terraza o balcón"], ["bodega", "Bodega o cajón, precisar"]],
  "04D": [["privativa", "Privativa o útil, precisar"], ["rentable", "Rentable según método"], ["estacionamiento", "Estacionamiento o bodega, precisar"]],
  "04E": [["local", "Local privativo"], ["rentable", "Rentable según método"], ["terraza", "Terraza o apoyo, precisar"]],
  "04F": [["terreno", "Terreno"], ["nave", "Nave o almacén"], ["oficinas", "Oficinas y servicios"], ["patio", "Patio de maniobras"]],
  "04G": [["terreno", "Terreno"], ["construccion", "Construcción total"], ["rentable", "Área rentable según método"], ["comunes", "Áreas comunes, precisar"]],
};
const DESCRIPTORS: Record<Exclude<LevantamientoId, "04A">, [string, string][]> = {
  "04B": [["tipoVivienda", "Tipo de vivienda"], ["niveles", "Niveles visibles"], ["estacionamientos", "Estacionamientos"]],
  "04C": [["torre", "Torre"], ["numeroUnidad", "Número de unidad"], ["piso", "Piso"], ["niveles", "Niveles interiores"], ["acceso", "Acceso"], ["elevador", "Elevador"]],
  "04D": [["edificio", "Edificio"], ["piso", "Piso"], ["usoActual", "Uso actual"], ["acceso", "Acceso independiente o común"]],
  "04E": [["giro", "Giro actual"], ["ubicacionConjunto", "Ubicación dentro del conjunto"], ["frenteComercial", "Frente comercial"], ["accesoComercial", "Acceso comercial"]],
  "04F": [["usoActual", "Uso u operación actual"], ["edificio", "Edificio o nave dentro del parque"], ["accesoCarga", "Acceso para carga"]],
  "04G": [["numeroUnidades", "Número de unidades"], ["niveles", "Niveles"], ["accesos", "Accesos"], ["tipoConjunto", "Tipo de conjunto"], ["usoConjunto", "Uso del conjunto"]],
};
const distribution = "04 / Distribución y características";
const DETAILS: Record<Exclude<LevantamientoId, "04A">, FormatoField[]> = {
  "04B": [
    ...technicalFields(distribution, [["recamaras", "Recámaras"], ["banos", "Baños"], ["mediosBanos", "Medios baños"], ["cocinas", "Cocinas"], ["cajonesTechados", "Cajones techados"], ["cajonesDescubiertos", "Cajones sin techar"]]),
    ...textFields(distribution, [["distribucion", "Distribución por planta"], ["espaciosServicio", "Espacios de servicio"], ["ampliaciones", "Ampliaciones según fuente"], ["antiguedad", "Antigüedad según fuente"], ["iluminacion", "Iluminación observada"], ["ventilacion", "Ventilación observada"]]),
    ...conditionFields, ...installations([["agua", "Agua, cisterna y bombeo"], ["drenaje", "Drenaje y gas"], ["electricidad", "Electricidad y medidor"], ["clima", "Climatización y equipo fijo"]]),
  ],
  "04C": [
    ...technicalFields(distribution, [["recamaras", "Recámaras"], ["banos", "Baños"], ["mediosBanos", "Medios baños"], ["cajones", "Número de cajones"]]),
    ...textFields(distribution, [["ubicacionCajones", "Ubicación de cajones"], ["numeroBodega", "Número de bodega"], ["distribucion", "Distribución interior"], ["espaciosComplementarios", "Espacios complementarios"], ["indiviso", "Indiviso y fuente"], ["asignacionAccesorios", "Asignación de accesorios y fuente"], ["areasComunes", "Áreas comunes visitadas"], ["accesibilidad", "Accesibilidad observada"]]),
    ...conditionFields, ...installations([["agua", "Agua y drenaje"], ["medidores", "Medidores individuales o comunes"], ["gasClima", "Gas, clima y telecomunicaciones"]]),
  ],
  "04D": [
    ...technicalFields(distribution, [["privados", "Privados"], ["salas", "Salas de reunión"], ["sanitarios", "Sanitarios"], ["estacionamientos", "Estacionamientos"], ["alturaLibre", "Altura libre en metros"], ["aforo", "Aforo documentado"]]),
    ...textFields(distribution, [["areaAbierta", "Área abierta"], ["recepcion", "Recepción"], ["archivo", "Archivo"], ["divisiones", "Divisiones"], ["accesibilidad", "Accesibilidad"], ["circulacion", "Circulación vertical"], ["horarios", "Horarios"], ["restricciones", "Restricciones"]]),
    ...conditionFields, ...installations([["electricidad", "Electricidad, fases y voltaje"], ["datos", "Voz, datos y canalizaciones"], ["clima", "Clima, ventilación y extracción"], ["agua", "Agua, drenaje y equipo fijo"]]),
  ],
  "04E": [
    ...technicalFields(distribution, [["frente", "Frente en metros"], ["fondo", "Fondo en metros"], ["alturaLibre", "Altura libre en metros"], ["sanitarios", "Sanitarios"]]),
    ...textFields(distribution, [["areaVenta", "Área de venta"], ["bodega", "Bodega"], ["areaServicio", "Área de servicio"], ["escaparate", "Escaparate"], ["anuncio", "Anuncio"], ["acceso", "Acceso"], ["cargaDescarga", "Carga y descarga"], ["estacionamiento", "Estacionamiento"], ["usoAutorizado", "Uso autorizado según fuente o NV"], ["restricciones", "Restricciones y fuente"]]),
    ...conditionFields, ...installations([["electricidad", "Electricidad, fases y voltaje"], ["agua", "Agua, drenaje y trampa de grasas"], ["gas", "Gas, extracción y ventilación"], ["clima", "Clima y equipo fijo incluido"]]),
  ],
  "04F": [
    ...technicalFields("04 / Geometría y construcción", [["alturaLibre", "Altura libre mínima en metros"], ["alturaTotal", "Altura total en metros"], ["claroColumnas", "Claro entre columnas en metros"], ["espesorPiso", "Espesor de piso documentado"], ["cargaPiso", "Carga admisible de piso documentada"]]),
    ...textFields("04 / Geometría y construcción", [["estructura", "Estructura"], ["cubierta", "Cubierta"], ["aislamiento", "Aislamiento"], ["piso", "Piso"], ["oficinas", "Oficinas"], ["sanitarios", "Sanitarios"], ["areasApoyo", "Áreas de apoyo"], ["iluminacion", "Iluminación natural"], ["ventilacion", "Ventilación"]]),
    ...technicalFields("05 / Operación logística", [["andenes", "Andenes"], ["rampas", "Rampas a nivel"], ["puertasCarga", "Puertas de carga"], ["profundidadPatio", "Profundidad útil del patio en metros"]]),
    ...textFields("05 / Operación logística", [["equiposAnden", "Equipos de andén"], ["patio", "Patio de maniobras"], ["accesoTransporte", "Acceso de transporte"], ["maniobra", "Maniobra de transporte"], ["estacionamiento", "Estacionamiento"], ["caseta", "Caseta"], ["racks", "Racks"], ["grua", "Grúa"], ["otrosEquipos", "Otros equipos"]]),
    ...textFields("06 / Condición física visible", [["pisoIndicio", "Piso y estructura: indicio, extensión y fotografía"], ["pisoRevision", "Piso y estructura: revisión necesaria"], ["cubiertaIndicio", "Cubierta y fachadas: indicio, extensión y fotografía"], ["cubiertaRevision", "Cubierta y fachadas: revisión necesaria"]]),
    ...textFields("07 / Electricidad y capacidad", [["alimentacion", "Tipo de alimentación"], ["servicioMedidor", "Servicio y medidor"], ["subestacion", "Subestación"], ["tableros", "Tableros"], ["respaldoElectrico", "Respaldo eléctrico"], ["factibilidad", "Factibilidad o ampliación pendiente"]]),
    ...technicalFields("07 / Electricidad y capacidad", [["fases", "Fases"], ["voltaje", "Voltaje nominal en V"], ["transformadorKva", "Capacidad de transformador en kVA"], ["demandaKw", "Demanda contratada en kW"], ["capacidadDisponible", "Capacidad disponible para el usuario, indicar unidad"]]),
    ...textFields("08 / Agua, drenajes y otros suministros", [["origenAgua", "Origen del agua"], ["modalidadAgua", "Modalidad de suministro"], ["usoAgua", "Uso del agua"], ["infraestructuraAgua", "Infraestructura de agua"], ["caudalPresion", "Caudal o presión documentados con unidad y fuente"], ["drenajeSanitario", "Drenaje sanitario"], ["drenajePluvial", "Drenaje pluvial"], ["descargaProceso", "Descarga de proceso"], ["tratamiento", "Tratamiento"], ["gas", "Gas"], ["aireComprimido", "Aire comprimido"], ["otrosSuministros", "Otros suministros"]]),
    ...installations([["contraIncendio", "Contra incendio"], ["ventilacion", "Ventilación y extracción"], ["clima", "Climatización"], ["telecom", "Telecomunicaciones"]], "09 / Sistemas especiales y seguridad visible", "Equipos visibles, capacidad documentada o NV"),
    field("09 / Sistemas especiales y seguridad visible", "limitacionesInformes", "Limitaciones e informes técnicos necesarios", "long"),
  ],
  "04G": [
    choice("04 / Unidades del conjunto", "unidadesEstado", "Alcance del registro de unidades", [{ value: "completo", label: "Completo dentro del conjunto identificado" }, { value: "parcial", label: "Parcial" }, { value: "NV", label: "No verificado" }]),
    field("04 / Unidades del conjunto", "unidades", "Unidades del conjunto", "levantamientoRows", false),
    field("04 / Unidades del conjunto", "unidadesLimitacion", "Alcance y limitaciones del registro de unidades", "long"),
    ...textFields("05 / Áreas comunes y funcionamiento", [["estacionamiento", "Estacionamiento"], ["accesoPublico", "Acceso de público"], ["cargaDescarga", "Carga y descarga"], ["circulacionServicio", "Circulación de servicio"], ["sanitarios", "Sanitarios"], ["elevadores", "Elevadores"], ["accesibilidad", "Accesibilidad"], ["senales", "Señalización"], ["fachadas", "Fachadas"], ["mantenimiento", "Mantenimiento"]]),
    ...installations([["electricidad", "Electricidad"], ["agua", "Agua, drenaje y bombeo"], ["seguridad", "Seguridad y contra incendio"]], "06 / Servicios comunes y por unidad", "Medición individual o común y capacidad"),
  ],
};

export function levantamientoFields(id: LevantamientoId): FormatoField[] {
  if (id === "04A") return terrenoFields;
  const tail = terrenoFields.filter((item) => item.section?.startsWith("07") || item.section?.startsWith("08") || item.section?.startsWith("09"));
  return [
    ...terrenoFields.filter((item) => item.section === "Identificación" || item.section === "01 / Fotografía principal" && !["usoActual", "formaPendiente", "accesoFisico"].includes(item.key)),
    ...technicalFields("01 / Fotografía principal", DESCRIPTORS[id]),
    ...terrenoFields.filter((item) => item.section === "02 / Control de la visita"),
    ...SURFACES[id].flatMap(([key, label]) => surface(key, label)), ...DETAILS[id],
    ...tail.map((item) => id === "04F" ? { ...item, section: item.section!.replace(/^07/, "10").replace(/^08/, "11").replace(/^09/, "12") } : item),
  ];
}

export function validarLevantamiento(id: LevantamientoId, data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const key of ["fotoPrincipalId", "croquisId"]) if (typeof data[key] !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(data[key] as string)) errors.push(key === "fotoPrincipalId" ? "Selecciona la fotografía principal adjunta" : "Selecciona el croquis adjunto");
  if (typeof data.horaInicio === "string" && typeof data.horaTermino === "string" && data.horaTermino <= data.horaInicio) errors.push("Hora de término posterior al inicio");
  if (data.permisoFoto !== "autorizado") errors.push("Autorización de la fotografía principal");
  for (const [key] of SURFACES[id]) for (const suffix of ["Declarada", "Documental", "Medida"]) {
    const value = data[`${key}${suffix}`];
    if (typeof value !== "string" || !/^(?:NV|NA|\d+(?:[.,]\d+)?)$/i.test(value.trim())) errors.push(`${key}: superficie ${suffix.toLowerCase()} debe ser un valor no negativo, NV o NA`);
    if (suffix === "Medida" && data.permisoMedicion !== "autorizado" && !/^(NV|NA)$/i.test(String(value).trim())) errors.push(`${key}: no se registra medición sin autorización`);
  }
  const technicalKeys = levantamientoFields(id).filter((item) => item.type === "choice" && item.options === BASE_OPTIONS).map((item) => item.key.replace(/Base$/, ""));
  for (const key of technicalKeys) {
    const value = String(data[key] ?? "").trim();
    const base = data[`${key}Base`];
    if ((["NV", "NA"].includes(String(base)) || ["NV", "NA"].includes(value.toUpperCase())) && value.toUpperCase() !== base) errors.push(`${key}: valor y base deben coincidir cuando es NV o NA`);
    if (NUMERIC_TECHNICAL_KEYS.has(key) && !/^(?:NV|NA|\d+(?:[.,]\d+)?)$/i.test(value)) errors.push(`${key}: valor numérico no negativo, NV o NA`);
    if (["C", "M"].includes(String(base)) && /^(?:NV|NA|pendiente)?$/i.test(String(data[`${key}Referencia`] ?? "").trim())) errors.push(`${key}: identifica la evidencia o método que respalda la base`);
    if (data[`${key}Base`] === "M" && data.permisoMedicion !== "autorizado") errors.push(`${key}: no se registra medición sin autorización`);
  }
  const tables: [LevantamientoTable, string, string[]][] = [["respaldos", "respaldosEstado", ["registrados"]], ["discrepancias", "discrepanciasEstado", ["registradas"]]];
  if (id === "04G") tables.push(["unidades", "unidadesEstado", ["completo", "parcial"]]);
  for (const [key, state, active] of tables) {
    const rows = data[key];
    if (active.includes(String(data[state]))) {
      if (!Array.isArray(rows) || rows.length === 0 || rows.length > 30) { errors.push(`${key}: registra entre 1 y 30 filas`); continue; }
      rows.forEach((row, index) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) { errors.push(`${key}, fila ${index + 1}`); return; }
        for (const column of LEVANTAMIENTO_TABLES[key].columns) {
          const value = (row as Record<string, unknown>)[column.key];
          if (typeof value !== "string" || !value.trim()) errors.push(`${key}, fila ${index + 1}: ${column.label}`);
          if (column.key === "fecha") {
            const parsed = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : new Date(NaN);
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) errors.push(`${key}, fila ${index + 1}: fecha válida`);
          }
        }
        if (key === "unidades" && !/^(?:NV|NA|\d+(?:[.,]\d+)?)$/i.test(String((row as Record<string, unknown>).area).trim())) errors.push(`unidades, fila ${index + 1}: área válida`);
      });
      if (key === "unidades") {
        const unitIds = rows.map((row) => String((row as Record<string, unknown>)?.id ?? "").trim().toLowerCase());
        if (new Set(unitIds).size !== unitIds.length) errors.push("unidades: ID duplicado");
        if (data.unidadesEstado === "completo" && /^\d+$/.test(String(data.numeroUnidades)) && Number(data.numeroUnidades) !== rows.length) errors.push("El número de unidades no coincide con el registro completo");
      }
    } else if (Array.isArray(rows) && rows.length) errors.push(`${key}: el estado contradice los registros`);
  }
  return errors;
}
