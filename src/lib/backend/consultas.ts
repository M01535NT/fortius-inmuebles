import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Coincidencia, Encargo } from "./asuntos-contrato";
import { apartadosPara, buscarCoincidencias } from "./asuntos";
import { claveCatalogo, mapaCatalogos } from "./catalogos";
import { etiquetaDe, ofrecidos } from "./catalogos-contrato";
import { fallo } from "./fallo";
import { FIRMAS } from "./firmas";
import {
  DEBE, DE_QUIEN, OCUPA, QUIERE, SI_NO,
  encargosSegun, inmuebleSegun, nombreDelAsunto, papelDeQuienLlama, primerPlan,
  type Carga, type Consulta, type ConsultaAbierta, type DatosConsulta,
} from "./consultas-contrato";
import type { StaffUser } from "./contracts";
import { BUCKET_EXPEDIENTES } from "./expediente-archivos";
import { ApiError } from "./http";

/**
 * La consulta (SPEC.md, sección 4). Se lee y se escribe con la sesión de quien atiende: la base decide qué ve cada quien.
 * «Abrir asunto» y «Guardar como contacto» son funciones de la base de una sola transacción.
 */

const T = { consultas: "fortius_inmuebles_consultas", cargas: "fortius_inmuebles_cargas_por_acomodar" } as const;
const CAMPOS = "id,version,estado,quien_nombre,quien_telefonos,quien_correo,canal,persona_id,que_pasa,datos,otras_personas,documentos_pedir,asunto_id,motivo,es_ejemplo,created_at,updated_at";
const CAMPOS_CARGA_ANTES = "id,nombre_original,mime,byte_length,created_at";
const CAMPOS_CARGA = `${CAMPOS_CARGA_ANTES},documento`;

const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
const telefono = z.object({ pais: z.string().trim().regex(/^\+?\d{1,4}$/), numero: z.string().trim().max(30) }).strict();
const datos = z.object({
  que_quiere: z.enum(QUIERE).optional(), de_quien: z.enum(DE_QUIEN).optional(), tipo: claveCatalogo.optional(),
  colonia: z.string().trim().max(120).optional(), ocupa: z.enum(OCUPA).optional(), escritura: z.enum(SI_NO).optional(),
  debe: z.array(z.enum(DEBE)).max(DEBE.length).optional(),
}).strict();
const otra = z.object({
  nombre: z.string().trim().min(1).max(160), papel: claveCatalogo,
  pais: z.string().trim().regex(/^\+?\d{1,4}$/).optional(), numero: z.string().trim().max(30).optional(), fallecida: z.boolean().optional(),
}).strict();
const docPedir = z.object({
  nombre: z.string().trim().min(1).max(200), grupo: z.enum(["persona", "inmueble", "credito", "otro"]).optional(),
  entrega_papel: z.string().trim().max(40).optional(), quitado: z.boolean().optional(), propio: z.boolean().optional(),
  recibido: z.boolean().optional(),
}).strict();
/** El documento de la lista al que pertenece un archivo (su nombre exacto); vacío o null: archivo suelto. */
export const documentoDeCarga = z.string().trim().max(200).nullable().optional().transform((x) => x || null);
export const cambioCargaSchema = z.object({ documento: documentoDeCarga }).strict();

export const nuevaConsultaSchema = z.object({
  quien_nombre: z.string().trim().max(160).optional(),
  canal: claveCatalogo.optional(),
  persona_id: z.uuid().optional(),
  /** Desde una consulta del sitio (registro «leads»): trae su mensaje, el canal «sitio» y lo que dijo del inmueble. */
  desde_lead: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/).optional(),
}).strict();

/** Lo que trae una consulta del sitio, tal como se guardó (registro viejo «leads»). */
export type LeadDelSitio = {
  nombre?: unknown; mensaje?: unknown; zona?: unknown; tipoPropiedad?: unknown; propiedadSlug?: unknown; personaId?: unknown;
  perfil?: { operacion?: unknown } | null;
};
const texto = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");
/** Qué quiere, según lo que eligió en el sitio. «Rentar» del sitio es buscar dónde vivir: no se adivina. */
const QUIERE_DEL_SITIO: Partial<Record<string, (typeof QUIERE)[number]>> = { vender: "vender", comprar: "comprar", arrendar: "rentar" };

