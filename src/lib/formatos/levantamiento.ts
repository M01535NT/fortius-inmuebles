import type { FormatoField } from "./catalog";

/*
  04A–04G · Levantamiento sobre la plantilla de Word de cada tipo de inmueble
  (G:\Mi unidad\FORTIUS\04_Metodologia\01_Captacion\04x_Levantamiento*.docx), capturado sobre el
  documento en vivo (EXT-12, DEC-31). Decisiones del titular que se aplican a los siete:
  - 17/10/2026: es la inspección visual de un asesor, no un peritaje; superficies, medidas y
    colindancias son opcionales porque salen de la escritura en la revisión jurídica (05).
  - 27/10/2026: sin columnas de base y referencia (D/O/M/C/NV/NA), sin tablas de respaldos ni de
    discrepancias, con uso de suelo; acomodo del Word del 04A, sin huecos ni título repetido.
    Las listas con diagonales que son opciones van como casillas o menú; las que piden varios
    datos se parten en campos. El ID de operación (EXP-…) y el del inmueble (FORTIUS-…) los pone
    el sistema; el de la fotografía sale del archivo elegido.
  Cada tipo se describe una vez (PLANTILLAS): de ahí salen sus campos y su documento.
*/

type Opcion = { value: string; label: string };
const options = (values: readonly [string, string][]): Opcion[] => values.map(([value, label]) => ({ value, label }));

/** Campo de una celda impresa. «corto»: rótulo que se imprime junto al dato cuando la celda lleva varios. */
export type Campo = { key: string; label: string; type?: FormatoField["type"]; options?: readonly Opcion[]; required?: boolean; corto?: string; sistema?: boolean };
/** Celda impresa: su pregunta, su ancho relativo y los campos que la llenan; «marcas» dibuja las opciones como casillas. */
export type Celda = { q: string; w: number; campos: Campo[]; marcas?: boolean };
export type Parte =
  | { kind: "form"; label?: string; rows: Celda[][] }
  /** Tabla de la plantilla: un campo por renglón y columna («claveRenglón» + sufijo). */
  | { kind: "tabla"; label: string; header: string; widths: number[]; rows: ReadonlyArray<readonly [string, string]>; columns: ReadonlyArray<readonly [string, string]> }
  | { kind: "unidades"; label: string }
  | { kind: "foto"; extra: Celda[] }
  | { kind: "croquis"; label: string }
  | { kind: "nota"; text: string }
  /** Título de grupo de hojas («Características del inmueble») con su banda. */
  | { kind: "grupo"; text: string };

export const LEVANTAMIENTO_TABLES = {
  unidades: { columns: [{ key: "id", label: "ID unidad" }, { key: "tipo", label: "Tipo y uso actual" }, { key: "area", label: "Área m²" }, { key: "ocupacion", label: "Ocupación" }, { key: "acceso", label: "Acceso o medidor" }] },
} as const;
export type LevantamientoTable = keyof typeof LEVANTAMIENTO_TABLES;
export type LevantamientoRow = Record<string, string>;

export const LEVANTAMIENTO_TITLES = { "04A": "Levantamiento de terreno", "04B": "Levantamiento de casa habitación", "04C": "Levantamiento de departamento", "04D": "Levantamiento de oficina", "04E": "Levantamiento de local comercial", "04F": "Levantamiento de nave o bodega", "04G": "Levantamiento de plaza o conjunto" } as const;
export type LevantamientoId = keyof typeof LEVANTAMIENTO_TITLES;
export const isLevantamiento = (id: string): id is LevantamientoId => Object.hasOwn(LEVANTAMIENTO_TITLES, id);
export const LEVANTAMIENTO_TIPO: Record<LevantamientoId, string> = { "04A": "Terreno", "04B": "Casa habitación", "04C": "Departamento", "04D": "Oficina", "04E": "Local comercial", "04F": "Nave o bodega", "04G": "Plaza o conjunto" };
/** Claves que se eligen entre las imágenes adjuntas, no como texto. */
export const LEVANTAMIENTO_IMAGE_KEYS = ["fotoPrincipalId", "croquisId"] as const;

