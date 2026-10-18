"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronRight, Columns3, List, Search } from "lucide-react";
import { Avatar, Button, Card, CardLink, EmptyBox, Pill, Segmented, Surface, Thumb } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { useBrowserPreference } from "@/components/admin/workspace/browser-preference";
import { apiRequest, db, errorMessage, fetchJson as json, loadAllDossiers, useCollection, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { SALE_PROCESS } from "@/lib/formatos/operation-workflow";
import { attentionOf, boardCard, dueLabel, flowOf, groupOfPhase, PHASE_GROUPS, pastGaps, stageTrack, type Attention, type GroupId, type OperationRecord } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { DirectCreate } from "./direct-create";
import { useLeaveGuard } from "./use-operation";
import s from "./board.module.css";

/*
  Operaciones (bocetos aprobados por el titular el 17/10/2026): dos vistas con selector.
  La lista (inicial) va en dos grupos, «Esperan algo de ti» —con el motivo en una palabra—
  y «Al día», con la foto del inmueble, la etapa numerada según su ruta, lo que sigue y su
  fecha. El tablero pone una columna por fase. La última vista se recuerda en este navegador
  como comodidad del dispositivo. «?etapa=<slug>» sigue funcionando: filtra por la fase.
*/

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VERB: Record<string, string> = { captacion: "Vende", arrendador: "Renta su inmueble", compra: "Compra", arrendatario: "Busca una renta", inversion: "Invierte" };
type Row = { op: OperationRecord; who: string; meta: string; photo?: string; adviser?: string; n: number; total: number; stage: string; group: GroupId; gapAt: Set<number>; next: string; date?: string; late: boolean; attention: Attention | null; mine: boolean; href: string };
type View = "lista" | "tablero";
const asView = (value: unknown): View => value === "tablero" ? "tablero" : "lista";

export function OperationsBoard() {
  const params = useSearchParams(), router = useRouter();
  const session = useSession();
  const admin = session?.role === "admin";
  const deleted = params.get("eliminadas") === "1";
  const clients = useCollection(db.clientes), properties = useCollection(db.propiedades), tasks = useCollection(db.tareas), advisers = useCollection(db.asesores);
  const [view, setView] = useBrowserPreference<View>(`fortius:operaciones:vista:${session?.id ?? "anon"}`, "lista", asView);
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
      photo: op.propiedad_slug ? properties.find(p => p.slug === op.propiedad_slug)?.galeria[0]?.src : undefined, adviser: advisers.find(a => a.id === op.asesor_id)?.nombre,
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

  return <Surface className="pb-4">
    <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className={s.head1}>{deleted ? "Operaciones eliminadas" : "Operaciones"}</h1>
        {records && <p className="text-muted-foreground">{deleted ? `${records.length} ${records.length === 1 ? "operación" : "operaciones"} que puedes restaurar` : `${active.length} en curso${waiting.length ? `. ${waiting.length} ${waiting.length === 1 ? "espera" : "esperan"} algo de ti.` : "."}`}</p>}
      </div>
      {!deleted && <div className="flex flex-wrap items-center gap-2.5">
        <Segmented label="Vista" value={view} onChange={setView} options={[{ id: "lista", label: "Lista", icon: <List size={16} aria-hidden="true" /> }, { id: "tablero", label: "Tablero", icon: <Columns3 size={16} aria-hidden="true" /> }]} />
        {admin && me && <Segmented label="Operaciones que se muestran" options={[{ id: "mias", label: "Mías" }, { id: "equipo", label: "Todo el equipo" }]} value={scope} onChange={setScope} />}
      </div>}
    </header>
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-destructive"><span>{error}</span>{records === null && <Button onClick={() => setAttempt(n => n + 1)}>Reintentar</Button>}</div>}
    {notice && <p role="status" className="mb-4 text-sm">{notice}</p>}

    {deleted ? <DeletedList records={records} names={names} onRestore={op => void restore(op)} />
      : records === undefined ? <p role="status" className="text-sm text-muted-foreground">Consultando operaciones…</p>
      : records !== null && records.length === 0 ? <EmptyBox title="Todavía no hay operaciones" action={<Link href="/admin/operaciones/nueva" className="font-semibold underline underline-offset-4">Nueva operación</Link>}>Empieza con la entrevista del cliente; la operación se crea al terminarla.</EmptyBox>
      : records !== null && <>
        <div className={s.toolbar}>
          <div role="group" aria-label="Filtrar por fase" className={s.filters}>
            {[{ id: "todas" as const, label: "Todas" }, ...PHASE_GROUPS].map(g => {
              const count = g.id === "todas" ? active.length : active.filter(row => row.group === g.id).length;
              return <button key={g.id} type="button" aria-pressed={group === g.id} className={s.filter} onClick={() => chooseGroup(g.id)}>{g.label}<span className={s.count}>{count}</span></button>;
            })}
          </div>
          <span className="flex-1" />
          <label className={s.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar operación</span><input className={inputClass} placeholder="Nombre, folio o inmueble" value={query} onChange={e => setQuery(e.target.value)} /></label>
        </div>
        {view === "tablero" ? <PhaseBoard rows={inGroup} today={today} />
          : <>
            <OperationGroup id="esperan" title="Esperan algo de ti" rows={waiting} today={today} empty="Nada pendiente por ahora." />
            <OperationGroup id="al-dia" title="Al día" rows={fine} today={today} empty={waiting.length ? "Todas las operaciones de esta vista esperan algo de ti." : "Sin operaciones en esta fase."} />
          </>}
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

/** Pastilla de fecha: vencido en rojo, hoy en guinda, lo demás neutro. */
function DuePill({ date, late, today }: { date?: string; late: boolean; today: string }) {
  return <Pill tone={late ? "alert" : date === today ? "brand" : "muted"}>{dueLabel(date, today)}</Pill>;
}

function OperationGroup({ id, title, rows, today, empty }: { id: string; title: string; rows: Row[]; today: string; empty: string }) {
  return <section aria-labelledby={`grupo-${id}`} className="mb-6 flex flex-col gap-3">
    <h2 id={`grupo-${id}`} className={s.groupTitle}>{title}<Pill tone={id === "esperan" && rows.length ? "alert" : "muted"} size="sm">{rows.length}</Pill></h2>
    {rows.length ? <Card as="div" className={s.list}>
      <div className={s.head} aria-hidden="true"><span>Operación</span><span>Etapa</span><span>Lo que sigue</span><span>Fecha</span></div>
      <ul className="m-0 list-none p-0">{rows.map(row => <li key={row.op.id}><Link href={row.href} className={s.row} aria-label={`${row.who}. Etapa ${row.n} de ${row.total}, ${row.stage}.${row.attention ? ` ${row.attention.label}.` : ""} Sigue: ${row.next}. ${dueLabel(row.date, today)}`}>
        <span className={s.who}><Thumb src={row.photo} size={48} icon={<Building2 size={20} aria-hidden="true" />} /><span className={s.whoText}><strong>{row.who}</strong><span>{row.meta}</span></span></span>
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2"><span className={s.stageText}>{row.n} de {row.total} · {row.stage}</span>{row.attention && <span className={s.reason} data-late={row.attention.late || undefined}>{row.attention.label}</span>}</span>
          <span className={s.bar} style={{ gridTemplateColumns: `repeat(${row.total}, minmax(0, 1fr))` }} aria-hidden="true">{Array.from({ length: row.total }, (_, i) => <span key={i} data-state={row.gapAt.has(i + 1) ? "warn" : i < row.n ? "on" : undefined} />)}</span>
        </span>
        <span className="min-w-0 text-[0.9375rem] text-muted-foreground [overflow-wrap:anywhere]"><span className={s.mobileLabel}>Sigue: </span>{row.next}</span>
        <DuePill date={row.date} late={row.late} today={today} />
        <ChevronRight size={18} aria-hidden="true" className={s.chevron} />
      </Link></li>)}</ul>
    </Card> : <p className="px-1 text-sm text-muted-foreground">{empty}</p>}
  </section>;
}

/** Tablero: una columna por fase; cada tarjeta lleva la foto, lo que sigue, su fecha y el responsable. */
function PhaseBoard({ rows, today }: { rows: Row[]; today: string }) {
  const byDate = (a: Row, b: Row) => (a.attention?.rank ?? 9) - (b.attention?.rank ?? 9) || (a.date ?? "9999").localeCompare(b.date ?? "9999");
  return <div className={s.boardScroll}><div className={s.board} role="list" aria-label="Operaciones por fase">
    {PHASE_GROUPS.map(group => {
      const cards = rows.filter(row => row.group === group.id).sort(byDate);
      return <section key={group.id} role="listitem" aria-labelledby={`columna-${group.id}`} className={s.column}>
        <h2 id={`columna-${group.id}`} className={s.columnTitle}>{group.label}<Pill tone="muted" size="sm">{cards.length}</Pill></h2>
        {cards.length === 0 && <p className={s.columnEmpty}>Sin operaciones en esta fase.</p>}
        {cards.map(row => <CardLink key={row.op.id} href={row.href} className={s.boardCard} data-late={row.late || row.attention?.late || undefined} aria-label={`${row.who}. Etapa ${row.n} de ${row.total}, ${row.stage}.${row.attention ? ` ${row.attention.label}.` : ""} Sigue: ${row.next}. ${dueLabel(row.date, today)}`}>
          {row.photo && <Thumb src={row.photo} ratio="16 / 9" className={s.cardPhoto} />}
          <span className={s.cardBody}>
            {row.attention && <span className="self-start"><Pill tone={row.attention.late ? "alert" : "warn"} size="sm">{row.attention.label}</Pill></span>}
            <strong className="[overflow-wrap:anywhere]">{row.who}</strong>
            <span className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{row.meta}</span>
            <span className="text-sm [overflow-wrap:anywhere]"><span className="text-muted-foreground">{row.n} de {row.total} · </span>{row.next}</span>
            <span className={s.cardFoot}><DuePill date={row.date} late={row.late} today={today} />{row.adviser && <Avatar name={row.adviser} size={26} />}</span>
          </span>
        </CardLink>)}
      </section>;
    })}
  </div></div>;
}

function DeletedList({ records, names, onRestore }: { records: OperationRecord[] | null | undefined; names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined }; onRestore: (op: OperationRecord) => void }) {
  if (records === undefined) return <p role="status" className="text-sm text-muted-foreground">Consultando operaciones eliminadas…</p>;
  if (!records?.length) return records === null ? null : <EmptyBox title="No hay operaciones eliminadas">Cuando elimines una operación aparecerá aquí y podrás restaurarla.</EmptyBox>;
  return <Card as="div" className="overflow-hidden"><ul className="m-0 list-none p-0">{records.map(op => <li key={op.id} className={s.deletedRow}>
    <span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{names.client(op.cliente_id) ?? op.folio}</strong><small className="text-muted-foreground">{op.folio} · {names.property(op.propiedad_slug) ?? "Sin inmueble vinculado"}</small></span>
    <Button onClick={() => onRestore(op)} aria-label={`Restaurar ${op.folio}`}>Restaurar</Button>
  </li>)}</ul></Card>;
}

