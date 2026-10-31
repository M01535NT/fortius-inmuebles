"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Plus } from "@/components/admin/icons";
import { lastNotice, pendingNotices, priceDroppedSince, seekersFrom } from "@/lib/admin/buyer-matches";
import { keyDueDate, keyLoanLate, openKeyLoans } from "@/lib/propiedad-seguimiento";
import { Avatar, ButtonLink, Card, EmptyBox, Pill, Surface, Thumb, type PillTone } from "@/components/admin/kit";
import { apiRequest, db, upsert, useCollection, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen, type Task } from "@/lib/tasks";
import type { OperationalInterview } from "@/lib/intake/interview";
import { expiryItems, greeting, interviewSummary, longDate, overdueReports, shortDate, stageCounts, todayTasks, upcomingItems, waitingItems, weekDays, weekdayDate, type ContractDates, type OfferRun, type TodayDossier, type WaitingItem } from "@/lib/admin/today";
import { initialStatus } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { useOperationFormats } from "@/components/admin/operation/use-operation-formats";
import { cn } from "@/lib/utils";
import s from "./hoy.module.css";

/*
  Hoy, versión 2 (LV-07 «Mosaico cálido» con las reglas de LV-08, 30/10/2026). Un saludo corto;
  «Lo siguiente» con la foto del inmueble y el pendiente más urgente; las operaciones en curso
  por etapa; lo vencido; las tareas de hoy (sin repetir las que ya salen como pendiente, C10);
  la agenda; los próximos 7 días; y «Esperan algo de ti» con foto para las 4 más urgentes y el
  resto en lista corta. Todo se calcula con datos que el panel ya carga; nada se inventa.
*/

type Load<T> = T | undefined | null; // undefined: cargando · null: no se pudo consultar
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const active = (d: TodayDossier) => d.etapa !== "cerrado" && d.flujo?.estado !== "descartada";
const PHOTO_CARDS = 4, LIST_ROWS = 6, TASK_ROWS = 5, STAGE_ROWS = 4;
/** Pastilla corta por motivo (rango de WaitingItem): problema, vencida, revisar, oferta, agendar, seguimiento. */
function waitingPill(item: WaitingItem): { text: string; tone: PillTone } {
  if (item.rank === 0) return { text: "Problema", tone: "alert" };
  if (item.rank === 1) return { text: "Vencida", tone: "alert" };
  if (item.rank === 2) return { text: "Revisar", tone: "brand" };
  if (item.rank === 3) return { text: "Decidir", tone: "warn" };
  if (item.rank === 4) return { text: "Agendar", tone: "muted" };
  return { text: item.late ? "Atrasado" : "Seguimiento", tone: item.late ? "alert" : "info" };
}

/** El motivo sin la palabra que ya dice la pastilla o la fecha («Tarea vencida: …» → «…»). */
const reasonText = (item: WaitingItem) => item.rank === 1 ? item.reason.replace(/^Tarea vencida: /, "") : item.reason;

function Section({ title, count, action, children, id, className }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode; id: string; className?: string }) {
  return <section aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-3", className)}>
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h2 id={id} className={s.title}>{title}{!!count && <span className={s.count}>{count}</span>}</h2>
      {action}
    </div>
    {children}
  </section>;
}
const more = (href: string, label: string) => <Link href={href} className={s.more}>{label}</Link>;
const failed = (what: string) => <p role="alert" className={s.note}>No se pudieron consultar {what}. Recarga la página para reintentar.</p>;