// Zonas del Reglamento de Zonificación y Usos del Suelo del Centro de Población de Tijuana
// (P.O. 03/09/2010, última reforma P.O. 49 del 14/08/2020): art. 49 (suelo urbano y urbanizable)
// y art. 43 (agropecuaria y especial de conservación). Misma lista que usa la opinión de valor (07).
export const USO_SUELO = options([
  ["habitacional", "Habitacional"], ["comercio_servicios", "Comercio y servicios"], ["mixto", "Mixto"], ["industrial", "Industrial"],
  ["equipamiento", "Equipamiento urbano"], ["turistico", "Turístico"], ["agropecuario", "Agropecuario"], ["conservacion", "Especial de conservación"],
  ["no_sabe", "No lo sé todavía"],
]);
/** Casillas impresas en la plantilla del 04A (la más reciente), comunes a los siete. */
export const OPCIONES = {
  finalidad: options([["venta", "Venta"], ["renta", "Renta"], ["valoracion", "Valoración"], ["administracion", "Administración"], ["actualizacion", "Actualización"]]),
  ocupacion: options([["ocupado", "Ocupado"], ["vacio", "Vacío"], ["parcial", "Ocupación parcial"], ["no_verificado", "No se pudo ver"]]),
  alcance: options([["completa", "Visita completa"], ["parcial", "Visita parcial"], ["suspendida", "Suspendida"]]),
  acceso: options([["si", "Sí"], ["no", "No"], ["pendiente", "Pendiente"]]),
  siNo: options([["si", "Sí"], ["no", "No"]]),
  incidente: options([["sin_incidente", "Sin incidente observado"], ["suspendida", "Suspendida"], ["cancelada", "Cancelada"], ["cambio_finalidad", "Cambio de finalidad"]]),
} as const;

const t = (key: string, label: string, corto?: string): Campo => ({ key, label, ...(corto ? { corto } : {}) });
const n = (key: string, label: string, required = false, corto?: string): Campo => ({ key, label, type: "number", required, ...(corto ? { corto } : {}) });
const largo = (key: string, label: string, corto?: string): Campo => ({ key, label, type: "long", ...(corto ? { corto } : {}) });
const fecha = (key: string, label: string, corto?: string): Campo => ({ key, label, type: "date", ...(corto ? { corto } : {}) });
const una = (key: string, label: string, opts: readonly Opcion[], required = false, corto?: string): Campo => ({ key, label, type: "choice", options: opts, required, ...(corto ? { corto } : {}) });
const varias = (key: string, label: string, opts: readonly Opcion[], corto?: string): Campo => ({ key, label, type: "multi", options: opts, ...(corto ? { corto } : {}) });
const celda = (q: string, w: number, ...campos: Campo[]): Celda => ({ q, w, campos });
const casillas = (q: string, w: number, ...campos: Campo[]): Celda => ({ q, w, campos, marcas: true });
/** Una celda con su campo del mismo nombre. */
const sola = (campo: Campo, w: number): Celda => celda(campo.label, w, campo);
const sup = (rows: Array<[string, string, boolean?]>): Parte => ({
  kind: "form", label: "03 Superficies, si las tienes a la mano",
  rows: [rows.map(([key, label, texto]) => sola(texto ? t(key, label) : n(key, `${label} en m²`), 6 / rows.length))],
});
const SUP_NOTA: Parte = { kind: "nota", text: "Las superficies, medidas y colindancias que no se tomaron en la visita se toman de la escritura y los demás documentos en la revisión jurídica (05)." };
const COMPONENTES: Parte = { kind: "tabla", label: "05 Componentes y condición visible", header: "Componente", widths: [2088, 8136], rows: [["muros", "Muros y estructura aparente"], ["pisos", "Pisos y cubierta"], ["puertas", "Puertas y ventanas"]], columns: [["Estado", "Material o acabado y estado visible"]] };
const servicios = (label: string, rows: ReadonlyArray<readonly [string, string]>, column = "Características y estado de disponibilidad"): Parte => ({ kind: "tabla", label, header: "Servicio", widths: [2016, 8208], rows, columns: [["Estado", column]] });
const SERV_NOTA: Parte = { kind: "nota", text: "Distinguir servicio conectado, solo visible, declarado, pendiente o NA. La presencia de equipo no acredita funcionamiento ni capacidad." };

