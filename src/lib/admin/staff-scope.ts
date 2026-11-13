"use client";
import * as React from "react";
import { apiRequest, useSession } from "@/lib/admin/store";

/*
  COR-23 y DEC-43 (12/11/2026): qué puede cambiar cada quien en un inmueble. La base de datos lo
  hace valer (migración 20261112160000_alcance_del_asesor); aquí solo se decide qué botones se
  muestran, para que el asesor no vea acciones que el servidor le va a rechazar.
*/
export type PropertyScope = { edit: boolean; publish: boolean; feature: boolean; reassign: boolean };

export function propertyScope(role: string | undefined, myAdvisor: string | null | undefined, property?: { asesorId?: string }): PropertyScope {
  if (role === "admin") return { edit: true, publish: true, feature: true, reassign: true };
  // Un inmueble nuevo se da de alta a nombre del propio asesor; uno existente, solo si es suyo.
  const own = !!myAdvisor && (!property || property.asesorId === myAdvisor);
  return { edit: own, publish: false, feature: false, reassign: false };
}

let cached: { session: string; asesorId: string | null } | undefined;
let pending: { session: string; request: Promise<string | null> } | undefined;

/** El asesor ligado a la cuenta con sesión (`undefined` mientras se consulta). */
export function useMyAdvisor(): string | null | undefined {
  const session = useSession();
  const key = session?.id ?? "";
  const [loaded, setLoaded] = React.useState<{ session: string; asesorId: string | null }>();
  React.useEffect(() => {
    if (!key || cached?.session === key) return;
    let alive = true;
    if (pending?.session !== key) pending = { session: key, request: apiRequest<{ asesorId?: string | null }>("/api/admin/mi-asesor").then(r => r.asesorId ?? null).catch(() => null) };
    pending.request.then(asesorId => { cached = { session: key, asesorId }; if (alive) setLoaded(cached); });
    return () => { alive = false; };
  }, [key]);
  const known = cached?.session === key ? cached : loaded?.session === key ? loaded : undefined;
  return known ? known.asesorId : undefined;
}

/** ¿La sesión es del director? Sin sesión (solo en pruebas de componentes) la pantalla queda completa. */
export function useIsDirector() {
  const session = useSession();
  return !session || session.role === "admin";
}

/** Lo que la persona con sesión puede hacer con este inmueble (o con uno nuevo, sin `property`). */
export function usePropertyScope(property?: { asesorId?: string }) {
  const session = useSession();
  const mine = useMyAdvisor();
  // Sin sesión no se pinta el panel (el armazón pide entrar); solo pasa en pruebas de componentes.
  if (!session) return { edit: true, publish: true, feature: true, reassign: true, myAdvisor: mine, loading: false };
  return { ...propertyScope(session?.role, mine, property), myAdvisor: mine, loading: session?.role !== "admin" && mine === undefined };
}
