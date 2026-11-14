"use client";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { FirstDay } from "./first-day";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Plus } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Pill, Surface, Thumb, type PillTone } from "@/components/admin/kit";
import { db, upsert, useCollection, useSession, type Evento } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { greeting, longDate, shortDate, todayTasks, upcomingItems, weekDays, weekdayDate, QUEUE_LABEL, type QueueItem } from "@/lib/admin/today";
import { operationTags } from "@/lib/admin/operation-view";
import { useConditions } from "@/lib/admin/conditions";
import { cn } from "@/lib/utils";
import { SetupChecklist } from "@/components/admin/workspace/setup-checklist";
import { SectionBoundary } from "@/components/admin/section-boundary";
import { useTodayQueue } from "@/components/admin/workspace/use-today-queue";
import { FirstContactButton } from "@/components/admin/workspace/first-contact";
import { NextStepPrompt } from "@/components/admin/contacts/next-step-prompt";
import { Announcements } from "@/components/admin/workspace/announcements";
import { Inbox } from "@/components/admin/workspace/inbox";
import { askNextAfter, type NextRef } from "@/lib/admin/next-step-task";
import s from "./hoy.module.css";

/*
  Hoy en dos columnas (rediseño del 14/11/2026 sobre el boceto «desde cero»; conserva SIM-16):
  - Arriba, el saludo y una frase con el hallazgo del día: lo vencido, lo de hoy y lo de la semana.
  - Izquierda, «Tu día» en una sola tarjeta: lo siguiente como fila destacada y, debajo, lo demás
    agrupado por persona en «Vencido» y «Por atender» (una fila por persona, con cuántos más tiene).
  - Derecha, el tiempo: «Hoy» (citas y tareas, que se marcan aquí) y «Esta semana» como lista por día.
  En celular va todo en una columna: saludo, avisos, tu día, hoy y semana.
  Todo se calcula con datos que el panel ya carga; nada se inventa.
*/

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const LIST_ROWS = 6, TASK_ROWS = 5;
/** Tono de la pastilla por tipo; lo vencido siempre en rojo. */
function queuePill(item: QueueItem): { text: string; tone: PillTone } {
  if (item.late) return { text: item.kind === "seguimiento" ? "Atrasado" : QUEUE_LABEL[item.kind], tone: "alert" };
  const tone: PillTone = item.kind === "revisar" || item.kind === "entrevista" || item.kind === "nuevo" ? "brand" : item.kind === "decidir" || item.kind === "contrato" || item.kind === "licencia" || item.kind === "informe" ? "warn" : item.kind === "agendar" ? "muted" : "info";
  return { text: QUEUE_LABEL[item.kind], tone };
}
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

function Section({ title, count, action, children, id, className }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode; id: string; className?: string }) {
  return <section id={id + "-bloque"} aria-labelledby={id} className={cn(s.panel, className)}>
    <div className={s.head}>
      {/* El número va fuera del h2 para que el nombre de la sección sea solo el título. */}
      <span className={s.title}><h2 id={id} className="m-0 text-[length:inherit] font-[inherit]">{title}</h2>{!!count && <span className={s.count}>{count}</span>}</span>
      {action}
    </div>
    {children}
  </section>;
}
const more = (href: string, label: string) => <Link href={href} className={s.more}>{label}</Link>;
const failed = (what: string) => <p role="alert" className={s.note}>No se pudieron consultar {what}. Recarga la página para reintentar.</p>;

