import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { normalizar } from "@/lib/panel/buscar";
import type { FilaAsunto } from "@/lib/panel/datos/asuntos";

/**
 * Bandeja (PN-06, primer corte): lógica pura. El asesor sube varios archivos; cada uno espera en la carga temporal
 * privada del servidor («Por confirmar») hasta que se elige a mano dónde va. La lectura automática no está activa:
 * aquí no se adivina el destino. Solo se ofrecen los destinos que ya tienen ruta en el servidor.
 */

/** Sin videos (AUD-06, 10): ningún destino de la Bandeja los guarda todavía; se rechazan al entrar y no después de subirlos. */
export const TIPOS_BANDEJA = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"] as const;
/** Lo que guarda el repositorio de documentos del asunto (`/api/admin/expedientes/{id}/archivos/completar`). */
export const TIPOS_ASUNTO = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
/** Lo que acepta la galería del inmueble (fotos públicas, sin EXIF ni GPS). */
export const TIPOS_FOTO_INMUEBLE = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_BYTES_BANDEJA = 20 * 1024 * 1024;
/** El permiso de la carga temporal dura 10 minutos en el servidor; se renueva un minuto antes por si acaso. */
export const VIGENCIA_CARGA_MS = 9 * 60_000;

export type ClaseDestino = "asunto" | "inmueble" | "persona";
export const CLASES_DESTINO: readonly { valor: ClaseDestino; etiqueta: string }[] = [
  { valor: "asunto", etiqueta: "Un asunto" },
  { valor: "inmueble", etiqueta: "Un inmueble" },
  { valor: "persona", etiqueta: "Una persona" },
];

export type Carga = { ticket: string; expira: number };

/** Dónde quedó un archivo guardado, con lo necesario para deshacerlo. */
export type Guardado =
  | { clase: "asunto"; expedienteId: string; archivoId: string; titulo: string; texto: string; href: string; porPersona?: string }
  | { clase: "inmueble"; slug: string; src: string; texto: string; href: string };

export type EstadoArchivo = "subiendo" | "por-confirmar" | "guardando" | "guardado" | "error";

export type ArchivoBandeja = {
  id: string;
  nombre: string;
  tipo: string;
  bytes: number;
  estado: EstadoArchivo;
  carga: Carga | null;
  error: string;
  guardado: Guardado | null;
  agregadoEl: number;
  /** Su fila en la cola del servidor (DEC-54); null si no alcanzó a anotarse o si la cola todavía no está en el servidor. */
  cola: { id: string; version: number } | null;
  /** Si los bytes están en este navegador. Uno recuperado del servidor no los tiene: se piden con un permiso al abrirlo o guardarlo. */
  enMemoria: boolean;
};

/** Una fila de la cola de la Bandeja tal como la devuelve `GET /api/admin/bandeja` (DEC-54). */
export type EstadoCola = "por_confirmar" | "guardado" | "descartado";
export type DestinoCola = { clase: "asunto" | "inmueble"; ref: string };
export type FilaBandeja = {
  id: string; nombre: string; tipo: string; bytes: number; estado: EstadoCola;
  destino: DestinoCola | null; version: number; creadoEl: string; venceEl: string;
};

/** Revisa un archivo antes de subirlo: tipo y tamaño que acepta el servidor. Devuelve el motivo si no se puede. */
export function revisarArchivo(f: { type: string; size: number; name: string }): string | null {
  if (f.type.startsWith("video/")) return `${f.name}: los videos todavía no se guardan desde aquí. Súbelo al recorrido del inmueble.`;
  if (!(TIPOS_BANDEJA as readonly string[]).includes(f.type)) return `${f.name}: solo PDF y fotos JPEG, PNG, WebP o GIF.`;
  if (!f.size) return `${f.name}: el archivo está vacío.`;
  if (f.size > MAX_BYTES_BANDEJA) return `${f.name}: pesa más de 20 MB.`;
  return null;
}

export function nuevoArchivo(id: string, f: { name: string; type: string; size: number }, ahora: number): ArchivoBandeja {
  return { id, nombre: f.name, tipo: f.type, bytes: f.size, estado: "subiendo", carga: null, error: "", guardado: null, agregadoEl: ahora, cola: null, enMemoria: true };
}

/** Un archivo que espera en la cola del servidor y no está en este navegador: entra «Por confirmar», sin permiso todavía. */
export function desdeCola(f: FilaBandeja, ahora = Date.now()): ArchivoBandeja {
  const creado = Date.parse(f.creadoEl);
  return {
    id: f.id, nombre: f.nombre, tipo: f.tipo, bytes: f.bytes, estado: "por-confirmar", carga: null, error: "", guardado: null,
    agregadoEl: Number.isFinite(creado) ? creado : ahora, cola: { id: f.id, version: f.version }, enMemoria: false,
  };
}

const idCola = (a: ArchivoBandeja) => a.cola?.id ?? null;

