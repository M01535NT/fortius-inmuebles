"use client";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { FirstDay } from "./first-day";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Building2, ChevronRight, Circle, Plus, Star } from "@/components/admin/icons";
import { Button, ButtonLink, Surface, Thumb } from "@/components/admin/kit";
import { db, upsert, useCollection, type Evento } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { longDate, shortDate, todayTasks, upcomingItems, weekDays, weekdayDate, type QueueItem, type TodayDossier } from "@/lib/admin/today";
import { operationTags, stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { stageIcon } from "@/components/admin/icons";
import { useConditions } from "@/lib/admin/conditions";
import { cn } from "@/lib/utils";
import { SetupChecklist } from "@/components/admin/workspace/setup-checklist";
import { SectionBoundary } from "@/components/admin/section-boundary";
import { useTodayQueue } from "@/components/admin/workspace/use-today-queue";
import { FirstContactButton } from "@/components/admin/workspace/first-contact";
import { NewMenu } from "@/components/admin/workspace/guided-nav";
import { NextStepPrompt } from "@/components/admin/contacts/next-step-prompt";
import { Announcements } from "@/components/admin/workspace/announcements";
import { Inbox } from "@/components/admin/workspace/inbox";
import { askNextAfter, type NextRef } from "@/lib/admin/next-step-task";
import s from "./hoy.module.css";

/*
  Hoy según el boceto «desde cero» aprobado por el titular (14/11/2026; conserva SIM-16):
  - Arriba, «Hoy» y una frase con el hallazgo del día; a la derecha, «+ Nuevo».
  - Izquierda, «Tu día»: una sola lista pareja en «Vencido» y «Hoy». Cada fila lleva el ícono de su estado,
    qué hacer, de quién, cuándo y su acción. La primera es «Lo siguiente» (la región lo dice al lector de pantalla).
  - Derecha, «Agenda de hoy» como línea de tiempo con la raya de «Ahora» y las tareas del día, y «Próximos 7 días».
  - Abajo, «Tu cartera por etapa»: cuántas operaciones hay en cada una de las diez etapas.
  Todo se calcula con datos que el panel ya carga; nada se inventa.
*/

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const LIST_ROWS = 7, TASK_ROWS = 5;
const PHASES = [["Captar", 3], ["Preparar", 4], ["Comercializar", 2], ["Cerrar", 1]] as const;
/** Los pendientes de una misma persona van juntos; el primero (el más urgente) da la fila. */
function byPerson(items: QueueItem[]) {
  const groups = new Map<string, QueueItem[]>();
  for (const item of items) {
    // Contrato, informe y requisitos no siempre traen folio ni inmueble; el nombre (antes del primer «·») sí.
    const key = item.who.split(" · ")[0].trim().toLocaleLowerCase("es-MX") || item.id;
    const group = groups.get(key);
    if (group) group.push(item); else groups.set(key, [item]);
  }
  return [...groups.values()];
}
/** Qué dice el botón de cada fila, según a dónde lleva. */
function actionOf(item: QueueItem) {
  if (item.href.startsWith("/admin/operaciones")) return "Abrir operación";
  if (item.href.startsWith("/admin/tareas")) return "Abrir tarea";
  if (item.kind === "informe") return "Preparar";
  if (item.href.startsWith("/admin/clientes") || item.href.startsWith("/admin/leads") || item.href.startsWith("/admin/contactos")) return "Abrir ficha";
  return "Abrir";
}
/** El ícono de estado de la fila: problema en triángulo, lo nuevo con estrella y lo demás en círculo. */
function StateIcon({ item }: { item: QueueItem }) {
  if (item.kind === "problema" || item.kind === "plazo") return <span className={cn(s.si, s.siWarn)}><AlertTriangle size={18} aria-hidden="true" /></span>;
  if (item.kind === "nuevo") return <span className={cn(s.si, s.siInfo)}><Star size={18} aria-hidden="true" /></span>;
  return <span className={s.si}><Circle size={18} aria-hidden="true" /></span>;
}
/** Lo mínimo de la operación que necesita el riel para saber su etapa. */
const asOperation = (d: TodayDossier): OperationRecord => ({ id: d.id, folio: d.folio, version: 0, cliente_id: d.cliente_id ?? "", asesor_id: d.asesor_id ?? "", operacion: "venta", propiedad_slug: d.propiedad_slug ?? null, etapa: d.etapa, flujo: d.flujo, inicial: d.inicial });

function Section({ title, count, action, children, id, className }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode; id: string; className?: string }) {
  return <section id={id + "-bloque"} aria-labelledby={id} className={cn(s.panel, className)}>
    <div className={s.head}>
      {/* El número va fuera del h2 para que el nombre de la sección sea solo el título. */}
      <span className={s.title}><h2 id={id} className={s.h2}>{title}</h2>{!!count && <span className={s.count}>{count}</span>}</span>
      {action}
    </div>
    {children}
  </section>;
}
const more = (href: string, label: string) => <Link href={href} className={s.more}>{label}</Link>;
const failed = (what: string) => <p role="alert" className={s.note}>No se pudieron consultar {what}. Recarga la página para reintentar.</p>;