/** Identificación, fotografía principal y control de la visita: iguales en los siete, salvo el renglón propio de la foto. */
function inicio(extra: Celda[]): Parte[] {
  return [
    { kind: "form", rows: [
      [celda("ID inmueble", 2, { key: "idInmueble", label: "ID inmueble", sistema: true }), celda("ID operación", 2, { key: "folio", label: "ID operación", required: true, sistema: true }), sola(t("unidadConjunto", "Unidad o conjunto"), 2)],
      [sola({ key: "inmueble", label: "Domicilio observado o referencia física", required: true }, 6)],
      [sola(t("colonia", "Colonia o zona"), 2.5), sola(t("municipioEstado", "Municipio y estado"), 2.5), sola(t("codigoPostal", "C. P."), 1)],
      [sola(una("usoSuelo", "Uso de suelo", USO_SUELO, true), 6)],
    ] },
    { kind: "foto", extra },
    { kind: "form", label: "02 Control de la visita", rows: [
      [sola({ key: "fechaVisita", label: "Fecha de visita", type: "date", required: true }, 2), celda("Hora inicio y término", 2, { key: "horaInicio", label: "Hora de inicio", type: "time", corto: "Inicio" }, { key: "horaTermino", label: "Hora de término", type: "time", corto: "Término" }), sola({ key: "asesor", label: "Asesor responsable", required: true }, 2)],
      [casillas("Finalidad del levantamiento", 3, una("finalidad", "Finalidad del levantamiento", OPCIONES.finalidad)), casillas("Ocupación y alcance", 3, una("ocupacion", "Ocupación", OPCIONES.ocupacion, true), una("alcance", "Alcance de la visita", OPCIONES.alcance, true))],
      [casillas("Acceso autorizado y acompañante por rol", 3, una("accesoAutorizado", "Acceso autorizado", OPCIONES.acceso), t("acompananteRol", "Rol del acompañante", "Rol")),
        casillas("Permiso para foto y medición", 3, una("permisoFoto", "Permiso para foto", OPCIONES.siNo, false, "Foto"), una("permisoMedicion", "Permiso para medición", OPCIONES.siNo, false, "Medición"), t("restriccion", "Restricción", "Restricción"))],
    ] },
    { kind: "nota", text: "Inspección visual no pericial. No certifica superficies, seguridad ni uso autorizado. Ante riesgo suspenda el recorrido, registre lo ocurrido y derive a revisión competente." },
    { kind: "grupo", text: "Características del inmueble" },
  ];
}
/** Croquis, pendientes y cierre: iguales en los siete; «primero» es el número de la sección del croquis. */
function cierre(primero: number): Parte[] {
  const num = (k: number) => String(primero + k).padStart(2, "0");
  return [
    { kind: "grupo", text: "Ubicación y evidencias" },
    { kind: "croquis", label: `${num(0)} Croquis de ubicación y acceso` },
    { kind: "form", rows: [
      [celda("Coordenadas y punto de referencia", 3, t("latitud", "Latitud", "Latitud"), t("longitud", "Longitud", "Longitud")), celda("Fuente del croquis y fecha", 3, t("croquisFuente", "Fuente del croquis", "Fuente"), fecha("croquisFecha", "Fecha del croquis", "Fecha"))],
      [celda("Acceso, vialidad y entorno inmediato", 6, t("ruta", "Ruta", "Ruta"), t("referencias", "Referencias", "Referencias"), t("barreras", "Barreras", "Barreras"), t("transito", "Tránsito", "Tránsito"), t("ruido", "Ruido", "Ruido"), t("clima", "Clima", "Clima"))],
    ] },
    { kind: "form", label: `${num(1)} Pendientes y siguiente acción`, rows: [
      [celda("Áreas no accesibles e indicios que requieren especialista", 6, t("noAccesibleZona", "Zona no accesible", "Zona"), t("noAccesibleMotivo", "Motivo", "Motivo"), t("noAccesibleFoto", "Foto de referencia", "Foto"), t("especialista", "Especialista que se requiere", "Especialista"))],
      [casillas("Incidente, suspensión o cambio de alcance", 6, una("incidente", "Incidente, suspensión o cambio de alcance", OPCIONES.incidente), t("incidenteMotivo", "Motivo del incidente", "Motivo"), t("incidenteAccion", "Acción tomada", "Acción"), t("versionAnterior", "Referencia de la versión anterior", "Versión anterior"))],
      [celda("Elaboró y revisó la captura", 3, t("elaboro", "Elaboró", "Elaboró"), t("reviso", "Revisó", "Revisó")), celda("Siguiente acción y fecha", 3, t("siguienteAccion", "Siguiente acción", "Acción"), fecha("fechaSiguiente", "Fecha de la siguiente acción", "Fecha"))],
    ] },
  ];
}
const tipoVivienda = (key: string) => ({ key, label: "Tipo de vivienda", required: true });

