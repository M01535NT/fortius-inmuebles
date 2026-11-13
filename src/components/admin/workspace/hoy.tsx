"use client";
import { FirstDay } from "./first-day";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Plus } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Card, Pill, Surface, Thumb, type PillTone } from "@/components/admin/kit";
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
import s from "./hoy.module.css";

/*
  Hoy en tres bloques (SIM-16, 11/11/2026; conserva las reglas de LV-07 y LV-08):
  1. «Lo siguiente»: la portada con lo más urgente y, debajo, una sola cola con todo lo demás que
     espera algo del usuario (operaciones, contactos, prospectos nuevos, entrevistas, contratos,
     informes, llaves y avisos), de lo más urgente a lo menos. Las 4 siguientes con foto, después
     una lista corta y «Ver las N» para el resto. Cada tipo se distingue por su pastilla.
  2. «Hoy»: las citas y las tareas del día en una sola tarjeta; las tareas se marcan aquí.
  3. «Esta semana»: los siete días que siguen.
  Sin inventario (las operaciones en curso viven en Operaciones) y sin línea de resumen: nada se
  cuenta dos veces. Todo se calcula con datos que el panel ya carga; nada se inventa.
*/

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const PHOTO_CARDS = 4, LIST_ROWS = 6, TASK_ROWS = 5;
/** Tono de la pastilla por tipo; lo vencido siempre en rojo. */
function queuePill(item: QueueItem): { text: string; tone: PillTone } {
  if (item.late) return { text: item.kind === "seguimiento" ? "Atrasado" : QUEUE_LABEL[item.kind], tone: "alert" };
  const tone: PillTone = item.kind === "revisar" || item.kind === "entrevista" || item.kind === "nuevo" ? "brand" : item.kind === "decidir" || item.kind === "contrato" || item.kind === "licencia" || item.kind === "informe" ? "warn" : item.kind === "agendar" ? "muted" : "info";
  return { text: QUEUE_LABEL[item.kind], tone };
}

