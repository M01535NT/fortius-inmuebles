import { z } from "zod";
import { formatoById, type FormatoField } from "./catalog";
import { TIPO_INMUEBLE_DESDE_ENTREVISTA } from "./valor-fields";

/*
  Datos del expediente (titular, 29/10/2026): el diccionario único. Cada dato del cliente o del
  inmueble se confirma una sola vez y llena todas las celdas que lo usan en los formatos, aunque
  cada formato lo llame distinto (el nombre es «titular» en el 01, «propietario» en el 07 y
  «vendedor» en la 15). Lo confirmado llena solo celdas vacías: lo que una persona escribió en un
  formato no se cambia; si es distinto, el formato lo avisa y el asesor decide.
  Fuera del diccionario, a propósito: consentimientos, firmas, decisiones, autorizaciones,
  conclusiones jurídicas y opiniones de valor. Esos los decide siempre una persona.
*/

export type TipoDato = "texto" | "numero" | "fecha";
/** Una celda que recibe el dato: el formato (o «04» para los siete levantamientos) y su clave. */
type Destino = { formato: string; key: string; transformar?: (valor: string | number) => string | number | undefined };
export type DatoExpediente = { clave: string; etiqueta: string; grupo: string; tipo: TipoDato; ayuda?: string; destinos: Destino[] };

const LEV = "04";
const d = (formato: string, ...keys: string[]): Destino[] => keys.map(key => ({ formato, key }));

