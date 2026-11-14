"use client";
import * as React from "react";
import type { Asesor } from "@/lib/admin/store";
import { selectClass } from "@/components/admin/ui";
import { Button } from "@/components/admin/kit";

type Account = { user_id: string; email: string; role: string; active: boolean; asesor_id: string | null };

/** Solo las cuentas con la forma esperada (C60): una respuesta distinta no debe tumbar la pantalla. */
export function parseAccounts(body: unknown): Account[] | null {
  const list = (body as { cuentas?: unknown } | null)?.cuentas;
  if (!Array.isArray(list)) return null;
  return list.filter((item): item is Account => !!item && typeof item === "object"
    && typeof (item as Account).user_id === "string" && typeof (item as Account).role === "string" && typeof (item as Account).active === "boolean")
    .map(item => ({ ...item, email: typeof item.email === "string" ? item.email : "", asesor_id: typeof item.asesor_id === "string" ? item.asesor_id : null }));
}

export function AdviserAccountLinks({ isAdmin, advisers }: { isAdmin: boolean; advisers: Asesor[] }) {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loadError, setLoadError] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    fetch("/api/admin/asesor-cuentas", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => { const body: unknown = await response.json().catch(() => null); const list = response.ok ? parseAccounts(body) : null; if (!list) throw new Error("forma"); return list; })
      .then((list) => { if (active) { setAccounts(list); setLoadError(false); } })
      .catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [isAdmin, attempt]);
  if (!isAdmin) return null;
  async function link(userId: string, asesorId: string) {
    setError(""); setSaving(userId);
    try {
      const response = await fetch("/api/admin/asesor-cuentas", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, asesorId }) });
      const body = await response.json().catch(() => null) as { error?: unknown } | null;
      if (!response.ok) throw new Error(typeof body?.error === "string" && body.error ? body.error : "No se pudo vincular la cuenta");
      setAccounts((items) => items.map((item) => item.user_id === userId ? { ...item, asesor_id: asesorId } : item));
    } catch (cause) { setError(cause instanceof Error && cause.message ? cause.message : "No se pudo vincular la cuenta"); } finally { setSaving(""); }
  }
  const editors = accounts.filter((account) => account.role === "editor" && account.active);
  return <section className="mt-8 rounded-[var(--radius-card)] border border-[var(--card-edge)] bg-[var(--card)] p-5 shadow-[var(--shadow-rest)]">
    <h2 className="text-lg font-semibold">Cuentas de asesores</h2>
    <p className="mt-2 text-sm text-muted-foreground">Liga cada cuenta con su ficha de asesor. Verá solo lo asignado a esa ficha.</p>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {loadError && <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="min-w-0 flex-1">No pudimos cargar las cuentas.</span><Button onClick={() => setAttempt(n => n + 1)}>Reintentar</Button></div>}
    {!loadError && !error && !editors.length && <p className="mt-4 text-sm text-muted-foreground">Todavía no hay cuentas de asesor activas. Cuando invites a alguien, aparecerá aquí para ligarlo con su ficha.</p>}
    <div className="mt-4 space-y-3">{editors.map((account) => <form key={account.user_id} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void link(account.user_id, String(data.get("asesorId"))); }} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-control)] border border-[var(--card-edge)] p-3">
      <div className="min-w-[190px] flex-1"><strong className="block break-words text-sm">{account.email || "Cuenta sin correo"}</strong></div>
      <label className="min-w-[190px] flex-1 text-sm">Asesor<select name="asesorId" required defaultValue={account.asesor_id ?? ""} className={selectClass}><option value="">Sin vincular</option>{advisers.filter((item) => item.activo || item.id === account.asesor_id).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
      <Button type="submit" disabled={saving === account.user_id}>{saving === account.user_id ? "Guardando…" : "Guardar vínculo"}</Button>
    </form>)}</div>
  </section>;
}
