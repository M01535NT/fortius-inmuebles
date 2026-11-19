import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { crearAsunto, crearEnParte, fallo, idSchema } from "./asuntos";
import type { StaffUser } from "./contracts";
import { FIRMAS as FIRMAS_DOCUMENTO } from "./consultas";
import { BUCKET_EXPEDIENTES } from "./expediente-archivos";
import { limpiarNombre } from "./apartados";
import { sinMetadatos } from "./files";
import { ApiError } from "./http";
import {
  camposDe, ESTADOS_INMUEBLE, estadosPara, MONEDAS, OPERACIONES, TIPOS_INMUEBLE,
  type AsuntoDelInmueble, type CambioPrecio, type DocumentoDelInmueble, type EstadoInmueble, type FilaInmueble, type Inmueble, type Medio,
  type Operacion, type TipoInmueble,
} from "./inmuebles-contrato";

/**
 * Inmuebles del panel (SPEC.md, sección 5). Se lee y se escribe con la sesión de quien entró (RLS decide qué ve).
 * Las fotos y los videos se suben con la llave del servidor al bucket público, ya revisados y sin metadatos;
 * subir no publica: solo sale en el sitio lo que tiene «Publicado».
 */

const T = {
  inmuebles: "fortius_inmuebles_inmuebles",
  medios: "fortius_inmuebles_inmueble_medios",
  precios: "fortius_inmuebles_inmueble_precios",
  ligas: "fortius_inmuebles_asunto_inmuebles",
  documentos: "fortius_inmuebles_asunto_documentos",
  archivos: "fortius_inmuebles_documento_archivos",
} as const;
export const BUCKET_PUBLICO = "fortius-inmuebles-public";
export const TAMANO_MAXIMO_MEDIO = 20 * 1024 * 1024;

const COLUMNAS_FILA = "id,folio,nombre,tipo,operacion,colonia,precio,moneda,estado,publicado,es_ejemplo,conjunto_id,responsable_id,portada_id,version";
const COLUMNAS_FICHA = `${COLUMNAS_FILA},slug,unidades_total,ficha,ciudad,referencias,direccion_exacta,mostrar_direccion,lat,lng,mapa,descripcion,publicado_el,compartido,inmobiliaria`;

type MedioLeido = { id: string; inmueble_id: string; tipo: Medio["tipo"]; url: string; path: string | null; nombre: string | null; alt: string | null; orden: number; created_at: string };
type LigaLeida = { inmueble_id: string; asunto: AsuntoDelInmueble | null };

const aMedio = (m: MedioLeido): Medio => ({ id: m.id, tipo: m.tipo, url: m.url, subido: m.path !== null, nombre: m.nombre, alt: m.alt, orden: m.orden, created_at: m.created_at });
const numero = (x: unknown) => (x === null || x === undefined ? null : Number(x));

// ── Lectura ──────────────────────────────────────────────────────────────────────────────────────────
export async function listarInmuebles(client: SupabaseClient): Promise<FilaInmueble[]> {
  const r = await client.from(T.inmuebles).select(COLUMNAS_FILA).is("deleted_at", null).order("created_at", { ascending: false }).limit(2000);
  if (r.error) fallo(r.error);
  const filas = (r.data ?? []) as (Omit<FilaInmueble, "portada" | "fotos" | "video" | "recorrido" | "asunto"> & { portada_id: string | null })[];
  if (!filas.length) return [];
  const ids = filas.map((f) => f.id);
  const [me, li] = await Promise.all([
    client.from(T.medios).select("id,inmueble_id,tipo,url,path,nombre,alt,orden,created_at").in("inmueble_id", ids).is("retirado_el", null).order("orden").order("created_at"),
    client.from(T.ligas).select("inmueble_id,asunto:fortius_inmuebles_asuntos(id,folio,nombre)").in("inmueble_id", ids).is("retirado_el", null).order("created_at", { ascending: false }),
  ]);
  if (me.error) fallo(me.error);
  if (li.error) fallo(li.error);
  const medios = new Map<string, MedioLeido[]>();
  for (const m of (me.data ?? []) as MedioLeido[]) medios.set(m.inmueble_id, [...(medios.get(m.inmueble_id) ?? []), m]);
  const asunto = new Map<string, AsuntoDelInmueble>();
  for (const l of (li.data ?? []) as unknown as LigaLeida[]) if (l.asunto && !asunto.has(l.inmueble_id)) asunto.set(l.inmueble_id, l.asunto);
  return filas.map(({ portada_id, ...f }) => {
    const ms = medios.get(f.id) ?? [];
    const fotos = ms.filter((m) => m.tipo === "foto");
    return {
      ...f, precio: numero(f.precio), portada: (fotos.find((m) => m.id === portada_id) ?? fotos[0])?.url ?? null,
      fotos: fotos.length, video: ms.some((m) => m.tipo === "video"), recorrido: ms.some((m) => m.tipo === "recorrido_360"),
      asunto: asunto.get(f.id) ?? null,
    };
  });
}

