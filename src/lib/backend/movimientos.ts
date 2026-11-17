import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { completeUpload, leerTicketDeCarga } from "./files";
import { ApiError, databaseError } from "./http";

/**
  PN-08 · Movimientos de Dinero (DEC-53, DEC-56): comisiones sueltas, gastos por reembolsar y apartados en resguardo,
  en `fortius_inmuebles_movimientos`. Lecturas y escrituras con el cliente de la sesión (RLS decide qué ve cada quien);
  solo Storage usa el cliente privilegiado. El comprobante vive en el bucket privado y se abre con una URL firmada corta.
  Mientras la migración no esté aplicada la tabla no existe: todo responde 503 con un texto claro.
*/
const TABLA = "fortius_inmuebles_movimientos";
const PRIVADO = "fortius-inmuebles-private";
const COLUMNAS = "id,tipo,asunto_id,monto,moneda,concepto,vence_el,cobrado,forma_pago,estado,liquidado_el,comprobante_path,comprobante_nombre,comprobante_tipo,responsable_id,creado_por,eliminado_el,version,created_at";
const TIPOS_COMPROBANTE = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
export const SIN_MOVIMIENTOS = "Los movimientos de Dinero todavía no están en el servidor. Se activan al publicar el panel nuevo.";

export type TipoMovimiento = "comision" | "gasto" | "apartado";
export type EstadoMovimiento = "pendiente" | "entregado" | "reembolsado" | "cobrado";
export type Movimiento = {
  id: string; tipo: TipoMovimiento; asuntoId: string; monto: number; moneda: "MXN" | "USD"; concepto: string;
  venceEl: string | null; cobrado: number; formaPago: string | null; estado: EstadoMovimiento; liquidadoEl: string | null;
  comprobante: { nombre: string; tipo: string } | null; responsableId: string; eliminado: boolean; version: number; creadoEl: string;
};
type Registro = {
  id: string; tipo: TipoMovimiento; asunto_id: string; monto: number | string; moneda: "MXN" | "USD"; concepto: string; vence_el: string | null;
  cobrado: number | string; forma_pago: string | null; estado: EstadoMovimiento; liquidado_el: string | null; comprobante_path: string | null;
  comprobante_nombre: string | null; comprobante_tipo: string | null; responsable_id: string; creado_por: string; eliminado_el: string | null;
  version: number; created_at: string;
};
type Cliente = Pick<SupabaseClient, "from">;
type ClienteServicio = Pick<SupabaseClient, "from" | "storage">;
type ErrorBase = { code?: string; message?: string };

// Mensajes que el disparador de la tabla lanza a propósito; se muestran tal cual.
const MENSAJES_DEL_DISPARADOR = new Set([
  "Alguien más cambió este movimiento. Vuelve a abrirlo.",
  "Esos datos del movimiento no se cambian",
  "Solo dirección reasigna un movimiento",
  "Este movimiento ya se cerró; su monto no cambia",
]);

const sinTabla = (error: ErrorBase) =>
  error.code === "PGRST205" || error.code === "42P01" || /could not find the table|relation .* does not exist/i.test(error.message ?? "");

/** Sin tabla: 503 para que la pantalla lo diga sin romperse. Los mensajes del disparador pasan tal cual (409/403). */
export function errorDeMovimientos(error: ErrorBase): never {
  if (sinTabla(error)) throw new ApiError(503, SIN_MOVIMIENTOS);
  if ((error.code === "PT409" || error.code === "PT403") && MENSAJES_DEL_DISPARADOR.has(error.message ?? "")) {
    throw new ApiError(Number(error.code.slice(2)), error.message!);
  }
  return databaseError(error);
}

const numero = (v: number | string) => Math.round(Number(v) * 100) / 100;
function aMovimiento(r: Registro): Movimiento {
  return {
    id: r.id, tipo: r.tipo, asuntoId: r.asunto_id, monto: numero(r.monto), moneda: r.moneda, concepto: r.concepto, venceEl: r.vence_el,
    cobrado: numero(r.cobrado), formaPago: r.forma_pago, estado: r.estado, liquidadoEl: r.liquidado_el,
    comprobante: r.comprobante_path && r.comprobante_nombre && r.comprobante_tipo ? { nombre: r.comprobante_nombre, tipo: r.comprobante_tipo } : null,
    responsableId: r.responsable_id, eliminado: r.eliminado_el !== null, version: Number(r.version), creadoEl: r.created_at,
  };
}