export function HoyScreen() {
  const session = useSession();
  const tasks = useCollection(db.tareas), events = useCollection(db.eventos), leads = useCollection(db.leads), clients = useCollection(db.clientes), properties = useCollection(db.propiedades);
  const today = operationalDate();
  const [dossiers, setDossiers] = React.useState<Load<TodayDossier[]>>(undefined);
  const [interviews, setInterviews] = React.useState<Load<OperationalInterview[]>>(undefined);
  const [offers, setOffers] = React.useState<Load<OfferRun[]>>(undefined);
  const [reports, setReports] = React.useState<Load<Record<string, string>>>(undefined);
  const [contracts, setContracts] = React.useState<Load<ContractDates[]>>(undefined);
  const [hour, setHour] = React.useState<number | null>(null);
  React.useEffect(() => {
    let alive = true;
    const settle = <T,>(promise: Promise<T>, set: (value: T | null) => void) => promise.then(value => { if (alive) set(value); }).catch(() => { if (alive) set(null); });
    settle(apiRequest<{ expedientes?: TodayDossier[] }>("/api/admin/expedientes").then(r => r.expedientes ?? []), setDossiers);
    settle(apiRequest<{ entrevistas?: OperationalInterview[] }>("/api/admin/entrevistas").then(r => (r.entrevistas ?? []).filter(i => i.estado === "borrador")), setInterviews);
    settle(apiRequest<{ runs?: OfferRun[] }>("/api/admin/apps/runs?slug=ofertas").then(r => r.runs ?? []), setOffers);
    settle(apiRequest<{ ultimos?: Record<string, string> }>("/api/admin/apps/runs?slug=informe-propietario&vista=ultimo-por-expediente").then(r => r.ultimos ?? {}), setReports);
    settle(apiRequest<{ contratos?: ContractDates[] }>("/api/admin/vencimientos").then(r => r.contratos ?? []), setContracts);
    // La hora se toma en el navegador para no saludar con la hora del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHour(new Date().getHours());
    return () => { alive = false; };
  }, []);

  const names = {
    client: (id?: string) => id ? clients.find(c => c.id === id)?.nombre : undefined,
    property: (slug?: string | null) => slug ? properties.find(p => p.slug === slug)?.titulo : undefined,
  };
  const photo = (slug?: string | null) => slug ? properties.find(p => p.slug === slug)?.galeria[0]?.src : undefined;
  // Misma etapa que Operaciones: documentos de cada operación y su checklist (COR-03).
  const formats = useOperationFormats();
  const staged = (dossiers ?? []).map(d => ({ ...d, inicial: initialStatus(formats.get(d.id), tasks.find(t => t.id === checklistTaskId(d.id))) }));
  const waiting = dossiers === undefined ? [] : waitingItems({ dossiers: staged, tasks, offers: offers ?? null, followups: projectFollowups(leads, clients), names, today });
  const next = waiting[0];
  const lateCount = waiting.filter(item => item.late).length;
  const inProgress = staged.filter(active);
  const stages = stageCounts(staged, today);
  const shownTasks = new Set(waiting.map(item => item.taskId).filter(Boolean));
  const dayTasks = todayTasks(tasks, today).filter(task => !shownTasks.has(task.id));
  const openToday = dayTasks.filter(isTaskOpen).length;
  const agenda = events.filter(e => e.fecha === today).sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99"));
  const visits = agenda.filter(e => e.tipo === "visita");
  const week = weekDays(today);
  const nextEvent = events.filter(e => e.fecha > today && e.fecha <= week[6]).sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? "99").localeCompare(b.hora ?? "99"))[0];
  const upcoming = upcomingItems({ tasks, dossiers: dossiers ?? [], reports, names, today });
  const lateReports = dossiers && reports ? overdueReports({ dossiers, reports, names, today }) : [];
  const expiring = dossiers && contracts ? expiryItems({ contracts, dossiers, names, today }) : [];
  const toDay = (instant: string) => operationalDate(new Date(instant));
  const lateKeys = properties.flatMap(p => openKeyLoans(p.llaves).filter(loan => keyLoanLate(loan, today, toDay)).map(loan => ({ property: p, loan })));
  const notices = pendingNotices(properties, seekersFrom(leads, clients)).slice(0, 5);
  const firstName = session?.name?.trim().split(/\s+/)[0];
  const weekItems = (day: string) => [
    ...events.filter(e => e.fecha === day).map(e => ({ id: `evento:${e.id}`, text: `${e.hora ? `${e.hora} · ` : ""}${e.titulo}`, href: `/admin/agenda?fecha=${day}&evento=${encodeURIComponent(e.id)}`, visit: e.tipo === "visita" })),
    ...upcoming.filter(item => item.date === day).map(item => ({ id: item.id, text: item.text, href: item.href, visit: false })),
    ...expiring.filter(item => item.date === day).map(item => ({ id: item.id, text: item.kind === "Contrato" ? "Vence el contrato de servicio" : "Vence la licencia estatal", href: item.href, visit: false })),
  ];
  const weekCount = week.reduce((sum, day) => sum + weekItems(day).length, 0);
  const summary = dossiers === undefined ? "Consultando tus operaciones…" : `${plural(waiting.length, "pendiente", "pendientes")} · ${plural(openToday, "tarea", "tareas")} · ${plural(visits.length, "visita", "visitas")} hoy`;
  const photoCards = waiting.slice(0, PHOTO_CARDS), listRows = waiting.slice(PHOTO_CARDS, PHOTO_CARDS + LIST_ROWS);

  return <Surface className={s.page}>
    <header className={s.top}>
      <p className={s.date}><time dateTime={today}>{longDate(today)}</time></p>
      <h1 className={s.hello}>{hour === null ? "Hola" : greeting(hour)}{firstName ? `, ${firstName}` : ""}.</h1>
      <p className={s.summary}>{summary}</p>
    </header>

    <section aria-label="Lo siguiente" className={cn(s.next, next && photo(next.propertySlug) && s.nextWithPhoto)}>
      {dossiers === undefined ? <p role="status" className={s.nextNote}>Consultando operaciones…</p>
        : next ? <Link href={next.href} className={s.nextLink} aria-label={`Lo siguiente: ${next.reason} ${next.who}`}>
          {photo(next.propertySlug) && <Image unoptimized fill sizes="(max-width: 899px) 100vw, 60vw" src={photo(next.propertySlug)!} alt="" className={s.nextPhoto} />}
          <span className={s.nextScrim} aria-hidden="true" />
          <span className={s.nextBody}>
            <span className={s.nextTags}>{next.late && <Pill tone="alert">{next.when || "Vencida"}</Pill>}<Pill tone="onDark">Lo siguiente</Pill></span>
            <strong className={s.nextTitle}>{reasonText(next)}</strong>
            <span className={s.nextFoot}><span className={s.nextWho}>{next.who}{next.detail ? ` · ${next.detail}` : ""}</span><span className={s.nextGo}>Continuar<ArrowRight size={18} aria-hidden="true" /></span></span>
          </span>
        </Link>
        : <div className={s.nextEmpty}><strong className={s.nextTitle}>Nada espera por ti.</strong><span className={s.nextWho}>{inProgress.length ? "Cada operación tiene su siguiente paso con fecha." : "Empieza con la entrevista del propietario: la operación se crea al terminarla."}</span>{!inProgress.length && <ButtonLink href="/admin/operaciones/nueva" variant="primary" className="mt-2 self-start">Nueva operación</ButtonLink>}</div>}
    </section>

    <section aria-label="Operaciones en curso" className={s.navy}>
      <div className="flex items-baseline justify-between gap-3"><h2 className={s.navyTitle}>Operaciones en curso</h2>{more("/admin/operaciones", "Ver todas")}</div>
      <p className={s.big}>{dossiers === undefined ? "…" : dossiers === null ? "—" : inProgress.length}</p>
      {dossiers === null ? <p className={s.navyNote}>No se pudieron consultar las operaciones.</p>
        : stages.length > 0 && <ul className={s.bars}>
          {stages.slice(0, STAGE_ROWS).map(stage => <li key={stage.label}><span>{stage.label}</span><span className={s.bar} aria-hidden="true"><span style={{ width: `${Math.round(stage.count / inProgress.length * 100)}%` }} /></span><span>{stage.count}</span></li>)}
          {stages.length > STAGE_ROWS && <li className={s.navyNote}>{plural(stages.slice(STAGE_ROWS).reduce((sum, stage) => sum + stage.count, 0), "más en otra etapa", "más en otras etapas")}</li>}
        </ul>}
    </section>

    <a href="#hoy-esperan" className={s.late} aria-label={`${plural(lateCount, "pendiente vencido o con problema", "pendientes vencidos o con problema")}, ver`}>
      <span className={s.lateTitle}>Vencidas</span>
      <span className={s.big}>{dossiers === undefined ? "…" : lateCount}</span>
      <span className={s.lateGo}>Ver<ArrowRight size={18} aria-hidden="true" /></span>
    </a>

    <TodayTasks tasks={dayTasks} today={today} />

    <Section id="hoy-agenda" title="Agenda de hoy" className={s.agendaBox} action={more("/admin/agenda", "Ver semana")}>
      {agenda.length ? <Card as="ul" className={s.agenda}>{agenda.map(event => {
        const visit = event.tipo === "visita";
        const context = [names.client(event.clienteId) ?? leads.find(l => l.id === event.leadId)?.nombre, names.property(event.propiedadSlug)].filter(text => text && text !== event.titulo).join(" · ");
        return <li key={event.id} className="contents"><Link href={`/admin/agenda?fecha=${today}&evento=${encodeURIComponent(event.id)}`} className={cn(s.event, visit && s.visit)}>
          <time className={s.time}>{event.hora ?? "—"}</time>
          <span className="flex min-w-0 flex-col gap-0.5">{visit && <span className={s.visitTag}><MapPin size={12} aria-hidden="true" />Visita</span>}<strong className="[overflow-wrap:anywhere]">{event.titulo}</strong>{context && <small className="text-muted-foreground">{visit ? `Con ${context}` : context}</small>}</span>
        </Link></li>;
      })}</Card> : <Card as="div" className={s.agendaEmpty}>
        <p className={s.note}>Sin citas hoy</p>
        {nextEvent && <Link href={`/admin/agenda?fecha=${nextEvent.fecha}&evento=${encodeURIComponent(nextEvent.id)}`} className={s.nextEvent}>
          <Thumb src={photo(nextEvent.propiedadSlug)} size={56} icon={<Building2 size={22} aria-hidden="true" />} />
          <span className="flex min-w-0 flex-col gap-0.5"><small className="text-muted-foreground">La siguiente: {weekdayDate(nextEvent.fecha)}{nextEvent.hora ? ` · ${nextEvent.hora}` : ""}{nextEvent.tipo === "visita" ? " · Visita" : ""}</small><strong className="[overflow-wrap:anywhere]">{nextEvent.titulo}</strong></span>
        </Link>}
        <Link href="/admin/agenda?nueva=1" className={s.add}><Plus size={18} aria-hidden="true" />Agendar</Link>
      </Card>}
    </Section>

    <Section id="hoy-proximos" title="Próximos 7 días" className={s.weekBox} action={<span className={s.meta}>{weekCount ? plural(weekCount, "pendiente", "pendientes") : "Nada vence"}</span>}>
      {dossiers === null && failed("los documentos de las operaciones")}
      <Card as="ul" className={s.week} aria-label="Próximos 7 días, por día">{week.map(day => {
        const items = weekItems(day), shown = items.slice(0, 2);
        return <li key={day} className={s.day} data-busy={items.length > 0 || undefined}>
          <span className={s.dayName}>{weekdayDate(day).slice(0, 3)}</span>
          <span className={s.dayNum}>{Number(day.slice(8))}</span>
          <ul className={s.dayItems}>{shown.map(item => <li key={item.id}><Link href={item.href} className={cn(s.dayItem, item.visit && s.dayVisit)}>{item.text}</Link></li>)}
            {items.length > shown.length && <li className={s.dayMore}>+{items.length - shown.length}</li>}</ul>
        </li>;
      })}</Card>
    </Section>

    <Section id="hoy-esperan" title="Esperan algo de ti" count={waiting.length} className={s.waitingBox} action={waiting.length > 0 ? more("/admin/operaciones", waiting.length > PHOTO_CARDS + LIST_ROWS ? `Ver las ${waiting.length}` : "Ver operaciones") : undefined}>
      {dossiers === undefined ? <p className={s.note} role="status">Consultando operaciones…</p>
        : <>
          {dossiers === null && failed("las operaciones")}
          {waiting.length ? <>
            <ul className={s.cards}>{photoCards.map(item => {
              const pill = waitingPill(item), src = item.folio ? photo(item.propertySlug) : undefined;
              return <li key={item.id}><article className={s.photoCard}><Link href={item.href} className={s.photoLink} aria-label={`Continuar con ${item.who}`}>
                <span className={cn(s.cardPhoto, !src && s.cardInitials)}>{src ? <Image unoptimized fill sizes="(max-width: 899px) 50vw, 25vw" src={src} alt="" /> : <span aria-hidden="true">{item.folio ? <Building2 size={32} aria-hidden="true" /> : <Avatar name={item.who} size={56} />}</span>}</span>
                <span className={s.cardBody}>
                  <span className={s.cardTags}>{item.rank !== 1 && <Pill tone={pill.tone} size="sm">{pill.text}</Pill>}{item.when && <span className={cn(s.meta, item.late && s.lateText)}>{item.when}</span>}</span>
                  <strong className={s.cardWho}>{item.who}</strong>
                  <span className={s.cardText}>{reasonText(item)}{item.detail ? ` · ${item.detail}` : ""}</span>
                </span>
              </Link></article></li>;
            })}</ul>
            {listRows.length > 0 && <Card as="ul" className={s.list}>{listRows.map(item => {
              const pill = waitingPill(item);
              return <li key={item.id}><article><Link href={item.href} className={s.row} aria-label={`Continuar con ${item.who}`}>
                {item.folio ? <Thumb src={photo(item.propertySlug)} size={44} icon={<Building2 size={20} aria-hidden="true" />} /> : <Avatar name={item.who} size={44} />}
                <span className={s.rowBody}><span className={s.rowTitle}>{item.who}</span><span className={s.rowText}>{reasonText(item)}{item.detail ? ` · ${item.detail}` : ""}</span></span>
                <span className={s.rowEnd}>{item.rank !== 1 && <Pill tone={pill.tone} size="sm">{pill.text}</Pill>}{item.when && <span className={cn(s.meta, item.late && s.lateText)}>{item.when}</span>}</span>
              </Link></article></li>;
            })}</Card>}
          </> : dossiers !== null && <EmptyBox title="Nada espera por ti">Las operaciones tienen su siguiente paso con fecha y no hay contactos pendientes.</EmptyBox>}
        </>}
    </Section>

    {(interviews === null || !!interviews?.length) && <Section id="hoy-entrevistas" title="Entrevistas por terminar" count={interviews?.length} className={s.half}>
      {interviews === null ? failed("las entrevistas") : <Card as="ul" className={s.list}>{interviews!.map(interview => <li key={interview.id}><Link href={`/admin/operaciones/nueva?entrevista=${encodeURIComponent(interview.id)}`} className={s.row} aria-label={`Seguir la entrevista de ${interview.contacto?.nombre || "contacto sin nombre"}`}>
        <Avatar name={interview.contacto?.nombre || "?"} size={44} />
        <span className={s.rowBody}><span className={s.rowTitle}>{interview.contacto?.nombre || "Contacto sin nombre"}</span><span className={s.rowText}>{interviewSummary(interview)}</span></span>
        <span className={s.rowEnd}><Pill tone="brand">Seguir<ArrowRight size={14} aria-hidden="true" /></Pill></span>
      </Link></li>)}</Card>}
    </Section>}

    {(contracts === null || expiring.length > 0) && <Section id="hoy-contratos" title="Contratos y licencias por vencer" count={expiring.length} className={s.half}>
      {contracts === null ? failed("los contratos de servicio") : <Card as="ul" className={s.list}>{expiring.map(item => <li key={item.id}><Link href={item.href} className={s.row}>
        <span className={cn(s.dayPill, item.late && s.lateText)}>{shortDate(item.date)}</span>
        <span className={s.rowBody}><span className={s.rowTitle}>{item.text}</span><span className={s.rowText}>{item.meta}</span></span>
      </Link></li>)}</Card>}
    </Section>}

    {lateKeys.length > 0 && <Section id="hoy-llaves" title="Llaves sin regresar" count={lateKeys.length} className={s.half}>
      <Card as="ul" className={s.list}>{lateKeys.map(({ property, loan }) => <li key={`${property.slug}:${loan.id}`}><Link href={`/admin/propiedades/${encodeURIComponent(property.slug)}/seguimiento?seccion=llaves`} className={s.row}>
        <Thumb src={property.galeria[0]?.src} size={44} icon={<Building2 size={20} aria-hidden="true" />} />
        <span className={s.rowBody}><span className={s.rowTitle}>Las tiene {loan.persona} desde el {shortDate(toDay(loan.salida))}</span><span className={s.rowText}>{[property.titulo, loan.motivo].filter(Boolean).join(" · ")}</span></span>
        <span className={s.rowEnd}><span className={cn(s.meta, s.lateText)}>Debían volver el {shortDate(keyDueDate(loan, toDay))}</span></span>
      </Link></li>)}</Card>
    </Section>}

    {notices.length > 0 && <Section id="hoy-compradores" title="Compradores por avisar" count={notices.length} className={s.half}>
      <Card as="ul" className={s.list}>{notices.map(({ property, pending }) => <li key={property.slug} className={s.report}>
        <div className="flex min-w-0 flex-1 items-center gap-3"><Thumb src={property.galeria[0]?.src} size={44} icon={<Building2 size={20} aria-hidden="true" />} /><span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{property.titulo}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{pending.some(m => priceDroppedSince(property, lastNotice(property, m.seeker))) ? "Bajó de precio · " : ""}{pending.length === 1 ? `Le puede servir a ${pending[0].seeker.nombre}` : `Le puede servir a ${pending[0].seeker.nombre} y ${pending.length - 1} más`}</small></span></div>
        <ButtonLink href={`/admin/propiedades/${encodeURIComponent(property.slug)}/seguimiento?seccion=compradores`} className="shrink-0 self-start" aria-label={`Avisar a compradores de ${property.titulo}`}>Avisar</ButtonLink>
      </li>)}</Card>
    </Section>}

    {(reports === null || lateReports.length > 0) && <Section id="hoy-informes" title="Informes al propietario vencidos" count={lateReports.length} className={s.half}>
      {reports === null ? failed("los informes al propietario") : <Card as="ul" className={s.list}>{lateReports.map(report => <li key={report.id} className={s.report}>
        <div className="flex min-w-0 flex-1 items-center gap-3"><Avatar name={report.who} size={44} /><span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{report.who}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{report.property}</small><span className={cn(s.meta, s.lateText)}>{report.status}</span></span></div>
        <ButtonLink href={report.href} className="shrink-0 self-start" aria-label={`Preparar informe de ${report.who}`}>Preparar informe</ButtonLink>
      </li>)}</Card>}
    </Section>}
  </Surface>;
}