function Section({ title, count, action, children, id, className }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode; id: string; className?: string }) {
  return <section aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-3", className)}>
    <div className="flex items-baseline justify-between gap-3 px-1">
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
    ...events.filter(e => e.fecha === day).map(e => ({ id: `evento:${e.id}`, text: `${e.hora ? `${e.hora} · ` : ""}${e.titulo}`, href: `/admin/agenda?fecha=${day}&evento=${encodeURIComponent(e.id)}`, visit: e.tipo === "visita" })),
    ...upcoming.filter(item => item.date === day).map(item => ({ id: item.id, text: item.text, href: item.href, visit: false })),
    ...expiring.filter(item => item.date === day).map(item => ({ id: item.id, text: item.kind === "Contrato" ? "Vence el contrato de servicio" : "Vence la licencia estatal", href: item.href, visit: false })),
  ];
  const weekCount = week.reduce((sum, day) => sum + weekItems(day).length, 0);
  // La portada no se repite abajo; con foto del inmueble van en tarjeta, las personas sin foto en la lista (C34).
  const rest = queue.slice(1);
  const withPhoto = (item: QueueItem) => !!item.propertySlug && !!photo(item.propertySlug);
  const photoCards = rest.filter(withPhoto).slice(0, PHOTO_CARDS);
  const listAll = rest.filter(item => !photoCards.includes(item));
  const listRows = showAll ? listAll : listAll.slice(0, LIST_ROWS);
  const hidden = listAll.length - listRows.length;
  const failures = [dossiers === null && "las operaciones", interviews === null && "las entrevistas", contracts === null && "los contratos de servicio", reports === null && "los informes al propietario"].filter((x): x is string => !!x);
  // COR-14: la situación y la condición de la llamada, como chip en cada operación.
  const tagsOf = (item: QueueItem) => { const d = item.folio ? dossiers?.find(x => x.folio === item.folio) : undefined; return d ? operationTags(d, conditions.ofOperation(d.id)) : []; };
  // COR-21: un prospecto nuevo del sitio se marca como atendido desde aquí, sin abrir su ficha.
  const leadOf = (item: QueueItem) => item.leadId ? leads.find(l => l.id === item.leadId) : undefined;
  const nextLead = next ? leadOf(next) : undefined;
  const thumb = (item: QueueItem, size: number) => item.folio || item.propertySlug ? <Thumb src={photo(item.propertySlug)} size={size} icon={<Building2 size={size > 44 ? 24 : 20} aria-hidden="true" />} /> : <Avatar name={item.who} size={size} />;

  return <Surface className={s.page}>
    {/* Bloque 1, «Lo siguiente»: saludo, portada y la cola; la región lleva el título oculto porque la portada ya lo dice. */}
    <section aria-labelledby="hoy-cola" className={s.queueBox}>
      <h2 id="hoy-cola" className="sr-only">Lo siguiente</h2>
      <header className={s.top}>
        <p className={s.date}><time dateTime={today}>{longDate(today)}</time></p>
        <h1 className={s.hello}>{hour === null ? "Hola" : greeting(hour)}{firstName ? `, ${firstName}` : ""}.</h1>
      </header>
      <SectionBoundary what="«Preparar tu espacio»"><SetupChecklist className={s.full} /></SectionBoundary>
      <SectionBoundary what="«Tu primer día»"><FirstDay operations={dossiers} className={s.full} /></SectionBoundary>

      <div data-tour="hoy-siguiente" className={cn(s.next, next && photo(next.propertySlug) && s.nextWithPhoto)}>
        {dossiers === undefined ? <p role="status" className={s.nextNote}>Consultando operaciones…</p>
          : next ? <Link href={next.href} className={s.nextLink} aria-label={`Lo siguiente: ${next.text} ${next.who}`}>
            {photo(next.propertySlug) && <Image unoptimized fill sizes="(max-width: 899px) 100vw, 60vw" src={photo(next.propertySlug)!} alt="" className={s.nextPhoto} />}
            <span className={s.nextScrim} aria-hidden="true" />
            <span className={s.nextBody}>
              <span className={s.nextTags}>{next.late && <Pill tone="alert">{next.when || QUEUE_LABEL[next.kind]}</Pill>}<Pill tone="onDark">{next.late && next.kind !== "vencida" ? QUEUE_LABEL[next.kind] : "Lo siguiente"}</Pill>{tagsOf(next).map(tag => <Pill key={tag} tone="onDark">{tag}</Pill>)}</span>
              <strong className={s.nextTitle}>{next.text}</strong>
              <span className={s.nextFoot}><span className={s.nextWho}>{next.who}{next.detail ? ` · ${next.detail}` : ""}</span><span className={s.nextGo}>Continuar<ArrowRight size={18} aria-hidden="true" /></span></span>
            </span>
          </Link>
          : <div className={s.nextEmpty}><strong className={s.nextTitle}>Nada espera por ti.</strong><span className={s.nextWho}>{inProgress.length ? "Cada operación tiene su siguiente paso con fecha." : "Empieza con la entrevista del propietario: la operación se crea al terminarla."}</span>{!inProgress.length && <ButtonLink href="/admin/operaciones/nueva" variant="primary" className="mt-2 self-start">Nueva operación</ButtonLink>}</div>}
      </div>

      {nextLead && <div className={cn(s.contactLine, s.full)}>
        <span className={s.meta}>¿Ya hablaste con {nextLead.nombre}?</span>
        <FirstContactButton lead={nextLead} />
      </div>}
      {failures.map(what => <div key={what} className={s.full}>{failed(what)}</div>)}
      {dossiers !== undefined && rest.length > 0 && <div className={cn(s.queueHead, s.full)}>
        <span className={s.meta}>{plural(queue.length, "pendiente en total", "pendientes en total")}</span>
        {hidden > 0 && <Button variant="ghost" className={s.more} onClick={() => setShowAll(true)}>{hidden === 1 ? "Ver 1 más" : `Ver ${hidden} más`}</Button>}
      </div>}
      {dossiers !== undefined && rest.length > 0 && <>
        {photoCards.length > 0 && <ul className={cn(s.cards, s.full)}>{photoCards.map(item => {
          const pill = queuePill(item);
          return <li key={item.id}><article className={s.photoCard}><Link href={item.href} className={s.photoLink} aria-label={`Continuar con ${item.who}`}>
            <span className={s.cardPhoto}><Image unoptimized fill sizes="(max-width: 899px) 50vw, 25vw" src={photo(item.propertySlug)!} alt="" /></span>
            <span className={s.cardBody}>
              <span className={s.cardTags}>{item.kind !== "vencida" && <Pill tone={pill.tone} size="sm">{pill.text}</Pill>}{tagsOf(item).map(tag => <Pill key={tag} tone="warn" size="sm">{tag}</Pill>)}{item.when && <span className={cn(s.meta, item.late && s.lateText)}>{item.when}</span>}</span>
              <strong className={s.cardWho}>{item.who}</strong>
              <span className={s.cardText}>{item.text}{item.detail ? ` · ${item.detail}` : ""}</span>
            </span>
          </Link></article></li>;
        })}</ul>}
        {listRows.length > 0 && <Card as="ul" className={cn(s.list, s.full)} aria-label="Más pendientes">{listRows.map(item => {
          const pill = queuePill(item);
          const lead = leadOf(item);
          return <li key={item.id}><article className={cn(lead && s.rowWithAction)}><Link href={item.href} className={s.row} aria-label={`Continuar con ${item.who}`}>
            {thumb(item, 44)}
            <span className={s.rowBody}><span className={s.rowTitle}>{item.who}</span><span className={s.rowText}>{item.text}{item.detail ? ` · ${item.detail}` : ""}</span></span>
            <span className={s.rowEnd}>{tagsOf(item).map(tag => <Pill key={tag} tone="warn" size="sm">{tag}</Pill>)}{item.kind !== "vencida" && <Pill tone={pill.tone} size="sm">{pill.text}</Pill>}{item.when && <span className={cn(s.meta, item.late && s.lateText)}>{item.when}</span>}</span>
          </Link>{lead && <FirstContactButton lead={lead} className={s.rowAction} />}</article></li>;
        })}</Card>}
      </>}
      {dossiers !== undefined && next && rest.length === 0 && <p className={cn(s.note, s.full)}>Nada más espera por ti.</p>}
    </section>

    <TodayBlock tasks={dayTasks} agenda={agenda} today={today} nextEvent={nextEvent} names={names} leads={leads} photo={photo} />

    <Section id="hoy-semana" title="Esta semana" className={s.weekBox} action={<span className={s.meta}>{weekCount ? plural(weekCount, "pendiente", "pendientes") : "Nada vence"}</span>}>
      <Card as="ul" className={s.week} aria-label="Esta semana, por día">{week.map(day => {
        const items = weekItems(day), shown = items.slice(0, 2);
        return <li key={day} className={s.day} data-busy={items.length > 0 || undefined}>
          <span className={s.dayName}>{weekdayDate(day).slice(0, 3)}</span>
          <span className={s.dayNum}>{Number(day.slice(8))}</span>
          <ul className={s.dayItems}>{shown.map(item => <li key={item.id}><Link href={item.href} className={cn(s.dayItem, item.visit && s.dayVisit)}>{item.text}</Link></li>)}
            {items.length > shown.length && <li className={s.dayMore}>+{items.length - shown.length}</li>}</ul>
        </li>;
      })}</Card>
    </Section>
  </Surface>;
}

