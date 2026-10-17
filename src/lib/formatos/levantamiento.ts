import type { FormatoField } from "./catalog";

/*
  04A–04G · Levantamiento (decisión del titular, 17/10/2026). Se hace el mismo día de la
  entrevista, en la visita: qué inmueble es y su uso de suelo, fotografías, cómo está
  distribuido, de qué está hecho y qué servicios tiene. Lo que no se pueda anotar en el
  momento —superficies, medidas y colindancias— sale después de la escritura, en la revisión
  jurídica (05); por eso aquí es opcional. Sin claves de «base y referencia» ni tablas de
  respaldo: es la inspección visual de un asesor, no un peritaje.
  Un formato por tipo de inmueble: terreno, casa, departamento, oficina, local, nave y plaza
  o conjunto; el tipo lo elige el asesor al iniciar el levantamiento desde la operación.
*/

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: readonly { value: string; label: string }[], required = true): FormatoField => ({ section, key, label, type: "choice", required, options });
const options = (values: readonly [string, string][]) => values.map(([value, label]) => ({ value, label }));

export const LEVANTAMIENTO_TABLES = {
  unidades: { columns: [{ key: "id", label: "Unidad" }, { key: "tipo", label: "Tipo" }, { key: "uso", label: "Uso actual" }, { key: "area", label: "m² aproximados" }, { key: "ocupacion", label: "Ocupación" }] },
} as const;
export type LevantamientoTable = keyof typeof LEVANTAMIENTO_TABLES;
export type LevantamientoRow = Record<string, string>;

export const LEVANTAMIENTO_TITLES = { "04A": "Levantamiento de terreno", "04B": "Levantamiento de casa habitación", "04C": "Levantamiento de departamento", "04D": "Levantamiento de oficina", "04E": "Levantamiento de local comercial", "04F": "Levantamiento de nave o bodega", "04G": "Levantamiento de plaza o conjunto" } as const;
export type LevantamientoId = keyof typeof LEVANTAMIENTO_TITLES;
export const isLevantamiento = (id: string): id is LevantamientoId => Object.hasOwn(LEVANTAMIENTO_TITLES, id);

const ID = "Identificación", QUE = "01 / Qué inmueble es", FOTOS = "02 / Fotografías y croquis", VISITA = "03 / La visita";
const COMO = "04 / Cómo es", SUP = "05 / Superficies, si las tienes a la mano", MAT = "06 / Materiales y estado", SERV = "07 / Servicios", ENT = "08 / Entorno y observaciones";
/** Claves que se capturan en la pantalla de imágenes, no como texto. */
export const LEVANTAMIENTO_IMAGE_KEYS = ["fotoPrincipalId", "croquisId"] as const;

// Zonas del Reglamento de Zonificación y Usos del Suelo del Centro de Población de Tijuana
// (P.O. 03/09/2010, última reforma P.O. 49 del 14/08/2020): art. 49 (suelo urbano y urbanizable)
// y art. 43 (agropecuaria y especial de conservación). Misma lista que usa la opinión de valor (07).
export const USO_SUELO = options([
  ["habitacional", "Habitacional"], ["comercio_servicios", "Comercio y servicios"], ["mixto", "Mixto"], ["industrial", "Industrial"],
  ["equipamiento", "Equipamiento urbano"], ["turistico", "Turístico"], ["agropecuario", "Agropecuario"], ["conservacion", "Especial de conservación"],
  ["no_sabe", "No lo sé todavía"],
]);
const SI_NO = options([["si", "Sí"], ["no", "No"], ["no_sabe", "No sé"]]);
const ESTADO = options([["bueno", "Bueno"], ["regular", "Regular"], ["reparaciones", "Necesita reparaciones"]]);

const num = (section: string, key: string, label: string, required = false): FormatoField => field(section, key, label, "number", required);