export function HoyScreen() {
  const tasks = useCollection(db.tareas), events = useCollection(db.eventos), leads = useCollection(db.leads), properties = useCollection(db.propiedades);
  const today = operationalDate();
  const conditions = useConditions();
  const [showAll, setShowAll] = React.useState(false);
  // La cola y sus datos vienen del mismo cálculo que el número del menú (COR-05, RP-84).
  const { queue, dossiers, staged, interviews, reports, contracts, expiring, names } = useTodayQueue();
  const photo = (slug?: string | null) => slug ? properties.find(p => p.slug === slug)?.galeria[0]?.src : undefined;
  const next = queue[0];
  const inProgress = staged.filter(d => d.etapa !== "cerrado" && d.flujo?.estado !== "descartada");
  const shownTasks = new Set(queue.map(item => item.taskId).filter(Boolean));
  const dayTasks = todayTasks(tasks, today).filter(task => !shownTasks.has(task.id));
  const agenda = events.filter(e => e.fecha === today).sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99"));
  const week = weekDays(today);
  const nextEvent = events.filter(e => e.fecha > today && e.fecha <= week[6]).sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? "99").localeCompare(b.hora ?? "99"))[0];
  const upcoming = upcomingItems({ tasks, dossiers: dossiers ?? [], reports, names, today });
  const weekItems = (day: string) => [
    ...events.filter(e => e.fecha === day).sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99")).map(e => ({ id: `evento:${e.id}`, text: e.titulo, time: e.hora, meta: e.tipo === "visita" ? "Visita" : "Cita", href: `/admin/agenda?fecha=${day}&evento=${encodeURIComponent(e.id)}`, visit: e.tipo === "visita" })),
    ...upcoming.filter(item => item.date === day).map(item => ({ id: item.id, text: item.text, time: undefined, meta: item.meta, href: item.href, visit: false })),
    ...expiring.filter(item => item.date === day).map(item => ({ id: item.id, text: item.kind === "Contrato" ? "Vence el contrato de servicio" : "Vence la licencia estatal", time: undefined, meta: item.meta, href: item.href, visit: false })),
  ];
  const weekList = week.map(day => ({ day, items: weekItems(day) })).filter(entry => entry.items.length > 0);
  const weekCount = weekList.reduce((sum, entry) => sum + entry.items.length, 0);
  const lateCount = queue.filter(item => item.late).length;
  const failures = [dossiers === null && "las operaciones", interviews === null && "las entrevistas", contracts === null && "los contratos de servicio", reports === null && "los informes al propietario"].filter((x): x is string => !!x);
  // COR-14: la situación y la condición de la llamada, en texto junto a la operación.
  const tagsOf = (item: QueueItem) => { const d = item.folio ? dossiers?.find(x => x.folio === item.folio) : undefined; return d ? operationTags(d, conditions.ofOperation(d.id)) : []; };
  // COR-21: un prospecto nuevo del sitio se marca como atendido desde aquí, sin abrir su ficha.
  const leadOf = (item: QueueItem) => item.leadId ? leads.find(l => l.id === item.leadId) : undefined;

  // «Lo siguiente» va primero en su grupo; lo demás, agrupado por persona (13/11/2026).
  const rest = queue.slice(1);
  const groups = byPerson(rest);
  const lateGroups = groups.filter(group => group[0].late), otherGroups = groups.filter(group => !group[0].late);
  const room = LIST_ROWS - 1;
  const lateShown = showAll ? lateGroups : lateGroups.slice(0, room);
  const otherShown = showAll ? otherGroups : otherGroups.slice(0, Math.max(0, room - lateShown.length));
  const hidden = groups.length - lateShown.length - otherShown.length;
  const lateTotal = lateGroups.length + (next?.late ? 1 : 0), todayTotal = otherGroups.length + (next && !next.late ? 1 : 0);

  const row = (group: QueueItem[], label?: string) => {
    const item = group[0], lead = leadOf(item), others = group.length - 1, tags = tagsOf(item);
    return <li key={item.id}><article className={cn(s.qrow, lead && s.qrowLead)}>
      <Link href={item.href} className={s.row} aria-label={label ?? `Continuar con ${item.who}`}>
        <StateIcon item={item} />
        <span className={s.rowBody}>
          <span className={s.rowTitle}>{item.text}</span>
          <span className={s.rowText}>{item.who}{item.detail ? ` · ${item.detail}` : ""}{tags.map(tag => <span key={tag} className={s.warnText}> · {tag}</span>)}{others > 0 && ` · ${others} más`}</span>
        </span>
        {item.when && <span className={cn(s.when, item.late && s.lateText, !item.late && item.kind === "nuevo" && s.infoText)}>{item.when}</span>}
        {!lead && <span className={s.rowGo} aria-hidden="true">{actionOf(item)}</span>}
        <ChevronRight size={18} aria-hidden="true" className={s.rowChevron} />
      </Link>
      {lead && <FirstContactButton lead={lead} className={s.rowAction} />}
    </article></li>;
  };
  const nextBlock = next && <section aria-labelledby="hoy-cola" className={s.nextSection}>
    <h3 id="hoy-cola" className="sr-only">Lo siguiente</h3>
    <ul className={s.list} data-tour="hoy-siguiente">{row([next], `Lo siguiente: ${next.text} ${next.who}`)}</ul>
    {rest.length === 0 && <p className={s.note}>Nada más espera por ti.</p>}
  </section>;

  // El hallazgo del día en una frase: lo vencido primero; nada se cuenta dos veces.
  const todayCount = todayTotal + agenda.length + dayTasks.filter(isTaskOpen).length;
  const oldest = next?.late ? next.when : undefined;
  const finding = dossiers === undefined ? "Consultando tu día…"
    : <>{lateCount > 0 ? <>Tienes <b className={s.lateText}>{plural(lateCount, "cosa vencida", "cosas vencidas")}</b> y </> : "No tienes nada vencido; "}
      {todayCount > 0 ? `${todayCount} para hoy` : "nada más para hoy"}.{oldest ? ` Lo más urgente viene ${oldest.charAt(0).toLowerCase()}${oldest.slice(1)}.` : ""}</>;

  // Tu cartera: cuántas operaciones del propietario hay en cada una de sus diez etapas.
  const stagesCount = Array.from({ length: 10 }, () => 0);
  let stageNames: Array<{ label: string; key?: string }> = [];
  for (const d of inProgress) {
    const { stages, current } = stageTrack(asOperation(d), today);
    if (stages.length !== 10 || current < 0) continue;
    stageNames = stages; stagesCount[current] += 1;
  }
  const prospects = leads.filter(l => l.estado !== "descartado" && !l.clienteId).length;

  return <Surface className={s.page}>
    <header className={s.top}>
      <div className={s.titleRow}>
        <div className={s.titleText}>
          <h1 className={s.helloTitle}>Hoy</h1>
          <p className={s.finding}>{finding}</p>
        </div>
        <div className={s.titleAction}><NewMenu /></div>
      </div>
      <SectionBoundary what="«Preparar tu espacio»"><SetupChecklist compact /></SectionBoundary>
    </header>

    <div className={s.main}>
      <div className={s.notices}>
        <SectionBoundary what="«Tu primer día»"><FirstDay operations={dossiers} /></SectionBoundary>
        <SectionBoundary what="«Avisos»"><Announcements /></SectionBoundary>
        <SectionBoundary what="«Para ti»"><Inbox /></SectionBoundary>
      </div>

      <section aria-labelledby="hoy-dia" className={cn(s.panel, s.nextBox)}>
        <div className={s.head}><h2 id="hoy-dia" className={s.title}>Tu día</h2><span className={s.meta}>{dossiers !== undefined && queue.length > 0 ? `${plural(queue.length, "pendiente", "pendientes")} · ` : ""}{longDate(today).toLocaleLowerCase("es-MX")}</span></div>
        {failures.map(what => <div key={what}>{failed(what)}</div>)}
        {dossiers === undefined ? <p role="status" className={s.note}>Consultando operaciones…</p>
          : !next ? <section aria-labelledby="hoy-cola" className={s.empty}>
            <h3 id="hoy-cola" className="sr-only">Lo siguiente</h3>
            <strong className={s.emptyTitle}>Nada espera por ti.</strong>
            <span className={s.rowText}>{inProgress.length ? "Cada operación tiene su siguiente paso con fecha." : "Empieza con la entrevista del propietario: la operación se crea al terminarla."}</span>
            {!inProgress.length && <ButtonLink href="/admin/operaciones/nueva" variant="primary" className="mt-2 self-start">Nueva operación</ButtonLink>}
          </section>
          : <>
            {lateTotal > 0 && <>
              <h3 className={cn(s.group, s.groupLate)}>Vencido <span>{lateTotal}</span></h3>
              {next.late && nextBlock}
              {lateShown.length > 0 && <ul className={s.list} aria-label="Pendientes vencidos">{lateShown.map(group => row(group))}</ul>}
            </>}
            {todayTotal > 0 && (otherShown.length > 0 || !next.late) && <>
              <h3 className={s.group}>Hoy <span>{todayTotal}</span></h3>
              {!next.late && nextBlock}
              {otherShown.length > 0 && <ul className={s.list} aria-label="Más pendientes">{otherShown.map(group => row(group))}</ul>}
            </>}
            {hidden > 0 && <Button variant="ghost" className={cn(s.more, "self-start")} onClick={() => setShowAll(true)}>{hidden === 1 ? "Ver 1 fila más" : `Ver ${hidden} filas más`}</Button>}
          </>}
      </section>
    </div>

    <div className={s.side}>
      <TodayBlock tasks={dayTasks} agenda={agenda} today={today} nextEvent={nextEvent} names={names} leads={leads} photo={photo} />

      <Section id="hoy-semana" title="Próximos 7 días" className={s.weekBox} action={weekCount > 0 ? <span className={s.meta}>{weekCount}</span> : more("/admin/agenda", "Ver agenda")}>
        {weekList.length ? <ul className={s.week} aria-label="Próximos 7 días, por día">{weekList.flatMap(({ day, items }) => items.map((item, i) => <li key={item.id} className={s.day}>
          <span className={s.dayBadge} aria-hidden="true">{i === 0 && <><span className={s.dayName}>{weekdayDate(day).slice(0, 3)}</span><span className={s.dayNum}>{Number(day.slice(8))}</span></>}</span>
          <Link href={item.href} className={s.dayItem}>
            <span className="sr-only">{weekdayDate(day)}: </span>
            <span className={cn(s.dayText, item.visit && s.dayVisit)}>{item.time ? `${item.time} · ` : ""}{item.text}</span>
            {item.meta && <small className={s.dayMeta}>{item.meta}</small>}
          </Link>
        </li>))}</ul> : <p className={s.note}>Nada vence en los próximos siete días.</p>}
      </Section>
    </div>

    {stageNames.length === 10 && <section aria-labelledby="hoy-cartera" className={cn(s.panel, s.cartera)}>
      <div className={s.head}><h2 id="hoy-cartera" className={s.title}>Tu cartera por etapa</h2><span className={s.meta}>{plural(inProgress.length, "operación", "operaciones")} · {plural(prospects, "prospecto", "prospectos")}</span></div>
      <ol className={s.pipe} aria-label="Operaciones por etapa">{stageNames.map((stage, i) => {
        const Icon = stageIcon(stage, i), n = stagesCount[i];
        return <li key={stage.label} className={s.pcol}>
          <span className={cn(s.pnum, !n && s.pzero)}>{n}</span>
          <span className={s.pbar} aria-hidden="true"><i style={{ height: n ? "100%" : 0 }} /></span>
          <span className={s.pname}><Icon size={14} aria-hidden="true" />{stage.label.split(" · ")[0]}</span>
        </li>;
      })}</ol>
      <div className={s.pphases} aria-hidden="true">{PHASES.map(([name, span]) => <span key={name} style={{ gridColumn: `span ${span}` }}>{name}</span>)}</div>
    </section>}
  </Surface>;
}