/**
 * Une la cola del servidor con lo que ya está en la página, sin duplicar (por id de cola).
 * Lo que ya está aquí se conserva tal cual (es lo más reciente) y solo toma la versión del servidor si es mayor.
 * Del servidor solo entra lo que sigue por confirmar.
 */
export function unirCola(locales: readonly ArchivoBandeja[], filas: readonly FilaBandeja[], ahora = Date.now()): ArchivoBandeja[] {
  const porId = new Map(filas.map((f) => [f.id, f]));
  const unidos = locales.map((a) => {
    const f = a.cola ? porId.get(a.cola.id) : undefined;
    return f && a.cola && f.version > a.cola.version ? { ...a, cola: { id: a.cola.id, version: f.version } } : a;
  });
  const vistos = new Set(locales.flatMap((a) => [a.id, idCola(a)]).filter((x): x is string => Boolean(x)));
  const nuevos = filas.filter((f) => f.estado === "por_confirmar" && !vistos.has(f.id)).map((f) => desdeCola(f, ahora));
  return [...unidos, ...nuevos];
}

/**
 * Un archivo de esta página quedó anotado en la cola: guarda su fila y quita la copia recuperada del servidor
 * si la lectura de la cola llegó antes que la respuesta de anotar.
 */
export function anotadoEnLista(lista: readonly ArchivoBandeja[], id: string, fila: Pick<FilaBandeja, "id" | "version">): ArchivoBandeja[] {
  return lista
    .filter((a) => a.id === id || a.enMemoria || (a.id !== fila.id && idCola(a) !== fila.id))
    .map((a) => (a.id === id ? { ...a, cola: { id: fila.id, version: fila.version } } : a));
}

/** La versión que devolvió el servidor después de cambiar la fila. */
export const conVersion = (a: ArchivoBandeja, version: number): ArchivoBandeja => (a.cola ? { ...a, cola: { id: a.cola.id, version } } : a);

/** El archivo ya no está en la carga temporal (410): queda con el error y solo se puede quitar. */
export const perdido = (a: ArchivoBandeja, error = "Este archivo ya no está en la Bandeja del servidor. Vuelve a subirlo desde tu equipo."): ArchivoBandeja =>
  ({ ...a, estado: "error", carga: null, error });

/** Los bytes ya están en este navegador (se descargaron con el permiso). */
export const enMemoria = (a: ArchivoBandeja): ArchivoBandeja => ({ ...a, enMemoria: true });

/** El destino que se anota en la cola: la persona se guarda en uno de sus asuntos, así que cuenta como asunto. */
export function destinoCola(g: Guardado): DestinoCola {
  return g.clase === "asunto" ? { clase: "asunto", ref: g.expedienteId } : { clase: "inmueble", ref: g.slug };
}

export const cargaVigente = (c: Carga | null, ahora: number): c is Carga => Boolean(c && c.expira > ahora);

/**
 * Si un destino no se puede usar con este archivo, la línea que lo explica; null si se puede.
 * La persona no tiene ruta propia para documentos: su archivo se guarda en uno de sus asuntos.
 */
export function motivoDestino(clase: ClaseDestino, tipo: string): string | null {
  if (clase === "asunto" || clase === "persona") {
    if ((TIPOS_ASUNTO as readonly string[]).includes(tipo)) return null;
    if (tipo.startsWith("video/")) return "Los asuntos guardan PDF y fotos; los videos todavía no tienen dónde guardarse desde la Bandeja.";
    return "Los asuntos guardan PDF y fotos JPEG, PNG o WebP; un GIF solo puede ir a las fotos de un inmueble.";
  }
  if ((TIPOS_FOTO_INMUEBLE as readonly string[]).includes(tipo)) return null;
  if (tipo.startsWith("video/")) return "El inmueble guarda un enlace de video, no el archivo; los videos todavía no tienen dónde guardarse desde la Bandeja.";
  return "La ficha del inmueble solo guarda fotos públicas; un documento del inmueble se guarda en su asunto.";
}

export type Opcion = { valor: string; etiqueta: string };

const coincide = (texto: string, consulta: string) => {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  const t = normalizar(texto);
  return palabras.every((p) => t.includes(p));
};

export const nombrePersona = (c: Pick<Cliente, "nombre">) => c.nombre?.trim() || "Sin nombre";

/** Opciones del destino elegido, filtradas por lo que se escribió en «Buscar». Nunca muestra CURP ni RFC. */
export function opcionesDestino(clase: ClaseDestino, d: { asuntos: readonly FilaAsunto[]; inmuebles: readonly Property[]; personas: readonly Cliente[] }, consulta: string): Opcion[] {
  if (clase === "asunto") {
    return d.asuntos
      .filter((a) => coincide(`${a.titulo} ${a.folio} ${a.linea}`, consulta))
      .map((a) => ({ valor: a.id, etiqueta: a.folio ? `${a.titulo} · ${a.folio}` : a.titulo }));
  }
  if (clase === "inmueble") {
    return d.inmuebles
      .filter((p) => coincide(`${p.titulo} ${p.codigo} ${p.zona}`, consulta))
      .map((p) => ({ valor: p.slug, etiqueta: p.codigo ? `${p.titulo} · ${p.codigo}` : p.titulo }));
  }
  return d.personas
    .filter((c) => coincide(`${nombrePersona(c)} ${c.telefono ?? ""} ${c.email ?? ""}`, consulta))
    .map((c) => ({ valor: c.id, etiqueta: c.telefono ? `${nombrePersona(c)} · ${c.telefono}` : nombrePersona(c) }));
}