export function HoyScreen() {
  const session = useSession();
  const tasks = useCollection(db.tareas), events = useCollection(db.eventos), leads = useCollection(db.leads), properties = useCollection(db.propiedades);
  const today = operationalDate();
  const conditions = useConditions();
  const [hour, setHour] = React.useState<number | null>(null);
  const [showAll, setShowAll] = React.useState(false);
  React.useEffect(() => {
    // La hora se toma en el navegador para no saludar con la hora del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHour(new Date().getHours());
  }, []);
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
  const firstName = session?.name?.trim().split(/\s+/)[0];
  const weekItems = (day: string) => [
    ...events.filter(e => e.fecha === day).sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99")).map(e => ({ id: `evento:${e.id}`, text: e.titulo, time: e.hora, meta: e.tipo === "visita" ? "Visita" : "Cita", href: `/admin/agenda?fecha=${day}&evento=${encodeURIComponent(e.id)}`, visit: e.tipo === "visita" })),
    ...upcoming.filter(item => item.date === day).map(item => ({ id: item.id, text: item.text, time: undefined, meta: item.meta, href: item.href, visit: false })),
    ...expiring.filter(item => item.date === day).map(item => ({ id: item.id, text: item.kind === "Contrato" ? "Vence el contrato de servicio" : "Vence la licencia estatal", time: undefined, meta: item.meta, href: item.href, visit: false })),
  ];
  const weekList = week.map(day => ({ day, items: weekItems(day) })).filter(entry => entry.items.length > 0);
  const weekCount = weekList.reduce((sum, entry) => sum + entry.items.length, 0);
  const todayCount = agenda.length + dayTasks.filter(isTaskOpen).length;
  const lateCount = queue.filter(item => item.late).length;
  // La portada no se repite abajo; lo demás, agrupado por persona (13/11/2026).
  const rest = queue.slice(1);
  const groups = byPerson(rest);
  const failures = [dossiers === null && "las operaciones", interviews === null && "las entrevistas", contracts === null && "los contratos de servicio", reports === null && "los informes al propietario"].filter((x): x is string => !!x);
  // COR-14: la situación y la condición de la llamada, como chip en cada operación.
  const tagsOf = (item: QueueItem) => { const d = item.folio ? dossiers?.find(x => x.folio === item.folio) : undefined; return d ? operationTags(d, conditions.ofOperation(d.id)) : []; };
  // COR-21: un prospecto nuevo del sitio se marca como atendido desde aquí, sin abrir su ficha.
  const leadOf = (item: QueueItem) => item.leadId ? leads.find(l => l.id === item.leadId) : undefined;
  const nextLead = next ? leadOf(next) : undefined;
  const thumb = (item: QueueItem, size: number) => item.folio || item.propertySlug ? <Thumb src={photo(item.propertySlug)} size={size} icon={<Building2 size={size > 44 ? 24 : 20} aria-hidden="true" />} /> : <Avatar name={item.who} size={size} />;

  const lateGroups = groups.filter(group => group[0].late), otherGroups = groups.filter(group => !group[0].late);
  const lateShown = showAll ? lateGroups : lateGroups.slice(0, LIST_ROWS);
  const otherShown = showAll ? otherGroups : otherGroups.slice(0, Math.max(0, LIST_ROWS - lateShown.length));
  const hidden = groups.length - lateShown.length - otherShown.length;
  const row = (group: QueueItem[]) => {
    const item = group[0], pill = queuePill(item), lead = leadOf(item), others = group.length - 1;
    return <li key={item.id}><article className={cn(lead && s.rowWithAction)}><Link href={item.href} className={s.row} aria-label={`Continuar con ${item.who}`}>
      {thumb(item, 40)}
      <span className={s.rowBody}><span className={s.rowTitle}>{item.text}</span><span className={s.rowText}>{item.who}{item.detail ? ` · ${item.detail}` : ""}</span></span>
      <span className={s.rowEnd}>
        <span className={s.rowPills}>{tagsOf(item).map(tag => <Pill key={tag} tone="warn" size="sm">{tag}</Pill>)}{item.kind !== "vencida" && <Pill tone={pill.tone} size="sm">{pill.text}</Pill>}</span>
        <span className={s.meta}>{item.when && <span className={cn(item.late && s.lateText)}>{item.when}</span>}{item.when && others > 0 && " · "}{others > 0 && `${others} más`}</span>
      </span>
    </Link>{lead && <FirstContactButton lead={lead} className={s.rowAction} />}</article></li>;
  };
  // El hallazgo del día en una frase: lo vencido primero; nada se cuenta dos veces.
  const finding = dossiers === undefined ? "Consultando tu día…"
    : <>{lateCount > 0 ? <>Tienes <b className={s.lateText}>{plural(lateCount, "cosa vencida", "cosas vencidas")}</b>, </> : "No tienes nada vencido; "}
      {todayCount > 0 ? `${todayCount} para hoy` : "nada más para hoy"}{weekCount > 0 ? ` y ${weekCount} en los próximos siete días.` : "."}</>;

  return <Surface className={s.page}>
    <header className={s.top}>
      <p className={s.date}><time dateTime={today}>{longDate(today)}</time></p>
      <h1 className={s.helloTitle}>{hour === null ? "Hola" : greeting(hour)}{firstName ? `, ${firstName}` : ""}.</h1>
      <p className={s.finding}>{finding}</p>
      <SectionBoundary what="«Preparar tu espacio»"><SetupChecklist compact /></SectionBoundary>
    </header>

    <div className={s.main}>
      <div className={s.notices}>
        <SectionBoundary what="«Tu primer día»"><FirstDay operations={dossiers} /></SectionBoundary>
        <SectionBoundary what="«Avisos»"><Announcements /></SectionBoundary>
        <SectionBoundary what="«Para ti»"><Inbox /></SectionBoundary>
      </div>

      {/* Tu día (boceto del 14/11/2026): lo siguiente arriba y, debajo, lo demás en «Vencido» y «Por atender». */}
      <div className={cn(s.panel, s.nextBox)}>
        <section aria-labelledby="hoy-cola" className={s.nextSection}>
          <div className={s.head}><h2 id="hoy-cola" className={s.title}>Lo siguiente</h2>{dossiers !== undefined && queue.length > 1 && <span className={s.meta}>{plural(queue.length, "pendiente", "pendientes")}</span>}</div>
          <div data-tour="hoy-siguiente">
            {dossiers === undefined ? <p role="status" className={s.note}>Consultando operaciones…</p>
              : next ? <Link href={next.href} className={s.lead} aria-label={`Lo siguiente: ${next.text} ${next.who}`}>
                {next.folio || next.propertySlug ? <Thumb src={photo(next.propertySlug)} size={64} icon={<Building2 size={24} aria-hidden="true" />} /> : <Avatar name={next.who} size={64} />}
                <span className={s.leadBody}>
                  <span className={s.leadTags}>{next.late && <Pill tone="alert" size="sm">{next.when || QUEUE_LABEL[next.kind]}</Pill>}{!(next.late && next.kind === "vencida") && <Pill tone={next.late ? "muted" : queuePill(next).tone} size="sm">{QUEUE_LABEL[next.kind]}</Pill>}{tagsOf(next).map(tag => <Pill key={tag} tone="warn" size="sm">{tag}</Pill>)}</span>
                  <strong className={s.leadTitle}>{next.text}</strong>
                  <span className={s.rowText}>{next.who}{next.detail ? ` · ${next.detail}` : ""}</span>
                </span>
                <span className={s.leadGo}>Continuar<ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
              : <div className={s.empty}><strong className={s.leadTitle}>Nada espera por ti.</strong><span className={s.rowText}>{inProgress.length ? "Cada operación tiene su siguiente paso con fecha." : "Empieza con la entrevista del propietario: la operación se crea al terminarla."}</span>{!inProgress.length && <ButtonLink href="/admin/operaciones/nueva" variant="primary" className="mt-2 self-start">Nueva operación</ButtonLink>}</div>}
          </div>
          {nextLead && <div className={s.contactLine}>
            <span className={s.meta}>¿Ya hablaste con {nextLead.nombre}?</span>
            <FirstContactButton lead={nextLead} />
          </div>}
          {failures.map(what => <div key={what}>{failed(what)}</div>)}
          {dossiers !== undefined && next && rest.length === 0 && <p className={s.note}>Nada más espera por ti.</p>}
        </section>

        {dossiers !== undefined && rest.length > 0 && <section aria-labelledby="hoy-pendientes" className={s.queueSection}>
          <h2 id="hoy-pendientes" className="sr-only">Pendientes</h2>
          {lateShown.length > 0 && <>
            <h3 className={cn(s.group, s.groupLate)}>Vencido <span>{lateGroups.length}</span></h3>
            <ul className={s.list} aria-label="Pendientes vencidos">{lateShown.map(row)}</ul>
          </>}
          {otherShown.length > 0 && <>
            <h3 className={s.group}>Por atender <span>{otherGroups.length}</span></h3>
            <ul className={s.list} aria-label="Más pendientes">{otherShown.map(row)}</ul>
          </>}
          {hidden > 0 && <Button variant="ghost" className={cn(s.more, "self-start")} onClick={() => setShowAll(true)}>{hidden === 1 ? "Ver 1 fila más" : `Ver ${hidden} filas más`}</Button>}
        </section>}
      </div>
    </div>

    <div className={s.side}>
      <TodayBlock tasks={dayTasks} agenda={agenda} today={today} nextEvent={nextEvent} names={names} leads={leads} photo={photo} />

      <Section id="hoy-semana" title="Esta semana" className={s.weekBox} action={more("/admin/agenda", "Ver agenda")}>
        {weekList.length ? <ul className={s.week} aria-label="Esta semana, por día">{weekList.map(({ day, items }) => <li key={day} className={s.day}>
          <span className={s.dayBadge} aria-hidden="true"><span className={s.dayName}>{weekdayDate(day).slice(0, 3)}</span><span className={s.dayNum}>{Number(day.slice(8))}</span></span>
          <span className="sr-only">{weekdayDate(day)}</span>
          <ul className={s.dayItems}>{items.map(item => <li key={item.id}><Link href={item.href} className={s.dayItem}>
            <span className={cn(s.dayText, item.visit && s.dayVisit)}>{item.time ? `${item.time} · ` : ""}{item.text}</span>
            {item.meta && <small className={s.dayMeta}>{item.meta}</small>}
          </Link></li>)}</ul>
        </li>)}</ul> : <p className={s.note}>Nada vence en los próximos siete días.</p>}
      </Section>
    </div>
  </Surface>;
}