export const DATOS_EXPEDIENTE: DatoExpediente[] = [
  // Propietario y apoderado
  { clave: "propietarioNombre", etiqueta: "Nombre del propietario o razón social", grupo: "Propietario", tipo: "texto",
    destinos: [...d("01", "titular"), ...d("07", "propietario"), ...d("08", "propietario"), ...d("10", "propietario"), ...d("11", "propietario"), ...d("14", "propietario"), ...d("15", "vendedor")] },
  { clave: "propietarioCurp", etiqueta: "CURP del propietario", grupo: "Propietario", tipo: "texto", destinos: [] },
  { clave: "propietarioRfc", etiqueta: "RFC del propietario", grupo: "Propietario", tipo: "texto", destinos: d("15", "rfcVendedor") },
  { clave: "propietarioIdentificacion", etiqueta: "Identificación oficial del propietario", grupo: "Propietario", tipo: "texto", ayuda: "Tipo y número, por ejemplo INE 1234567890.", destinos: d("15", "identificacionVendedor") },
  { clave: "propietarioNacimiento", etiqueta: "Fecha de nacimiento del propietario", grupo: "Propietario", tipo: "fecha", destinos: d("02", "fechaNacimiento") },
  { clave: "propietarioEstadoCivil", etiqueta: "Estado civil del propietario", grupo: "Propietario", tipo: "texto", destinos: [...d("02", "estadoCivilActual"), ...d("05", "estadoCivilActual"), ...d("15", "estadoCivilVendedor")] },
  { clave: "propietarioDomicilio", etiqueta: "Domicilio del propietario", grupo: "Propietario", tipo: "texto", destinos: d("15", "domicilioVendedor") },
  { clave: "propietarioTelefono", etiqueta: "Teléfono del propietario", grupo: "Propietario", tipo: "texto", destinos: d("02", "telefono") },
  { clave: "propietarioCorreo", etiqueta: "Correo del propietario", grupo: "Propietario", tipo: "texto", destinos: d("02", "correo") },
  { clave: "apoderadoNombre", etiqueta: "Nombre del apoderado o representante", grupo: "Apoderado", tipo: "texto", destinos: [...d("01", "representante"), ...d("15", "representanteVendedor")] },
  { clave: "apoderadoDocumento", etiqueta: "Documento que acredita la representación", grupo: "Apoderado", tipo: "texto", ayuda: "Poder, número, fecha y notario.", destinos: [...d("01", "documentoRepresentante"), ...d("15", "documentoRepresentacionVendedor")] },

  // Inmueble
  { clave: "inmuebleDomicilio", etiqueta: "Domicilio del inmueble", grupo: "Inmueble", tipo: "texto",
    destinos: ["02", LEV, "05", "06", "07", "08", "09", "10", "11", "13", "14", "15", "16", "17", "18", "19"].flatMap(formato => d(formato, "inmueble")) },
  { clave: "inmuebleTipo", etiqueta: "Tipo de inmueble", grupo: "Inmueble", tipo: "texto", ayuda: "Casa, departamento, terreno, oficina, local, nave o plaza.",
    destinos: [...d("02", "tipoInmueble"), ...d("10", "tipoInmueble"), { formato: "07", key: "tipoInmueble", transformar: valor => TIPO_INMUEBLE_DESDE_ENTREVISTA[String(valor)] ?? valor }] },
  { clave: "folioReal", etiqueta: "Folio real", grupo: "Inmueble", tipo: "texto", destinos: [...d("05", "folioReal"), ...d("09", "folioReal"), ...d("10", "folioReal"), ...d("14", "folioInmueble")] },
  { clave: "partida", etiqueta: "Partida registral", grupo: "Inmueble", tipo: "texto", destinos: d("14", "partida") },
  { clave: "claveCatastral", etiqueta: "Clave catastral", grupo: "Inmueble", tipo: "texto", destinos: [...d("05", "claveCatastral"), ...d("07", "cuentaCatastral"), ...d("09", "claveCatastral"), ...d("10", "claveCatastral"), ...d("15", "claveCatastral")] },
  { clave: "superficieTerreno", etiqueta: "Superficie de terreno (m²)", grupo: "Inmueble", tipo: "numero", destinos: [...d(LEV, "superficieTerreno"), ...d("07", "terreno"), ...d("10", "terreno")] },
  { clave: "superficieConstruccion", etiqueta: "Superficie de construcción (m²)", grupo: "Inmueble", tipo: "numero", destinos: [...d(LEV, "superficieConstruccion", "superficieConstrucciones"), ...d("07", "construccion"), ...d("10", "construccion")] },
  { clave: "recamaras", etiqueta: "Recámaras", grupo: "Inmueble", tipo: "numero", destinos: [...d(LEV, "recamaras"), ...d("07", "recamaras"), ...d("10", "recamaras")] },
  { clave: "banos", etiqueta: "Baños completos", grupo: "Inmueble", tipo: "numero", destinos: [...d(LEV, "banos"), ...d("07", "banos"), ...d("10", "banos")] },
  { clave: "mediosBanos", etiqueta: "Medios baños", grupo: "Inmueble", tipo: "numero", destinos: [...d(LEV, "mediosBanos"), ...d("10", "mediosBanos")] },
  { clave: "medidasColindancias", etiqueta: "Medidas y colindancias", grupo: "Inmueble", tipo: "texto", destinos: [...d("07", "linderos"), ...d("15", "colindancias")] },
  { clave: "regimenPropiedad", etiqueta: "Régimen de propiedad", grupo: "Inmueble", tipo: "texto", ayuda: "Individual o condominio.", destinos: [...d("07", "regimen"), ...d("10", "regimen")] },

  // Escritura, registro y adeudos
  { clave: "escritura", etiqueta: "Escritura o título de propiedad", grupo: "Escritura y registro", tipo: "texto", ayuda: "Número, fecha y notario, por ejemplo: escritura 12,345 del 2 de mayo de 2010, notaría 5 de Tijuana.", destinos: [...d("09", "titulo"), ...d("15", "titulo")] },
  { clave: "inscripcion", etiqueta: "Inscripción en el Registro Público", grupo: "Escritura y registro", tipo: "texto", destinos: d("15", "inscripcion") },
  { clave: "gravamenes", etiqueta: "Gravámenes o hipotecas", grupo: "Escritura y registro", tipo: "texto", ayuda: "Lo que dice el certificado de libertad de gravámenes; «ninguno» si está libre.", destinos: d("09", "gravamenes") },
  { clave: "predial", etiqueta: "Predial: cuenta, periodo y saldo", grupo: "Adeudos", tipo: "texto", destinos: d("05", "predial") },
  { clave: "agua", etiqueta: "Agua: cuenta, titular y saldo", grupo: "Adeudos", tipo: "texto", destinos: d("05", "agua") },
  { clave: "valorAvaluo", etiqueta: "Valor del avalúo (MXN)", grupo: "Avalúo", tipo: "numero", destinos: [] },
];
const POR_CLAVE = new Map(DATOS_EXPEDIENTE.map(dato => [dato.clave, dato]));

