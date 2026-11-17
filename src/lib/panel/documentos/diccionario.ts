import { formatoById, type FormatoField } from "@/lib/formatos/catalog";
import { DATOS_EXPEDIENTE, valorPara } from "@/lib/formatos/datos-expediente";
import { TIPO_INMUEBLE_DESDE_ENTREVISTA } from "@/lib/formatos/valor-fields";
import { tipoInmueble, TIPO_INMUEBLE_LABELS } from "@/lib/inmueble-tipos";

/*
  Del asunto al documento y de regreso (SPEC.md, sección 8). Cada dato vive en un solo lugar —la persona o el
  inmueble— y llena todos los espacios que lo usan en los formatos, aunque cada uno lo llame distinto. Lo que se
  captura en un formato vuelve a ese lugar y no se vuelve a pedir.
  · «propietario»: quien vende o renta (propietario, vendedor, titular, copropietario o heredero).
  · «comprador»: quien compra o renta (comprador o inquilino).
  Fuera, a propósito: consentimientos, firmas, decisiones, conclusiones jurídicas y opiniones de valor.
  Este módulo no usa nada del servidor: lo leen la pantalla y el servidor por igual.
*/

export type Lado = "propietario" | "comprador" | "inmueble";
export const CAMPOS_PERSONA = ["nombre", "telefono", "correo", "estado_civil", "curp", "rfc", "identificacion", "domicilio", "nacionalidad"] as const;
export type CampoPersona = (typeof CAMPOS_PERSONA)[number];
export const CAMPOS_INMUEBLE = [
  "domicilio", "tipo", "terreno", "construccion", "recamaras", "banos", "precio",
  "folio_real", "partida", "clave_catastral", "escritura", "inscripcion", "colindancias", "regimen", "gravamenes", "predial", "agua",
] as const;
export type CampoInmueble = (typeof CAMPOS_INMUEBLE)[number];

/** Los datos del inmueble para contratos (privados, tabla aparte). */
export const LEGALES_INMUEBLE = ["folio_real", "partida", "clave_catastral", "escritura", "inscripcion", "colindancias", "regimen", "gravamenes", "predial", "agua"] as const;
export type LegalInmueble = (typeof LEGALES_INMUEBLE)[number];

type Destino = { formato: string; key: string; transformar?: (v: string | number) => string | number | undefined };
export type Dato =
  | { lado: "propietario" | "comprador"; campo: CampoPersona; etiqueta: string; destinos: Destino[] }
  | { lado: "inmueble"; campo: CampoInmueble; etiqueta: string; destinos: Destino[] };

const d = (formato: string, ...keys: string[]): Destino[] => keys.map((key) => ({ formato, key }));
const de = (clave: string): Destino[] => DATOS_EXPEDIENTE.find((x) => x.clave === clave)?.destinos ?? [];

/** Tipo del inmueble en la base → la clave que usan los formatos. */
const TIPO_A_FORMATO: Record<string, string> = { nave_bodega: "nave-industrial", plaza_conjunto: "plaza" };