/** «Hoy»: citas y tareas del día en una sola tarjeta; las tareas se marcan aquí. */
function TodayBlock({ tasks, agenda, today, nextEvent, names, leads, photo }: {
  tasks: Task[]; agenda: Evento[]; today: string; nextEvent?: Evento; names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined };
  leads: Array<{ id: string; nombre: string }>; photo: (slug?: string | null) => string | undefined;
}) {
  const [saving, setSaving] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const allTasks = useCollection(db.tareas);
  const [ask, setAsk] = React.useState<NextRef | null>(null);
  const undo = useUndo();
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
  return <Section id="hoy-hoy" title="Hoy" count={agenda.length + open.length || undefined} className={s.todayBox} action={more("/admin/agenda", "Ver semana")}>
    <div className={s.todayCard}>
      {empty ? <div className={s.agendaEmpty}>
        <p className={s.note}>Sin citas ni tareas hoy</p>
        {nextEvent && <Link href={`/admin/agenda?fecha=${nextEvent.fecha}&evento=${encodeURIComponent(nextEvent.id)}`} className={s.nextEvent}>
          <Thumb src={photo(nextEvent.propiedadSlug)} size={56} icon={<Building2 size={22} aria-hidden="true" />} />
          <span className="flex min-w-0 flex-col gap-0.5"><small className="text-muted-foreground">La siguiente: {weekdayDate(nextEvent.fecha)}{nextEvent.hora ? ` · ${nextEvent.hora}` : ""}{nextEvent.tipo === "visita" ? " · Visita" : ""}</small><strong className="[overflow-wrap:anywhere]">{nextEvent.titulo}</strong></span>
        </Link>}
      </div> : <>
        {agenda.length > 0 && <ul className={s.agenda} aria-label="Citas de hoy">{agenda.map(event => {
          const visit = event.tipo === "visita";
          const context = [names.client(event.clienteId) ?? leads.find(l => l.id === event.leadId)?.nombre, names.property(event.propiedadSlug)].filter(text => text && text !== event.titulo).join(" · ");
          return <li key={event.id} className="contents"><Link href={`/admin/agenda?fecha=${today}&evento=${encodeURIComponent(event.id)}`} className={cn(s.event, visit && s.visit)}>
            <time className={s.time}>{event.hora ?? "—"}</time>
            <span className="flex min-w-0 flex-col gap-0.5">{visit && <span className={s.visitTag}><MapPin size={12} aria-hidden="true" />Visita</span>}<strong className="[overflow-wrap:anywhere]">{event.titulo}</strong>{context && <small className="text-muted-foreground">{visit ? `Con ${context}` : context}</small>}</span>
          </Link></li>;
        })}</ul>}
        {tasks.length > 0 && <div className={cn(s.tasks, agenda.length > 0 && s.tasksAfterAgenda)}>
          <p className={cn(s.meta, "px-3 pt-2")}>{done} de {tasks.length} hechas</p>
          <ul className="flex flex-col" aria-label="Tareas de hoy">{shown.map(task => {
            const isOpen = isTaskOpen(task);
            return <li key={task.id} className={s.task}>
              <input type="checkbox" className={s.check} checked={!isOpen} disabled={saving === task.id} onChange={() => void toggle(task)} aria-label={`${isOpen ? "Marcar como hecha" : "Marcar como pendiente"}: ${task.titulo}`} />
              <span className="flex min-w-0 flex-col gap-0.5"><Link href={`/admin/tareas/${encodeURIComponent(task.id)}`} className={cn("[overflow-wrap:anywhere] font-medium", !isOpen && s.doneText)}>{task.titulo}</Link><small className={cn(s.meta, isOpen && task.vence! < today && s.lateText)}>{task.vence === today ? "Hoy" : `Vencida desde el ${shortDate(task.vence!)}`}</small></span>
            </li>;
          })}</ul>
          {tasks.length > TASK_ROWS && more("/admin/agenda?tab=tareas", `Ver las ${tasks.length} tareas`)}
        </div>}
      </>}
      <div className={s.todayFoot}>
        <Link href="/admin/agenda?tab=tareas&nueva=1" className={s.add}><Plus size={18} aria-hidden="true" />Agregar tarea</Link>
        <Link href="/admin/agenda?nueva=1" className={s.add}><Plus size={18} aria-hidden="true" />Agendar</Link>
      </div>
    </div>
    {message && <p role="status" className={cn("px-1 text-sm", message.startsWith("No se pudo") ? "text-destructive" : "text-muted-foreground")}>{message}</p>}
    <UndoNotice {...undo} onError={setMessage} />
    {ask && <NextStepPrompt key={ask.id} person={ask} today={today} name={ask.kind === "lead" ? leads.find(l => l.id === ask.id)?.nombre : names.client(ask.kind === "operacion" ? ask.clienteId : ask.id)} onClose={() => setAsk(null)} />}
  </Section>;
}