export const PLANTILLAS: Record<LevantamientoId, Parte[]> = {
  "04A": [
    ...inicio([sola({ key: "usoActual", label: "Uso actual", required: true }, 2), sola(t("formaPendiente", "Forma y pendiente aparente"), 2), sola(t("accesoFisico", "Acceso físico observado"), 2)]),
    sup([["superficieTerreno", "Terreno"], ["superficieConstrucciones", "Construcciones existentes"], ["afectacionReferida", "Afectación referida (precisar)", true]]), SUP_NOTA,
    { kind: "form", label: "04 Terreno y entorno físico", rows: [
      [sola(n("frente", "Frente en m"), 1.5), sola(n("fondo", "Fondo en m"), 1.5), sola(t("otrosFrentes", "Otros frentes en m"), 1.5), sola(t("orientacion", "Orientación"), 1.5)],
      [sola(t("linderos", "Linderos visibles frente a documentos"), 3), sola(t("cercas", "Cercas, bardas y ocupaciones"), 3)],
      [celda("Relieve, taludes, cortes, rellenos, vegetación y escurrimientos", 6, t("relieveDescripcion", "Relieve: descripción", "Descripción"), t("relieveUbicacion", "Relieve: ubicación", "Ubicación"), t("relieveFoto", "Relieve: foto", "Foto"))],
    ] },
    { kind: "form", label: "05 Uso de suelo y restricciones por verificar", rows: [
      [sola(t("usoPretendido", "Uso pretendido"), 3), casillas("Uso autorizado según documento", 3, una("usoDocumento", "Uso autorizado según documento", options([["identificado", "Documento identificado"], ["pendiente", "Pendiente"]])))],
      [celda("Documento de uso o zonificación y condiciones", 6, t("zonDocTipo", "Tipo de documento de uso", "Tipo"), t("zonDocAutoridad", "Autoridad que lo emitió", "Autoridad"), t("zonDocFolio", "Folio del documento de uso", "Folio"), fecha("zonDocFecha", "Fecha del documento de uso", "Fecha"), t("zonDocUso", "Uso literal", "Uso literal"))],
      [celda("COS, CUS, altura o densidad documentados", 3, t("cos", "COS", "COS"), t("cus", "CUS", "CUS"), t("alturaMaxima", "Altura máxima", "Altura"), t("densidad", "Densidad", "Densidad")),
        celda("Afectaciones, pasos o líneas visibles", 3, t("afectaciones", "Afectaciones visibles", "Descripción"), t("afectacionesRevision", "Revisión pendiente de afectaciones", "Revisión pendiente"))],
    ] },
    servicios("06 Infraestructura disponible", [["agua", "Agua y drenaje"], ["electricidad", "Electricidad y alumbrado"], ["vialidad", "Vialidad y pavimento"]], "Punto de conexión, distancia y situación"),
    { kind: "nota", text: "La cercanía de una red no acredita factibilidad ni capacidad. La observación no confirma linderos, servidumbres ni el uso autorizado." },
    ...cierre(7),
  ],
  "04B": [
    ...inicio([sola(tipoVivienda("tipoVivienda"), 2), sola(n("niveles", "Niveles visibles", true), 2), sola(t("estacionamientos", "Estacionamientos"), 2)]),
    sup([["superficieTerreno", "Terreno"], ["superficieConstruccion", "Construcción total"], ["patioTerraza", "Patio o terraza (precisar)", true]]), SUP_NOTA,
    { kind: "form", label: "04 Distribución y características", rows: [
      [sola(n("recamaras", "Recámaras", true), 1), sola(n("banos", "Baños", true), 1), sola(n("mediosBanos", "Medios baños"), 1), sola(n("cocinas", "Cocinas"), 1), sola(n("cajonesTechados", "Cajones techados"), 1), sola(n("cajonesSinTechar", "Cajones sin techar"), 1)],
      [casillas("Distribución por planta y espacios de servicio", 6, t("plantaBaja", "Planta baja", "Planta baja"), t("plantaAlta", "Planta alta", "Alta"), t("otrosNiveles", "Otros niveles", "Otros niveles"),
        varias("espaciosServicio", "Espacios de servicio", options([["sala", "Sala"], ["comedor", "Comedor"], ["lavado", "Lavado"], ["bodega", "Bodega"], ["patio", "Patio"], ["jardin", "Jardín"], ["terraza", "Terraza"]])))],
      [celda("Ampliaciones y antigüedad", 3, t("ampliaciones", "Ampliaciones", "Ampliaciones"), t("antiguedad", "Antigüedad", "Antigüedad")), sola(t("iluminacionVentilacion", "Iluminación y ventilación observadas"), 3)],
    ] },
    COMPONENTES,
    servicios("06 Servicios e instalaciones", [["agua", "Agua, cisterna y bombeo"], ["drenaje", "Drenaje y gas"], ["electricidad", "Electricidad y medidor"], ["clima", "Climatización y equipo fijo"]]), SERV_NOTA,
    ...cierre(7),
  ],
  "04C": [
    ...inicio([celda("Torre y unidad", 2, t("torre", "Torre", "Torre"), t("unidadDepartamento", "Número de unidad", "Unidad")), celda("Piso y niveles interiores", 2, { key: "piso", label: "Piso", required: true, corto: "Piso" }, n("nivelesInteriores", "Niveles interiores", false, "Niveles")), casillas("Acceso y elevador", 2, t("accesoEdificio", "Acceso al edificio", "Acceso"), una("elevador", "Elevador", OPCIONES.siNo, false, "Elevador"))]),
    sup([["superficiePrivativa", "Privativa"], ["superficieConstruccion", "Construcción"], ["superficieTerraza", "Terraza o balcón"], ["bodegaCajon", "Bodega o cajón (precisar)", true]]), SUP_NOTA,
    { kind: "form", label: "04 Distribución y características", rows: [
      [sola(n("recamaras", "Recámaras", true), 1.5), celda("Baños y medios baños", 1.5, n("banos", "Baños", true, "Baños"), n("mediosBanos", "Medios baños", false, "Medios")), celda("Cajones y ubicación", 1.5, n("cajones", "Cajones", false, "Cajones"), t("cajonesUbicacion", "Ubicación de los cajones", "Ubicación")), celda("Bodega y número", 1.5, t("bodegaNumero", "Bodega y número"))],
      [casillas("Distribución interior y espacios complementarios", 6, varias("espacios", "Espacios interiores", options([["sala", "Sala"], ["comedor", "Comedor"], ["cocina", "Cocina"], ["lavado", "Lavado"], ["terraza", "Terraza"], ["otros", "Otros"]])), t("espaciosOtros", "Otros espacios", "Otros"))],
      [sola(t("indiviso", "Indiviso y asignación de accesorios (porcentaje)"), 3), celda("Áreas comunes visitadas y accesibilidad", 3, t("escaleras", "Escaleras", "Escaleras"), t("amenidades", "Amenidades", "Amenidades"), t("barrerasAcceso", "Barreras de accesibilidad", "Barreras"))],
    ] },
    COMPONENTES,
    servicios("06 Servicios e instalaciones", [["agua", "Agua y drenaje"], ["medidores", "Medidores individuales o comunes"], ["gas", "Gas, clima y telecomunicaciones"]]), SERV_NOTA,
    ...cierre(7),
  ],
  "04D": [
    ...inicio([celda("Edificio y piso", 2, t("edificio", "Edificio", "Edificio"), { key: "piso", label: "Piso", required: true, corto: "Piso" }), sola(t("usoActual", "Uso actual"), 2), casillas("Acceso independiente o común", 2, una("acceso", "Acceso independiente o común", options([["independiente", "Independiente"], ["comun", "Común"]]), true))]),
    sup([["superficiePrivativa", "Privativa o útil (precisar)", true], ["superficieRentable", "Rentable según método", true], ["estacionamientoBodega", "Estac. o bodega (precisar)", true]]), SUP_NOTA,
    { kind: "form", label: "04 Distribución y características", rows: [
      [sola(n("privados", "Privados"), 1.5), sola(n("salas", "Salas de reunión"), 1.5), celda("Sanitarios", 1.5, n("sanitariosPropios", "Sanitarios propios", false, "Propios"), n("sanitariosComunes", "Sanitarios comunes", false, "Comunes")), celda("Estacionamientos", 1.5, n("estacionamientosAsignados", "Estacionamientos asignados", false, "Asignados"), n("estacionamientosComunes", "Estacionamientos comunes", false, "Comunes"))],
      [sola(t("areaAbierta", "Área abierta, recepción y archivo"), 3), celda("Altura libre en m y divisiones", 3, n("alturaLibre", "Altura libre en m", false, "Altura"), t("divisiones", "Divisiones", "Divisiones"))],
      [casillas("Accesibilidad y circulación vertical", 3, varias("circulacion", "Accesibilidad y circulación vertical", options([["rampas", "Rampas"], ["escaleras", "Escaleras"], ["elevador", "Elevador"]]))), sola(t("aforo", "Aforo, horarios y restricciones"), 3)],
    ] },
    COMPONENTES,
    servicios("06 Servicios e instalaciones", [["electricidad", "Electricidad, fases y voltaje"], ["datos", "Voz, datos y canalizaciones"], ["clima", "Clima, ventilación y extracción"], ["agua", "Agua, drenaje y equipo fijo"]]), SERV_NOTA,
    ...cierre(7),
  ],
  "04E": [
    ...inicio([sola({ key: "giro", label: "Giro actual", required: true }, 2), sola(t("ubicacion", "Ubicación dentro del conjunto"), 2), sola(t("frenteAcceso", "Frente y acceso comercial"), 2)]),
    sup([["superficieLocal", "Local privativo"], ["superficieRentable", "Rentable según método", true], ["superficieTerraza", "Terraza o apoyo (precisar)", true]]), SUP_NOTA,
    { kind: "form", label: "04 Distribución y características", rows: [
      [sola(n("frente", "Frente en m"), 1.5), sola(n("fondo", "Fondo en m"), 1.5), sola(n("alturaLibre", "Altura libre en m"), 1.5), celda("Sanitarios", 1.5, n("sanitariosPropios", "Sanitarios propios", false, "Propios"), n("sanitariosComunes", "Sanitarios comunes", false, "Comunes"))],
      [sola(t("distribucion", "Área de venta, bodega y servicio"), 3), sola(t("escaparate", "Escaparate, anuncio y acceso"), 3)],
      [sola(t("cargaDescarga", "Carga, descarga y estacionamiento"), 3), celda("Uso autorizado y restricciones", 3, t("usoDocumentoLocal", "Documento del uso autorizado", "Documento"), t("giroAutorizado", "Giro autorizado", "Giro"), t("horario", "Horario autorizado", "Horario"))],
    ] },
    COMPONENTES,
    servicios("06 Servicios e instalaciones", [["electricidad", "Electricidad, fases y voltaje"], ["agua", "Agua, drenaje y trampa de grasas"], ["gas", "Gas, extracción y ventilación"], ["clima", "Clima y equipo fijo incluido"]]), SERV_NOTA,
    ...cierre(7),
  ],
  "04F": [
    ...inicio([sola({ key: "usoActual", label: "Uso u operación actual", required: true }, 2), sola(t("parque", "Edificio o nave dentro del parque"), 2), sola(t("accesoCarga", "Acceso para carga"), 2)]),
    sup([["superficieTerreno", "Terreno"], ["superficieNave", "Nave o almacén"], ["superficieOficinas", "Oficinas y servicios"], ["superficiePatio", "Patio de maniobras"]]), SUP_NOTA,
    { kind: "form", label: "04 Geometría y construcción", rows: [
      [sola(n("alturaLibre", "Altura libre mínima en m"), 2), sola(n("alturaTotal", "Altura total en m"), 2), sola(n("claroColumnas", "Claro entre columnas en m"), 2)],
      [sola(t("estructura", "Estructura, cubierta y aislamiento"), 3), celda("Piso, espesor y carga documentada", 3, t("pisoEspesor", "Espesor del piso", "Espesor"), t("pisoCarga", "Carga documentada del piso (con unidad)", "Carga"))],
      [sola(t("oficinasApoyo", "Oficinas, sanitarios y áreas de apoyo"), 3), sola(t("iluminacionVentilacion", "Iluminación natural y ventilación"), 3)],
    ] },
    { kind: "form", label: "05 Operación logística", rows: [
      [sola(n("andenes", "Andenes"), 1.5), sola(n("rampas", "Rampas a nivel"), 1.5), sola(t("puertasCarga", "Puertas de carga (ancho x alto en m)"), 1.5), sola(t("equiposAnden", "Equipos de andén"), 1.5)],
      [sola(n("patioProfundidad", "Patio y profundidad útil en m"), 3), celda("Acceso y maniobra de transporte", 3, t("tipoVehiculo", "Tipo de vehículo", "Vehículo"), t("restriccionTransporte", "Restricción de transporte", "Restricción"))],
      [sola(t("estacionamientoCaseta", "Estacionamiento y caseta"), 3), casillas("Racks, grúa u otros equipos", 3, t("equipos", "Racks, grúa u otros equipos", "Equipos"), varias("equiposCondicion", "Condición de los equipos", options([["fijo", "Fijo"], ["mueble", "Mueble"], ["incluido", "Incluido"], ["pendiente", "Pendiente"]])))],
    ] },
    { kind: "tabla", label: "06 Condición física visible", header: "Zona o componente", widths: [2088, 4968, 3168], rows: [["pisoEstructura", "Piso y estructura"], ["cubierta", "Cubierta y fachadas"]], columns: [["Indicio", "Indicio, extensión y fotografía"], ["Revision", "Revisión necesaria"]] },
    { kind: "nota", text: "No se deduce la carga admisible del piso por su apariencia ni se prueba maquinaria durante esta visita." },
    { kind: "grupo", text: "Instalaciones industriales" },
    { kind: "form", label: "07 Electricidad y capacidad", rows: [
      [casillas("Tipo de alimentación", 2, una("alimentacion", "Tipo de alimentación", options([["baja", "Baja tensión"], ["media", "Media tensión"], ["no_verificado", "No se pudo ver"]]))), celda("Fases y voltaje nominal en V", 2, t("fases", "Fases", "Fases"), t("voltaje", "Voltaje nominal en V", "Voltaje")), casillas("Servicio y medidor", 2, una("medidor", "Servicio y medidor", options([["individual", "Individual"], ["compartido", "Compartido"], ["no_verificado", "No se pudo ver"]])))],
      [sola(n("transformadorKva", "Capacidad de transformador en kVA"), 2), sola(n("demandaKw", "Demanda contratada en kW"), 2), sola(t("capacidadDisponible", "Capacidad disponible para usuario (con unidad)"), 2)],
      [celda("Subestación, tableros y respaldo", 3, t("subestacionUbicacion", "Ubicación de subestación y tableros", "Ubicación"), t("subestacionEstado", "Estado visible de subestación y tableros", "Estado visible")),
        celda("Factibilidad o ampliación pendiente", 3, t("factibilidadEmisor", "Emisor de la factibilidad", "Emisor"), t("factibilidadFolio", "Folio de la factibilidad", "Folio"), fecha("factibilidadFecha", "Fecha de la factibilidad", "Fecha"), t("factibilidadCondiciones", "Condiciones de la factibilidad", "Condiciones"))],
    ] },
    { kind: "nota", text: "kVA expresa potencia aparente; kW, potencia activa. No son intercambiables. La placa del transformador no acredita capacidad disponible ni factibilidad del suministro." },
    { kind: "form", label: "08 Agua, drenajes y otros suministros", rows: [
      [casillas("Origen del agua y modalidad", 3, varias("origenAgua", "Origen del agua", options([["red", "Red"], ["pozo", "Pozo"], ["pipa", "Pipa"], ["otro", "Otro"], ["no_verificado", "No se pudo ver"]])), una("modalidadAgua", "Modalidad del agua", options([["exclusiva", "Exclusiva"], ["compartida", "Compartida"]]))),
        casillas("Uso del agua e infraestructura", 3, varias("usoAgua", "Uso del agua", options([["sanitario", "Sanitario"], ["proceso", "Proceso"], ["otro", "Otro"]])), varias("infraestructuraAgua", "Infraestructura de agua", options([["medidor", "Medidor"], ["cisterna", "Cisterna"], ["bombeo", "Bombeo"]])))],
      [sola(t("caudal", "Caudal o presión documentados (con unidad)"), 3), casillas("Drenaje sanitario y pluvial", 3, t("drenajeDestino", "Destino del drenaje", "Destino"), una("drenajeTipo", "Drenaje separado o combinado", options([["separado", "Separado"], ["combinado", "Combinado"]])))],
      [celda("Descarga de proceso y tratamiento", 3, t("descargaSistema", "Sistema de descarga y tratamiento", "Sistema"), t("descargaCondicion", "Condición de la descarga", "Condición")), celda("Gas, aire comprimido y otros", 3, t("suministroTipo", "Tipo de otros suministros", "Tipo"), t("suministroCapacidad", "Capacidad de otros suministros (con unidad)", "Capacidad"))],
    ] },
    servicios("09 Sistemas especiales y seguridad visible", [["incendio", "Contra incendio"], ["extraccion", "Ventilación y extracción"], ["climatizacion", "Climatización"], ["telecom", "Telecomunicaciones"]], "Equipos visibles o capacidad documentada"),
    { kind: "form", rows: [[casillas("Limitaciones e informes técnicos necesarios", 6, varias("limitaciones", "Limitaciones e informes técnicos necesarios", options([["no_accesibles", "Equipos no accesibles"], ["olores", "Olores"], ["residuos", "Residuos"], ["expuesta", "Instalación expuesta"], ["electrica", "Revisión eléctrica"], ["ambiental", "Revisión ambiental"], ["otra", "Otra"]])), t("limitacionesDetalle", "Detalle de las limitaciones", "Detalle"))]] },
    { kind: "nota", text: "Anote equipos y documentos; no certifique suficiencia contra incendio, seguridad eléctrica ni aptitud de descarga. El desarrollo de un parque requiere un expediente independiente." },
    ...cierre(10),
  ],
  "04G": [
    ...inicio([sola(n("numeroUnidades", "Número de unidades"), 2), celda("Niveles y accesos", 2, n("niveles", "Niveles", false, "Niveles"), t("accesos", "Accesos", "Accesos")),
      celda("Tipo y uso del conjunto", 2, una("tipoConjunto", "Tipo de conjunto", options([["plaza", "Plaza comercial"], ["oficinas", "Edificio de oficinas"], ["departamentos", "Edificio de departamentos"], ["mixto", "Conjunto mixto"], ["industrial", "Parque industrial"], ["otro", "Otro"]]), true, "Tipo"), t("usoConjunto", "Uso del conjunto", "Uso"))]),
    sup([["superficieTerreno", "Terreno"], ["superficieConstruccion", "Construcción total"], ["superficieRentable", "Área rentable según método", true], ["areasComunes", "Áreas comunes (precisar)", true]]), SUP_NOTA,
    { kind: "unidades", label: "04 Unidades del conjunto" },
    { kind: "nota", text: "Use una fila por unidad. Para detalle interior active 04C, 04D, 04E o 04F con el mismo ID de inmueble y su ID de unidad. No sume superficies sin comprobar concepto y ausencia de traslapes." },
    { kind: "form", label: "05 Áreas comunes y funcionamiento", rows: [
      [celda("Estacionamiento y acceso de público", 3, n("estacionamientoTotal", "Cajones de estacionamiento en total", false, "Total"), n("estacionamientoReservados", "Cajones reservados", false, "Reservados"), t("estacionamientoBarreras", "Barreras del estacionamiento", "Barreras")), sola(t("cargaServicio", "Carga, descarga y circulación de servicio"), 3)],
      [sola(t("sanitariosElevadores", "Sanitarios, elevadores y accesibilidad"), 3), sola(t("fachadas", "Señalización, fachadas y mantenimiento"), 3)],
    ] },
    servicios("06 Servicios comunes y por unidad", [["electricidad", "Electricidad"], ["agua", "Agua, drenaje y bombeo"], ["seguridad", "Seguridad y contra incendio"]], "Medición individual o común y capacidad"),
    { kind: "nota", text: "Registre infraestructura existente. Rentas, cuotas, cobro, contratos y administración se controlan por separado." },
    ...cierre(7),
  ],
};