/** «Agenda de hoy»: citas como línea de tiempo con la raya de «Ahora» y, debajo, las tareas del día, que se marcan aquí. */
function TodayBlock({ tasks, agenda, today, nextEvent, names, leads, photo }: {
  tasks: Task[]; agenda: Evento[]; today: string; nextEvent?: Evento; names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined };
  leads: Array<{ id: string; nombre: string }>; photo: (slug?: string | null) => string | undefined;
}) {
  const [saving, setSaving] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [now, setNow] = React.useState<string | null>(null);
  const allTasks = useCollection(db.tareas);
  const [ask, setAsk] = React.useState<NextRef | null>(null);
  const undo = useUndo();
  React.useEffect(() => {
    // La hora se toma en el navegador para no dibujar «Ahora» con la hora del servidor.
    const tick = () => { const d = new Date(); setNow(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`); };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const open = tasks.filter(isTaskOpen), done = tasks.length - open.length;
  const shown = tasks.slice(0, TASK_ROWS);
  async function toggle(task: Task) {
    setSaving(task.id); setMessage(""); setAsk(null); undo.clear();
    try {
      const completing = isTaskOpen(task);
      const saved = await upsert(db.tareas, { ...task, estado: completing ? "completada" : "pendiente" }, db.tareas.version(task));
      // RP-16: completar se deshace con un toque; el aviso sale cuando el servidor ya lo guardó.
      if (completing) undo.offer({ text: `Completaste «${task.titulo}».`, undo: () => { setAsk(null); return upsert(db.tareas, { ...saved, estado: task.estado as typeof saved.estado }, db.tareas.version(saved.id)); } }); // C-71: deshacer también retira «¿Qué sigue?»
      else setMessage("Guardado");
      // DEC-42: completar el siguiente paso de una persona pide el que sigue.
      if (completing) setAsk(askNextAfter(task, allTasks));
    } catch (error) {
      setMessage(`No se pudo guardar: ${error instanceof Error ? error.message : "intenta de nuevo"}`);
    } finally { setSaving(null); }
  }
  const empty = !agenda.length && !tasks.length;
  // La raya de «Ahora» va después de la última cita que ya empezó.
  const nowAt = now === null ? -1 : agenda.filter(event => (event.hora ?? "99") <= now).length;
  const nowLine = <li key="ahora" className={s.nowRow} aria-hidden="true"><span className={s.nowTime}>Ahora</span><span className={s.nowLine} /></li>;
  return <Section id="hoy-hoy" title="Agenda de hoy" count={agenda.length + open.length || undefined} className={s.todayBox} action={more("/admin/agenda", "Ver semana")}>
    <div className={s.todayCard}>
      {empty ? <div className={s.agendaEmpty}>
        <p className={s.note}>Sin citas ni tareas hoy</p>
        {nextEvent && <Link href={`/admin/agenda?fecha=${nextEvent.fecha}&evento=${encodeURIComponent(nextEvent.id)}`} className={s.nextEvent}>
          <Thumb src={photo(nextEvent.propiedadSlug)} size={56} icon={<Building2 size={22} aria-hidden="true" />} />
          <span className="flex min-w-0 flex-col gap-0.5"><small className="text-muted-foreground">La siguiente: {weekdayDate(nextEvent.fecha)}{nextEvent.hora ? ` · ${nextEvent.hora}` : ""}{nextEvent.tipo === "visita" ? " · Visita" : ""}</small><strong className="[overflow-wrap:anywhere]">{nextEvent.titulo}</strong></span>
        </Link>}
      </div> : <>
        {agenda.length > 0 && <ul className={s.agenda} aria-label="Citas de hoy">{agenda.flatMap((event, i) => {
          const visit = event.tipo === "visita";
          const context = [names.client(event.clienteId) ?? leads.find(l => l.id === event.leadId)?.nombre, names.property(event.propiedadSlug)].filter(text => text && text !== event.titulo).join(" · ");
          const item = <li key={event.id} className="contents"><Link href={`/admin/agenda?fecha=${today}&evento=${encodeURIComponent(event.id)}`} className={cn(s.event, visit && s.visit)}>
            <time className={s.time}>{event.hora ?? "—"}</time>
            <span className="flex min-w-0 flex-col gap-0.5"><strong className={s.eventTitle}>{event.titulo}</strong>{(visit || context) && <small className={s.dayMeta}>{visit ? ["Visita", context].filter(Boolean).join(" · ") : context}</small>}</span>
          </Link></li>;
          return i === nowAt ? [nowLine, item] : [item];
        }).concat(nowAt === agenda.length ? [nowLine] : [])}</ul>}
        {tasks.length > 0 && <div className={cn(s.tasks, agenda.length > 0 && s.tasksAfterAgenda)}>
          <p className={s.tasksHead}><span>Tareas</span><span className={s.meta}>{done} de {tasks.length} hechas</span></p>
          <ul className="flex flex-col" aria-label="Tareas de hoy">{shown.map(task => {
            const isOpen = isTaskOpen(task);
            return <li key={task.id} className={s.task}>
              <input type="checkbox" className={s.check} checked={!isOpen} disabled={saving === task.id} onChange={() => void toggle(task)} aria-label={`${isOpen ? "Marcar como hecha" : "Marcar como pendiente"}: ${task.titulo}`} />
              <span className="flex min-w-0 flex-col gap-0.5"><Link href={`/admin/tareas/${encodeURIComponent(task.id)}`} className={cn("[overflow-wrap:anywhere]", !isOpen && s.doneText)}>{task.titulo}</Link><small className={cn(s.dayMeta, isOpen && task.vence! < today && s.lateText)}>{task.vence === today ? "Hoy" : `Vencida desde el ${shortDate(task.vence!)}`}</small></span>
            </li>;
          })}</ul>
          {tasks.length > TASK_ROWS && more("/admin/agenda?tab=tareas", `Ver las ${tasks.length} tareas`)}
        </div>}
      </>}
      <div className={s.todayFoot}>
        <Link href="/admin/agenda?tab=tareas&nueva=1" className={s.add}><Plus size={16} aria-hidden="true" />Agregar tarea</Link>
        <Link href="/admin/agenda?nueva=1" className={s.add}><Plus size={16} aria-hidden="true" />Agendar</Link>
      </div>
    </div>
    {message && <p role="status" className={cn("text-sm", message.startsWith("No se pudo") ? "text-destructive" : "text-muted-foreground")}>{message}</p>}
    <UndoNotice {...undo} onError={setMessage} />
    {ask && <NextStepPrompt key={ask.id} person={ask} today={today} name={ask.kind === "lead" ? leads.find(l => l.id === ask.id)?.nombre : names.client(ask.kind === "operacion" ? ask.clienteId : ask.id)} onClose={() => setAsk(null)} />}
  </Section>;
}