/** Los asuntos de una persona (donde se guarda su archivo). Los cerrados al final. */
export function asuntosDePersona(personaId: string, asuntos: readonly FilaAsunto[]): FilaAsunto[] {
  const peso = (a: FilaAsunto) => (a.estado === "cerrado" ? 1 : 0);
  return asuntos.filter((a) => a.persona?.id === personaId).sort((a, b) => peso(a) - peso(b));
}

/** Título con el que se guarda en el asunto: el nombre del archivo sin extensión ni guiones bajos. */
export function tituloArchivo(nombre: string): string {
  const base = nombre.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Documento").slice(0, 240);
}

export const rutaAsunto = (id: string) => `/admin/asuntos?ver=${encodeURIComponent(id)}`;
export const rutaInmueble = (p: Pick<Property, "codigo" | "slug">) => `/admin/inmuebles?ver=${encodeURIComponent(p.codigo || p.slug)}`;

export function textoGuardadoAsunto(a: Pick<FilaAsunto, "titulo" | "folio">, persona?: string): string {
  const donde = a.folio ? `${a.titulo} (${a.folio})` : a.titulo;
  return persona ? `En el asunto ${donde} de ${persona}` : `En el asunto ${donde}`;
}
export const textoGuardadoInmueble = (p: Pick<Property, "titulo">) => `En las fotos de ${p.titulo}`;

/** Línea de estado de cada archivo, en palabras del asesor. */
export function textoEstado(a: ArchivoBandeja): string {
  switch (a.estado) {
    case "subiendo": return "Subiendo…";
    case "por-confirmar": return "Por confirmar: elige dónde va";
    case "guardando": return "Guardando…";
    case "guardado": return a.guardado?.texto ?? "Guardado";
    case "error": return a.error || "No se pudo subir";
  }
}

export function tamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

export function claseArchivo(tipo: string): "pdf" | "foto" | "video" {
  return tipo === "application/pdf" ? "pdf" : tipo.startsWith("video/") ? "video" : "foto";
}

/** Por confirmar incluye lo que se sube, se guarda o falló (sigue en la cola); Guardados, lo que ya tiene destino, lo último primero. */
export function vistaBandeja(archivos: readonly ArchivoBandeja[], vista: "pendientes" | "guardados"): ArchivoBandeja[] {
  if (vista === "guardados") return archivos.filter((a) => a.estado === "guardado").sort((a, b) => b.agregadoEl - a.agregadoEl);
  return archivos.filter((a) => a.estado !== "guardado").sort((a, b) => a.agregadoEl - b.agregadoEl);
}

export function cuentasBandeja(archivos: readonly ArchivoBandeja[]) {
  return {
    porConfirmar: archivos.filter((a) => a.estado === "por-confirmar").length,
    enProceso: archivos.filter((a) => a.estado === "subiendo" || a.estado === "guardando").length,
    conError: archivos.filter((a) => a.estado === "error").length,
    guardados: archivos.filter((a) => a.estado === "guardado").length,
  };
}

/**
 * Lo que se quiere confirmar antes de salir: hay archivos que todavía no tienen destino.
 * Con la cola en el servidor, solo lo que no alcanzó a anotarse se perdería al cerrar.
 */
export const hayPendientes = (archivos: readonly ArchivoBandeja[], conServidor = false) =>
  archivos.some((a) => a.estado !== "guardado" && a.estado !== "error" && !(conServidor && a.cola));

/** Cambios de un archivo; cada uno devuelve una copia. */
export const subido = (a: ArchivoBandeja, carga: Carga): ArchivoBandeja => ({ ...a, estado: "por-confirmar", carga, error: "" });
export const falloSubida = (a: ArchivoBandeja, error: string): ArchivoBandeja => ({ ...a, estado: "error", carga: null, error });
export const guardando = (a: ArchivoBandeja): ArchivoBandeja => ({ ...a, estado: "guardando", error: "" });
/** Guardar consume la carga temporal: si se deshace, se vuelve a subir desde este navegador. */
export const guardadoEn = (a: ArchivoBandeja, g: Guardado): ArchivoBandeja => ({ ...a, estado: "guardado", carga: null, guardado: g, error: "" });
export const falloGuardar = (a: ArchivoBandeja, error: string): ArchivoBandeja => ({ ...a, estado: "por-confirmar", error });
export const deshecho = (a: ArchivoBandeja): ArchivoBandeja => ({ ...a, estado: "por-confirmar", guardado: null, error: "" });
