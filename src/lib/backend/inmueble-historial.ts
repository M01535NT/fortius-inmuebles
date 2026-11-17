import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ApiError, databaseError } from "./http";
import { propiedadVisible } from "./repository";

/**
  Historial del inmueble (panel nuevo): «Publicar así», cambios de precio, publicar o quitar del sitio y el interruptor
  «Dirección exacta». Reutiliza el historial de PN-02 (`fortius_inmuebles_historial`, migración 20261116090500): solo se
  agrega, el actor es siempre quien está en sesión y RLS decide qué ve cada quien (dirección todo; el asesor lo suyo).
  Mientras esa migración no esté aplicada la tabla no existe: todo responde 503 y la pestaña dice que llega después.
*/
export const SIN_HISTORIAL = "El historial del inmueble todavía no está en el servidor. Llega al publicar el panel nuevo.";
export const ACCIONES_INMUEBLE = ["publicar", "publicar_asi", "quitar_sitio", "precio", "direccion_exacta"] as const;
export type AccionInmueble = (typeof ACCIONES_INMUEBLE)[number];
export type EntradaHistorial = { id: number; accion: string; resumen: string; detalle: Record<string, unknown> | null; actorId: string | null; creadoEl: string };

type Cliente = Pick<SupabaseClient, "from" | "rpc">;
type ErrorBase = { code?: string; message?: string };
const slugValido = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
const sinTabla = (e: ErrorBase) => ["PGRST205", "PGRST202", "42P01", "42883"].includes(e.code ?? "")
  || /could not find the (table|function)|relation .* does not exist|function .* does not exist/i.test(e.message ?? "");
function errorDeHistorial(e: ErrorBase): never {
  if (sinTabla(e)) throw new ApiError(503, SIN_HISTORIAL);
  return databaseError(e);
}

async function inmuebleVisible(client: Cliente, slug: string): Promise<string> {
  const s = slugValido.parse(slug);
  if (!(await propiedadVisible(client, s))) throw new ApiError(404, "Inmueble no disponible");
  return s;
}

export async function listarHistorialInmueble(client: Cliente, slug: string): Promise<EntradaHistorial[]> {
  const s = await inmuebleVisible(client, slug);
  const { data, error } = await client.from("fortius_inmuebles_historial").select("id,accion,resumen,detalle,actor_id,created_at")
    .eq("entidad", "inmueble").eq("entidad_id", s).order("created_at", { ascending: false }).limit(100);
  if (error) errorDeHistorial(error);
  return ((data ?? []) as { id: number; accion: string; resumen: string; detalle: Record<string, unknown> | null; actor_id: string | null; created_at: string }[])
    .map((r) => ({ id: r.id, accion: r.accion, resumen: r.resumen, detalle: r.detalle, actorId: r.actor_id, creadoEl: r.created_at }));
}

const entrada = z.object({
  accion: z.enum(ACCIONES_INMUEBLE),
  resumen: z.string().trim().min(1).max(500),
  // Solo datos cortos y sin contenido privado del cliente: precio anterior y nuevo, avisos que se aceptaron.
  detalle: z.object({
    antes: z.union([z.number(), z.string().max(80)]).optional(),
    despues: z.union([z.number(), z.string().max(80)]).optional(),
    avisos: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  }).strict().optional(),
}).strict();

export async function anotarHistorialInmueble(client: Cliente, slug: string, input: unknown): Promise<{ id: number }> {
  const s = await inmuebleVisible(client, slug);
  const d = entrada.parse(input);
  const { data, error } = await client.rpc("fortius_inmuebles_anotar_historial", {
    p_entidad: "inmueble", p_entidad_id: s, p_asunto: null, p_accion: d.accion, p_resumen: d.resumen, p_detalle: d.detalle ?? null,
  });
  if (error) errorDeHistorial(error);
  return { id: Number(data) };
}
