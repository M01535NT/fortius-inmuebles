"use client";
import * as React from "react";
import { Button, Card, EmptyBox, Notice, Surface } from "@/components/admin/kit";
import { EMPTY_ART } from "@/components/admin/icons";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { AdminFrame } from "@/components/admin/workspace/admin-frame";
import { apiRequest, db, errorMessage, fetchJson, loadAdminData, useCollection, useSession } from "@/lib/admin/store";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { humanDateTime } from "@/lib/utils";
import { PAPELERA } from "./textos";

/*
  Papelera única (NAV-13, N23): reúne en una pantalla lo que ya se podía recuperar en dos lugares
  (operaciones eliminadas en Operaciones y lo eliminado en Historial). No cambia cómo se
  restaura: las operaciones vuelven con sus documentos y tareas por la misma ruta que antes, y los
  inmuebles, artículos, notas y citas vuelven por la restauración del historial, sin publicar.
  Las operaciones las ve quien tiene acceso a ellas; lo demás, solo el director (como en Historial).
*/
type Entry = { id: string; collection: string; record_id: string; created_at: string; actor_id: string | null; titulo?: string | null };
const KIND: Record<string, string> = { propiedades: "Inmueble", posts: "Artículo del blog", notas: "Nota", eventos: "Cita" };
const row = "flex flex-wrap items-center justify-between gap-3 px-5 py-4 [&+&]:border-t [&+&]:border-border";