/** Todos los movimientos que la sesión puede ver y no se quitaron, más recientes primero. */
export async function listarMovimientos(client: Cliente): Promise<Movimiento[]> {
  const { data, error } = await client.from(TABLA).select(COLUMNAS).is("eliminado_el", null).order("created_at", { ascending: false }).limit(1000);
  if (error) errorDeMovimientos(error);
  return ((data ?? []) as Registro[]).map(aMovimiento);
}

/** Hoy en Tijuana más n días, como AAAA-MM-DD. */
function venceEn(dias: number, ahora = new Date()): string {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
  const fecha = new Date(`${hoy}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

const monto = z.number().min(0.01).max(999999999999).transform((n) => Math.round(n * 100) / 100);
const altaInput = z.object({
  tipo: z.enum(["comision", "gasto", "apartado"]),
  asuntoId: z.uuid(),
  monto,
  moneda: z.enum(["MXN", "USD"]).default("MXN"),
  concepto: z.string().trim().max(300).default(""),
  vence: z.enum(["0", "7", "30"]).default("0"),
  ticket: z.string().min(1).max(4096).optional(),
}).strict();

/** Guarda el comprobante (carga temporal privada) en el bucket privado y devuelve su ruta, nombre y tipo. */
async function guardarComprobante(servicio: ClienteServicio, userId: string, ticket: string) {
  const claims = leerTicketDeCarga(ticket, userId);
  if (claims.visibility !== "private") throw new ApiError(400, "El comprobante se guarda como privado");
  if (!TIPOS_COMPROBANTE.includes(claims.contentType)) throw new ApiError(400, "El comprobante debe ser PDF o imagen (JPG, PNG, WEBP o GIF)");
  const guardado = await completeUpload(servicio, userId, ticket);
  if (guardado.bucket !== PRIVADO) throw new ApiError(400, "El comprobante se guarda como privado");
  return { path: guardado.path, nombre: (guardado.name.trim() || "Comprobante").slice(0, 160), tipo: guardado.type };
}

async function quitarArchivo(servicio: ClienteServicio, path: string) {
  try { await servicio.storage.from(PRIVADO).remove([path]); } catch { /* queda privado; no cambia el resultado */ }
}

/** Anota un movimiento. Con ticket, guarda el comprobante en privado; si la base lo rechaza, el archivo se retira. */
export async function crearMovimiento(client: Cliente, servicio: ClienteServicio, userId: string, input: unknown): Promise<Movimiento> {
  const alta = altaInput.parse(input);
  // Si la tabla no existe, se avisa antes de tocar Storage.
  const sonda = await client.from(TABLA).select("id").limit(1);
  if (sonda.error) errorDeMovimientos(sonda.error);
  const comprobante = alta.ticket ? await guardarComprobante(servicio, userId, alta.ticket) : null;
  const fila = {
    tipo: alta.tipo, asunto_id: alta.asuntoId, monto: alta.monto, moneda: alta.moneda, concepto: alta.concepto,
    vence_el: alta.tipo === "apartado" || alta.vence === "0" ? null : venceEn(Number(alta.vence)),
    comprobante_path: comprobante?.path ?? null, comprobante_nombre: comprobante?.nombre ?? null, comprobante_tipo: comprobante?.tipo ?? null,
  };
  const { data, error } = await client.from(TABLA).insert(fila).select(COLUMNAS).single();
  if (error) {
    if (comprobante) await quitarArchivo(servicio, comprobante.path);
    errorDeMovimientos(error);
  }
  return aMovimiento(data as Registro);
}

async function leerRegistro(client: Cliente, id: string): Promise<Registro> {
  const { data, error } = await client.from(TABLA).select(COLUMNAS).eq("id", id).maybeSingle();
  if (error) errorDeMovimientos(error);
  if (!data) throw new ApiError(404, "Ese movimiento no existe o no lo puedes ver");
  return data as Registro;
}

const version = z.number().int().positive();
const cambioInput = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("entregar"), version }).strict(),
  z.object({ accion: z.literal("cobrar"), version, monto, formaPago: z.enum(["transferencia", "efectivo", "cheque"]) }).strict(),
  // Deshacer: regresa a pendiente con lo que estaba cobrado antes (0 en un apartado).
  z.object({ accion: z.literal("reabrir"), version, cobrado: z.number().min(0).max(999999999999).default(0), formaPago: z.enum(["transferencia", "efectivo", "cheque"]).nullable().default(null) }).strict(),
  z.object({ accion: z.literal("quitar"), version }).strict(),
  z.object({ accion: z.literal("restaurar"), version }).strict(),
  z.object({ accion: z.literal("comprobante"), version, ticket: z.string().min(1).max(4096) }).strict(),
]);

/** Registrar entrega o cobro, deshacerlo, quitar, restaurar o agregar el comprobante. La versión leída evita pisar un cambio ajeno. */
export async function cambiarMovimiento(client: Cliente, servicio: ClienteServicio, userId: string, id: string, input: unknown): Promise<Movimiento> {
  const cambio = cambioInput.parse(input);
  const actual = await leerRegistro(client, id);
  if (Number(actual.version) !== cambio.version) throw new ApiError(409, "Alguien más cambió este movimiento. Vuelve a abrirlo.");
  let datos: Record<string, unknown>;
  let nuevoArchivo: string | null = null;
  switch (cambio.accion) {
    case "entregar":
      if (actual.tipo !== "apartado") throw new ApiError(400, "Solo un apartado se entrega; lo demás se cobra");
      if (actual.estado !== "pendiente") throw new ApiError(409, "Este apartado ya se entregó");
      datos = { estado: "entregado" };
      break;
    case "cobrar": {
      if (actual.tipo === "apartado") throw new ApiError(400, "Un apartado no se cobra: se entrega al propietario");
      const falta = numero(numero(actual.monto) - numero(actual.cobrado));
      if (falta <= 0) throw new ApiError(409, "Esto ya está cobrado completo");
      if (cambio.monto > falta + 0.001) throw new ApiError(400, "No se puede cobrar más de lo que falta");
      datos = { cobrado: numero(numero(actual.cobrado) + cambio.monto), forma_pago: cambio.formaPago };
      break;
    }
    case "reabrir":
      if (actual.tipo === "apartado") datos = { estado: "pendiente" };
      else {
        if (cambio.cobrado >= numero(actual.monto)) throw new ApiError(400, "Para dejarlo pendiente, lo cobrado debe ser menor al monto");
        datos = { estado: "pendiente", cobrado: cambio.cobrado, forma_pago: cambio.formaPago };
      }
      break;
    case "quitar":
      datos = { eliminado_el: new Date().toISOString() };
      break;
    case "restaurar":
      datos = { eliminado_el: null };
      break;
    case "comprobante": {
      if (actual.comprobante_path) throw new ApiError(409, "Este movimiento ya tiene comprobante");
      const c = await guardarComprobante(servicio, userId, cambio.ticket);
      nuevoArchivo = c.path;
      datos = { comprobante_path: c.path, comprobante_nombre: c.nombre, comprobante_tipo: c.tipo };
      break;
    }
  }
  const { data, error } = await client.from(TABLA).update({ ...datos, version: cambio.version }).eq("id", id).select(COLUMNAS).maybeSingle();
  if (error || !data) {
    if (nuevoArchivo) await quitarArchivo(servicio, nuevoArchivo);
    if (error) errorDeMovimientos(error);
    throw new ApiError(404, "Ese movimiento no existe o no lo puedes ver");
  }
  return aMovimiento(data as Registro);
}

/** URL firmada de 5 minutos para ver el comprobante; antes, RLS confirma que la sesión puede ver el movimiento. */
export async function urlDeComprobante(client: Cliente, servicio: ClienteServicio, id: string): Promise<{ url: string; nombre: string }> {
  const r = await leerRegistro(client, id);
  if (!r.comprobante_path || !r.comprobante_nombre) throw new ApiError(404, "Este movimiento no tiene comprobante");
  const firmada = await servicio.storage.from(PRIVADO).createSignedUrl(r.comprobante_path, 300);
  if (firmada.error || !firmada.data?.signedUrl) throw new ApiError(410, "El comprobante ya no está disponible");
  return { url: firmada.data.signedUrl, nombre: r.comprobante_nombre };
}
