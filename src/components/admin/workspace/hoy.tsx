"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Plus } from "lucide-react";
import { ButtonLink, Card, EmptyBox, Surface } from "@/components/admin/kit";
import { apiRequest, db, upsert, useCollection, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen, type Task } from "@/lib/tasks";
import type { OperationalInterview } from "@/lib/intake/interview";
import { greeting, interviewSummary, longDate, overdueReports, shortDate, todayTasks, upcomingItems, waitingItems, weekdayDate, type OfferRun, type TodayDossier } from "@/lib/admin/today";
import { cn } from "@/lib/utils";
import s from "./hoy.module.css";

/*
  Hoy (docs/diseno/lienzo-panel: Main y HoyMovil). Lo que espera algo de ti,
  entrevistas por terminar, tareas y agenda del día, lo que vence en los próximos
  7 días e informes al propietario vencidos.
*/

type Load<T> = T | undefined | null; // undefined: cargando · null: no se pudo consultar
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

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
  const [hour, setHour] = React.useState<number | null>(null);
  React.useEffect(() => {
    let alive = true;
    const settle = <T,>(promise: Promise<T>, set: (value: T | null) => void) => promise.then(value => { if (alive) set(value); }).catch(() => { if (alive) set(null); });
    settle(apiRequest<{ expedientes?: TodayDossier[] }>("/api/admin/expedientes").then(r => r.expedientes ?? []), setDossiers);
    settle(apiRequest<{ entrevistas?: OperationalInterview[] }>("/api/admin/entrevistas").then(r => (r.entrevistas ?? []).filter(i => i.estado === "borrador")), setInterviews);
    settle(apiRequest<{ runs?: OfferRun[] }>("/api/admin/apps/runs?slug=ofertas").then(r => r.runs ?? []), setOffers);
    settle(apiRequest<{ ultimos?: Record<string, string> }>("/api/admin/apps/runs?slug=informe-propietario&vista=ultimo-por-expediente").then(r => r.ultimos ?? {}), setReports);
    // La hora se toma en el navegador para no saludar con la hora del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHour(new Date().getHours());
    return () => { alive = false; };
  }, []);

  const names = {
    client: (id?: string) => id ? clients.find(c => c.id === id)?.nombre : undefined,
    property: (slug?: string | null) => slug ? properties.find(p => p.slug === slug)?.titulo : undefined,
  };
  const waiting = dossiers === undefined ? [] : waitingItems({ dossiers: dossiers ?? [], tasks, offers: offers ?? null, followups: projectFollowups(leads, clients), names, today });
  const dayTasks = todayTasks(tasks, today);
  const openToday = dayTasks.filter(isTaskOpen).length;
  const agenda = events.filter(e => e.fecha === today).sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99"));
  const visits = agenda.filter(e => e.tipo === "visita").length;
  const upcoming = upcomingItems({ tasks, dossiers: dossiers ?? [], reports, names, today });
  const lateReports = dossiers && reports ? overdueReports({ dossiers, reports, names, today }) : [];
  const firstName = session?.name?.trim().split(/\s+/)[0];
  const summary = [
    waiting.length ? `${plural(waiting.length, "pendiente espera", "pendientes esperan")} algo de ti` : "Nada espera por ti",
    `tienes ${plural(openToday, "tarea", "tareas")}`,
    `${plural(visits, "visita", "visitas")} hoy`,
  ];

  return <Surface className="-mx-4 -mt-5 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8">
    <header className="mb-8 flex flex-col gap-1.5">
      <p className={s.date}><time dateTime={today}>{longDate(today)}</time></p>
      <h1 className={s.hello}>{hour === null ? "Hola" : greeting(hour)}{firstName ? `, ${firstName}` : ""}</h1>
      <p className="text-muted-foreground">{summary[0]}, {summary[1]} y {summary[2]}.</p>
    </header>
    <div className={s.layout}>
      <div className="flex min-w-0 flex-col gap-8">
        <Section id="hoy-esperan" title="Esperan algo de ti" count={waiting.length}>
          {dossiers === undefined ? <p className={s.note} role="status">Consultando operaciones…</p>
            : <>
              {dossiers === null && failed("las operaciones")}
              {waiting.length ? <Card as="div" className={s.list}>{waiting.map(item => <article key={item.id} className={s.waiting}>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-baseline gap-x-2.5"><strong className="text-base">{item.who}</strong>{item.folio && <span className={s.mono}>{item.folio}</span>}</p>
                  {item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>}
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 text-sm"><Clock size={15} aria-hidden="true" className="translate-y-0.5 self-start" /><span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{item.reason}</span>{item.when && <span className={cn(s.mono, item.late && s.late)}>{item.when}</span>}</p>
                </div>
                <ButtonLink href={item.href} className="shrink-0 self-start sm:self-center" aria-label={`Continuar con ${item.who}`}>Continuar<ArrowRight size={16} aria-hidden="true" /></ButtonLink>
              </article>)}</Card>
                : dossiers !== null && <EmptyBox title="Nada espera por ti">Las operaciones tienen su siguiente paso con fecha y no hay contactos pendientes.</EmptyBox>}
            </>}
        </Section>

        {(interviews === null || !!interviews?.length) && <Section id="hoy-entrevistas" title="Entrevistas por terminar" count={interviews?.length}>
          {interviews === null ? failed("las entrevistas") : <Card as="div" className={s.list}>{interviews!.map(interview => <article key={interview.id} className={s.waiting}>
            <div className="flex min-w-0 flex-col gap-1"><strong className="text-base [overflow-wrap:anywhere]">{interview.contacto?.nombre || "Contacto sin nombre"}</strong><p className="text-sm text-muted-foreground">{interviewSummary(interview)}</p></div>
            <ButtonLink href={`/admin/operaciones/nueva?entrevista=${encodeURIComponent(interview.id)}`} className="shrink-0 self-start sm:self-center" aria-label={`Seguir la entrevista de ${interview.contacto?.nombre || "contacto sin nombre"}`}>Seguir la entrevista<ArrowRight size={16} aria-hidden="true" /></ButtonLink>
          </article>)}</Card>}
        </Section>}

        <TodayTasks tasks={dayTasks} today={today} />
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <Section id="hoy-agenda" title="Agenda de hoy" action={more("/admin/agenda", "Ver semana")}>
          {agenda.length ? <Card as="div" className={cn(s.list, "p-1.5")}><ul className="flex flex-col gap-1">{agenda.map(event => {
            const visit = event.tipo === "visita";
            const context = [names.client(event.clienteId) ?? leads.find(l => l.id === event.leadId)?.nombre, names.property(event.propiedadSlug)].filter(text => text && text !== event.titulo).join(" · ");
            return <li key={event.id}><Link href={`/admin/agenda?fecha=${today}&evento=${encodeURIComponent(event.id)}`} className={cn(s.event, visit && s.visit)}>
              <time className={s.time}>{event.hora ?? "—"}</time>
              <span className="flex min-w-0 flex-col gap-0.5">{visit && <span className={s.tag}>Visita</span>}<strong className="[overflow-wrap:anywhere]">{event.titulo}</strong>{context && <small className="text-muted-foreground">{visit ? `Con ${context}` : context}</small>}</span>
            </Link></li>;
          })}</ul></Card> : <EmptyBox title="Sin citas hoy">Las visitas y citas del día aparecen aquí.</EmptyBox>}
        </Section>

        <Section id="hoy-proximos" title="Próximos 7 días" action={more("/admin/agenda", "Ver agenda")} description="Tareas y documentos que vencen pronto, antes de que se vuelvan urgentes.">
          {dossiers === null && failed("los documentos de las operaciones")}
          {upcoming.length ? <Card as="div" className={s.list}><ul>{upcoming.map(item => <li key={item.id}><Link href={item.href} className={s.upcoming}>
            <span className={s.day}>{weekdayDate(item.date)}</span>
            <span className="flex min-w-0 flex-col gap-0.5"><span className={s.kind}>{item.kind}</span><strong className="[overflow-wrap:anywhere]">{item.text}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{item.meta}</small></span>
          </Link></li>)}</ul></Card> : <EmptyBox title="Nada vence esta semana" />}
        </Section>

        {(reports === null || lateReports.length > 0) && <Section id="hoy-informes" title="Informes al propietario vencidos" count={lateReports.length} description="Cada mes le contamos al propietario cómo va la venta.">
          {reports === null ? failed("los informes al propietario") : <Card as="div" className={s.list}>{lateReports.map(report => <article key={report.id} className={s.report}>
            <div className="flex min-w-0 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{report.who}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{report.property}</small><span className={cn(s.mono, s.late)}>{report.status}</span></div>
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
    {tasks.length > 0 && <p className={cn(s.mono, "-mt-2 px-1")}>{done} de {tasks.length} hechas</p>}
    <Card as="div" className={s.list}>
      {tasks.length ? <ul>{tasks.map(task => {
        const open = isTaskOpen(task);
        return <li key={task.id} className={s.task}>
          <input type="checkbox" className={s.check} checked={!open} disabled={saving === task.id} onChange={() => void toggle(task)} aria-label={`${open ? "Marcar como hecha" : "Marcar como pendiente"}: ${task.titulo}`} />
          <span className="flex min-w-0 flex-col gap-0.5"><Link href={`/admin/tareas/${encodeURIComponent(task.id)}`} className={cn("[overflow-wrap:anywhere]", !open && s.doneText)}>{task.titulo}</Link><small className={cn(s.mono, open && task.vence! < today && s.late)}>{task.vence === today ? "Hoy" : `Vencida desde el ${shortDate(task.vence!)}`}</small></span>
        </li>;
      })}</ul> : <p className={s.note}>No hay tareas para hoy ni vencidas.</p>}
      <Link href="/admin/agenda?tab=tareas&nueva=1" className={s.add}><Plus size={18} aria-hidden="true" />Agregar tarea</Link>
    </Card>
    {message && <p role="status" className={cn("px-1 text-sm", message.startsWith("No se pudo") ? "text-destructive" : "text-muted-foreground")}>{message}</p>}
  </Section>;
}
