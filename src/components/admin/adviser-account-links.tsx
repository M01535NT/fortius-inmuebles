"use client";
import * as React from "react";
import type { Asesor } from "@/lib/admin/store";
import { btnPrimary, selectClass } from "@/components/admin/ui";

type Account = { user_id: string; email: string; role: string; active: boolean; asesor_id: string | null };
export function AdviserAccountLinks({ isAdmin, advisers }: { isAdmin: boolean; advisers: Asesor[] }) {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState("");
  React.useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    fetch("/api/admin/asesor-cuentas", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body as { cuentas: Account[] }; })
      .then((body) => { if (active) setAccounts(body.cuentas); })
      .catch((cause) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [isAdmin]);
  if (!isAdmin) return null;
  async function link(userId: string, asesorId: string) {
    setError(""); setSaving(userId);
    try {
      const response = await fetch("/api/admin/asesor-cuentas", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, asesorId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No se pudo vincular la cuenta");
      setAccounts((items) => items.map((item) => item.user_id === userId ? { ...item, asesor_id: asesorId } : item));
    } catch (cause) { setError(String(cause)); } finally { setSaving(""); }
  }
  return <section className="mt-8 rounded-lg border border-border bg-card p-5">
    <h2 className="display-soft text-xl">Cuentas de asesores</h2>
    <p className="mt-2 text-sm text-muted-foreground">Liga cada cuenta con su ficha de asesor. Verá solo lo asignado a esa ficha.</p>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <div className="mt-4 space-y-3">{accounts.filter((account) => account.role === "editor" && account.active).map((account) => <form key={account.user_id} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void link(account.user_id, String(data.get("asesorId"))); }} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="min-w-[190px] flex-1"><strong className="block text-sm">{account.email || account.user_id}</strong><span className="font-mono text-xs text-muted-foreground">{account.user_id}</span></div>
      <label className="min-w-[190px] flex-1 text-sm">Asesor<select name="asesorId" required defaultValue={account.asesor_id ?? ""} className={selectClass}><option value="">Sin vincular</option>{advisers.filter((item) => item.activo).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
      <button type="submit" disabled={saving === account.user_id} className={btnPrimary}>Guardar vínculo</button>
    </form>)}</div>
  </section>;
}
