"use client";
import { UndoNotice } from "@/components/admin/workspace/undo-notice";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Building2, Check, Plus } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Surface, Swap, Thumb } from "@/components/admin/kit";
import { db, useCollection, useSession, type Evento } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { greeting as greetingFor, longDate, shortDate, todayTasks, upcomingItems, weekDays, weekdayDate, type QueueItem, type TodayDossier } from "@/lib/admin/today";
import { operationTags, stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { stageIcon } from "@/components/admin/icons";
import { useConditions } from "@/lib/admin/conditions";
import { cn } from "@/lib/utils";
import { SectionBoundary } from "@/components/admin/section-boundary";
import { useTodayQueue } from "@/components/admin/workspace/use-today-queue";
import { FirstContactButton } from "@/components/admin/workspace/first-contact";
import { NewMenu } from "@/components/admin/workspace/guided-nav";
import { NextStepPrompt } from "@/components/admin/contacts/next-step-prompt";
import { Announcements } from "@/components/admin/workspace/announcements";
import { AsuntoAvisos } from "@/components/admin/workspace/asunto-avisos";
import { Inbox } from "@/components/admin/workspace/inbox";
import { useTaskDone, type TaskDone } from "@/components/admin/workspace/hoy/use-task-done";
import { actionOf, QueueList, TaskCheck, type RowHelpers } from "@/components/admin/workspace/hoy/queue-list";
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

const noSubscribe = () => () => undefined;
const greetingNow = () => greetingFor(new Date().getHours());
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/*
  Reglas de volumen de Hoy (29/10/2026): con foto solo los 4 más urgentes («Lo siguiente» y 3 filas);
  después, hasta 10 en total en lista compacta sin foto, y al final «Ver los N asuntos» (y, si quedan prospectos o seguimientos fuera, «Ver a las N personas por atender»). Tareas y citas, 5.
*/
const PHOTO_ROWS = 3, LIST_ROWS = 10, TASK_ROWS = 5, AGENDA_ROWS = 5;
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
/** El asunto al que lleva un pendiente (no cuenta «Nuevo asunto» desde una entrevista). */
const asuntoOf = (item: QueueItem) => /^\/admin\/operaciones\/(?!nueva\b)([^/?#]+)/.exec(item.href)?.[1];
/** Prospecto nuevo o seguimiento de contacto: se revisan en Personas. */
const isPersonItem = (item: QueueItem) => item.kind === "nuevo" || item.kind === "seguimiento";
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
  // Un solo cálculo para palomear en la portada, en las filas y en la agenda (un aviso a la vez).
  const done = useTaskDone();
  const firstName = (useSession()?.name ?? "").trim().split(/\s+/)[0];
  // El saludo usa la hora del navegador, no la del servidor.
  const greeting = React.useSyncExternalStore(noSubscribe, greetingNow, () => "Hola");
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
  const failures = [dossiers === null && "los asuntos", interviews === null && "las entrevistas", contracts === null && "los contratos de servicio", reports === null && "los informes al propietario"].filter((x): x is string => !!x);
  // COR-14: la situación y la condición de la llamada, en texto junto a la operación.
  const tagsOf = (item: QueueItem) => { const d = item.folio ? dossiers?.find(x => x.folio === item.folio) : undefined; return d ? operationTags(d, conditions.ofOperation(d.id)) : []; };
  // COR-21: un prospecto nuevo del sitio se marca como atendido desde aquí, sin abrir su ficha.
  const leadOf = (item: QueueItem) => item.leadId ? leads.find(l => l.id === item.leadId) : undefined;

  // «Lo siguiente» va primero en su grupo; lo demás, agrupado por persona (13/11/2026).
  const rest = queue.slice(1);
  const groups = byPerson(rest);
  const lateGroups = groups.filter(group => group[0].late), otherGroups = groups.filter(group => !group[0].late);
  // Vencido primero; entre los dos grupos, a lo más LIST_ROWS filas contando «Lo siguiente».
  const room = LIST_ROWS - 1;
  const lateShown = lateGroups.slice(0, room);
  const otherShown = otherGroups.slice(0, Math.max(0, room - lateShown.length));
  // Lo que no cabe se revisa donde vive, y el enlace cuenta lo que se va a encontrar ahí: asuntos en
  // Asuntos y personas por atender en Personas (no los pendientes de Hoy, que incluyen las dos cosas).
  const hiddenItems = [...lateGroups.slice(lateShown.length), ...otherGroups.slice(otherShown.length)].flat();
  const asuntosTotal = new Set(queue.map(asuntoOf).filter(Boolean)).size;
  const peopleTotal = new Set(queue.filter(isPersonItem).map(item => item.who)).size;
  const moreAsuntos = hiddenItems.some(item => asuntoOf(item)), morePeople = hiddenItems.some(isPersonItem);
  // Los números cuentan pendientes, no filas, y cada uno por lo que es: una fila de «3 pendientes» que
  // empieza con algo vencido no vuelve vencidos a los otros dos. Así cuadran con «N pendientes» y el menú.
  const lateTotal = queue.filter(item => item.late).length, todayTotal = queue.length - lateTotal;
  // Las 3 primeras filas visibles (las más urgentes después de «Lo siguiente») van con foto o cara.
  const latePhotos = Math.min(PHOTO_ROWS, lateShown.length), otherPhotos = Math.max(0, PHOTO_ROWS - latePhotos);

  // DEC-51: cada pendiente con la foto de su inmueble o, si no tiene, con la cara de la persona.
  const slugOf = (item: QueueItem) => item.propertySlug ?? (item.folio ? dossiers?.find(x => x.folio === item.folio)?.propiedad_slug : undefined);
  const personOf = (item: QueueItem) => item.who.split(" · ")[0].trim() || item.who;
  const taskOf = (item: QueueItem) => item.taskId ? tasks.find(t => t.id === item.taskId) : undefined;
  const helpers: RowHelpers = {
    media: item => { const slug = slugOf(item); return slug ? <Thumb src={photo(slug)} size={44} className={s.media} /> : <Avatar name={personOf(item)} size={40} />; },
    tagsOf, leadOf, taskOf, done,
  };
  // «Lo siguiente» en grande (DEC-51): foto del inmueble, qué hacer y, si es una tarea, «Ya lo hice» con deshacer.
  const nextTask = next ? taskOf(next) : undefined;
  const nextSlug = next ? slugOf(next) : undefined;
  const nextLead = next ? leadOf(next) : undefined;
  const nextBlock = next && <section aria-labelledby="hoy-cola" className={s.nextSection}>
    <Swap as="article" id={next.id} className={s.hero}>
      <span className={s.heroMedia}>{nextSlug ? <Thumb src={photo(nextSlug)} ratio="4 / 3" className={s.heroThumb} /> : <span className={s.heroFace}><Avatar name={personOf(next)} size={72} onDark /></span>}</span>
      <div className={s.heroBody}>
        <div className={s.heroLabel}>{next.late ? <AlertTriangle size={16} aria-hidden="true" /> : null}<h3 id="hoy-cola" className={s.heroH3}>Lo siguiente</h3>{next.when ? <><span aria-hidden="true">·</span><span>{next.when}</span></> : null}</div>
        <Link href={next.href} className={s.heroLink} aria-label={`Lo siguiente: ${next.text} ${next.who}`}>
          <span className={s.heroTitle}>{next.text}</span>
          <span className={s.heroText}>{next.who}{next.detail ? ` · ${next.detail}` : ""}{tagsOf(next).map(tag => ` · ${tag}`)}</span>
        </Link>
        <div className={s.heroActions}>
          {nextTask && isTaskOpen(nextTask) && <Button variant="primary" disabled={done.saving === nextTask.id} onClick={() => void done.toggle(nextTask)} aria-label={`Ya lo hice: ${nextTask.titulo}`}><Check size={18} aria-hidden="true" />Ya lo hice</Button>}
          {nextLead ? <FirstContactButton lead={nextLead} className={s.heroSecondary} />
            : <ButtonLink href={next.href} variant={nextTask ? "secondary" : "primary"} className={nextTask ? s.heroSecondary : undefined}>{actionOf(next)}</ButtonLink>}
        </div>
      </div>
    </Swap>
    {rest.length === 0 && <p className={s.note}>Nada más espera por ti.</p>}
  </section>;

  // El hallazgo del día en una frase: lo vencido primero; nada se cuenta dos veces.
  const todayCount = todayTotal + agenda.length + dayTasks.filter(isTaskOpen).length;
  const oldest = next?.late ? next.when : undefined;
  const finding = dossiers === undefined ? "Consultando tu día…"
    : <>{lateTotal > 0 ? <>Tienes <b className={s.lateText}>{plural(lateTotal, "cosa vencida", "cosas vencidas")}</b> y </> : "No tienes nada vencido; "}
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
          {/* El título de la pantalla sigue siendo «Hoy» para el lector de pantalla; a la vista va el saludo. */}
          <h1 className="sr-only">Hoy</h1>
          <p className={s.helloTitle} aria-hidden="true">{greeting}{firstName ? `, ${firstName}` : ""}</p>
          <p className={s.finding}>{finding}</p>
        </div>
        <div className={s.titleAction}><NewMenu /></div>
      </div>
    </header>

    <div className={s.main}>
      <div className={s.notices}>
        <SectionBoundary what="«Avisos»"><Announcements /></SectionBoundary>
        <SectionBoundary what="«Para ti»"><Inbox /></SectionBoundary>
        <SectionBoundary what="«Avisos de tus asuntos»"><AsuntoAvisos /></SectionBoundary>
      </div>

      <section aria-labelledby="hoy-dia" className={cn(s.panel, s.nextBox)} onClickCapture={done.guardClick}>
        <div className={s.head}><h2 id="hoy-dia" className={s.title}>Tu día</h2><span className={s.meta}>{dossiers !== undefined && queue.length > 0 ? `${plural(queue.length, "pendiente", "pendientes")} · ` : ""}{longDate(today).toLocaleLowerCase("es-MX")}</span></div>
        {failures.map(what => <div key={what}>{failed(what)}</div>)}
        {dossiers === undefined ? <p role="status" className={s.note}>Consultando asuntos…</p>
          : !next ? <section aria-labelledby="hoy-cola" className={s.empty}>
            <h3 id="hoy-cola" className="sr-only">Lo siguiente</h3>
            <strong className={s.emptyTitle}>Nada espera por ti.</strong>
            <span className={s.rowText}>{inProgress.length ? "Cada asunto tiene su siguiente paso con fecha." : "Empieza con la entrevista del propietario: el asunto se crea al terminarla."}</span>
            {!inProgress.length && <ButtonLink href="/admin/operaciones/nueva" variant="primary" className="mt-2 self-start">Nuevo asunto</ButtonLink>}
          </section>
          : <>
            {lateTotal > 0 && <>
              <h3 className={cn(s.group, s.groupLate)}>Vencido <span>{lateTotal}</span></h3>
              {next.late && nextBlock}
              <QueueList groups={lateShown} photos={latePhotos} label="Pendientes vencidos" helpers={helpers} />
            </>}
            {todayTotal > 0 && (otherShown.length > 0 || !next.late) && <>
              <h3 className={s.group}>Hoy <span>{todayTotal}</span></h3>
              {!next.late && nextBlock}
              <QueueList groups={otherShown} photos={otherPhotos} label="Más pendientes" helpers={helpers} />
            </>}
            {/* Hoy no crece con el volumen: el resto se revisa en Asuntos, que pone arriba lo vencido y tiene filtros. */}
            {(moreAsuntos || morePeople) && <div className={s.moreLinks}>
              {moreAsuntos && <ButtonLink href="/admin/operaciones" variant="ghost" className={s.more}>{asuntosTotal === 1 ? "Ver el asunto" : `Ver los ${asuntosTotal} asuntos`}</ButtonLink>}
              {morePeople && <ButtonLink href="/admin/personas" variant="ghost" className={s.more}>{peopleTotal === 1 ? "Ver a la persona por atender" : `Ver a las ${peopleTotal} personas por atender`}</ButtonLink>}
            </div>}
          </>}
        {done.from === "dia" && <DoneMessage done={done} />}
      </section>
    </div>

    <div className={s.side}>
      <TodayBlock tasks={dayTasks} agenda={agenda} today={today} nextEvent={nextEvent} names={names} leads={leads} photo={photo} done={done} />

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

    <UndoNotice {...done.undo} onError={done.setMessage} />
    {done.ask && <NextStepPrompt key={done.ask.id} person={done.ask} today={today} name={done.ask.kind === "lead" ? leads.find(l => l.id === done.ask!.id)?.nombre : names.client(done.ask.kind === "operacion" ? done.ask.clienteId : done.ask.id)} onClose={done.closeAsk} />}

    {stageNames.length === 10 && <section aria-labelledby="hoy-cartera" className={cn(s.panel, s.cartera)}>
      <div className={s.head}><h2 id="hoy-cartera" className={s.title}>Tu cartera por etapa</h2><span className={s.meta}>{plural(inProgress.length, "asunto", "asuntos")} · {plural(prospects, "prospecto", "prospectos")}</span></div>
      <ol className={s.pipe} aria-label="Asuntos por etapa">{stageNames.map((stage, i) => {
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

/** El resultado de palomear: «Guardado» o el motivo del error, junto al bloque donde se hizo. */
function DoneMessage({ done }: { done: TaskDone }) {
  if (!done.message) return null;
  const failed = done.message.startsWith("No se pudo");
  return <p role={failed ? "alert" : "status"} className={cn("text-sm", failed ? "text-destructive" : "text-muted-foreground")}>{done.message}</p>;
}

/** «Agenda de hoy»: citas como línea de tiempo con la raya de «Ahora» y, debajo, las tareas del día, que se marcan aquí. */
function TodayBlock({ tasks, agenda, today, nextEvent, names, leads, photo, done: completer }: {
  tasks: Task[]; agenda: Evento[]; today: string; nextEvent?: Evento; names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined };
  leads: Array<{ id: string; nombre: string }>; photo: (slug?: string | null) => string | undefined; done: TaskDone;
}) {
  const [now, setNow] = React.useState<string | null>(null);
  React.useEffect(() => {
    // La hora se toma en el navegador para no dibujar «Ahora» con la hora del servidor.
    const tick = () => { const d = new Date(); setNow(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`); };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const open = tasks.filter(isTaskOpen), finished = tasks.length - open.length;
  const shown = tasks.slice(0, TASK_ROWS);
  const empty = !agenda.length && !tasks.length;
  // La raya de «Ahora» va después de la última cita que ya empezó.
  const nowAt = now === null ? -1 : agenda.filter(event => (event.hora ?? "99") <= now).length;
  const nowLine = <li key="ahora" className={s.nowRow} aria-hidden="true"><span className={s.nowTime}>Ahora</span><span className={s.nowLine} /></li>;
  return <Section id="hoy-hoy" title="Agenda de hoy" count={agenda.length + open.length || undefined} className={s.todayBox} action={more("/admin/agenda", "Ver semana")}>
    <div className={s.todayCard} onClickCapture={completer.guardClick}>
      {empty ? <div className={s.agendaEmpty}>
        <p className={s.note}>Sin citas ni tareas hoy</p>
        {nextEvent && <Link href={`/admin/agenda?fecha=${nextEvent.fecha}&evento=${encodeURIComponent(nextEvent.id)}`} className={s.nextEvent}>
          <Thumb src={photo(nextEvent.propiedadSlug)} size={56} icon={<Building2 size={22} aria-hidden="true" />} />
          <span className="flex min-w-0 flex-col gap-0.5"><small className="text-muted-foreground">La siguiente: {weekdayDate(nextEvent.fecha)}{nextEvent.hora ? ` · ${nextEvent.hora}` : ""}{nextEvent.tipo === "visita" ? " · Visita" : ""}</small><strong className="[overflow-wrap:anywhere]">{nextEvent.titulo}</strong></span>
        </Link>}
      </div> : <>
        {agenda.length > 0 && <ul className={s.agenda} aria-label="Citas de hoy">{agenda.slice(0, AGENDA_ROWS).flatMap((event, i) => {
          const visit = event.tipo === "visita";
          const context = [names.client(event.clienteId) ?? leads.find(l => l.id === event.leadId)?.nombre, names.property(event.propiedadSlug)].filter(text => text && text !== event.titulo).join(" · ");
          const item = <li key={event.id} className="contents"><Link href={`/admin/agenda?fecha=${today}&evento=${encodeURIComponent(event.id)}`} className={cn(s.event, visit && s.visit)}>
            <time className={s.time}>{event.hora ?? "—"}</time>
            <span className="flex min-w-0 flex-col gap-0.5"><strong className={s.eventTitle}>{event.titulo}</strong>{(visit || context) && <small className={s.dayMeta}>{visit ? ["Visita", context].filter(Boolean).join(" · ") : context}</small>}</span>
          </Link></li>;
          return i === nowAt ? [nowLine, item] : [item];
        }).concat(nowAt === Math.min(agenda.length, AGENDA_ROWS) ? [nowLine] : [])}</ul>}
        {agenda.length > AGENDA_ROWS && <span className={s.moreRow}>{more(`/admin/agenda?fecha=${today}`, `Ver las ${agenda.length} citas`)}</span>}
        {tasks.length > 0 && <div className={cn(s.tasks, agenda.length > 0 && s.tasksAfterAgenda)}>
          <p className={s.tasksHead}><span>Tareas</span><span className={s.meta}>{finished} de {tasks.length} hechas</span></p>
          <ul className="flex flex-col" aria-label="Tareas de hoy">{shown.map(task => {
            const isOpen = isTaskOpen(task);
            return <li key={task.id} className={s.task}>
              <TaskCheck task={task} done={completer} where="agenda" className={s.taskCheck} />
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
    {completer.from === "agenda" && <DoneMessage done={completer} />}
  </Section>;
}
