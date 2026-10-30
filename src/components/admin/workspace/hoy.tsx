"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Plus } from "@/components/admin/icons";
import { lastNotice, pendingNotices, priceDroppedSince, seekersFrom } from "@/lib/admin/buyer-matches";
import { keyDueDate, keyLoanLate, openKeyLoans } from "@/lib/propiedad-seguimiento";
import { Avatar, ButtonLink, Card, CardLink, EmptyBox, Pill, Ring, Surface, Thumb, type PillTone } from "@/components/admin/kit";
import { apiRequest, db, upsert, useCollection, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen, type Task } from "@/lib/tasks";
import type { OperationalInterview } from "@/lib/intake/interview";
import { expiryItems, greeting, interviewSummary, longDate, overdueReports, shortDate, todayTasks, upcomingItems, waitingItems, weekdayDate, type ContractDates, type OfferRun, type TodayDossier, type WaitingItem } from "@/lib/admin/today";
import { initialStatus } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { useOperationFormats } from "@/components/admin/operation/use-operation-formats";
import { cn } from "@/lib/utils";
import s from "./hoy.module.css";

/*
  Hoy, tablero del director (bocetos aprobados el 17/10/2026: Main y HoyBandeja). Arriba las
  cifras del día con lo que el sistema ya sabe: operaciones en curso, lo que espera algo de ti,
  tareas, visitas y lo que vence en la semana. Debajo, «Esperan algo de ti» con la foto del
  inmueble, entrevistas por terminar, tareas, agenda y próximos 7 días. Se acomoda al celular.
  Sin cifras inventadas: cobros, metas y tipo de cambio no existen todavía en el sistema.
*/

type Load<T> = T | undefined | null; // undefined: cargando · null: no se pudo consultar
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const active = (d: TodayDossier) => d.etapa !== "cerrado" && d.flujo?.estado !== "descartada";
/** Pastilla corta por motivo (rango de WaitingItem): problema, vencida, revisar, oferta, agendar, seguimiento. */
function waitingPill(item: WaitingItem): { text: string; tone: PillTone } {
  if (item.rank === 0) return { text: "Problema", tone: "alert" };
  if (item.rank === 1) return { text: "Vencida", tone: "alert" };
  if (item.rank === 2) return { text: "Revisar", tone: "brand" };
  if (item.rank === 3) return { text: "Decidir", tone: "warn" };
  if (item.rank === 4) return { text: "Agendar", tone: "muted" };
  return { text: item.late ? "Atrasado" : "Seguimiento", tone: item.late ? "alert" : "info" };
}