/**
 * Arma lo que la consulta nueva recibe de una consulta del sitio: el mensaje en «Qué pasa» (con el inmueble por el que
 * preguntó), la zona como colonia, el tipo si está en la lista de tipos y qué quiere si se sabe. Nada se inventa.
 * `tipoDeLista` traduce el tipo del sitio («nave-industrial») a la clave de la lista de tipos, o null si no se ofrece.
 */
export function desdeElSitio(lead: LeadDelSitio, inmueble: string | null, tipoDeLista: (t: string) => string | null) {
  const lineas = [
    texto(lead.mensaje, 4000) ? `Del sitio: ${texto(lead.mensaje, 4000)}` : "Llegó por el sitio.",
    inmueble ? `Preguntó por: ${inmueble}` : "",
  ].filter(Boolean);
  const tipoSitio = texto(lead.tipoPropiedad, 40);
  const tipo = tipoSitio ? tipoDeLista(tipoSitio) : null;
  const quiere = QUIERE_DEL_SITIO[texto(lead.perfil?.operacion, 20)];
  const campos: DatosConsulta = {
    ...(quiere ? { que_quiere: quiere } : {}),
    ...(tipo ? { tipo } : {}),
    ...(texto(lead.zona, 120) ? { colonia: texto(lead.zona, 120) } : {}),
  };
  return { canal: "sitio" as const, quien_nombre: texto(lead.nombre, 160), que_pasa: lineas.join("\n"), datos: campos };
}

async function leerLead(client: SupabaseClient, id: string): Promise<{ lead: LeadDelSitio; inmueble: string | null }> {
  const r = await client.from("fortius_inmuebles_records").select("data").eq("collection", "leads").eq("id", id).maybeSingle();
  if (r.error) fallo(r.error);
  if (!r.data) throw new ApiError(404, "Esa consulta del sitio no existe o la lleva otro asesor.");
  const lead = (r.data as { data: LeadDelSitio }).data ?? {};
  const slug = texto(lead.propiedadSlug, 160);
  if (!slug) return { lead, inmueble: null };
  // El nombre del inmueble si quien atiende lo ve; si no, su dirección en el sitio.
  const i = await client.from("fortius_inmuebles_inmuebles").select("nombre,folio").eq("slug", slug).is("deleted_at", null).maybeSingle();
  const fila = i.error ? null : (i.data as { nombre: string; folio: string | null } | null);
  return { lead, inmueble: fila ? [fila.nombre, fila.folio].filter(Boolean).join(" · ") : `/inmuebles/${slug}` };
}

export const cambioConsultaSchema = z.object({
  version,
  quien_nombre: z.string().max(160).optional(),
  quien_telefonos: z.array(telefono).max(5).optional(),
  quien_correo: z.string().trim().max(200).nullable().optional(),
  canal: claveCatalogo.optional(),
  que_pasa: z.string().max(20000).optional(),
  datos: datos.optional(),
  otras_personas: z.array(otra).max(30).optional(),
  documentos_pedir: z.array(docPedir).max(80).optional(),
}).strict();

