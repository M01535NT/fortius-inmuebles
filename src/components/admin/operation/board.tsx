"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { Button, Card, EmptyBox, Segmented, Surface } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { apiRequest, db, errorMessage, fetchJson as json, loadAllDossiers, useCollection, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { SALE_PROCESS } from "@/lib/formatos/operation-workflow";
import { attentionOf, boardCard, dueLabel, flowOf, groupOfPhase, PHASE_GROUPS, pastGaps, stageTrack, type Attention, type GroupId, type OperationRecord } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { DirectCreate } from "./direct-create";
import { useLeaveGuard } from "./use-operation";
import { cn } from "@/lib/utils";
import s from "./board.module.css";

/*
  Operaciones (boceto C, aprobado por el titular el 17/10/2026): una lista en dos grupos,
  «Esperan algo de ti» —con el motivo en una palabra— y «Al día», filtrable por fase.
  Cada operación muestra su etapa numerada según su ruta, lo que sigue y su fecha.
  «?etapa=<slug>» sigue funcionando: filtra por la fase de esa etapa.
*/

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VERB: Record<string, string> = { captacion: "Vende", arrendador: "Renta su inmueble", compra: "Compra", arrendatario: "Busca una renta", inversion: "Invierte" };
type Row = { op: OperationRecord; who: string; meta: string; n: number; total: number; stage: string; group: GroupId; gapAt: Set<number>; next: string; date?: string; late: boolean; attention: Attention | null; mine: boolean; href: string };

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
  const requestedStage = SALE_PROCESS.find(p => p.slug === params.get("etapa"));
  const requestedGroup = PHASE_GROUPS.find(g => g.id === params.get("fase"))?.id ?? (requestedStage ? groupOfPhase(requestedStage.key) : undefined);
  const group = requestedGroup ?? "todas";
  React.useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(undefined); setError("");
    (deleted ? json<{ expedientes: OperationRecord[] }>("/api/admin/expedientes?estado=eliminados").then(r => r.expedientes ?? []) : loadAllDossiers<OperationRecord>())
      .then(list => { if (alive) setRecords(list.filter(item => deleted ? !!item.deleted_at : !item.deleted_at)); })
      .catch(cause => { if (alive) { setRecords(null); setError(errorMessage(cause)); } });
    return () => { alive = false; };
  }, [deleted, attempt]);
  // Formatos iniciados por operación: separan las primeras etapas del propietario y muestran lo que falta de etapas anteriores.
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

  const names = {
    client: (id?: string) => id ? clients.find(c => c.id === id)?.nombre : undefined,
    property: (slug?: string | null) => slug ? properties.find(p => p.slug === slug)?.titulo : undefined,
  };
  const rows: Row[] = (records ?? []).map(op => {
    const formats = started.get(op.id), checklist = tasks.find(t => t.id === checklistTaskId(op.id));
    const view: OperationRecord = { ...op, inicial: { iniciada: !!formats?.has("02"), levantamiento: formats?.has("04") ? "borrador" : undefined, documentos: checklist ? (checklist.pasos.length > 0 && checklist.pasos.every(p => p.hecho) ? "completo" : "pendiente") : undefined } };
    const card = boardCard(view, tasks, today, names, me);
    const { stages, current } = stageTrack(view, today);
    // Aquí solo se sabe qué formatos existen: se avisa del que falta por completo, no del que espera su PDF.
    const gaps = pastGaps(view, today, formato => formats?.has(formato) ? "terminado" : undefined);
    const flow = flowOf(op);
    return {
      op, who: card.who, meta: [VERB[flow.ruta] ?? "", card.property].filter(Boolean).join(" · "),
      n: current + 1, total: stages.length, stage: stages[current]?.label ?? "", group: stages[current]?.group ?? "conocer", gapAt: new Set(gaps.map(g => g.n)),
      next: card.next, date: card.date, late: card.late, attention: attentionOf(view, tasks, today, gaps[0]?.gap), mine: card.mine, href: card.href,
    };
  });
  const visible = rows.filter(row => (!admin || scope === "equipo" || !me || row.mine) && (!query.trim() || normalize(`${row.who} ${row.op.folio} ${row.meta}`).includes(normalize(query.trim()))));
  const active = visible.filter(row => row.op.etapa !== "cerrado");
  const archived = visible.filter(row => row.op.etapa === "cerrado");
  const inGroup = active.filter(row => group === "todas" || row.group === group);
  const byDate = (a: Row, b: Row) => (a.date ?? "9999").localeCompare(b.date ?? "9999") || a.who.localeCompare(b.who, "es");
  const waiting = inGroup.filter(row => row.attention).sort((a, b) => a.attention!.rank - b.attention!.rank || byDate(a, b));
  const fine = inGroup.filter(row => !row.attention).sort(byDate);

  function chooseGroup(id: GroupId | "todas") {
    const next = new URLSearchParams(params.toString()); next.delete("etapa");
    if (id === "todas") next.delete("fase"); else next.set("fase", id);
    const search = next.toString();
    router.replace(search ? `/admin/operaciones?${search}` : "/admin/operaciones", { scroll: false });
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
    <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="m-0">{deleted ? "Operaciones eliminadas" : "Operaciones"}</h1>
        {records && <p className="text-muted-foreground">{deleted ? `${records.length} ${records.length === 1 ? "operación" : "operaciones"} que puedes restaurar` : `${active.length} en curso${waiting.length ? ` · ${waiting.length} ${waiting.length === 1 ? "espera" : "esperan"} algo de ti` : ""}`}</p>}
      </div>
      {!deleted && <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {admin && me && <Segmented label="Operaciones que se muestran" options={[{ id: "mias", label: "Mías" }, { id: "equipo", label: "Todo el equipo" }]} value={scope} onChange={setScope} />}
        <label className={s.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar operación</span><input className={inputClass} placeholder="Buscar por nombre, folio o inmueble" value={query} onChange={e => setQuery(e.target.value)} /></label>
      </div>}
    </header>
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-destructive"><span>{error}</span>{records === null && <Button onClick={() => setAttempt(n => n + 1)}>Reintentar</Button>}</div>}
    {notice && <p role="status" className="mb-4 text-sm">{notice}</p>}

    {deleted ? <DeletedList records={records} names={names} onRestore={op => void restore(op)} />
      : records === undefined ? <p role="status" className="text-sm text-muted-foreground">Consultando operaciones…</p>
      : records !== null && records.length === 0 ? <EmptyBox title="Todavía no hay operaciones" action={<Link href="/admin/operaciones/nueva" className="font-semibold underline underline-offset-4">Nueva operación</Link>}>Empieza con la entrevista del cliente; la operación se crea al terminarla.</EmptyBox>
      : records !== null && <>
        <div role="group" aria-label="Filtrar por fase" className={s.filters}>
          {[{ id: "todas" as const, label: "Todas" }, ...PHASE_GROUPS].map(g => {
            const count = g.id === "todas" ? active.length : active.filter(row => row.group === g.id).length;
            return <button key={g.id} type="button" aria-pressed={group === g.id} className={s.filter} onClick={() => chooseGroup(g.id)}>{g.label}<span className={s.count}>{count}</span></button>;
          })}
        </div>
        <OperationGroup id="esperan" title="Esperan algo de ti" rows={waiting} today={today} empty="Nada pendiente por ahora." />
        <OperationGroup id="al-dia" title="Al día" rows={fine} today={today} empty={waiting.length ? "Todas las operaciones de esta vista esperan algo de ti." : "Sin operaciones en esta fase."} />
        {visible.length === 0 && records.length > 0 && <p className="mt-4 text-sm text-muted-foreground">Ninguna operación coincide con la búsqueda o el filtro.</p>}
        {archived.length > 0 && <details className={s.archived}><summary>Archivadas ({archived.length})</summary><ul className="mt-2 flex flex-col gap-1">{archived.map(row => <li key={row.op.id}><Link href={row.href} className={s.archivedLink}>{row.who} <span className="font-mono text-xs text-muted-foreground">{row.op.folio}</span></Link></li>)}</ul></details>}
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

function OperationGroup({ id, title, rows, today, empty }: { id: string; title: string; rows: Row[]; today: string; empty: string }) {
  return <section aria-labelledby={`grupo-${id}`} className="mb-6 flex flex-col gap-3">
    <h2 id={`grupo-${id}`} className="m-0 text-lg font-bold">{title} <span className="text-sm font-normal text-muted-foreground">{rows.length}</span></h2>
    {rows.length ? <Card as="div" className="overflow-hidden">
      <div className={s.head} aria-hidden="true"><span>Operación</span><span>Etapa</span><span>Lo que sigue</span><span>Fecha</span></div>
      <ul className="m-0 list-none p-0">{rows.map(row => <li key={row.op.id}><Link href={row.href} className={s.row} aria-label={`${row.who}. Etapa ${row.n} de ${row.total}, ${row.stage}.${row.attention ? ` ${row.attention.label}.` : ""} Sigue: ${row.next}. ${dueLabel(row.date, today)}`}>
        <span className="flex min-w-0 flex-col"><strong className="[overflow-wrap:anywhere]">{row.who}</strong><span className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{row.meta}</span></span>
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2 text-sm"><span>{row.n} de {row.total} · {row.stage}</span>{row.attention && <span className={s.reason} data-late={row.attention.late || undefined}>{row.attention.label}</span>}</span>
          <span className={s.bar} style={{ gridTemplateColumns: `repeat(${row.total}, minmax(0, 1fr))` }} aria-hidden="true">{Array.from({ length: row.total }, (_, i) => <span key={i} data-state={row.gapAt.has(i + 1) ? "warn" : i < row.n ? "on" : undefined} />)}</span>
        </span>
        <span className="min-w-0 text-[0.9375rem] [overflow-wrap:anywhere]"><span className={s.mobileLabel}>Sigue: </span>{row.next}</span>
        <span className={cn("text-sm", row.late ? s.late : row.date === today ? "font-semibold" : "text-muted-foreground")}>{dueLabel(row.date, today)}</span>
        <ChevronRight size={18} aria-hidden="true" className={s.chevron} />
      </Link></li>)}</ul>
    </Card> : <p className="text-sm text-muted-foreground">{empty}</p>}
  </section>;
}

function DeletedList({ records, names, onRestore }: { records: OperationRecord[] | null | undefined; names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined }; onRestore: (op: OperationRecord) => void }) {
  if (records === undefined) return <p role="status" className="text-sm text-muted-foreground">Consultando operaciones eliminadas…</p>;
  if (!records?.length) return records === null ? null : <EmptyBox title="No hay operaciones eliminadas">Cuando elimines una operación aparecerá aquí y podrás restaurarla.</EmptyBox>;
  return <Card as="div" className="overflow-hidden"><ul className="m-0 list-none p-0">{records.map(op => <li key={op.id} className={s.deletedRow}>
    <span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{names.client(op.cliente_id) ?? op.folio}</strong><small className="text-muted-foreground">{op.folio} · {names.property(op.propiedad_slug) ?? "Sin inmueble vinculado"}</small></span>
    <Button onClick={() => onRestore(op)} aria-label={`Restaurar ${op.folio}`}>Restaurar</Button>
  </li>)}</ul></Card>;
}