function Section({ title, count, action, description, children, id }: { title: string; count?: number; action?: React.ReactNode; description?: string; children: React.ReactNode; id: string }) {
  return <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h2 id={id} className={s.title}>{title}{!!count && <span className={s.count}>{count}</span>}</h2>
      {action}
    </div>
    {description && <p className="-mt-1 px-1 text-sm text-muted-foreground">{description}</p>}
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
  const lateCount = waiting.filter(item => item.late).length;
  const inProgress = (dossiers ?? []).filter(active);
  const waitingOps = new Set(waiting.filter(item => item.folio).map(item => item.id));
  const fine = inProgress.filter(d => !waitingOps.has(d.id)).length;
  const dayTasks = todayTasks(tasks, today);
  const openToday = dayTasks.filter(isTaskOpen).length, doneToday = dayTasks.length - openToday;
  const agenda = events.filter(e => e.fecha === today).sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99"));
  const visits = agenda.filter(e => e.tipo === "visita");
  const upcoming = upcomingItems({ tasks, dossiers: dossiers ?? [], reports, names, today });
  const lateReports = dossiers && reports ? overdueReports({ dossiers, reports, names, today }) : [];
  const expiring = dossiers && contracts ? expiryItems({ contracts, dossiers, names, today }) : [];
  const toDay = (instant: string) => operationalDate(new Date(instant));
  const lateKeys = properties.flatMap(p => openKeyLoans(p.llaves).filter(loan => keyLoanLate(loan, today, toDay)).map(loan => ({ property: p, loan })));
  const notices = pendingNotices(properties, seekersFrom(leads, clients)).slice(0, 5);
  const firstName = session?.name?.trim().split(/\s+/)[0];
  const heroPhoto = [...waiting.map(item => item.propertySlug), ...inProgress.map(d => d.propiedad_slug)].map(photo).find(Boolean);
  const tail = dossiers === undefined ? "Consultando tus operaciones…" : waiting.length ? `${waiting.length === 1 ? "Hay 1 pendiente esperándote." : `Hay ${waiting.length} pendientes esperándote.`}` : "Nada espera por ti.";
  const summary = `${waiting.length ? `${plural(waiting.length, "pendiente espera", "pendientes esperan")} algo de ti` : "Nada espera por ti"}, tienes ${plural(openToday, "tarea", "tareas")} y ${plural(visits.length, "visita", "visitas")} hoy.`;

  return <Surface className="pb-4">
    <header className="flex flex-col gap-1">
      <p className={s.date}><time dateTime={today}>{longDate(today)}</time></p>
      <h1 className={s.hello}>{hour === null ? "Hola" : greeting(hour)}{firstName ? `, ${firstName}` : ""}. <span className={s.helloTail}>{tail}</span></h1>
      <p className="text-muted-foreground">{summary}</p>
    </header>

    <section aria-label="Resumen del día" className={s.summary}>
      <CardLink href="/admin/operaciones" tone="navy" panel className={s.hero}>
        {heroPhoto && <Image unoptimized fill sizes="(max-width: 899px) 100vw, 50vw" src={heroPhoto} alt="" className={s.heroPhoto} />}
        <span className={s.heroScrim} aria-hidden="true" />
        <span className={s.heroTop}><span>Operaciones en curso</span>{inProgress.length > 0 && <Ring value={fine} max={inProgress.length} size={72} stroke={7} label={`${fine} de ${inProgress.length} al día`} trackClass={s.heroRingTrack} valueClass={s.heroRingValue} />}</span>
        <span className={s.heroBody}>
          <span className={s.heroNumber}>{dossiers === undefined ? "…" : dossiers === null ? "—" : inProgress.length}{inProgress.length > 0 && <small> {inProgress.length === 1 ? "operación" : "operaciones"}</small>}</span>
          <span className={s.heroText}>{dossiers === null ? "No se pudieron consultar las operaciones." : inProgress.length === 0 ? "Empieza con la entrevista del propietario: la operación se crea al terminarla." : waitingOps.size ? `${plural(waitingOps.size, "espera", "esperan")} algo de ti · ${fine} al día.` : "Todas al día: cada una tiene su siguiente paso con fecha."}</span>
        </span>
      </CardLink>
      <CardLink href="#hoy-esperan" className={s.stat} data-tone={lateCount ? "alert" : undefined}>
        <span className={s.statLabel}>Esperan algo de ti</span>
        <span className={s.statValue}>{dossiers === undefined ? "…" : waiting.length}</span>
        <span className={s.statText}>{lateCount ? plural(lateCount, "vencido o con problema", "vencidos o con problema") : "Nada vencido"}</span>
      </CardLink>
      <CardLink href="/admin/agenda?tab=tareas" className={s.stat}>
        <span className={s.statLabel}>Tareas de hoy</span>
        <span className={s.statValue}>{openToday}</span>
        {dayTasks.length > 0 ? <span className={s.statBar} aria-hidden="true">{dayTasks.map((task, i) => <span key={task.id} data-on={i < doneToday || undefined} />)}</span> : null}
        <span className={s.statText}>{dayTasks.length ? `${doneToday} ${doneToday === 1 ? "hecha" : "hechas"} de ${dayTasks.length}` : "Sin tareas para hoy"}</span>
      </CardLink>
      <CardLink href="/admin/agenda" className={s.stat}>
        <span className={s.statLabel}>Visitas hoy</span>
        <span className={s.statValue}>{visits.length}</span>
        <span className={s.statText}>{visits[0] ? `${visits[0].hora ?? "Sin hora"} · ${visits[0].titulo}` : agenda.length ? plural(agenda.length, "cita en la agenda", "citas en la agenda") : "Sin citas en la agenda"}</span>
      </CardLink>
      <CardLink href="#hoy-proximos" className={s.stat}>
        <span className={s.statLabel}>Vencen en 7 días</span>
        <span className={s.statValue}>{upcoming.length}</span>
        <span className={s.statText}>{upcoming[0] ? `${weekdayDate(upcoming[0].date)} · ${upcoming[0].text}` : "Nada vence esta semana"}</span>
      </CardLink>
    </section>

    <div className={s.layout}>
      <div className="flex min-w-0 flex-col gap-7">
        <Section id="hoy-esperan" title="Esperan algo de ti" count={waiting.length} action={waiting.length > 0 ? more("/admin/operaciones", "Ver operaciones") : undefined}>
          {dossiers === undefined ? <p className={s.note} role="status">Consultando operaciones…</p>
            : <>
              {dossiers === null && failed("las operaciones")}
              {waiting.length ? <Card as="div" className={s.list}>{waiting.map(item => {
                const pill = waitingPill(item);
                return <article key={item.id}><Link href={item.href} className={s.row} aria-label={`Continuar con ${item.who}`}>
                  {item.folio ? <Thumb src={photo(item.propertySlug)} size={52} icon={<Building2 size={22} aria-hidden="true" />} /> : <Avatar name={item.who} size={52} />}
                  <span className={s.rowBody}>
                    <span className={s.rowTitle}>{item.reason}</span>
                    <span className={s.rowText}>{item.who}{item.detail ? ` · ${item.detail}` : ""}</span>
                  </span>
                  <span className={s.rowEnd}><Pill tone={pill.tone}>{pill.text}</Pill>{item.when && <span className={cn(s.meta, item.late && s.late)}>{item.when}</span>}</span>
                </Link></article>;
              })}</Card>
                : dossiers !== null && <EmptyBox title="Nada espera por ti">Las operaciones tienen su siguiente paso con fecha y no hay contactos pendientes.</EmptyBox>}
            </>}
        </Section>

        {(interviews === null || !!interviews?.length) && <Section id="hoy-entrevistas" title="Entrevistas por terminar" count={interviews?.length}>
          {interviews === null ? failed("las entrevistas") : <Card as="div" className={s.list}>{interviews!.map(interview => <Link key={interview.id} href={`/admin/operaciones/nueva?entrevista=${encodeURIComponent(interview.id)}`} className={s.row} aria-label={`Seguir la entrevista de ${interview.contacto?.nombre || "contacto sin nombre"}`}>
            <Avatar name={interview.contacto?.nombre || "?"} size={52} />
            <span className={s.rowBody}><span className={s.rowTitle}>{interview.contacto?.nombre || "Contacto sin nombre"}</span><span className={s.rowText}>{interviewSummary(interview)}</span></span>
            <span className={s.rowEnd}><Pill tone="brand">Seguir<ArrowRight size={14} aria-hidden="true" /></Pill></span>
          </Link>)}</Card>}
        </Section>}

        <TodayTasks tasks={dayTasks} today={today} />
      </div>

      <div className="flex min-w-0 flex-col gap-7">
        <Section id="hoy-agenda" title="Agenda de hoy" action={more("/admin/agenda", "Ver semana")}>
          {agenda.length ? <Card as="ul" className={s.agenda}>{agenda.map(event => {
            const visit = event.tipo === "visita";
            const context = [names.client(event.clienteId) ?? leads.find(l => l.id === event.leadId)?.nombre, names.property(event.propiedadSlug)].filter(text => text && text !== event.titulo).join(" · ");
            return <li key={event.id} className="contents"><Link href={`/admin/agenda?fecha=${today}&evento=${encodeURIComponent(event.id)}`} className={cn(s.event, visit && s.visit)}>
              <time className={s.time}>{event.hora ?? "—"}</time>
              <span className="flex min-w-0 flex-col gap-0.5">{visit && <span className={s.visitTag}><MapPin size={12} aria-hidden="true" />Visita</span>}<strong className="[overflow-wrap:anywhere]">{event.titulo}</strong>{context && <small className="text-muted-foreground">{visit ? `Con ${context}` : context}</small>}</span>
            </Link></li>;
          })}</Card> : <EmptyBox title="Sin citas hoy">Las visitas y citas del día aparecen aquí.</EmptyBox>}
        </Section>

        <Section id="hoy-proximos" title="Próximos 7 días" action={more("/admin/agenda", "Ver agenda")} description="Tareas y documentos que vencen pronto, antes de que se vuelvan urgentes.">
          {dossiers === null && failed("los documentos de las operaciones")}
          {upcoming.length ? <Card as="div" className={s.list}><ul>{upcoming.map(item => <li key={item.id}><Link href={item.href} className={s.upcoming}>
            <span className={s.day}>{weekdayDate(item.date)}</span>
            <span className="flex min-w-0 flex-col gap-0.5"><span className={s.kind}>{item.kind}</span><strong className="[overflow-wrap:anywhere]">{item.text}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{item.meta}</small></span>
          </Link></li>)}</ul></Card> : <EmptyBox title="Nada vence esta semana" />}
        </Section>

        {(contracts === null || expiring.length > 0) && <Section id="hoy-contratos" title="Contratos y licencias por vencer" count={expiring.length} description="El contrato de servicio avisa 30 días antes y la licencia estatal, 60.">
          {contracts === null ? failed("los contratos de servicio") : <Card as="div" className={s.list}><ul>{expiring.map(item => <li key={item.id}><Link href={item.href} className={s.upcoming}>
            <span className={cn(s.day, item.late && s.late)}>{shortDate(item.date)}</span>
            <span className="flex min-w-0 flex-col gap-0.5"><span className={s.kind}>{item.late ? `${item.kind} vencido` : item.kind}</span><strong className="[overflow-wrap:anywhere]">{item.text}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{item.meta}</small></span>
          </Link></li>)}</ul></Card>}
        </Section>}

        {lateKeys.length > 0 && <Section id="hoy-llaves" title="Llaves sin regresar" count={lateKeys.length} description="Préstamos que ya debían volver a la oficina o al propietario.">
          <Card as="div" className={s.list}><ul>{lateKeys.map(({ property, loan }) => <li key={`${property.slug}:${loan.id}`}><Link href={`/admin/propiedades/${encodeURIComponent(property.slug)}/seguimiento?seccion=llaves`} className={s.upcoming}>
            <span className={cn(s.day, s.late)}>{shortDate(keyDueDate(loan, toDay))}</span>
            <span className="flex min-w-0 flex-col gap-0.5"><span className={s.kind}>Llaves</span><strong className="[overflow-wrap:anywhere]">Las tiene {loan.persona} desde el {shortDate(toDay(loan.salida))}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{[property.titulo, loan.motivo].filter(Boolean).join(" · ")}</small></span>
          </Link></li>)}</ul></Card>
        </Section>}

        {notices.length > 0 && <Section id="hoy-compradores" title="Compradores por avisar" count={notices.length} description="Inmuebles publicados que le pueden servir a alguien que busca.">
          <Card as="div" className={s.list}>{notices.map(({ property, pending }) => <article key={property.slug} className={s.report}>
            <div className="flex min-w-0 flex-1 items-center gap-3"><Thumb src={property.galeria[0]?.src} size={40} icon={<Building2 size={18} aria-hidden="true" />} /><span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{property.titulo}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{pending.some(m => priceDroppedSince(property, lastNotice(property, m.seeker))) ? "Bajó de precio · " : ""}{pending.length === 1 ? `Le puede servir a ${pending[0].seeker.nombre}` : `Le puede servir a ${pending[0].seeker.nombre} y ${pending.length - 1} más`}</small></span></div>
            <ButtonLink href={`/admin/propiedades/${encodeURIComponent(property.slug)}/seguimiento?seccion=compradores`} className="shrink-0 self-start" aria-label={`Avisar a compradores de ${property.titulo}`}>Avisar</ButtonLink>
          </article>)}</Card>
        </Section>}

        {(reports === null || lateReports.length > 0) && <Section id="hoy-informes" title="Informes al propietario vencidos" count={lateReports.length} description="Cada mes le contamos al propietario cómo va la venta.">
          {reports === null ? failed("los informes al propietario") : <Card as="div" className={s.list}>{lateReports.map(report => <article key={report.id} className={s.report}>
            <div className="flex min-w-0 flex-1 items-center gap-3"><Avatar name={report.who} size={40} /><span className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{report.who}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{report.property}</small><span className={cn(s.meta, s.late)}>{report.status}</span></span></div>
            <ButtonLink href={report.href} className="shrink-0 self-start" aria-label={`Preparar informe de ${report.who}`}>Preparar informe</ButtonLink>
          </article>)}</Card>}
        </Section>}
      </div>
    </div>
  </Surface>;
}

