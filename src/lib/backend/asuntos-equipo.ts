import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Miembro } from "./asuntos-contrato";
import { createServerClient } from "./auth";
import type { StaffUser } from "./contracts";
import { ApiError, databaseError } from "./http";

/**
 * Quiénes llevan asuntos, con su nombre, para «Quién lo lleva». El director ve a todo el equipo activo;
 * el asesor solo se ve a sí mismo (lo de otros asesores no le toca, SPEC.md, sección 12).
 * El nombre sale de su ficha de asesor; si no tiene, del nombre de su cuenta o de su correo.
 */
export async function leerEquipo(client: SupabaseClient, user: StaffUser): Promise<Miembro[]> {
  const propio: Miembro = { id: user.id, nombre: user.name?.trim() || user.email.split("@")[0], director: user.role === "admin" };
  if (user.role !== "admin") return [propio];
  return todoElEquipo(client, user, propio);
}

/**
 * Los compañeros para mencionar con @ en una nota (decisión del titular, 17/11/2026): todo el equipo activo, también
 * para el asesor. Solo el nombre: no dice qué lleva cada quien ni da acceso a sus asuntos.
 */
export async function leerCompaneros(user: StaffUser): Promise<Miembro[]> {
  const propio: Miembro = { id: user.id, nombre: user.name?.trim() || user.email.split("@")[0], director: user.role === "admin" };
  return todoElEquipo(createServerClient(undefined, true), user, propio);
}

async function todoElEquipo(client: SupabaseClient, user: StaffUser, propio: Miembro): Promise<Miembro[]> {
  const privileged = createServerClient(undefined, true);
  const [staff, cuentas, fichas, usuarios] = await Promise.all([
    privileged.from("fortius_inmuebles_staff").select("user_id,role,active").eq("active", true),
    client.from("fortius_inmuebles_adviser_accounts").select("user_id,asesor_id"),
    client.from("fortius_inmuebles_records").select("id,data").eq("collection", "asesores"),
    privileged.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (staff.error) databaseError(staff.error);
  if (cuentas.error) databaseError(cuentas.error);
  if (fichas.error) databaseError(fichas.error);
  if (usuarios.error) throw new ApiError(503, "No se pudo consultar el equipo");
  const nombreFicha = new Map(((fichas.data ?? []) as { id: string; data: { nombre?: unknown } }[]).map((f) => [f.id, typeof f.data?.nombre === "string" ? f.data.nombre : ""]));
  const fichaDe = new Map(((cuentas.data ?? []) as { user_id: string; asesor_id: string }[]).map((c) => [c.user_id, c.asesor_id]));
  const cuenta = new Map(usuarios.data.users.map((u) => [u.id, u]));
  const miembros = ((staff.data ?? []) as { user_id: string; role: string }[]).map((s): Miembro => {
    const u = cuenta.get(s.user_id);
    const meta = u?.user_metadata as { name?: unknown; full_name?: unknown; fortius_profile?: { name?: unknown } } | undefined;
    // El nombre de «Mi perfil» va antes que los del proveedor de acceso: es el que la persona escribió.
    const perfil = typeof meta?.fortius_profile?.name === "string" ? meta.fortius_profile.name.trim() : "";
    const nombre = nombreFicha.get(fichaDe.get(s.user_id) ?? "")?.trim() || perfil
      || (typeof meta?.name === "string" ? meta.name.trim() : "") || (typeof meta?.full_name === "string" ? meta.full_name.trim() : "")
      || (u?.email ?? "").split("@")[0] || "Sin nombre";
    return { id: s.user_id, nombre, director: s.role === "admin" };
  });
  if (!miembros.some((m) => m.id === user.id)) miembros.push(propio);
  return miembros.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