export const cierreSchema = z.discriminatedUnion("como", [
  z.object({ como: z.literal("contacto"), version, volver: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict(),
  z.object({ como: z.literal("no_procede"), version, motivo: z.string().trim().max(1000).optional() }).strict(),
  z.object({ como: z.literal("reabrir"), version }).strict(),
]);

type FilaConsulta = Omit<Consulta, "cargas">;

/** Teléfonos solo con dígitos; los vacíos no se guardan. */
function limpiarTelefonos(lista: { pais: string; numero: string }[]) {
  return lista
    .map((t) => ({ pais: `+${t.pais.replace(/\D/g, "") || "52"}`, numero: t.numero.replace(/\D/g, "") }))
    .filter((t) => t.numero.length > 0);
}

export async function listarAbiertas(client: SupabaseClient, user: StaffUser): Promise<ConsultaAbierta[]> {
  const r = await client.from(T.consultas).select("id,quien_nombre,que_pasa,updated_at")
    .eq("estado", "abierta").eq("responsable_id", user.id).is("deleted_at", null)
    .order("updated_at", { ascending: false }).limit(10);
  if (r.error) fallo(r.error);
  return (r.data ?? []) as ConsultaAbierta[];
}

export async function crearConsulta(client: SupabaseClient, user: StaffUser, entrada: z.infer<typeof nuevaConsultaSchema>) {
  // Desde el Directorio: la consulta llega con el nombre, el teléfono y el correo que ya tiene la ficha.
  type Ficha = { nombre: string; telefonos: { pais: string; numero: string }[] | null; correo: string | null };
  // Desde una consulta del sitio: lo que escribió y la ficha a la que ya se ligó («Persona y asunto»).
  let sitio: ReturnType<typeof desdeElSitio> | null = null;
  let personaId = entrada.persona_id;
  if (entrada.desde_lead) {
    const { lead, inmueble } = await leerLead(client, entrada.desde_lead);
    const ligada = typeof lead.personaId === "string" && z.uuid().safeParse(lead.personaId).success ? lead.personaId : undefined;
    if (personaId && ligada && personaId !== ligada) throw new ApiError(409, "Esa consulta del sitio ya está ligada a otra persona. Vuelve a cargar.");
    personaId = personaId ?? ligada;
    // Dos clics dan la misma: si ya hay una consulta abierta de ese mensaje del sitio, se devuelve esa.
    const abierta = await abiertaDelSitio(client, entrada.desde_lead);
    if (abierta) return abierta;
    const catalogos = await mapaCatalogos(client);
    const tipos = ofrecidos(catalogos.tipo_inmueble);
    sitio = desdeElSitio(lead, inmueble, (t) => (tipos.find((x) => x.clave === t) ?? tipos.find((x) => x.significado === t))?.clave ?? null);
  }
  let ficha: Ficha | null = null;
  if (personaId) {
    const p = await client.from("fortius_inmuebles_personas").select("nombre,telefonos,correo").eq("id", personaId).is("deleted_at", null).maybeSingle();
    if (p.error) fallo(p.error);
    if (!p.data) throw new ApiError(404, "Esa persona ya no está en el Directorio.");
    ficha = p.data as Ficha;
  }
  const r = await client.from(T.consultas).insert({
    quien_nombre: entrada.quien_nombre ?? ficha?.nombre ?? sitio?.quien_nombre ?? "", canal: entrada.canal ?? sitio?.canal ?? "llamada", persona_id: personaId ?? null,
    ...(ficha ? { quien_telefonos: Array.isArray(ficha.telefonos) ? ficha.telefonos.slice(0, 5) : [], quien_correo: ficha.correo } : {}),
    ...(sitio ? { que_pasa: sitio.que_pasa, datos: sitio.datos, desde_lead: entrada.desde_lead } : {}),
    responsable_id: user.id, creado_por: user.id,
  }).select("id,version").single();
  if (r.error?.code === "23505" && entrada.desde_lead) {
    // Otro clic la abrió justo antes: se devuelve esa; si no se ve (la atiende otra persona), se avisa.
    const abierta = await abiertaDelSitio(client, entrada.desde_lead);
    if (abierta) return abierta;
    throw new ApiError(409, "Ya hay una consulta abierta de ese mensaje del sitio y la atiende otra persona.");
  }
  if (r.error) fallo(r.error);
  return r.data as { id: string; version: number };
}

/** La consulta abierta que salió de esa consulta del sitio, si quien está en sesión la ve. */
async function abiertaDelSitio(client: SupabaseClient, leadId: string): Promise<{ id: string; version: number } | null> {
  const r = await client.from(T.consultas).select("id,version")
    .eq("desde_lead", leadId).eq("estado", "abierta").is("deleted_at", null).limit(1).maybeSingle();
  if (r.error) fallo(r.error);
  return (r.data as { id: string; version: number } | null) ?? null;
}

type FilaCarga = Omit<Carga, "documento"> & { documento?: string | null };
const aCarga = ({ documento, ...resto }: FilaCarga): Carga => (documento ? { ...resto, documento } : resto);

/** Lee los archivos de la consulta; si la base todavía no tiene a qué documento pertenecen, todos salen sueltos. */
async function leerCargas(client: SupabaseClient, id: string): Promise<Carga[]> {
  const pedir = (campos: string) => client.from(T.cargas).select(campos).eq("consulta_id", id).neq("estado", "descartado").order("created_at");
  let r = await pedir(CAMPOS_CARGA);
  if (r.error?.code === "42703") r = await pedir(CAMPOS_CARGA_ANTES);
  if (r.error) fallo(r.error);
  return ((r.data ?? []) as unknown as FilaCarga[]).map(aCarga);
}

export async function leerConsulta(client: SupabaseClient, id: string): Promise<Consulta> {
  const [c, cargas] = await Promise.all([
    client.from(T.consultas).select(CAMPOS).eq("id", id).maybeSingle(),
    leerCargas(client, id),
  ]);
  if (c.error) fallo(c.error);
  if (!c.data) throw new ApiError(404, "No se encontró la consulta");
  const fila = c.data as FilaConsulta;
  // Un documento con un archivo ligado está recibido, aunque no se haya marcado.
  const conArchivo = new Set(cargas.map((x) => x.documento).filter(Boolean));
  const documentos_pedir = (fila.documentos_pedir ?? []).map((x) => (conArchivo.has(x.nombre) && !x.recibido ? { ...x, recibido: true } : x));
  return { ...fila, documentos_pedir, cargas };
}

/** Se guarda sola mientras se escribe. Responde la versión nueva para el siguiente guardado. */
export async function cambiarConsulta(client: SupabaseClient, id: string, entrada: z.infer<typeof cambioConsultaSchema>): Promise<{ version: number }> {
  const { version: v, quien_telefonos, ...resto } = entrada;
  const cambios: Record<string, unknown> = { ...resto };
  if (quien_telefonos) cambios.quien_telefonos = limpiarTelefonos(quien_telefonos);
  if (resto.otras_personas) {
    cambios.otras_personas = resto.otras_personas.map((p) => ({
      ...p, pais: p.pais ? `+${p.pais.replace(/\D/g, "")}` : undefined, numero: p.numero?.replace(/\D/g, "") || undefined,
    }));
  }
  if (!Object.keys(cambios).length) return { version: v };
  const r = await client.from(T.consultas).update(cambios).eq("id", id).eq("version", v).eq("estado", "abierta").select("version");
  if (r.error) fallo(r.error);
  if (!r.data?.length) {
    const actual = await client.from(T.consultas).select("estado").eq("id", id).maybeSingle();
    if (actual.data && actual.data.estado !== "abierta") throw new ApiError(409, "Esta consulta ya se cerró.");
    throw new ApiError(409, "La consulta cambió en otra ventana. Vuelve a cargarla.");
  }
  return { version: (r.data[0] as { version: number }).version };
}

/**
 * Las fichas del Directorio que se parecen a quien llama (nombre completo, teléfonos y correo de la consulta), con los
 * asuntos en que están. Solo lo que quien atiende puede ver. Los datos se leen de la consulta, no van en la dirección.
 */
export async function coincidenciasDeConsulta(client: SupabaseClient, id: string): Promise<Coincidencia[]> {
  const r = await client.from(T.consultas).select("quien_nombre,quien_telefonos,quien_correo,persona_id").eq("id", id).maybeSingle();
  if (r.error) fallo(r.error);
  if (!r.data) throw new ApiError(404, "No se encontró la consulta");
  const c = r.data as { quien_nombre: string; quien_telefonos: { pais: string; numero: string }[] | null; quien_correo: string | null; persona_id: string | null };
  // La ficha que ya se eligió no se avisa como repetida.
  return buscarCoincidencias(client, { nombre: c.quien_nombre, telefonos: c.quien_telefonos ?? [], correo: c.quien_correo }, c.persona_id);
}

/**
 * «Abrir asunto»: lo que se decide se arma aquí con las reglas; la base lo crea todo junto. Con `personaId`, quien llama
 * es esa ficha del Directorio (la que avisó la consulta) y no se crea otra. Con null o sin él, queda la ficha que la
 * consulta ya tenía; si no tenía ninguna, se crea una nueva.
 *
 * Ligar la ficha y abrir son dos pasos. Si abrir falla después de ligar, la liga se deshace y el error lleva en
 * `version` la versión vigente de la consulta, para que la pantalla siga sin recargar.
 */
export async function abrirAsunto(client: SupabaseClient, id: string, v: number, personaId?: string | null): Promise<{ id: string; folio: string }> {
  const liga = personaId ? await elegirFicha(client, id, v, personaId) : null;
  if (!liga) return abrirConVersion(client, id, v);
  try {
    return await abrirConVersion(client, id, liga.version);
  } catch (e) {
    const deshecha = await client.from(T.consultas).update({ persona_id: liga.antes })
      .eq("id", id).eq("version", liga.version).eq("estado", "abierta").select("version");
    const vigente = deshecha.data?.length
      ? (deshecha.data[0] as { version: number }).version
      : ((await client.from(T.consultas).select("version").eq("id", id).maybeSingle()).data as { version: number } | null)?.version;
    const status = e instanceof ApiError ? e.status : 500;
    const mensaje = e instanceof ApiError ? e.message : "No se pudo abrir el asunto. Vuelve a intentarlo.";
    throw new ApiError(status, mensaje, { ...(e instanceof ApiError ? e.details : {}), ...(vigente ? { version: vigente } : {}) });
  }
}

async function abrirConVersion(client: SupabaseClient, id: string, v: number): Promise<{ id: string; folio: string }> {
  const c = await leerConsulta(client, id);
  if (c.estado === "asunto" && c.asunto_id) throw new ApiError(409, "Esta consulta ya abrió su asunto.");
  const d: DatosConsulta = c.datos ?? {};
  const encargos: Encargo[] = encargosSegun(d);
  // «Recibir los documentos» solo si queda alguno por recibir (leerConsulta ya marca recibido lo que tiene archivo).
  const hayDocumentos = c.documentos_pedir.some((x) => !x.quitado && !x.recibido);
  const catalogos = await mapaCatalogos(client);
  const nombreTipo = (t: string) => etiquetaDe(catalogos.tipo_inmueble, t);
  const inmueble = inmuebleSegun(c.quien_nombre, d, nombreTipo);
  // Si se describió el inmueble, su apartado aparece aunque lo encargado no lo pida (una revisión también es de una casa).
  const apartados = [...new Set([...apartadosPara(encargos), ...(inmueble ? (["inmueble"] as const) : [])])];
  const r = await client.rpc("fortius_inmuebles_abrir_asunto_desde_consulta", {
    p_consulta: id, p_version: v,
    p_nombre: nombreDelAsunto(c.quien_nombre, d, nombreTipo),
    p_encargos: encargos,
    p_apartados: apartados,
    p_papel: papelDeQuienLlama(d, (p) => ofrecidos(catalogos.papel).some((x) => x.clave === p)),
    p_inmueble: inmueble,
    p_plan: primerPlan(encargos, hayDocumentos),
  });
  if (r.error) fallo(r.error);
  const res = r.data as { id: string; folio: string };
  return { id: res.id, folio: res.folio };
}

/**
 * Deja la consulta ligada a una ficha que quien atiende puede ver. Devuelve la versión nueva y la ficha de antes (para
 * deshacer), o null si no hay nada que ligar: la consulta ya no está abierta, cambió en otra ventana o ya tenía esa
 * ficha. En esos casos «Abrir asunto» sigue como sin ficha elegida, y la base responde lo de siempre.
 */
async function elegirFicha(client: SupabaseClient, id: string, v: number, personaId: string): Promise<{ version: number; antes: string | null } | null> {
  const actual = await client.from(T.consultas).select("version,estado,persona_id").eq("id", id).maybeSingle();
  if (actual.error) fallo(actual.error);
  const c = actual.data as { version: number; estado: string; persona_id: string | null } | null;
  if (!c || c.estado !== "abierta" || c.version !== v || c.persona_id === personaId) return null;
  const p = await client.from("fortius_inmuebles_personas").select("id").eq("id", personaId).is("deleted_at", null).maybeSingle();
  if (p.error) fallo(p.error);
  if (!p.data) throw new ApiError(404, "Esa persona ya no está en el Directorio.");
  const r = await client.from(T.consultas).update({ persona_id: personaId }).eq("id", id).eq("version", v).eq("estado", "abierta").select("version");
  if (r.error) fallo(r.error);
  // Otra ventana guardó justo ahora: se abre sin ligar y la base responde el 409 de siempre.
  if (!r.data?.length) return null;
  return { version: (r.data[0] as { version: number }).version, antes: c.persona_id };
}

export async function cerrarConsulta(client: SupabaseClient, id: string, entrada: z.infer<typeof cierreSchema>): Promise<{ persona_id?: string }> {
  if (entrada.como === "contacto") {
    const r = await client.rpc("fortius_inmuebles_consulta_a_contacto", { p_consulta: id, p_version: entrada.version, p_volver: entrada.volver });
    if (r.error) fallo(r.error);
    return { persona_id: r.data as string };
  }
  const cambios = entrada.como === "no_procede"
    ? { estado: "no_procede", motivo: entrada.motivo || null }
    : { estado: "abierta" };
  const r = await client.from(T.consultas).update(cambios).eq("id", id).eq("version", entrada.version).neq("estado", "asunto").select("id");
  // Reabrir cuando ya hay otra abierta del mismo mensaje del sitio: solo una a la vez.
  if (r.error?.code === "23505") throw new ApiError(409, "Ya hay otra consulta abierta de ese mensaje del sitio. Sigue en esa.");
  if (r.error) fallo(r.error);
  if (!r.data?.length) throw new ApiError(409, "La consulta cambió en otra ventana. Vuelve a cargarla.");
  return {};
}

// ── Lo que ya mandó ──────────────────────────────────────────────────────────────────────────────────
export const TAMANO_MAXIMO = 20 * 1024 * 1024;
export { FIRMAS } from "./firmas";

/**
 * Sube un archivo de la consulta al bucket privado y lo deja esperando su renglón (se acomoda al abrir el asunto).
 * `documento`: el documento de la lista al que pertenece (su nombre exacto); sin él, es un archivo suelto.
 */
export async function subirArchivo(client: SupabaseClient, privileged: SupabaseClient, user: StaffUser, consultaId: string, file: File, documento: string | null = null): Promise<Carga> {
  const c = await client.from(T.consultas).select("id,estado").eq("id", consultaId).maybeSingle();
  if (c.error) fallo(c.error);
  if (!c.data) throw new ApiError(404, "No se encontró la consulta");
  if (c.data.estado !== "abierta") throw new ApiError(409, "Esta consulta ya se cerró.");
  if (file.size < 1 || file.size > TAMANO_MAXIMO) throw new ApiError(413, "Cada archivo puede pesar hasta 20 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const tipo = FIRMAS.find((f) => f.es(bytes));
  if (!tipo) throw new ApiError(415, "Solo PDF o fotos (JPG, PNG o WebP)");
  const nombre = (file.name || `archivo.${tipo.ext}`).replace(/[\u0000-\u001f]/g, "").slice(0, 240) || `archivo.${tipo.ext}`;
  const path = `consultas/${consultaId}/${randomUUID()}.${tipo.ext}`;
  const subido = await privileged.storage.from(BUCKET_EXPEDIENTES).upload(path, bytes, { contentType: tipo.mime, upsert: false });
  if (subido.error) throw new ApiError(502, "No se pudo subir el archivo. Vuelve a intentarlo.");
  const r = await privileged.from(T.cargas).insert({
    usuario_id: user.id, consulta_id: consultaId, path, nombre_original: nombre, mime: tipo.mime,
    byte_length: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"),
    ...(documento ? { documento } : {}),
  }).select(documento ? CAMPOS_CARGA : CAMPOS_CARGA_ANTES).single();
  if (r.error) {
    await privileged.storage.from(BUCKET_EXPEDIENTES).remove([path]);
    fallo(r.error);
  }
  return aCarga(r.data as unknown as FilaCarga);
}

/** Cambia a qué documento de la lista pertenece un archivo ya cargado (null: queda suelto). */
export async function cambiarArchivo(client: SupabaseClient, consultaId: string, cargaId: string, documento: string | null): Promise<Carga> {
  const r = await client.from(T.cargas).update({ documento, updated_at: new Date().toISOString() })
    .eq("id", cargaId).eq("consulta_id", consultaId).eq("estado", "por_acomodar").select(CAMPOS_CARGA);
  if (r.error) fallo(r.error);
  const fila = (r.data ?? [])[0] as unknown as FilaCarga | undefined;
  if (!fila) throw new ApiError(404, "Ese archivo ya no está en la consulta");
  return aCarga(fila);
}

/** Quitar un archivo adjunto: se marca descartado (recuperable); el archivo se queda en el bucket privado. */
export async function descartarArchivo(client: SupabaseClient, consultaId: string, cargaId: string): Promise<void> {
  const r = await client.from(T.cargas).update({ estado: "descartado", updated_at: new Date().toISOString() })
    .eq("id", cargaId).eq("consulta_id", consultaId).eq("estado", "por_acomodar").select("id");
  if (r.error) fallo(r.error);
  if (!r.data?.length) throw new ApiError(404, "Ese archivo ya no está en la consulta");
}
