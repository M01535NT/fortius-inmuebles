"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { Button, Card, EmptyBox, Segmented, Surface, Tabs } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { apiRequest, db, errorMessage, fetchJson as json, loadAllDossiers, useCollection, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { SALE_PROCESS } from "@/lib/formatos/operation-workflow";
import { boardCard, dueLabel, type OperationRecord } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { DirectCreate } from "./direct-create";
import { useLeaveGuard } from "./use-operation";
import { cn } from "@/lib/utils";
import s from "./operation.module.css";

/*
  Operaciones (lienzo: OperacionesEscritorio y OperacionesMovil). Seis columnas en
  computadora, pestañas por etapa en celular. «?etapa=<slug>» abre esa etapa.
*/

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function OperationsBoard() {
  const params = useSearchParams(), router = useRouter();
  const session = useSession();
  const admin = session?.role === "admin";
  const deleted = params.get("eliminadas") === "1";
  const clients = useCollection(db.clientes), properties = useCollection(db.propiedades), tasks = useCollection(db.tareas);
  const today = operationalDate();
  const [records, setRecords] = React.useState<OperationRecord[] | null | undefined>(undefined);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  const [me, setMe] = React.useState<string | undefined>(undefined);
  const [scope, setScope] = React.useState<"mias" | "equipo">("mias");
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(params.get("nuevo") === "1");
  const [draftDirty, setDraftDirty] = React.useState(false);
  useLeaveGuard(creating && draftDirty);
  const requested = SALE_PROCESS.findIndex(p => p.slug === params.get("etapa"));
  const [tab, setTab] = React.useState(Math.max(requested, 0));
  React.useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(undefined); setError("");
    (deleted ? json<{ expedientes: OperationRecord[] }>("/api/admin/expedientes?estado=eliminados").then(r => r.expedientes ?? []) : loadAllDossiers<OperationRecord>())
      .then(list => { if (alive) setRecords(list.filter(item => deleted ? !!item.deleted_at : !item.deleted_at)); })
      .catch(cause => { if (alive) { setRecords(null); setError(errorMessage(cause)); } });
    return () => { alive = false; };
  }, [deleted, attempt]);
  // Formatos iniciados por operación: la entrevista (02) y el levantamiento (04) separan las primeras etapas del propietario.
  const [started, setStarted] = React.useState<Map<string, Set<string>>>(new Map());
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const byOperation = new Map<string, Set<string>>();
      for (let offset: number | null = 0; offset !== null && offset < 5000;) {
        const page: { documentos?: Array<{ expedienteId: string; formatoId: string }>; nextOffset?: number | null } = await apiRequest(`/api/admin/documentos?limit=100&offset=${offset}`);
        for (const d of page.documentos ?? []) { if (!byOperation.has(d.expedienteId)) byOperation.set(d.expedienteId, new Set()); byOperation.get(d.expedienteId)!.add(d.formatoId.startsWith("04") ? "04" : d.formatoId); }
        offset = page.nextOffset ?? null;
      }
      if (alive) setStarted(byOperation);
    })().catch(() => undefined);
    return () => { alive = false; };
  }, [attempt]);
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ asesorId?: string | null }>("/api/admin/mi-asesor").then(r => { if (alive) { setMe(r.asesorId ?? undefined); if (!r.asesorId) setScope("equipo"); } }).catch(() => { if (alive) setScope("equipo"); });
    return () => { alive = false; };
  }, []);
  React.useEffect(() => {
    if (requested < 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(requested);
    document.getElementById(`etapa-${SALE_PROCESS[requested].slug}`)?.scrollIntoView({ block: "nearest", inline: "start" });
  }, [requested]);

  const names = {
    client: (id?: string) => id ? clients.find(c => c.id === id)?.nombre : undefined,
    property: (slug?: string | null) => slug ? properties.find(p => p.slug === slug)?.titulo : undefined,
  };
  const all = (records ?? []).map(op => {
    const formats = started.get(op.id), checklist = tasks.find(t => t.id === checklistTaskId(op.id));
    return { op, card: boardCard({ ...op, inicial: { iniciada: !!formats?.has("02"), levantamiento: formats?.has("04") ? "borrador" : undefined, documentos: checklist ? "pendiente" : undefined } }, tasks, today, names, me) };
  });
  const visible = all.filter(({ op, card }) => (!admin || scope === "equipo" || !me || card.mine) && (!query.trim() || normalize(`${card.who} ${op.folio} ${card.property}`).includes(normalize(query.trim()))));
  const late = visible.filter(({ op, card }) => op.etapa !== "cerrado" && card.late).length;
  const archived = visible.filter(({ op }) => op.etapa === "cerrado");
  const current = visible.filter(({ op }) => op.etapa !== "cerrado");
  const columns = SALE_PROCESS.map((phase, index) => ({ phase, index, cards: current.filter(({ card }) => card.column === index) }));

  function chooseTab(index: number) {
    setTab(index);
    const next = new URLSearchParams(params.toString()); next.set("etapa", SALE_PROCESS[index].slug);
    router.replace(`/admin/operaciones?${next}`, { scroll: false });
  }
  async function restore(op: OperationRecord) {
    if (!await confirmAction(`¿Restaurar la operación ${op.folio}? Volverá a Operaciones con sus documentos y tareas.`)) return;
    setError(""); setNotice("");
    try {
      await json(`/api/admin/expedientes/${op.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: op.version }) });
      setRecords(items => items?.filter(item => item.id !== op.id));
      setNotice(`Operación ${op.folio} restaurada.`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  return <Surface className="-mx-4 -mt-5 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8">
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="m-0">{deleted ? "Operaciones eliminadas" : "Operaciones"}</h1>
        {records && <p className="text-muted-foreground">{deleted ? `${records.length} ${records.length === 1 ? "operación" : "operaciones"} que puedes restaurar` : <>{visible.length - visible.filter(({ op }) => op.etapa === "cerrado").length} en curso{late > 0 && <> · <span className={s.lateText}>{late} con algo vencido</span></>}</>}</p>}
      </div>
      {!deleted && <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className={s.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar cliente o folio</span><input className={inputClass} placeholder="Buscar cliente o folio" value={query} onChange={e => setQuery(e.target.value)} /></label>
        {admin && me && <Segmented label="Operaciones que se muestran" options={[{ id: "mias", label: "Mías" }, { id: "equipo", label: "Todo el equipo" }]} value={scope} onChange={setScope} />}
      </div>}
    </header>
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-destructive"><span>{error}</span>{records === null && <Button onClick={() => setAttempt(n => n + 1)}>Reintentar</Button>}</div>}
    {notice && <p role="status" className="mb-4 text-sm">{notice}</p>}

    {deleted ? <DeletedList records={records} names={names} onRestore={op => void restore(op)} />
      : records === undefined ? <p role="status" className="text-sm text-muted-foreground">Consultando operaciones…</p>
      : records !== null && records.length === 0 ? <EmptyBox title="Todavía no hay operaciones" action={<Link href="/admin/operaciones/nueva" className="font-semibold underline underline-offset-4">Nueva operación</Link>}>Empieza con la entrevista del cliente; la operación se crea al terminarla.</EmptyBox>
      : records !== null && <>
        <div className={s.tabs}><Tabs idPrefix="operaciones" label="Etapas" value={String(tab)} onChange={id => chooseTab(Number(id))} items={columns.map(c => ({ id: String(c.index), label: `${c.index + 1} ${c.phase.label.split(" ")[0]}`, count: c.cards.length }))} /></div>
        <div className={s.board} role="list" aria-label="Operaciones por etapa">
          {columns.map(({ phase, index, cards }) => <section key={phase.key} id={`etapa-${phase.slug}`} role="listitem" aria-labelledby={`col-${phase.key}`} className={s.column} data-active={index === tab || undefined} data-requested={index === requested || undefined}>
            <div className={s.columnHead}>
              <span className={s.mono}>Etapa {index + 1}</span>
              <h2 id={`col-${phase.key}`} className={s.columnTitle}>{phase.label} <span className={s.mono}>{cards.length}</span></h2>
              <p className={s.columnHint}>{phase.hace}</p>
            </div>
            {cards.length ? <ul className="flex flex-col gap-3">{cards.map(({ card }) => <li key={card.id}><Link href={card.href} className={s.card}>
              <strong className="[overflow-wrap:anywhere]">{card.who}</strong>
              <small className="text-muted-foreground [overflow-wrap:anywhere]">{card.property}</small>
              <span className={s.cardRule} aria-hidden="true" />
              <span className={s.sigue}>Sigue</span>
              <span className="flex items-start justify-between gap-2"><span className="[overflow-wrap:anywhere]">{card.next}</span><ChevronRight size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" /></span>
              <span className={cn(s.mono, card.late && s.lateText)}>{dueLabel(card.date, today)}</span>
            </Link></li>)}</ul> : <p className={s.emptyColumn}>Sin operaciones en esta etapa.</p>}
            {phase.key === "cierre" && archived.length > 0 && <details className={s.archived}><summary>Archivadas ({archived.length})</summary><ul className="mt-2 flex flex-col gap-1">{archived.map(({ op, card }) => <li key={op.id}><Link href={card.href} className={s.archivedLink}>{card.who} <span className={s.mono}>{op.folio}</span></Link></li>)}</ul></details>}
          </section>)}
        </div>
        {visible.length === 0 && records.length > 0 && <p className="mt-4 text-sm text-muted-foreground">Ninguna operación coincide con la búsqueda o el filtro.</p>}
      </>}

    <footer className="mt-8 flex flex-col gap-4">
      {!deleted && <Card as="div" className="p-4 sm:p-5">
        <button type="button" className={s.toggle} aria-expanded={creating} aria-controls="alta-directa" onClick={() => setCreating(open => !open)}>Alta directa, sin entrevista</button>
        {creating && <div className="mt-4"><DirectCreate onDirtyChange={setDraftDirty} /></div>}
      </Card>}
      <Link href={deleted ? "/admin/operaciones" : "/admin/operaciones?eliminadas=1"} className="self-start text-sm font-semibold text-foreground underline underline-offset-4">{deleted ? "Volver a las operaciones en curso" : "Ver operaciones eliminadas"}</Link>
    </footer>
  </Surface>;
}

function DeletedList({ records, names, onRestore }: { records: OperationRecord[] | null | undefined; names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined }; onRestore: (op: OperationRecord) => void }) {
  if (records === undefined) return <p role="status" className="text-sm text-muted-foreground">Consultando operaciones eliminadas…</p>;
  if (!records?.length) return records === null ? null : <EmptyBox title="No hay operaciones eliminadas">Cuando elimines una operación aparecerá aquí y podrás restaurarla.</EmptyBox>;
  return <Card as="div" className="overflow-hidden"><ul>{records.map(op => <li key={op.id} className={s.deletedRow}>
    <span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{names.client(op.cliente_id) ?? op.folio}</strong><small className="text-muted-foreground">{op.folio} · {names.property(op.propiedad_slug) ?? "Sin inmueble vinculado"}</small></span>
    <Button onClick={() => onRestore(op)} aria-label={`Restaurar ${op.folio}`}>Restaurar</Button>
  </li>)}</ul></Card>;
}