function Fallo({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center gap-3 text-sm"><p>{error}</p><Button onClick={onRetry}>Reintentar</Button></div>;
}

function Operaciones() {
  const clients = useCollection(db.clientes), properties = useCollection(db.propiedades);
  const [records, setRecords] = React.useState<OperationRecord[] | undefined>(undefined);
  const [error, setError] = React.useState(""), [notice, setNotice] = React.useState(""), [revision, setRevision] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    fetchJson<{ expedientes: OperationRecord[] }>("/api/admin/expedientes?estado=eliminados")
      .then(r => { if (active) { setRecords(r.expedientes ?? []); setError(""); } })
      .catch(cause => { if (active) setError(errorMessage(cause)); });
    return () => { active = false; };
  }, [revision]);

  async function restaurar(op: OperationRecord) {
    if (!await confirmAction(`La operación ${op.folio} vuelve a Operaciones con sus documentos y tareas.`, { title: `${PAPELERA.restaurar} operación`, confirmLabel: PAPELERA.restaurar })) return;
    setError(""); setNotice("");
    try {
      await fetchJson(`/api/admin/expedientes/${op.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: op.version }) });
      setRecords(items => items?.filter(item => item.id !== op.id));
      setNotice(`Operación ${op.folio} de vuelta en Operaciones.`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  return <section aria-labelledby="papelera-operaciones" className="flex flex-col gap-3">
    <h2 id="papelera-operaciones" className="text-lg font-semibold">{PAPELERA.operaciones}</h2>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {error ? <Fallo error={error} onRetry={() => { setError(""); setRecords(undefined); setRevision(n => n + 1); }} />
      : records === undefined ? <p role="status" className="text-sm text-muted-foreground">Consultando operaciones eliminadas…</p>
      : !records.length ? <EmptyBox art={{ icon: EMPTY_ART.papelera, kind: "listo" }} title="No hay operaciones eliminadas">Cuando se elimine una operación aparecerá aquí con sus documentos y tareas.</EmptyBox>
      : <Card as="ul" className="m-0 list-none overflow-hidden p-0" aria-label="Operaciones eliminadas">{records.map(op => {
        const who = clients.find(c => c.id === op.cliente_id)?.nombre;
        const where = op.propiedad_slug ? properties.find(p => p.slug === op.propiedad_slug)?.titulo : undefined;
        return <li key={op.id} className={row}>
          <span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{who ?? op.folio}</strong><small className="text-muted-foreground">{op.folio} · {where ?? "Sin inmueble vinculado"}</small></span>
          <Button onClick={() => void restaurar(op)} aria-label={`${PAPELERA.restaurar} ${op.folio}`}>{PAPELERA.restaurar}</Button>
        </li>;
      })}</Card>}
  </section>;
}

function Registros() {
  const session = useSession();
  const propiedades = useCollection(db.propiedades), notas = useCollection(db.notas), eventos = useCollection(db.eventos);
  const [entries, setEntries] = React.useState<Entry[] | undefined>(undefined);
  const [offset, setOffset] = React.useState(0), [more, setMore] = React.useState(false);
  const [error, setError] = React.useState(""), [notice, setNotice] = React.useState(""), [busy, setBusy] = React.useState(""), [revision, setRevision] = React.useState(0);
  const admin = session?.role === "admin";
  React.useEffect(() => {
    if (!admin) return;
    let active = true;
    apiRequest<{ entries: Entry[]; hasMore: boolean }>(`/api/admin/historial?${new URLSearchParams({ offset: String(offset), deleted: "1" })}`)
      .then(r => { if (active) { setEntries(r.entries); setMore(r.hasMore); setError(""); } })
      .catch(cause => { if (active) setError(errorMessage(cause)); });
    return () => { active = false; };
  }, [admin, offset, revision]);

  // C-81: lo borrado ya no está en las listas; el título guardado en el historial lo nombra.
  const nameOf = (entry: Entry) => (entry.collection === "propiedades" ? propiedades.find(p => p.slug === entry.record_id)?.titulo
    : entry.collection === "notas" ? notas.find(n => n.id === entry.record_id)?.titulo
    : entry.collection === "eventos" ? eventos.find(e => e.id === entry.record_id)?.titulo : undefined) ?? (entry.titulo || undefined);

  async function restaurar(entry: Entry) {
    if (!await confirmAction(`${nameOf(entry) ?? "El registro"} vuelve a su lugar; lo que estaba publicado vuelve sin publicar.`, { title: `${PAPELERA.restaurar} ${(KIND[entry.collection] ?? "registro").toLowerCase()}`, confirmLabel: PAPELERA.restaurar })) return;
    setBusy(entry.id); setError(""); setNotice("");
    try {
      await apiRequest("/api/admin/historial", "POST", { historyId: entry.id });
      setEntries(items => items?.filter(item => item.id !== entry.id));
      setNotice(`${KIND[entry.collection] ?? "Registro"} de vuelta en su lugar.`);
      try { await loadAdminData(); } catch { setNotice("Se restauró. Recarga el panel para ver las listas al día."); }
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(""); }
  }

  return <section aria-labelledby="papelera-registros" className="flex flex-col gap-3">
    <h2 id="papelera-registros" className="text-lg font-semibold">{PAPELERA.registros}</h2>
    {!session ? null : !admin ? <Notice tone="info">El director restaura los inmuebles, artículos, notas y citas. Pídeselo si eliminaste uno por error.</Notice> : <>
      <p className="text-sm text-muted-foreground">Los inmuebles y artículos vuelven sin publicar.</p>
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {error ? <Fallo error={error} onRetry={() => { setError(""); setEntries(undefined); setRevision(n => n + 1); }} />
        : entries === undefined ? <p role="status" className="text-sm text-muted-foreground">Consultando lo eliminado…</p>
        : !entries.length && offset === 0 ? <EmptyBox art={{ icon: EMPTY_ART.papelera, kind: "listo" }} title="Nada más que recuperar">Cuando se elimine un inmueble, un artículo, una nota o una cita, aparecerá aquí.</EmptyBox>
        : <Card as="ul" className="m-0 list-none overflow-hidden p-0" aria-label={PAPELERA.registros}>{entries.map(entry => {
          const name = nameOf(entry) ?? `${KIND[entry.collection] ?? "Registro"} eliminado`;
          return <li key={entry.id} className={row}>
            <span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{name}</strong><small className="text-muted-foreground">{KIND[entry.collection] ?? entry.collection} · se eliminó el {humanDateTime(entry.created_at)}{entry.actor_id === session.id ? " · por ti" : ""}</small></span>
            <Button disabled={busy === entry.id} onClick={() => void restaurar(entry)} aria-label={`${PAPELERA.restaurar} ${name}`}>{busy === entry.id ? "Restaurando…" : PAPELERA.restaurar}</Button>
          </li>;
        })}</Card>}
      {(offset > 0 || more) && <div className="flex gap-2">
        <Button disabled={offset === 0} onClick={() => { setEntries(undefined); setOffset(n => Math.max(0, n - 50)); }}>Anterior</Button>
        <Button disabled={!more} onClick={() => { setEntries(undefined); setOffset(n => n + 50); }}>Siguiente</Button>
      </div>}
    </>}
  </section>;
}

/** El director la ve dentro de Administración; el asesor llega desde Operaciones y la ve sola. */
export function PapeleraScreen() {
  const session = useSession();
  const body = <div className="flex min-w-0 flex-col gap-8">
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold">{PAPELERA.nombre}</h1>
      <p className="text-muted-foreground">{PAPELERA.descripcion}</p>
    </header>
    <Operaciones />
    <Registros />
  </div>;
  return session?.role === "admin" ? <AdminFrame>{body}</AdminFrame> : <Surface className="pb-4">{body}</Surface>;
}
