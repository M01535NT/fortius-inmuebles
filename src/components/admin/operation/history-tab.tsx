"use client";
import * as React from "react";
import { Button, Card, EmptyBox } from "@/components/admin/kit";
import { textareaClass } from "@/components/admin/ui";
import { db, errorMessage, fetchJson as json, useCollection } from "@/lib/admin/store";

type Activity = { id: string; tipo: "nota" | "cambio"; descripcion: string; created_by: string; created_at: string };

/** Historial: cada cambio que registra el servidor y las notas del equipo. */
export function HistoryTab({ operationId, refresh, onDirtyChange }: { operationId: string; refresh: number; onDirtyChange: (dirty: boolean) => void }) {
  const advisers = useCollection(db.asesores);
  const [items, setItems] = React.useState<Activity[] | null | undefined>(undefined);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  React.useEffect(() => { onDirtyChange(!!note.trim()); }, [note, onDirtyChange]);
  React.useEffect(() => {
    let alive = true;
    json<{ actividad: Activity[] }>(`/api/admin/expedientes/${operationId}/actividad`)
      .then(r => { if (alive) setItems(Array.isArray(r.actividad) ? r.actividad : []); })
      .catch(cause => { if (alive) { setItems(null); setError(errorMessage(cause)); } });
    return () => { alive = false; };
  }, [operationId, refresh]);
  async function add(event: React.FormEvent) {
    event.preventDefault(); if (!note.trim() || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const r = await json<{ actividad: Activity }>(`/api/admin/expedientes/${operationId}/actividad`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ descripcion: note.trim() }) });
      setItems(list => [r.actividad, ...(list ?? [])]); setNote(""); setNotice("Guardado");
    } catch (cause) { setError(`No se pudo guardar: ${errorMessage(cause)}`); } finally { setBusy(false); }
  }
  const who = (id: string) => advisers.find(a => a.id === id)?.nombre ?? "Equipo";
  return <div className="flex flex-col gap-5">
    <Card className="p-5" aria-label="Agregar una nota">
      <form onSubmit={add} className="flex flex-col gap-3">
        <label className="text-sm font-semibold">Nueva nota<textarea id="exp-review-note" className={textareaClass} maxLength={1000} rows={3} value={note} disabled={busy} onChange={e => setNote(e.target.value)} placeholder="Lo que pasó, lo que acordaron o lo que hay que recordar" /></label>
        <div className="flex flex-wrap items-center gap-3"><Button type="submit" variant="primary" disabled={!note.trim() || busy}>Guardar nota</Button>{notice && <span role="status" className="text-sm text-muted-foreground">{notice}</span>}</div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </form>
    </Card>
    {items === undefined ? <p role="status" className="text-sm text-muted-foreground">Consultando el historial…</p>
      : items?.length ? <Card as="div" className="overflow-hidden"><ol>{items.map(item => <li key={item.id} className="border-b border-border px-5 py-4 last:border-0">
        <p className="[overflow-wrap:anywhere]">{item.descripcion}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.tipo === "nota" ? "Nota" : "Cambio"} · {who(item.created_by)} · {new Date(item.created_at).toLocaleString("es-MX")}</p>
      </li>)}</ol></Card>
      : items !== null && <EmptyBox title="Sin historial todavía">Los cambios y las notas de esta operación aparecen aquí.</EmptyBox>}
  </div>;
}
