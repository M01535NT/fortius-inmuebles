import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Encargo, EnQueVa } from "./asuntos-contrato";
import type { StaffUser } from "./contracts";
import { CAMPOS_DATOS, type AsuntoDePersona, type CampoDato, type DatosDePersona, type FichaPersona } from "./directorio-contrato";
import { fallo } from "./fallo";
import { ApiError } from "./http";

/**
 * La ficha de una persona (SPEC.md, sección 6, «Personas dentro de un asunto»): su contacto, sus datos
 * (nombre completo, estado civil, CURP, RFC, identificación, domicilio…) y los asuntos donde aparece.
 * Se lee y se escribe con la sesión de quien entró: la base decide quién la ve (RLS). Cada parte lleva su versión.
 */

const T = {
  personas: "fortius_inmuebles_personas",
  datos: "fortius_inmuebles_persona_datos_legales",
  papeles: "fortius_inmuebles_asunto_personas",
} as const;

const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
const libre = (max: number) => z.string().trim().max(max).transform((v) => v || null).nullable();
const CURP = /^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HMX][A-Z]{5}[A-Z0-9][0-9]$/;
const RFC = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
const clave = (re: RegExp, nombre: string) => z.string().trim().toUpperCase()
  .refine((v) => !v || re.test(v), `Ese ${nombre} no tiene el formato correcto. Revísalo o déjalo vacío.`)
  .transform((v) => v || null).nullable();

export const cambioFichaSchema = z.object({
  persona: z.object({
    version,
    nombre: z.string().trim().min(1, "El nombre no puede quedar vacío.").max(160).optional(),
    correo: z.string().trim().max(200).refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Ese correo no parece válido.")
      .transform((v) => v.toLowerCase() || null).nullable().optional(),
    telefono: z.object({ pais: z.string().trim().max(5), numero: z.string().trim().max(30) }).strict().nullable().optional(),
    fallecida: z.boolean().optional(),
  }).strict().optional(),
  datos: z.object({
    version: version.nullable(),
    nombre_completo: libre(200).optional(), nacionalidad: libre(60).optional(), ocupacion: libre(120).optional(), estado_civil: libre(80).optional(),
    identificacion_tipo: libre(60).optional(), identificacion_numero: libre(60).optional(),
    curp: clave(CURP, "CURP").optional(), rfc: clave(RFC, "RFC").optional(), domicilio: libre(1500).optional(),
  }).strict().optional(),
}).strict();

type FilaPersona = Omit<FichaPersona, "datos" | "asuntos">;
type FilaDatos = Record<Exclude<CampoDato, "domicilio">, string | null> & { domicilio: { texto?: unknown } | null; version: number };
type FilaPapel = {
  papel: string;
  asunto: { id: string; folio: string; nombre: string; encargos: Encargo[]; en_que_va: EnQueVa | null; deleted_at: string | null } | null;
};

const SIN_DATOS = { ...Object.fromEntries(CAMPOS_DATOS.map((k) => [k, null])), version: null } as DatosDePersona;
const CONFLICTO = "Alguien más cambió esta ficha. Vuelve a cargar y repite el cambio.";
const NO_EXISTE = "Esa persona no existe o no te toca verla.";

export async function leerFicha(client: SupabaseClient, id: string): Promise<FichaPersona> {
  const [p, d, a] = await Promise.all([
    client.from(T.personas).select("id,clase,nombre,fallecida,telefonos,correo,no_contactar,version").eq("id", id).is("deleted_at", null).maybeSingle(),
    client.from(T.datos).select(`${CAMPOS_DATOS.join(",")},version`).eq("persona_id", id).maybeSingle(),
    client.from(T.papeles).select("papel,asunto:fortius_inmuebles_asuntos(id,folio,nombre,encargos,en_que_va,deleted_at)").eq("persona_id", id).is("retirado_el", null).limit(500),
  ]);
  for (const r of [p, d, a]) if (r.error) fallo(r.error);
  if (!p.data) throw new ApiError(404, NO_EXISTE);
  const fila = p.data as unknown as FilaPersona;
  const leidos = d.data as unknown as FilaDatos | null;
  const datos: DatosDePersona = leidos
    ? { ...leidos, domicilio: typeof leidos.domicilio?.texto === "string" ? leidos.domicilio.texto : null }
    : SIN_DATOS;
  const asuntos: AsuntoDePersona[] = [];
  for (const x of (a.data ?? []) as unknown as FilaPapel[]) {
    const s = x.asunto;
    if (!s || s.deleted_at) continue;
    const ya = asuntos.find((y) => y.id === s.id);
    if (ya) { if (!ya.papeles.includes(x.papel)) ya.papeles.push(x.papel); continue; }
    asuntos.push({ id: s.id, folio: s.folio, nombre: s.nombre, encargos: s.encargos ?? [], en_que_va: s.en_que_va, cerrado: s.en_que_va === "cerrado", papeles: [x.papel] });
  }
  return {
    ...fila, telefonos: Array.isArray(fila.telefonos) ? fila.telefonos : [], datos,
    asuntos: asuntos.sort((m, n) => Number(m.cerrado) - Number(n.cerrado)),
  };
}

/** Cambia lo que venga (contacto o datos) y devuelve la ficha ya guardada. */
export async function cambiarFicha(client: SupabaseClient, user: StaffUser, id: string, e: z.infer<typeof cambioFichaSchema>): Promise<FichaPersona> {
  if (!e.persona && !e.datos) throw new ApiError(400, "No hay nada que cambiar.");
  if (e.persona) {
    const { version: v, telefono, ...resto } = e.persona;
    const cambios: Record<string, unknown> = { ...resto };
    if (telefono !== undefined) {
      // Se cambia el primer teléfono; los demás que tenga se conservan.
      const actual = await client.from(T.personas).select("telefonos").eq("id", id).is("deleted_at", null).maybeSingle();
      if (actual.error) fallo(actual.error);
      if (!actual.data) throw new ApiError(404, NO_EXISTE);
      const previos = (actual.data as { telefonos: unknown }).telefonos;
      const lista = Array.isArray(previos) ? (previos as { pais: string; numero: string }[]) : [];
      const numero = telefono?.numero.replace(/\D/g, "") ?? "";
      cambios.telefonos = numero ? [{ pais: telefono?.pais || "+52", numero }, ...lista.slice(1)] : lista.slice(1);
    }
    if (Object.keys(cambios).length) {
      const r = await client.from(T.personas).update(cambios).eq("id", id).eq("version", v).is("deleted_at", null).select("id").maybeSingle();
      if (r.error) fallo(r.error);
      if (!r.data) throw new ApiError(409, CONFLICTO);
    }
  }
  if (e.datos) {
    const { version: v, domicilio, ...resto } = e.datos;
    const cambios: Record<string, unknown> = { ...resto };
    if (domicilio !== undefined) cambios.domicilio = domicilio ? { texto: domicilio } : null;
    if (Object.keys(cambios).length) {
      const r = v === null
        ? await client.from(T.datos).insert({ persona_id: id, creado_por: user.id, ...cambios }).select("persona_id").maybeSingle()
        : await client.from(T.datos).update(cambios).eq("persona_id", id).eq("version", v).select("persona_id").maybeSingle();
      // Si otra pestaña ya los creó, el alta choca con la llave: es el mismo conflicto.
      if (r.error?.code === "23505") throw new ApiError(409, CONFLICTO);
      if (r.error) fallo(r.error);
      if (!r.data) throw new ApiError(409, CONFLICTO);
    }
  }
  return leerFicha(client, id);
}