/** «Hoy»: citas y tareas del día en una sola tarjeta; las tareas se marcan aquí. */
function TodayBlock({ tasks, agenda, today, nextEvent, names, leads, photo }: {
  tasks: Task[]; agenda: Evento[]; today: string; nextEvent?: Evento; names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined };
  leads: Array<{ id: string; nombre: string }>; photo: (slug?: string | null) => string | undefined;
}) {
  const [saving, setSaving] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const open = tasks.filter(isTaskOpen), done = tasks.length - open.length;
  const shown = tasks.slice(0, TASK_ROWS);
  async function toggle(task: Task) {
    setSaving(task.id); setMessage("");
    try {
      await upsert(db.tareas, { ...task, estado: isTaskOpen(task) ? "completada" : "pendiente" }, db.tareas.version(task));
      setMessage("Guardado");
    } catch (error) {
      setMessage(`No se pudo guardar: ${error instanceof Error ? error.message : "intenta de nuevo"}`);
    } finally { setSaving(null); }
  }
  const empty = !agenda.length && !tasks.length;
  return <Section id="hoy-hoy" title="Hoy" count={agenda.length + open.length || undefined} className={s.todayBox} action={more("/admin/agenda", "Ver semana")}>
    <Card as="div" className={cn(s.list, s.todayCard)}>
      {empty ? <div className={s.agendaEmpty}>
        <p className={s.note}>Sin citas ni tareas hoy</p>
        {nextEvent && <Link href={`/admin/agenda?fecha=${nextEvent.fecha}&evento=${encodeURIComponent(nextEvent.id)}`} className={s.nextEvent}>
          <Thumb src={photo(nextEvent.propiedadSlug)} size={56} icon={<Building2 size={22} aria-hidden="true" />} />
          <span className="flex min-w-0 flex-col gap-0.5"><small className="text-muted-foreground">La siguiente: {weekdayDate(nextEvent.fecha)}{nextEvent.hora ? ` · ${nextEvent.hora}` : ""}{nextEvent.tipo === "visita" ? " · Visita" : ""}</small><strong className="[overflow-wrap:anywhere]">{nextEvent.titulo}</strong></span>
        </Link>}
      </div> : <>
        {agenda.length > 0 && <ul className={cn(s.agenda, !tasks.length && s.full)} aria-label="Citas de hoy">{agenda.map(event => {
          const visit = event.tipo === "visita";
          const context = [names.client(event.clienteId) ?? leads.find(l => l.id === event.leadId)?.nombre, names.property(event.propiedadSlug)].filter(text => text && text !== event.titulo).join(" · ");
          return <li key={event.id} className="contents"><Link href={`/admin/agenda?fecha=${today}&evento=${encodeURIComponent(event.id)}`} className={cn(s.event, visit && s.visit)}>
            <time className={s.time}>{event.hora ?? "—"}</time>
            <span className="flex min-w-0 flex-col gap-0.5">{visit && <span className={s.visitTag}><MapPin size={12} aria-hidden="true" />Visita</span>}<strong className="[overflow-wrap:anywhere]">{event.titulo}</strong>{context && <small className="text-muted-foreground">{visit ? `Con ${context}` : context}</small>}</span>
          </Link></li>;
        })}</ul>}
        {tasks.length > 0 && <div className={cn(s.tasks, agenda.length > 0 ? s.tasksAfterAgenda : s.full)}>
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
    </Card>
    {message && <p role="status" className={cn("px-1 text-sm", message.startsWith("No se pudo") ? "text-destructive" : "text-muted-foreground")}>{message}</p>}
  </Section>;
}
