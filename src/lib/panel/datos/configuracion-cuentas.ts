/**
 * Cuentas con acceso al panel (solo el director), con `/api/admin/asesor-cuentas`:
 * GET lee quién tiene cuenta y PUT liga la cuenta de un asesor a su ficha. No hay ruta para invitar,
 * quitar acceso ni cambiar el rol de nadie: eso llega con PN-10 y aquí no se envía nada.
 */
export type Cuenta = { user_id: string; role: "admin" | "editor"; active: boolean; email: string; asesor_id: string | null };

/** Solo las cuentas con la forma esperada: una respuesta distinta no tumba la pantalla. */
export function cuentasValidas(cuerpo: unknown): Cuenta[] | null {
  const lista = (cuerpo as { cuentas?: unknown } | null)?.cuentas;
  if (!Array.isArray(lista)) return null;
  return lista
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === "object")
    .filter((c) => typeof c.user_id === "string" && (c.role === "admin" || c.role === "editor") && typeof c.active === "boolean")
    .map((c) => ({
      user_id: c.user_id as string, role: c.role as Cuenta["role"], active: c.active as boolean,
      email: typeof c.email === "string" ? c.email : "", asesor_id: typeof c.asesor_id === "string" ? c.asesor_id : null,
    }));
}

export async function leerCuentas(senal?: AbortSignal): Promise<Cuenta[]> {
  const r = await fetch("/api/admin/asesor-cuentas", { credentials: "same-origin", cache: "no-store", signal: senal });
  if (r.status === 403) throw new Error("Solo el director ve las cuentas.");
  const lista = r.ok ? cuentasValidas(await r.json().catch(() => null)) : null;
  if (!lista) throw new Error("No se pudieron leer las cuentas.");
  return lista;
}

/** Liga una cuenta de asesor (activa) a una ficha activa. El servidor vuelve a comprobar las dos cosas. */
export async function ligarCuenta(userId: string, asesorId: string): Promise<void> {
  let r: Response;
  try {
    r = await fetch("/api/admin/asesor-cuentas", {
      method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, asesorId }),
    });
  } catch {
    throw new Error("Sin conexión: no se ligó la cuenta. Vuelve a intentarlo.");
  }
  if (!r.ok) {
    const cuerpo = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(r.status === 403 ? "Solo el director liga cuentas." : cuerpo.error || "No se ligó la cuenta. Vuelve a intentarlo.");
  }
}

/** «Director» o «Asesor», y si la cuenta está desactivada. */
export const rolDe = (c: Pick<Cuenta, "role" | "active">): string => `${c.role === "admin" ? "Director" : "Asesor"}${c.active ? "" : " · sin acceso"}`;

/** Las cuentas ligadas a cada ficha, y las que no tienen ficha (dirección, por ejemplo). */
export function unirCuentas<A extends { id: string }>(asesores: readonly A[], cuentas: readonly Cuenta[]): { porAsesor: Map<string, Cuenta[]>; sinFicha: Cuenta[] } {
  const ids = new Set(asesores.map((a) => a.id));
  const porAsesor = new Map<string, Cuenta[]>();
  const sinFicha: Cuenta[] = [];
  for (const c of cuentas) {
    if (c.asesor_id && ids.has(c.asesor_id)) porAsesor.set(c.asesor_id, [...(porAsesor.get(c.asesor_id) ?? []), c]);
    else sinFicha.push(c);
  }
  sinFicha.sort((x, y) => Number(y.active) - Number(x.active) || x.email.localeCompare(y.email, "es-MX"));
  return { porAsesor, sinFicha };
}

/** Qué cuentas se pueden ligar a esta ficha: de asesor, activas y que no estén ya ligadas a ella (las mismas reglas que el servidor). */
export function cuentasParaLigar(cuentas: readonly Cuenta[], asesorId: string): Cuenta[] {
  return cuentas.filter((c) => c.role === "editor" && c.active && c.asesor_id !== asesorId).sort((x, y) => x.email.localeCompare(y.email, "es-MX"));
}

/** La cuenta con su nueva ficha, para actualizar la lista sin volver a leer. */
export const conFicha = (cuentas: readonly Cuenta[], userId: string, asesorId: string | null): Cuenta[] =>
  cuentas.map((c) => (c.user_id === userId ? { ...c, asesor_id: asesorId } : c));