export async function leerInmueble(client: SupabaseClient, id: string): Promise<Inmueble> {
  const r = await client.from(T.inmuebles).select(COLUMNAS_FICHA).eq("id", id).is("deleted_at", null).maybeSingle();
  if (r.error) fallo(r.error);
  if (!r.data) throw new ApiError(404, "Ese inmueble no existe o no te toca verlo.");
  const base = r.data as unknown as Omit<Inmueble, "portada" | "fotos" | "video" | "recorrido" | "asunto" | "medios" | "precios" | "asuntos" | "documentos" | "conjunto" | "unidades">;
  const [me, pr, li, un, cj] = await Promise.all([
    client.from(T.medios).select("id,inmueble_id,tipo,url,path,nombre,alt,orden,created_at").eq("inmueble_id", id).is("retirado_el", null).order("orden").order("created_at"),
    client.from(T.precios).select("id,precio_antes,moneda_antes,precio,moneda,motivo,cambiado_por,created_at").eq("inmueble_id", id).order("created_at", { ascending: false }).limit(200),
    client.from(T.ligas).select("inmueble_id,asunto:fortius_inmuebles_asuntos(id,folio,nombre)").eq("inmueble_id", id).is("retirado_el", null).order("created_at", { ascending: false }),
    client.from(T.inmuebles).select("id,folio,nombre,estado,precio,publicado").eq("conjunto_id", id).is("deleted_at", null).order("folio"),
    base.conjunto_id ? client.from(T.inmuebles).select("id,folio,nombre").eq("id", base.conjunto_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  for (const x of [me, pr, li, un, cj]) if (x.error) fallo(x.error);
  const asuntos = ((li.data ?? []) as unknown as LigaLeida[]).map((l) => l.asunto).filter((a): a is AsuntoDelInmueble => a !== null);
  // Planos y permisos: los mismos documentos del asunto (lo que se sube aquí aparece allá).
  const docs = asuntos.length
    ? await client.from(T.documentos).select("id,nombre,grupo,estado,inmueble_id,archivos:fortius_inmuebles_documento_archivos(count)")
      .in("asunto_id", asuntos.map((a) => a.id)).is("deleted_at", null).order("orden").limit(500)
    : { data: [], error: null };
  if (docs.error) fallo(docs.error);
  const documentos = ((docs.data ?? []) as unknown as (Omit<DocumentoDelInmueble, "archivos"> & { inmueble_id: string | null; archivos: { count: number }[] })[])
    .filter((d) => d.inmueble_id === null || d.inmueble_id === id)
    .map(({ inmueble_id: _, archivos, ...d }) => ({ ...d, archivos: archivos?.[0]?.count ?? 0 }));
  const medios = ((me.data ?? []) as MedioLeido[]).map(aMedio);
  const fotos = medios.filter((m) => m.tipo === "foto");
  return {
    ...base, precio: numero(base.precio), lat: numero(base.lat), lng: numero(base.lng), ficha: base.ficha ?? {},
    portada: (fotos.find((m) => m.id === base.portada_id) ?? fotos[0])?.url ?? null,
    fotos: fotos.length, video: medios.some((m) => m.tipo === "video"), recorrido: medios.some((m) => m.tipo === "recorrido_360"),
    asunto: asuntos[0] ?? null, asuntos, medios, documentos,
    precios: ((pr.data ?? []) as CambioPrecio[]).map((p) => ({ ...p, precio: numero(p.precio), precio_antes: numero(p.precio_antes) })),
    conjunto: (cj.data as Inmueble["conjunto"]) ?? null,
    unidades: ((un.data ?? []) as Inmueble["unidades"]).map((u) => ({ ...u, precio: numero(u.precio) })),
  };
}

// ── Cambios ──────────────────────────────────────────────────────────────────────────────────────────
const corto = (max: number) => z.string().trim().max(max).transform((s) => s || null).nullable();
const https = z.string().trim().max(1000).regex(/^https:\/\/[^\s]+$/, "Pega un enlace que empiece con https://").nullable().or(z.literal("").transform(() => null));

export const cambioInmuebleSchema = z.object({
  version: z.number().int().positive(),
  nombre: z.string().trim().min(1).max(160).optional(),
  tipo: z.enum(TIPOS_INMUEBLE).nullable().optional(),
  operacion: z.enum(OPERACIONES).nullable().optional(),
  estado: z.enum(ESTADOS_INMUEBLE).optional(),
  precio: z.number().min(0).max(1e12).nullable().optional(),
  moneda: z.enum(MONEDAS).optional(),
  motivo_precio: z.string().trim().max(300).optional(),
  ficha: z.record(z.string().max(40), z.union([z.number().min(0).max(1e9), z.string().trim().max(120)])).optional(),
  colonia: corto(120).optional(),
  ciudad: z.string().trim().min(1).max(80).optional(),
  referencias: corto(500).optional(),
  direccion_exacta: corto(300).optional(),
  mostrar_direccion: z.boolean().optional(),
  mapa: https.optional(),
  descripcion: z.string().max(10000).optional(),
  publicado: z.boolean().optional(),
  portada_id: idSchema.nullable().optional(),
  conjunto_id: idSchema.nullable().optional(),
  unidades_total: z.number().int().min(1).max(500).nullable().optional(),
  compartido: z.boolean().optional(),
  inmobiliaria: corto(160).optional(),
}).strict();

/** Solo se guardan los datos que pide el tipo; los vacíos se quitan (no se inventan ceros). */
function limpiarFicha(tipo: TipoInmueble | null, ficha: Record<string, number | string>): Record<string, number | string> {
  const campos = new Map(camposDe(tipo).map((c) => [c.clave, c]));
  const fuera: Record<string, number | string> = {};
  for (const [k, v] of Object.entries(ficha)) {
    const c = campos.get(k);
    if (!c || v === "") continue;
    if (c.opciones) { if (typeof v === "string" && c.opciones.includes(v)) fuera[k] = v; continue; }
    if (c.texto) { fuera[k] = String(v).slice(0, 120); continue; }
    const cifra = typeof v === "number" ? v : Number(String(v).replace(/[,\s]/g, ""));
    if (Number.isFinite(cifra) && cifra >= 0) fuera[k] = cifra;
  }
  return fuera;
}

export async function cambiarInmueble(client: SupabaseClient, id: string, entrada: z.infer<typeof cambioInmuebleSchema>): Promise<void> {
  const { version: v, ...cambios } = entrada;
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const tocaEstado = cambios.operacion !== undefined || cambios.estado !== undefined;
  if (cambios.ficha || tocaEstado) {
    const actual = await client.from(T.inmuebles).select("tipo,operacion,estado").eq("id", id).maybeSingle();
    if (actual.error) fallo(actual.error);
    const fila = actual.data as { tipo: TipoInmueble | null; operacion: Operacion | null; estado: EstadoInmueble } | null;
    if (cambios.ficha) cambios.ficha = limpiarFicha((cambios.tipo ?? fila?.tipo ?? null) as TipoInmueble | null, cambios.ficha);
    // Un estado que no corresponde a la operación (un «Rentado» en venta) sacaría al inmueble del sitio: pasa a Libre.
    if (tocaEstado && fila) {
      const operacion = cambios.operacion !== undefined ? cambios.operacion : fila.operacion;
      const estado = cambios.estado ?? fila.estado;
      if (!estadosPara(operacion).includes(estado)) cambios.estado = "libre";
    }
  }
  if (cambios.conjunto_id === id) throw new ApiError(400, "Un inmueble no puede ser su propio conjunto.");
  const { data, error } = await client.from(T.inmuebles).update(cambios).eq("id", id).eq("version", v).is("deleted_at", null).select("id").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más cambió este inmueble. Vuelve a cargar y repite el cambio.");
}

export const loteSchema = z.object({
  ids: z.array(idSchema).min(1).max(200),
  publicar: z.boolean(),
}).strict();

/** Publicar o retirar varios de una vez (los cinco locales de la plaza, por ejemplo). Todo o nada. */
export async function publicarVarios(client: SupabaseClient, entrada: z.infer<typeof loteSchema>): Promise<number> {
  const ids = [...new Set(entrada.ids)];
  const vistos = await client.from(T.inmuebles).select("id,version").in("id", ids).is("deleted_at", null);
  if (vistos.error) fallo(vistos.error);
  if ((vistos.data ?? []).length !== ids.length) throw new ApiError(404, "Alguno de los inmuebles ya no está o no te toca.");
  // Una sola sentencia: o cambian todos o ninguno. La base sella quién y cuándo publicó cada uno.
  const r = await client.from(T.inmuebles).update({ publicado: entrada.publicar }).in("id", ids).is("deleted_at", null).select("id");
  if (r.error) fallo(r.error);
  return r.data?.length ?? 0;
}

export const nuevoInmuebleSchema = z.object({
  nombre: z.string().trim().min(1).max(160),
  tipo: z.enum(TIPOS_INMUEBLE).optional(),
  operacion: z.enum(OPERACIONES).optional(),
  colonia: z.string().trim().max(120).optional(),
  asunto_id: idSchema.optional(),
  /** Quién es el dueño, si ya se sabe: entra al asunto nuevo como propietario. */
  propietario: z.string().trim().min(1).max(160).optional(),
}).strict();

/**
 * Un inmueble siempre vive en un asunto. Desde un asunto, se agrega ahí; desde la lista de Inmuebles,
 * nace con su asunto de captación (encargo «Comercializar»), que lleva quien lo dio de alta.
 */
export async function crearInmueble(client: SupabaseClient, user: StaffUser, entrada: z.infer<typeof nuevoInmuebleSchema>): Promise<{ id: string; folio: string; asunto_id: string }> {
  const asuntoId = entrada.asunto_id ?? (await crearAsunto(client, user, { nombre: entrada.nombre, encargos: ["comercializar"] })).id;
  const r = await client.rpc("fortius_inmuebles_crear_inmueble", {
    p_asunto: asuntoId,
    p_datos: { nombre: entrada.nombre, tipo: entrada.tipo ?? "", operacion: entrada.operacion ?? "", colonia: entrada.colonia ?? "" },
  });
  if (r.error) fallo(r.error);
  if (entrada.propietario && !entrada.asunto_id) {
    await crearEnParte(client, user, asuntoId, "personas", { papel: "propietario", nueva: { nombre: entrada.propietario }, aunque_exista: true });
  }
  return { ...(r.data as { id: string; folio: string }), asunto_id: asuntoId };
}

export const copiaSchema = z.object({ asunto_id: idSchema, nombre: z.string().trim().max(160).optional() }).strict();

/** «Agregar otro igual»: otro local de la misma plaza en el mismo asunto. */
export async function copiarInmueble(client: SupabaseClient, id: string, entrada: z.infer<typeof copiaSchema>): Promise<{ id: string; folio: string }> {
  const r = await client.rpc("fortius_inmuebles_copiar_inmueble", { p_asunto: entrada.asunto_id, p_inmueble: id, p_nombre: entrada.nombre ?? "" });
  if (r.error) fallo(r.error);
  return r.data as { id: string; folio: string };
}

export async function eliminarInmueble(client: SupabaseClient, id: string, v: number, restaurar: boolean): Promise<void> {
  const r = await client.from(T.inmuebles).update({ deleted_at: restaurar ? null : new Date().toISOString(), publicado: false, version: v })
    .eq("id", id).eq("version", v).select("id").maybeSingle();
  if (r.error) fallo(r.error);
  if (!r.data) throw new ApiError(409, "Alguien más cambió este inmueble. Vuelve a cargar y repite el cambio.");
}

// ── Fotos, video y recorrido 360 ─────────────────────────────────────────────────────────────────────
const FIRMAS: { mime: string; ext: string; tipos: Medio["tipo"][]; es: (b: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", tipos: ["foto", "recorrido_360"], es: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", tipos: ["foto", "recorrido_360"], es: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/webp", ext: "webp", tipos: ["foto", "recorrido_360"], es: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
  { mime: "video/mp4", ext: "mp4", tipos: ["video"], es: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 },
  { mime: "video/webm", ext: "webm", tipos: ["video"], es: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];
export const tipoMedioSchema = z.enum(["foto", "video", "recorrido_360"]);

async function siguienteOrden(client: SupabaseClient, inmuebleId: string): Promise<number> {
  const r = await client.from(T.medios).select("orden").eq("inmueble_id", inmuebleId).order("orden", { ascending: false }).limit(1).maybeSingle();
  if (r.error) fallo(r.error);
  return r.data ? Number(r.data.orden) + 1 : 0;
}

/** Sube una foto, un video o una toma 360 (hasta 20 MB). Se revisa el contenido real, no el nombre. */
export async function subirMedio(client: SupabaseClient, privileged: SupabaseClient, userId: string, inmuebleId: string, tipo: Medio["tipo"], file: File): Promise<Medio> {
  const visto = await client.from(T.inmuebles).select("id").eq("id", inmuebleId).is("deleted_at", null).maybeSingle();
  if (visto.error) fallo(visto.error);
  if (!visto.data) throw new ApiError(404, "Ese inmueble no existe o no te toca verlo.");
  if (file.size < 1 || file.size > TAMANO_MAXIMO_MEDIO) throw new ApiError(413, "Cada archivo puede pesar hasta 20 MB. Para un video más grande, pega su enlace.");
  const crudo = new Uint8Array(await file.arrayBuffer());
  const firma = FIRMAS.find((f) => f.es(crudo));
  if (!firma || !firma.tipos.includes(tipo)) throw new ApiError(415, tipo === "video" ? "El video debe ser MP4 o WebM" : "Solo fotos JPG, PNG o WebP");
  // Una foto del celular trae la ubicación exacta de la casa: se quita antes de subirla al bucket público.
  const limpio = firma.mime.startsWith("image/") ? await sinMetadatos(new File([crudo], "x", { type: firma.mime }), firma.mime) : null;
  const bytes = limpio ? new Uint8Array(await limpio.arrayBuffer()) : crudo;
  const nombre = limpiarNombre(file.name, `archivo.${firma.ext}`);
  const path = `panel/inmuebles/${inmuebleId}/${randomUUID()}.${firma.ext}`;
  const subido = await privileged.storage.from(BUCKET_PUBLICO).upload(path, bytes, { contentType: firma.mime, upsert: false });
  if (subido.error) throw new ApiError(502, "No se pudo subir el archivo. Vuelve a intentarlo.");
  const url = privileged.storage.from(BUCKET_PUBLICO).getPublicUrl(path).data.publicUrl;
  const r = await privileged.from(T.medios).insert({
    inmueble_id: inmuebleId, tipo, url, path, nombre, mime: firma.mime, byte_length: bytes.byteLength,
    orden: await siguienteOrden(client, inmuebleId), creado_por: userId,
  }).select("id,inmueble_id,tipo,url,path,nombre,alt,orden,created_at").single();
  if (r.error) {
    await privileged.storage.from(BUCKET_PUBLICO).remove([path]);
    fallo(r.error);
  }
  return aMedio(r.data as MedioLeido);
}

export const enlaceSchema = z.object({ tipo: z.enum(["video", "recorrido_360"]), url: z.string().trim().max(1000).regex(/^https:\/\/[^\s]+$/, "Pega un enlace que empiece con https://") }).strict();

/** Video o recorrido por enlace (YouTube, Matterport…). Uno por tipo: el nuevo reemplaza al anterior. */
export async function ponerEnlace(client: SupabaseClient, userId: string, inmuebleId: string, entrada: z.infer<typeof enlaceSchema>): Promise<Medio> {
  const viejos = await client.from(T.medios).update({ retirado_el: new Date().toISOString() })
    .eq("inmueble_id", inmuebleId).eq("tipo", entrada.tipo).is("path", null).is("retirado_el", null).select("id");
  if (viejos.error) fallo(viejos.error);
  const r = await client.from(T.medios).insert({ inmueble_id: inmuebleId, tipo: entrada.tipo, url: entrada.url, orden: -1, creado_por: userId })
    .select("id,inmueble_id,tipo,url,path,nombre,alt,orden,created_at").single();
  if (r.error) fallo(r.error);
  return aMedio(r.data as MedioLeido);
}

export const cambioMedioSchema = z.object({
  id: idSchema,
  orden: z.number().min(-1e6).max(1e6).optional(),
  alt: z.string().trim().max(160).nullable().optional(),
  retirar: z.literal(true).optional(),
}).strict();

/** Ordenar, describir o quitar (recuperable: el archivo se queda). */
export async function cambiarMedio(client: SupabaseClient, inmuebleId: string, entrada: z.infer<typeof cambioMedioSchema>): Promise<void> {
  const { id, retirar, ...resto } = entrada;
  const cambios: Record<string, unknown> = { ...resto };
  if (retirar) {
    cambios.retirado_el = new Date().toISOString();
    // Si era la portada, el inmueble se queda sin portada elegida (la primera foto toma su lugar).
    const i = await client.from(T.inmuebles).select("version,portada_id").eq("id", inmuebleId).maybeSingle();
    if (i.error) fallo(i.error);
    if (i.data?.portada_id === id) {
      const p = await client.from(T.inmuebles).update({ portada_id: null, version: i.data.version }).eq("id", inmuebleId).eq("version", i.data.version).select("id");
      if (p.error) fallo(p.error);
    }
  }
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const r = await client.from(T.medios).update(cambios).eq("id", id).eq("inmueble_id", inmuebleId).is("retirado_el", null).select("id");
  if (r.error) fallo(r.error);
  if (!r.data?.length) throw new ApiError(404, "Ese archivo ya no está en el inmueble.");
}

// ── Planos y permisos ────────────────────────────────────────────────────────────────────────────────
export const documentoSchema = z.object({ nombre: z.string().trim().min(1).max(200) }).strict();

/**
 * Agrega un plano o un permiso a la lista de documentos del asunto del inmueble (la misma lista del apartado
 * Documentos). Con archivo, queda recibido; sin él, queda como «Falta». El archivo va al bucket privado.
 */
export async function agregarDocumento(client: SupabaseClient, privileged: SupabaseClient, user: StaffUser, inmuebleId: string, nombre: string, file: File | null): Promise<DocumentoDelInmueble> {
  const liga = await client.from(T.ligas).select("asunto_id").eq("inmueble_id", inmuebleId).is("retirado_el", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (liga.error) fallo(liga.error);
  if (!liga.data) throw new ApiError(404, "Ese inmueble no existe o no te toca verlo.");
  const asuntoId = (liga.data as { asunto_id: string }).asunto_id;
  let bytes: Uint8Array | null = null;
  let firma: (typeof FIRMAS_DOCUMENTO)[number] | undefined;
  if (file) {
    if (file.size < 1 || file.size > TAMANO_MAXIMO_MEDIO) throw new ApiError(413, "Cada archivo puede pesar hasta 20 MB");
    bytes = new Uint8Array(await file.arrayBuffer());
    firma = FIRMAS_DOCUMENTO.find((f) => f.es(bytes!));
    if (!firma) throw new ApiError(415, "Solo PDF o fotos (JPG, PNG o WebP)");
  }
  const d = await client.from(T.documentos).insert({
    asunto_id: asuntoId, nombre, grupo: "Permisos y planos", inmueble_id: inmuebleId, estado: bytes ? "recibido" : "falta",
    origen: "manual", creado_por: user.id,
  }).select("id,nombre,grupo,estado").single();
  if (d.error) fallo(d.error);
  const doc = d.data as Omit<DocumentoDelInmueble, "archivos">;
  if (!bytes || !firma || !file) return { ...doc, archivos: 0 };
  const path = `asuntos/${asuntoId}/${randomUUID()}.${firma.ext}`;
  const subido = await privileged.storage.from(BUCKET_EXPEDIENTES).upload(path, bytes, { contentType: firma.mime, upsert: false });
  if (subido.error) throw new ApiError(502, "El documento quedó en la lista, pero el archivo no se subió. Vuelve a intentarlo.");
  const a = await privileged.from(T.archivos).insert({
    documento_id: doc.id, asunto_id: asuntoId, path, nombre_original: limpiarNombre(file.name, `archivo.${firma.ext}`),
    mime: firma.mime, byte_length: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"), subido_por: user.id,
  });
  if (a.error) {
    await privileged.storage.from(BUCKET_EXPEDIENTES).remove([path]);
    fallo(a.error);
  }
  return { ...doc, archivos: 1 };
}