const head = (kind: FormatoField[]): FormatoField[] => [
  field(ID, "folio", "Folio de la operación"),
  field(ID, "idInmueble", "ID del inmueble en el panel", "text", false),
  field(ID, "inmueble", "Domicilio del inmueble"),
  field(ID, "colonia", "Colonia o zona", "text", false),
  field(ID, "municipioEstado", "Municipio y estado", "text", false),
  field(ID, "codigoPostal", "Código postal", "text", false),
  choice(QUE, "usoSuelo", "Uso de suelo", USO_SUELO),
  ...kind,
  field(FOTOS, "fotoPrincipalId", "Fotografía principal", "text", false),
  field(FOTOS, "croquisId", "Croquis o mapa", "text", false),
  field(VISITA, "fechaVisita", "Fecha de la visita", "date"),
  field(VISITA, "asesor", "Asesor que hizo la visita"),
  choice(VISITA, "ocupacion", "¿Cómo encontraste el inmueble?", options([["ocupado", "Ocupado"], ["desocupado", "Desocupado"], ["parcial", "Parcialmente ocupado"]])),
  choice(VISITA, "alcance", "¿Pudiste recorrerlo completo?", options([["completo", "Sí, completo"], ["parcial", "Solo una parte"]])),
  field(VISITA, "acompanante", "Quién te acompañó", "text", false),
];
const materials = (keys: ReadonlyArray<[string, string]>): FormatoField[] => [
  ...keys.map(([key, label]) => field(MAT, key, label, "text", false)),
  choice(MAT, "estadoGeneral", "Estado general a la vista", ESTADO),
];
const tail: FormatoField[] = [
  field(ENT, "accesoEntorno", "Acceso, vialidad y entorno", "long", false),
  field(ENT, "observaciones", "Observaciones", "long", false),
  field(ENT, "pendientes", "Qué falta ver, medir o pedir", "long", false),
];

export const terrenoFields: FormatoField[] = [
  ...head([
    field(QUE, "usoActual", "¿Qué hay o se hace en el terreno hoy?"),
    field(QUE, "formaPendiente", "Forma y pendiente", "text", false),
    field(QUE, "accesoFisico", "¿Cómo se entra?", "text", false),
  ]),
  num("04 / El terreno", "frente", "Frente en metros"), num("04 / El terreno", "fondo", "Fondo en metros"),
  field("04 / El terreno", "otrosFrentes", "Otros frentes", "text", false), field("04 / El terreno", "orientacion", "Orientación", "text", false),
  field("04 / El terreno", "cercas", "Bardas, cercas u ocupaciones", "long", false), field("04 / El terreno", "relieve", "Relieve, vegetación y escurrimientos", "long", false),
  field("04 / El terreno", "afectaciones", "Líneas, pasos o afectaciones a la vista", "long", false),
  num(SUP, "superficieTerreno", "Terreno en m²"), num(SUP, "superficieConstrucciones", "Construcciones existentes en m²"),
  choice("07 / Servicios en la calle", "agua", "Agua", SI_NO), choice("07 / Servicios en la calle", "drenaje", "Drenaje", SI_NO),
  choice("07 / Servicios en la calle", "electricidad", "Electricidad", SI_NO), choice("07 / Servicios en la calle", "pavimento", "Pavimento", SI_NO),
  ...tail,
];

