import { ESTADO_LABELS as ESTADOS_SITIO, OPERACION_LABELS, TIPO_LABELS, formatPrecio, type Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { normalizar } from "@/lib/panel/buscar";
import { diaLargo } from "@/lib/panel/calendario";

/** En el panel «En captación» basta: «privado» es palabra técnica (la captación nunca se publica). */
export const ESTADO_LABELS: Record<Property["estado"], string> = { ...ESTADOS_SITIO, evaluacion: "En captación" };
/** «No sabe» viene de la entrevista: no es una zona. */
const zonaReal = (z: string | undefined | null) => (z && z.trim().toLowerCase() !== "no sabe" ? z : undefined);

/** Lo que cada pantalla del panel nuevo muestra de un registro, ya listo para pintar. Sin tocar el servidor. */

export type FilaPersona = { id: string; nombre: string; subtitulo: string; contacto: string; tipo: Cliente["tipo"]; sinContacto: boolean; creadoEl: string };

/** «Filtrar y ordenar» (sugerencia 9). */
export type OrdenPersonas = "nombre" | "recientes";
export type OrdenInmuebles = "nombre" | "precio_mayor" | "precio_menor" | "folio";

export function ordenarPersonas(filas: readonly FilaPersona[], orden: OrdenPersonas): FilaPersona[] {
  const copia = [...filas];
  return orden === "recientes" ? copia.sort((a, b) => b.creadoEl.localeCompare(a.creadoEl)) : copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Por precio, los que no tienen precio publicado van al final. */
export function ordenarInmuebles(filas: readonly FilaInmueble[], orden: OrdenInmuebles): FilaInmueble[] {
  const copia = [...filas];
  if (orden === "folio") return copia.sort((a, b) => a.codigo.localeCompare(b.codigo));
  if (orden === "nombre") return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  const signo = orden === "precio_mayor" ? -1 : 1;
  return copia.sort((a, b) => (a.precioNum === null ? 1 : b.precioNum === null ? -1 : signo * (a.precioNum - b.precioNum)));
}

const TIPOS_PERSONA: Record<Cliente["tipo"], string> = {
  propietario: "Propietario", comprador: "Comprador", arrendador: "Arrendador", arrendatario: "Arrendatario", inversionista: "Inversionista", otro: "Otro",
};
export const NOMBRE_TIPO_PERSONA = TIPOS_PERSONA;
/** Título de cada grupo en la lista (no basta con agregar «s»: «Compradors»). */
export const PLURAL_TIPO_PERSONA: Record<Cliente["tipo"], string> = {
  propietario: "Propietarios", comprador: "Compradores", arrendador: "Arrendadores", arrendatario: "Arrendatarios", inversionista: "Inversionistas", otro: "Otros",
};

/** Teléfono legible: 10 dígitos como «664 123 4567»; con lada de país, «+52 664 123 4567». Lo demás, tal cual. */
export function telefonoLegible(t: string | undefined | null): string {
  if (!t) return "";
  const d = t.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 12 && d.startsWith("52")) return `+52 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return t;
}

/** La lista de Personas ya va agrupada por tipo: la fila no lo repite. */
export function filaPersona(c: Cliente): FilaPersona {
  const contacto = [telefonoLegible(c.telefono), c.email].filter(Boolean).join(" · ");
  return {
    id: c.id,
    nombre: c.nombre?.trim() || "Sin nombre",
    subtitulo: zonaReal(c.zona) ?? "",
    contacto,
    tipo: c.tipo,
    sinContacto: !c.telefono && !c.email,
    creadoEl: c.creadoEl ?? "",
  };
}

/** Busca por nombre, teléfono, correo o zona (sin acentos ni mayúsculas). */
export function filtrarPersonas(filas: readonly FilaPersona[], consulta: string): FilaPersona[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (!palabras.length) return [...filas];
  return filas.filter((f) => {
    const pajar = normalizar(`${f.nombre} ${TIPOS_PERSONA[f.tipo] ?? ""} ${f.subtitulo} ${f.contacto}`);
    return palabras.every((p) => pajar.includes(p));
  });
}

export type FilaInmueble = {
  slug: string; codigo: string; titulo: string; subtitulo: string; precio: string; estado: string;
  operacion: Property["operacion"]; esEjemplo: boolean; privado: boolean;
  /** Precio en número para ordenar; null si es «a consulta». */
  precioNum: number | null;
};

export function filaInmueble(p: Property): FilaInmueble {
  return {
    slug: p.slug,
    codigo: p.codigo,
    titulo: p.titulo,
    subtitulo: [TIPO_LABELS[p.tipo], zonaReal(p.zona)].filter(Boolean).join(" · "),
    precio: formatPrecio(p.precio),
    estado: `${OPERACION_LABELS[p.operacion]} · ${ESTADO_LABELS[p.estado]}`,
    operacion: p.operacion,
    esEjemplo: Boolean(p.demo),
    privado: p.estado === "evaluacion",
    precioNum: p.precio.modalidad === "publico" ? p.precio.monto : null,
  };
}

/** Ficha de solo lectura (PN-03). `falta` marca un dato pendiente para que se vea en tono de aviso. */
export type DatoFicha = { etiqueta: string; valor: string; falta?: boolean };
export type SeccionFicha = { titulo: string; datos: DatoFicha[] };

const FALTA = "Falta";
const dato = (etiqueta: string, valor: string | undefined | null): DatoFicha | null => (valor && valor.trim() ? { etiqueta, valor: valor.trim() } : null);
const pendiente = (etiqueta: string, valor: string | undefined | null): DatoFicha => dato(etiqueta, valor) ?? { etiqueta, valor: FALTA, falta: true };
const limpia = (datos: (DatoFicha | null)[]) => datos.filter((d): d is DatoFicha => d !== null);
const seccion = (titulo: string, datos: (DatoFicha | null)[]): SeccionFicha | null => {
  const d = limpia(datos);
  return d.length ? { titulo, datos: d } : null;
};
const fecha = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Tijuana" });
};

/**
 * Ficha de una persona. Los datos de identidad (CURP, RFC, identificación…) no se muestran aquí:
 * solo se dice si ya están o faltan, para que el expediente se complete sin exponerlos en pantalla.
 */
export function fichaPersona(c: Cliente): SeccionFicha[] {
  const identidad: [string, string | undefined][] = [
    ["CURP", c.curp], ["RFC", c.rfc], ["Identificación", c.identificacion], ["Domicilio", c.domicilio], ["Estado civil", c.estadoCivil], ["Fecha de nacimiento", c.fechaNacimiento],
  ];
  // El correo no es dato mínimo: solo se marca si tampoco hay teléfono (AUD-03).
  const sinContacto = !c.telefono?.trim() && !c.email?.trim();
  const registrados = identidad.filter(([, v]) => v && v.trim()).map(([e]) => e);
  const faltan = identidad.length - registrados.length;
  const perfil = (c.perfil ?? {}) as { proximaAccion?: string; proximoContacto?: string; canalPreferido?: string };
  const prefiere = ({ whatsapp: "WhatsApp", llamada: "Llamada", correo: "Correo" } as Record<string, string>)[perfil.canalPreferido ?? ""];
  return [
    // «Lo que sigue» lo pone el asesor (boceto de Personas); sin él, la persona queda «Sin seguimiento».
    seccion("Lo que sigue", perfil.proximaAccion?.trim() || perfil.proximoContacto
      ? [dato("Qué", perfil.proximaAccion?.trim() || undefined), dato("Cuándo", perfil.proximoContacto ? diaLargo(perfil.proximoContacto) : undefined)]
      : [{ etiqueta: "Seguimiento", valor: "Sin seguimiento", falta: true }]),
    seccion("Contacto", [
      sinContacto ? { etiqueta: "Teléfono", valor: FALTA, falta: true } : dato("Teléfono", telefonoLegible(c.telefono)),
      sinContacto ? { etiqueta: "Correo", valor: FALTA, falta: true } : dato("Correo", c.email),
      dato("Prefiere", prefiere),
      dato("Zona", zonaReal(c.zona)),
    ]),
    seccion("Interés", [dato("Papel", TIPOS_PERSONA[c.tipo]), dato("Tipo de inmueble", c.tipoPropiedad ? ((TIPO_LABELS as Record<string, string>)[c.tipoPropiedad] ?? c.tipoPropiedad) : undefined), dato("Mensaje", c.mensaje), dato("Notas", c.notas)]),
    // Una sola línea (AUD-03): a quien apenas preguntó no se le llenan seis avisos de datos que se piden al hacer un contrato.
    seccion("Datos para contratos", [
      faltan === 0
        ? { etiqueta: "Estado", valor: "Completos" }
        : { etiqueta: "Estado", valor: `Faltan ${faltan} de ${identidad.length}. Se piden al preparar un contrato.`, falta: registrados.length > 0 },
      registrados.length ? { etiqueta: "Registrados", valor: registrados.join(", ") } : null,
    ]),
    seccion("Registro", [dato("Alta", fecha(c.creadoEl)), dato("Último cambio", fecha(c.actualizadoEl)), c.convertidoEl ? dato("Llegó como consulta", fecha(c.convertidoEl)) : null]),
  ].filter((s): s is SeccionFicha => s !== null);
}

const num = (n: number | undefined, sufijo: string) => (typeof n === "number" && n > 0 ? `${n.toLocaleString("es-MX")}${sufijo ? ` ${sufijo}` : ""}` : undefined);

/** Ficha de un inmueble: lo que el asesor necesita para atender una llamada. */
export function fichaInmueble(p: Property): SeccionFicha[] {
  const f = p.ficha ?? {};
  return [
    seccion("Resumen", [
      dato("Folio", p.codigo), dato("Operación", OPERACION_LABELS[p.operacion]), dato("Tipo", TIPO_LABELS[p.tipo]), dato("Precio", formatPrecio(p.precio)),
      dato("Estado", ESTADO_LABELS[p.estado]), dato("En el sitio", p.publicada ? "Publicado" : "Sin publicar"),
      p.demo ? { etiqueta: "Aviso", valor: "Dato de ejemplo, no es una oferta vigente", falta: true } : null,
      p.colaboracion ? dato("Origen", "En colaboración con otra inmobiliaria") : null,
    ]),
    seccion("Ubicación", [pendiente("Zona", zonaReal(p.zona)), dato("Referencia", p.direccionAproximada)]),
    seccion("Ficha técnica", [
      dato("Terreno", num(f.terrenoM2, "m²")), dato("Construcción", num(f.construccionM2, "m²")), dato("Recámaras", num(f.recamaras, "")),
      dato("Baños", num(f.banos, "")), dato("Estacionamientos", num(f.estacionamientos, "")), dato("Antigüedad", f.antiguedad),
    ]),
    seccion("Material", [
      { etiqueta: "Fotos", valor: p.galeria?.length ? `${p.galeria.length}` : FALTA, falta: !p.galeria?.length },
      dato("Video", p.videoUrl ? "Cargado" : undefined), dato("Recorrido 360", p.tour360Url ? "Cargado" : undefined),
      dato("Documentos", p.documentos?.length ? `${p.documentos.length}` : undefined),
    ]),
  ].filter((s): s is SeccionFicha => s !== null);
}

export function filtrarInmuebles(filas: readonly FilaInmueble[], consulta: string, operacion: "todos" | "venta" | "renta"): FilaInmueble[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  return filas.filter((f) => {
    if (operacion !== "todos" && f.operacion !== operacion) return false;
    const pajar = normalizar(`${f.titulo} ${f.subtitulo} ${f.codigo} ${f.estado}`);
    return palabras.every((p) => pajar.includes(p));
  });
}