export const DICCIONARIO: readonly Dato[] = [
  // Quien vende o renta
  { lado: "propietario", campo: "nombre", etiqueta: "Nombre completo", destinos: [...de("propietarioNombre"), ...d("02", "entrevistado")] },
  { lado: "propietario", campo: "telefono", etiqueta: "Teléfono", destinos: de("propietarioTelefono") },
  { lado: "propietario", campo: "correo", etiqueta: "Correo", destinos: [...de("propietarioCorreo"), ...d("20", "arrendadorCorreo"), ...d("24", "vendedorCorreo")] },
  { lado: "propietario", campo: "estado_civil", etiqueta: "Estado civil", destinos: de("propietarioEstadoCivil") },
  { lado: "propietario", campo: "curp", etiqueta: "CURP", destinos: de("propietarioCurp") },
  { lado: "propietario", campo: "rfc", etiqueta: "RFC", destinos: de("propietarioRfc") },
  { lado: "propietario", campo: "identificacion", etiqueta: "Identificación oficial", destinos: de("propietarioIdentificacion") },
  { lado: "propietario", campo: "domicilio", etiqueta: "Domicilio", destinos: de("propietarioDomicilio") },
  { lado: "propietario", campo: "nacionalidad", etiqueta: "Nacionalidad", destinos: [...d("20", "arrendadorNacionalidad"), ...d("24", "vendedorNacionalidad")] },
  // Quien compra o renta
  { lado: "comprador", campo: "nombre", etiqueta: "Nombre completo", destinos: [...d("12", "comprador"), ...d("14", "comprador"), ...d("15", "comprador"), ...d("20", "arrendatario"), ...d("24", "comprador")] },
  { lado: "comprador", campo: "correo", etiqueta: "Correo", destinos: [...d("20", "arrendatarioCorreo"), ...d("24", "compradorCorreo")] },
  { lado: "comprador", campo: "estado_civil", etiqueta: "Estado civil", destinos: [...d("15", "estadoCivilComprador"), ...d("24", "compradorEstadoCivil")] },
  { lado: "comprador", campo: "rfc", etiqueta: "RFC", destinos: [...d("15", "rfcComprador"), ...d("20", "arrendatarioRfc"), ...d("24", "compradorRfc")] },
  { lado: "comprador", campo: "identificacion", etiqueta: "Identificación oficial", destinos: [...d("15", "identificacionComprador"), ...d("20", "arrendatarioIdentificacion"), ...d("24", "compradorIdentificacion")] },
  { lado: "comprador", campo: "domicilio", etiqueta: "Domicilio", destinos: [...d("15", "domicilioComprador"), ...d("20", "arrendatarioDomicilio"), ...d("24", "compradorDomicilio")] },
  { lado: "comprador", campo: "nacionalidad", etiqueta: "Nacionalidad", destinos: [...d("20", "arrendatarioNacionalidad"), ...d("24", "compradorNacionalidad")] },
  // El inmueble
  { lado: "inmueble", campo: "domicilio", etiqueta: "Domicilio del inmueble", destinos: de("inmuebleDomicilio") },
  { lado: "inmueble", campo: "tipo", etiqueta: "Tipo de inmueble", destinos: [...d("02", "tipoInmueble"), ...d("10", "tipoInmueble"), ...d("09", "tipoInmueble"),
    { formato: "07", key: "tipoInmueble", transformar: (v) => TIPO_INMUEBLE_DESDE_ENTREVISTA[String(v)] ?? v }] },
  { lado: "inmueble", campo: "terreno", etiqueta: "Superficie de terreno (m²)", destinos: de("superficieTerreno") },
  { lado: "inmueble", campo: "construccion", etiqueta: "Superficie de construcción (m²)", destinos: de("superficieConstruccion") },
  { lado: "inmueble", campo: "recamaras", etiqueta: "Recámaras", destinos: de("recamaras") },
  { lado: "inmueble", campo: "banos", etiqueta: "Baños", destinos: de("banos") },
  { lado: "inmueble", campo: "precio", etiqueta: "Precio", destinos: d("09", "precioAutorizado") },
  { lado: "inmueble", campo: "folio_real", etiqueta: "Folio real", destinos: de("folioReal") },
  { lado: "inmueble", campo: "partida", etiqueta: "Partida registral", destinos: de("partida") },
  { lado: "inmueble", campo: "clave_catastral", etiqueta: "Clave catastral", destinos: de("claveCatastral") },
  { lado: "inmueble", campo: "escritura", etiqueta: "Escritura o título", destinos: de("escritura") },
  { lado: "inmueble", campo: "inscripcion", etiqueta: "Inscripción en el Registro Público", destinos: de("inscripcion") },
  { lado: "inmueble", campo: "colindancias", etiqueta: "Medidas y colindancias", destinos: de("medidasColindancias") },
  { lado: "inmueble", campo: "regimen", etiqueta: "Régimen de propiedad", destinos: de("regimenPropiedad") },
  { lado: "inmueble", campo: "gravamenes", etiqueta: "Gravámenes o hipotecas", destinos: de("gravamenes") },
  { lado: "inmueble", campo: "predial", etiqueta: "Predial", destinos: de("predial") },
  { lado: "inmueble", campo: "agua", etiqueta: "Agua", destinos: de("agua") },
];

const aplica = (destino: Destino, formatoId: string) => destino.formato === formatoId || (destino.formato === "04" && /^04[A-G]$/.test(formatoId));