/** Campos de un levantamiento, en el orden del documento y con la sección donde se imprimen. */
export function levantamientoFields(id: LevantamientoId): FormatoField[] {
  const fields: FormatoField[] = [];
  let section = "Identificación";
  const add = (campo: Campo) => fields.push({ key: campo.key, label: campo.label, type: campo.type ?? "text", required: campo.required ?? false, section, ...(campo.options ? { options: campo.options } : {}) });
  for (const parte of PLANTILLAS[id]) {
    if (parte.kind === "foto") {
      section = "01 Fotografía principal";
      add({ key: "fotoPrincipalId", label: "Fachada o vista principal" });
      add(fecha("fotoFecha", "Fecha de toma")); add({ key: "fotoHora", label: "Hora de toma", type: "time" }); add(t("fotoDireccion", "Dirección de la toma"));
      parte.extra.forEach(c => c.campos.forEach(add));
    } else if (parte.kind === "form") {
      if (parte.label) section = parte.label;
      parte.rows.flat().forEach(c => c.campos.forEach(add));
    } else if (parte.kind === "tabla") {
      section = parte.label;
      for (const [row, label] of parte.rows) for (const [suffix, column] of parte.columns) add(largo(`${row}${suffix}`, parte.columns.length > 1 ? `${label} · ${column}` : label));
    } else if (parte.kind === "unidades") {
      section = parte.label;
      add({ key: "unidades", label: "Unidades", type: "levantamientoRows" });
    } else if (parte.kind === "croquis") {
      section = parte.label;
      add({ key: "croquisId", label: "Croquis o mapa del inmueble" });
    }
  }
  return fields;
}
export const terrenoFields: FormatoField[] = levantamientoFields("04A");

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
/** La fotografía principal es obligatoria; el croquis, solo si se eligió. Las unidades de una plaza se revisan fila por fila. */
export function validarLevantamiento(id: LevantamientoId, data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (typeof data.fotoPrincipalId !== "string" || !UUID.test(data.fotoPrincipalId)) errors.push("Selecciona la fotografía principal adjunta");
  if (data.croquisId !== undefined && data.croquisId !== null && data.croquisId !== "" && (typeof data.croquisId !== "string" || !UUID.test(data.croquisId))) errors.push("Selecciona el croquis adjunto");
  if (id === "04G" && data.unidades !== undefined) {
    const rows = data.unidades;
    if (!Array.isArray(rows) || rows.length > 60) errors.push("Unidades: registra hasta 60 filas");
    else rows.forEach((row, index) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) { errors.push(`Unidades, fila ${index + 1}`); return; }
      const unit = row as Record<string, unknown>;
      if (typeof unit.id !== "string" || !unit.id.trim()) errors.push(`Unidades, fila ${index + 1}: ID unidad`);
      if (unit.area !== undefined && unit.area !== "" && !/^\d+(?:[.,]\d+)?$/.test(String(unit.area).trim())) errors.push(`Unidades, fila ${index + 1}: Área m²`);
    });
  }
  return errors;
}