function TodayTasks({ tasks, today }: { tasks: Task[]; today: string }) {
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
  return <Section id="hoy-tareas" title="Tareas de hoy" className={s.tasksBox} action={tasks.length > TASK_ROWS ? more("/admin/agenda?tab=tareas", `Ver las ${tasks.length}`) : more("/admin/agenda?tab=tareas", "Ver todas")}>
    <Card as="div" className={s.list}>
      {tasks.length > 0 && <p className={cn(s.meta, "px-3 pt-2")}>{done} de {tasks.length} hechas</p>}
      {shown.length ? <ul className="flex flex-col">{shown.map(task => {
        const isOpen = isTaskOpen(task);
        return <li key={task.id} className={s.task}>
          <input type="checkbox" className={s.check} checked={!isOpen} disabled={saving === task.id} onChange={() => void toggle(task)} aria-label={`${isOpen ? "Marcar como hecha" : "Marcar como pendiente"}: ${task.titulo}`} />
          <span className="flex min-w-0 flex-col gap-0.5"><Link href={`/admin/tareas/${encodeURIComponent(task.id)}`} className={cn("[overflow-wrap:anywhere] font-medium", !isOpen && s.doneText)}>{task.titulo}</Link><small className={cn(s.meta, isOpen && task.vence! < today && s.lateText)}>{task.vence === today ? "Hoy" : `Vencida desde el ${shortDate(task.vence!)}`}</small></span>
        </li>;
      })}</ul> : <p className={s.note}>No hay tareas para hoy.</p>}
      <Link href="/admin/agenda?tab=tareas&nueva=1" className={s.add}><Plus size={18} aria-hidden="true" />Agregar tarea</Link>
    </Card>
    {message && <p role="status" className={cn("px-1 text-sm", message.startsWith("No se pudo") ? "text-destructive" : "text-muted-foreground")}>{message}</p>}
  </Section>;
}