/** Lo que se sabe de una persona del asunto, como lo leen los formatos. */
export type PersonaFuente = { id: string; nombre: string; valores: Partial<Record<CampoPersona, string>> };
/** Lo que se sabe del inmueble del asunto. */
export type InmuebleFuente = { id: string; nombre: string; valores: Partial<Record<CampoInmueble, string | number>> };
export type Fuentes = { propietario?: PersonaFuente | null; comprador?: PersonaFuente | null; inmueble?: InmuebleFuente | null };

/** De dónde sale un espacio: el dato y quién lo tiene. */
export type Origen = { lado: Lado; campo: string; quien: string };

const vacio = (v: unknown) => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

/** El tipo de la base como lo entienden los formatos («nave_bodega» → «nave-industrial»). */
export const tipoParaFormato = (tipo: string) => TIPO_A_FORMATO[tipo] ?? tipo;

/**
  Lo que el asunto aporta a un formato: el valor de cada espacio que se puede llenar con lo que ya se sabe, y de dónde
  sale. La hoja lo muestra en los espacios que el documento todavía no tiene escritos; lo escrito en el documento manda.
*/
export function delAsunto(formatoId: string, fuentes: Fuentes): { valores: Record<string, string | number>; origen: Record<string, Origen> } {
  let fields: FormatoField[];
  try { fields = formatoById(formatoId).fields; } catch { return { valores: {}, origen: {} }; }
  const porKey = new Map(fields.map((f) => [f.key, f]));
  const valores: Record<string, string | number> = {};
  const origen: Record<string, Origen> = {};
  for (const dato of DICCIONARIO) {
    const fuente = fuentes[dato.lado];
    for (const destino of dato.destinos.filter((x) => aplica(x, formatoId))) {
      const field = porKey.get(destino.key);
      if (!field || destino.key in origen) continue;
      if (fuente) origen[destino.key] = { lado: dato.lado, campo: dato.campo, quien: fuente.nombre };
      const crudo = fuente ? (fuente.valores as Record<string, string | number | undefined>)[dato.campo] : undefined;
      if (vacio(crudo) || crudo === undefined) continue;
      // En un espacio de texto el tipo se escribe con su nombre («Nave o bodega»), no con su clave.
      const tipoEscrito = dato.campo === "tipo" && (field.type === "text" || field.type === "long") ? tipoInmueble(crudo) : undefined;
      const transformado = tipoEscrito ? TIPO_INMUEBLE_LABELS[tipoEscrito] : destino.transformar ? destino.transformar(crudo) : crudo;
      if (transformado === undefined) continue;
      const valor = valorPara(field, transformado);
      if (valor !== undefined) valores[destino.key] = valor;
    }
  }
  return { valores, origen };
}

/** Lo que se ve en la hoja: lo escrito en el documento y, donde no hay nada, lo que ya se sabe del asunto. */
export function mezclar(datos: Record<string, unknown>, delAsuntoValores: Record<string, unknown>): Record<string, unknown> {
  const salida: Record<string, unknown> = { ...datos };
  for (const [k, v] of Object.entries(delAsuntoValores)) if (vacio(salida[k])) salida[k] = v;
  return salida;
}

/** Lo que vuelve a la persona o al inmueble: los espacios que se llenaron en el documento y tienen un dato detrás. */
export function aDevolver(formatoId: string, cambios: Record<string, unknown>): { lado: Lado; campo: string; valor: string | number }[] {
  const salida: { lado: Lado; campo: string; valor: string | number }[] = [];
  const vistos = new Set<string>();
  for (const [key, valor] of Object.entries(cambios)) {
    if (typeof valor !== "string" && typeof valor !== "number") continue;
    if (typeof valor === "string" && !valor.trim()) continue;
    const dato = DICCIONARIO.find((x) => x.destinos.some((y) => y.key === key && aplica(y, formatoId)));
    if (!dato || dato.campo === "tipo" || dato.campo === "precio" || dato.campo === "telefono") continue;  // esos se cambian en su ficha
    const id = `${dato.lado}:${dato.campo}`;
    if (vistos.has(id)) continue;
    vistos.add(id);
    salida.push({ lado: dato.lado, campo: dato.campo, valor: typeof valor === "string" ? valor.trim() : valor });
  }
  return salida;
}

/** CURP y RFC solo vuelven a la ficha si tienen la forma correcta; si no, se quedan en el documento. */
export const CURP = /^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HMX][A-Z]{5}[A-Z0-9][0-9]$/;
export const RFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