function TodayTasks({ tasks, today }: { tasks: Task[]; today: string }) {
  const [saving, setSaving] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const done = tasks.filter(t => !isTaskOpen(t)).length;
  async function toggle(task: Task) {
    setSaving(task.id); setMessage("");
    try {
      await upsert(db.tareas, { ...task, estado: isTaskOpen(task) ? "completada" : "pendiente" }, db.tareas.version(task));
      setMessage("Guardado");
    } catch (error) {
      setMessage(`No se pudo guardar: ${error instanceof Error ? error.message : "intenta de nuevo"}`);
    } finally { setSaving(null); }
  }
  return <Section id="hoy-tareas" title="Tareas de hoy" action={more("/admin/agenda?tab=tareas", "Ver todas")}>
    {tasks.length > 0 && <p className={cn(s.meta, "-mt-2 px-1")}>{done} de {tasks.length} hechas</p>}
    <Card as="div" className={s.list}>
      {tasks.length ? <ul className="flex flex-col">{tasks.map(task => {
        const open = isTaskOpen(task);
        return <li key={task.id} className={s.task}>
          <input type="checkbox" className={s.check} checked={!open} disabled={saving === task.id} onChange={() => void toggle(task)} aria-label={`${open ? "Marcar como hecha" : "Marcar como pendiente"}: ${task.titulo}`} />
          <span className="flex min-w-0 flex-col gap-0.5"><Link href={`/admin/tareas/${encodeURIComponent(task.id)}`} className={cn("[overflow-wrap:anywhere] font-medium", !open && s.doneText)}>{task.titulo}</Link><small className={cn(s.meta, open && task.vence! < today && s.late)}>{task.vence === today ? "Hoy" : `Vencida desde el ${shortDate(task.vence!)}`}</small></span>
        </li>;
      })}</ul> : <p className={s.note}>No hay tareas para hoy ni vencidas.</p>}
      <Link href="/admin/agenda?tab=tareas&nueva=1" className={s.add}><Plus size={18} aria-hidden="true" />Agregar tarea</Link>
    </Card>
    {message && <p role="status" className={cn("px-1 text-sm", message.startsWith("No se pudo") ? "text-destructive" : "text-muted-foreground")}>{message}</p>}
  </Section>;
}