const DETAILS: Record<Exclude<LevantamientoId, "04A">, FormatoField[]> = {
  "04B": [
    ...head([
      choice(QUE, "tipoVivienda", "Tipo de vivienda", options([["sola", "Casa sola"], ["condominio", "Casa en condominio o privada"], ["duplex", "Dúplex o casa adosada"], ["otra", "Otra"]])),
      field(QUE, "usoActual", "Uso actual, si no es solo vivienda", "text", false),
    ]),
    num(COMO, "niveles", "Niveles", true), num(COMO, "recamaras", "Recámaras", true), num(COMO, "banos", "Baños completos", true), num(COMO, "mediosBanos", "Medios baños"),
    num(COMO, "estacionamientos", "Cajones de estacionamiento"), choice(COMO, "estacionamientoTechado", "¿Estacionamiento techado?", options([["si", "Sí"], ["no", "No"], ["parcial", "Parcialmente"]]), false),
    field(COMO, "distribucion", "Cómo está distribuida por planta", "long", false), field(COMO, "espaciosExtra", "Patio, jardín, terraza, cuarto de servicio, bodega…", "long", false),
    field(COMO, "antiguedad", "Antigüedad aproximada", "text", false), field(COMO, "ampliaciones", "Ampliaciones o remodelaciones", "text", false),
    num(SUP, "superficieTerreno", "Terreno en m²"), num(SUP, "superficieConstruccion", "Construcción en m²"),
    ...materials([["muros", "Muros"], ["pisos", "Pisos"], ["techos", "Techos"], ["puertasVentanas", "Puertas y ventanas"]]),
    choice(SERV, "agua", "Agua", SI_NO), choice(SERV, "drenaje", "Drenaje", SI_NO), choice(SERV, "electricidad", "Electricidad", SI_NO), choice(SERV, "gas", "Gas", SI_NO),
    choice(SERV, "cisterna", "Cisterna o tinaco", SI_NO, false), field(SERV, "clima", "Clima, calentador u otro equipo fijo", "text", false),
    ...tail,
  ],
  "04C": [
    ...head([
      field(QUE, "edificio", "Torre o edificio", "text", false), field(QUE, "piso", "Piso"),
      choice(QUE, "elevador", "¿Tiene elevador?", SI_NO), field(QUE, "usoActual", "Uso actual, si no es solo vivienda", "text", false),
    ]),
    num(COMO, "nivelesInteriores", "Niveles interiores"), num(COMO, "recamaras", "Recámaras", true), num(COMO, "banos", "Baños completos", true), num(COMO, "mediosBanos", "Medios baños"),
    num(COMO, "cajones", "Cajones de estacionamiento"), choice(COMO, "bodega", "¿Tiene bodega?", SI_NO, false),
    field(COMO, "distribucion", "Cómo está distribuido", "long", false), field(COMO, "areasComunes", "Áreas comunes: alberca, gimnasio, roof…", "long", false),
    num(SUP, "superficiePrivativa", "Superficie privativa en m²"), num(SUP, "superficieConstruccion", "Construcción en m²"),
    ...materials([["muros", "Muros"], ["pisos", "Pisos"], ["puertasVentanas", "Puertas y ventanas"]]),
    choice(SERV, "agua", "Agua", SI_NO), choice(SERV, "drenaje", "Drenaje", SI_NO), choice(SERV, "electricidad", "Electricidad", SI_NO), choice(SERV, "gas", "Gas", SI_NO),
    choice(SERV, "medidores", "Medidores", options([["individual", "Individuales"], ["comun", "Comunes"], ["no_sabe", "No sé"]]), false), field(SERV, "clima", "Clima u otro equipo fijo", "text", false),
    ...tail,
  ],
  "04D": [
    ...head([
      field(QUE, "edificio", "Edificio", "text", false), field(QUE, "piso", "Piso"),
      choice(QUE, "acceso", "Acceso", options([["independiente", "Independiente"], ["comun", "Común del edificio"]])), field(QUE, "usoActual", "A qué se dedica hoy", "text", false),
    ]),
    num(COMO, "privados", "Privados"), num(COMO, "salas", "Salas de juntas"), num(COMO, "sanitarios", "Sanitarios"), num(COMO, "estacionamientos", "Cajones de estacionamiento"),
    num(COMO, "alturaLibre", "Altura libre en metros"), choice(COMO, "elevador", "¿Tiene elevador?", SI_NO, false),
    field(COMO, "distribucion", "Área abierta, recepción, archivo…", "long", false),
    num(SUP, "superficiePrivativa", "Superficie privativa en m²"), num(SUP, "superficieRentable", "Área rentable en m²"),
    ...materials([["muros", "Muros y divisiones"], ["pisos", "Pisos"], ["puertasVentanas", "Puertas y ventanas"]]),
    field(SERV, "electricidad", "Electricidad: fases y voltaje, si lo sabes", "text", false), field(SERV, "datos", "Voz, datos e internet", "text", false),
    field(SERV, "clima", "Clima y ventilación", "text", false), choice(SERV, "aguaDrenaje", "Agua y drenaje", SI_NO),
    ...tail,
  ],
  "04E": [
    ...head([
      field(QUE, "giro", "Giro actual o último"), field(QUE, "ubicacion", "Dónde está: plaza, esquina, calle…", "text", false),
    ]),
    num(COMO, "frente", "Frente en metros"), num(COMO, "fondo", "Fondo en metros"), num(COMO, "alturaLibre", "Altura libre en metros"), num(COMO, "sanitarios", "Sanitarios"),
    field(COMO, "distribucion", "Área de venta, bodega, área de servicio", "long", false),
    choice(COMO, "escaparate", "¿Tiene escaparate?", SI_NO, false), choice(COMO, "anuncio", "¿Tiene espacio para anuncio?", SI_NO, false),
    field(COMO, "estacionamiento", "Estacionamiento", "text", false), field(COMO, "cargaDescarga", "Carga y descarga", "text", false),
    num(SUP, "superficieLocal", "Superficie del local en m²"), num(SUP, "superficieTerraza", "Terraza o área exterior en m²"),
    ...materials([["muros", "Muros"], ["pisos", "Pisos"], ["puertasVentanas", "Puertas, cortinas y ventanas"]]),
    field(SERV, "electricidad", "Electricidad: fases y voltaje, si lo sabes", "text", false), choice(SERV, "aguaDrenaje", "Agua y drenaje", SI_NO), choice(SERV, "gas", "Gas", SI_NO, false),
    field(SERV, "extraccion", "Extracción y ventilación", "text", false), field(SERV, "clima", "Clima", "text", false),
    ...tail,
  ],
  "04F": [
    ...head([
      field(QUE, "usoActual", "Uso u operación actual"), field(QUE, "parque", "Parque o conjunto industrial", "text", false), field(QUE, "accesoCarga", "Acceso para transporte de carga", "text", false),
    ]),
    num("04 / Cómo es la nave", "alturaLibre", "Altura libre en metros"), num("04 / Cómo es la nave", "alturaTotal", "Altura total en metros"), num("04 / Cómo es la nave", "claroColumnas", "Claro entre columnas en metros"),
    num("04 / Cómo es la nave", "andenes", "Andenes"), num("04 / Cómo es la nave", "puertasCarga", "Puertas de carga"), num("04 / Cómo es la nave", "sanitarios", "Sanitarios"),
    field("04 / Cómo es la nave", "patioManiobras", "Patio de maniobras", "text", false), field("04 / Cómo es la nave", "oficinasDescripcion", "Oficinas dentro de la nave", "text", false),
    field("04 / Cómo es la nave", "estructura", "Estructura", "text", false), field("04 / Cómo es la nave", "cubierta", "Cubierta", "text", false), field("04 / Cómo es la nave", "piso", "Piso", "text", false),
    field("04 / Cómo es la nave", "estacionamiento", "Estacionamiento", "text", false),
    num(SUP, "superficieTerreno", "Terreno en m²"), num(SUP, "superficieNave", "Nave o almacén en m²"), num(SUP, "superficieOficinas", "Oficinas en m²"),
    choice("06 / Estado a la vista", "estadoGeneral", "Estado general a la vista", ESTADO), field("06 / Estado a la vista", "observacionesEstado", "Fisuras, humedad, cubierta…", "long", false),
    field(SERV, "electricidad", "Fases, voltaje y transformador, si lo sabes", "text", false), choice(SERV, "agua", "Agua", SI_NO), choice(SERV, "drenaje", "Drenaje", SI_NO), choice(SERV, "gas", "Gas", SI_NO, false),
    field(SERV, "contraIncendio", "Contra incendio", "text", false), field(SERV, "otros", "Aire comprimido, telecomunicaciones u otros", "text", false),
    ...tail,
  ],
  "04G": [
    ...head([
      choice(QUE, "tipoConjunto", "Tipo de conjunto", options([["plaza", "Plaza comercial"], ["oficinas", "Edificio de oficinas"], ["departamentos", "Edificio de departamentos"], ["mixto", "Conjunto mixto"], ["industrial", "Parque industrial"], ["otro", "Otro"]])),
      field(QUE, "usoActual", "Cómo funciona hoy", "text", false),
    ]),
    num(COMO, "numeroUnidades", "Número de unidades"), num(COMO, "niveles", "Niveles"), field(COMO, "accesos", "Accesos", "text", false), field(COMO, "estacionamiento", "Estacionamiento", "text", false),
    choice(COMO, "elevadores", "¿Tiene elevadores?", SI_NO, false), field(COMO, "unidades", "Unidades", "levantamientoRows", false), field(COMO, "areasComunes", "Áreas comunes", "long", false),
    num(SUP, "superficieTerreno", "Terreno en m²"), num(SUP, "superficieConstruccion", "Construcción en m²"), num(SUP, "superficieRentable", "Área rentable en m²"),
    choice("06 / Estado a la vista", "estadoGeneral", "Estado general a la vista", ESTADO), field("06 / Estado a la vista", "fachadas", "Fachadas y mantenimiento", "text", false),
    field(SERV, "electricidad", "Electricidad: medición común o por unidad", "text", false), choice(SERV, "agua", "Agua", SI_NO), choice(SERV, "drenaje", "Drenaje", SI_NO),
    field(SERV, "seguridad", "Seguridad y contra incendio", "text", false),
    ...tail,
  ],
};

export function levantamientoFields(id: LevantamientoId): FormatoField[] {
  return id === "04A" ? terrenoFields : DETAILS[id];
}

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
      if (typeof unit.id !== "string" || !unit.id.trim()) errors.push(`Unidades, fila ${index + 1}: Unidad`);
      if (unit.area !== undefined && unit.area !== "" && !/^\d+(?:[.,]\d+)?$/.test(String(unit.area).trim())) errors.push(`Unidades, fila ${index + 1}: m² aproximados`);
    });
  }
  return errors;
}