/** Un dato guardado: su valor, si está confirmado y de qué documento salió. */
export const datoGuardado = z.object({
  valor: z.union([z.string().trim().min(1).max(2000), z.number().finite().nonnegative()]),
  estado: z.enum(["propuesto", "confirmado"]),
  fuente: z.object({ archivoId: z.uuid().optional(), documento: z.string().max(240).optional(), pagina: z.number().int().positive().max(2000).optional(), cita: z.string().max(500).optional() }).strict().optional(),
  actualizadoEl: z.string().max(40).optional(),
}).strict();
export type DatoGuardado = z.infer<typeof datoGuardado>;
export type DatosGuardados = Record<string, DatoGuardado>;
export const datosGuardados = z.record(z.string(), datoGuardado).superRefine((datos, ctx) => {
  for (const [clave, dato] of Object.entries(datos)) {
    const def = POR_CLAVE.get(clave);
    if (!def) { ctx.addIssue({ code: "custom", message: `Dato desconocido: ${clave}` }); continue; }
    if (def.tipo === "numero" && typeof dato.valor !== "number") ctx.addIssue({ code: "custom", message: `${def.etiqueta}: debe ser un número` });
    if (def.tipo !== "numero" && typeof dato.valor !== "string") ctx.addIssue({ code: "custom", message: `${def.etiqueta}: debe ser texto` });
    if (def.tipo === "fecha" && !/^\d{4}-\d{2}-\d{2}$/.test(String(dato.valor))) ctx.addIssue({ code: "custom", message: `${def.etiqueta}: fecha AAAA-MM-DD` });
  }
});

const sinAcentos = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
const vacio = (value: unknown) => value === undefined || value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);

/** El valor como lo espera la celda: la opción de un menú (por valor o por su texto), un número, una fecha o texto. Si no encaja, no se llena. */
export function valorPara(field: FormatoField, valor: string | number): string | number | undefined {
  if (field.type === "choice") {
    const buscado = sinAcentos(String(valor));
    return field.options?.find(option => sinAcentos(option.value) === buscado || sinAcentos(option.label) === buscado)?.value;
  }
  if (field.type === "number" || field.type === "money") {
    const n = typeof valor === "number" ? valor : Number(String(valor).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }
  if (field.type === "date") return /^\d{4}-\d{2}-\d{2}$/.test(String(valor)) ? String(valor) : undefined;
  if (field.type === "text" || field.type === "long") return String(valor);
  return undefined;
}

const aplica = (destino: Destino, formatoId: string) => destino.formato === formatoId || (destino.formato === LEV && /^04[A-G]$/.test(formatoId));
export type Conflicto = { clave: string; etiqueta: string; key: string; actual: unknown; propuesto: string | number };

/**
  Lo que los datos confirmados aportan a un formato: las celdas vacías que llenan («patch») y las
  celdas que ya tienen otro valor escrito («conflictos»). Nunca cambia una celda con contenido.
*/
export function llenarDesdeDatos(formatoId: string, data: Record<string, unknown>, datos: DatosGuardados): { patch: Record<string, string | number>; conflictos: Conflicto[] } {
  let fields: FormatoField[];
  try { fields = formatoById(formatoId).fields; } catch { return { patch: {}, conflictos: [] }; }
  const porKey = new Map(fields.map(field => [field.key, field]));
  const patch: Record<string, string | number> = {}, conflictos: Conflicto[] = [];
  for (const def of DATOS_EXPEDIENTE) {
    const dato = datos[def.clave];
    if (!dato || dato.estado !== "confirmado") continue;
    for (const destino of def.destinos.filter(item => aplica(item, formatoId))) {
      const field = porKey.get(destino.key);
      if (!field || destino.key in patch) continue;
      const transformado = destino.transformar ? destino.transformar(dato.valor) : dato.valor;
      if (transformado === undefined) continue;
      const valor = valorPara(field, transformado);
      if (valor === undefined) continue;
      const actual = data[destino.key];
      if (vacio(actual)) patch[destino.key] = valor;
      else if (sinAcentos(String(actual)) !== sinAcentos(String(valor))) conflictos.push({ clave: def.clave, etiqueta: def.etiqueta, key: destino.key, actual, propuesto: valor });
    }
  }
  return { patch, conflictos };
}

export function datoDe(clave: string): DatoExpediente | undefined { return POR_CLAVE.get(clave); }
