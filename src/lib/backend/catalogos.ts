import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { CATALOGOS, CLAVE_VALOR, claveDesde, type Catalogo, type Catalogos, type ValorCatalogo } from "./catalogos-contrato";
import type { StaffUser } from "./contracts";
import { fallo } from "./fallo";
import { ApiError } from "./http";

/**
 * Los catálogos (SPEC.md, sección 3). Se leen y se escriben con la sesión de quien entró: todo el equipo los lee (las
 * listas desplegables los necesitan) y solo el director los cambia; la base lo hace cumplir (RLS) y guarda el historial.
 */
const T = { catalogos: "fortius_inmuebles_catalogos", valores: "fortius_inmuebles_catalogo_valores" } as const;
const CAMPOS_VALOR = "id,catalogo,clave,etiqueta,orden,activo,significado,padre,de_sistema,inicial,etiqueta_inicial,version";

const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
const etiqueta = z.string().trim().min(1, "Escribe el nombre").max(80);
const significado = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/);
/** Una clave guardada en un asunto, una persona o una tarea. Qué claves valen lo decide el catálogo, en la base. */
export const claveCatalogo = z.string().regex(CLAVE_VALOR, "Opción no válida");

export const nuevoValorSchema = z.object({
  catalogo: z.enum(CATALOGOS), etiqueta, significado: significado.nullable().optional(), padre: claveCatalogo.nullable().optional(),
}).strict();

export const cambioValorSchema = z.union([
  z.object({
    id: z.uuid(), version, etiqueta: etiqueta.optional(), activo: z.boolean().optional(),
    significado: significado.nullable().optional(), padre: claveCatalogo.nullable().optional(),
  }).strict(),
  z.object({ catalogo: z.enum(CATALOGOS), orden: z.array(z.uuid()).min(1).max(500) }).strict(),
]);

type FilaValor = ValorCatalogo & { catalogo: string };
const aValor = (f: FilaValor): ValorCatalogo => ({
  id: f.id, clave: f.clave, etiqueta: f.etiqueta, orden: f.orden, activo: f.activo, significado: f.significado, padre: f.padre,
  de_sistema: f.de_sistema, inicial: f.inicial, etiqueta_inicial: f.etiqueta_inicial, version: f.version,
});

/** Todos los catálogos con sus valores, en orden. */
export async function leerCatalogos(client: SupabaseClient): Promise<Catalogo[]> {
  const [c, v] = await Promise.all([
    client.from(T.catalogos).select("clave,nombre,ayuda,orden,fijo,significado_nombre,significados,padre,en_pantalla").order("orden"),
    client.from(T.valores).select(CAMPOS_VALOR).order("orden").order("created_at").limit(5000),
  ]);
  if (c.error) fallo(c.error);
  if (v.error) fallo(v.error);
  const valores = (v.data ?? []) as FilaValor[];
  return ((c.data ?? []) as Omit<Catalogo, "valores">[])
    .filter((x) => (CATALOGOS as readonly string[]).includes(x.clave))
    .map((x) => ({ ...x, valores: valores.filter((y) => y.catalogo === x.clave).map(aValor) }));
}

/** Los catálogos como mapa, para las reglas del servidor que arman textos («Casa en la Murúa»). */
export async function mapaCatalogos(client: SupabaseClient): Promise<Catalogos> {
  return Object.fromEntries((await leerCatalogos(client)).map((c) => [c.clave, c])) as Catalogos;
}

function soloDirector(user: StaffUser) {
  if (user.role !== "admin") throw new ApiError(403, "Solo el director cambia las listas.");
}

export async function agregarValor(client: SupabaseClient, user: StaffUser, entrada: z.infer<typeof nuevoValorSchema>): Promise<ValorCatalogo> {
  soloDirector(user);
  const existentes = await client.from(T.valores).select("clave").eq("catalogo", entrada.catalogo);
  if (existentes.error) fallo(existentes.error);
  const clave = claveDesde(entrada.etiqueta, ((existentes.data ?? []) as { clave: string }[]).map((x) => x.clave));
  const r = await client.from(T.valores)
    .insert({ catalogo: entrada.catalogo, clave, etiqueta: entrada.etiqueta, significado: entrada.significado ?? null, padre: entrada.padre ?? null })
    .select(CAMPOS_VALOR).single();
  if (r.error) fallo(r.error);
  return aValor(r.data as FilaValor);
}

export async function cambiarValor(client: SupabaseClient, user: StaffUser, entrada: z.infer<typeof cambioValorSchema>): Promise<ValorCatalogo | null> {
  soloDirector(user);
  if ("orden" in entrada) {
    const r = await client.rpc("fortius_inmuebles_ordenar_catalogo", { p_catalogo: entrada.catalogo, p_ids: entrada.orden });
    if (r.error) fallo(r.error);
    return null;
  }
  const { id, version: v, ...cambios } = entrada;
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  // La versión que vio quien guarda: si otra persona guardó antes, la base responde 409.
  const r = await client.from(T.valores).update({ ...cambios, version: v }).eq("id", id).select(CAMPOS_VALOR);
  if (r.error) fallo(r.error);
  const fila = (r.data ?? [])[0] as FilaValor | undefined;
  if (!fila) throw new ApiError(404, "Ese valor ya no está.");
  return aValor(fila);
}
