"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { calendarWeekDays, compareCalendarEntries, isCalendarDate, shiftCalendarDate } from "@/lib/admin/calendar-dates";
import { CalendarActivityList, CalendarEventContext, type CalendarActivity } from "@/components/admin/calendar-agenda";
import styles from "@/components/admin/calendar-agenda.module.css";
import { isTaskOpen, TASK_STATUSES } from "@/lib/tasks";

import {
  Badge,
  Field,
  ErrorNotice,
  PageHeader,
  btnGhost,
  btnPrimary,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import {
  EVENTO_TIPOS,
  EVENTO_TIPO_LABELS,
  db,
  removeById,
  uid,
  upsert,
  useCollection,
  type EventoTipo,
} from "@/lib/admin/store";

/*
  Calendario mensual de la operación: visitas, llamadas, firmas y
  reuniones, vinculables a personas, inmuebles, expedientes y asesores.
*/
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const DIAS_COMPLETOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function CalendarioPage() {
  useQuickCreate("visita", () => document.getElementById("cal-titulo")?.focus());
  const eventos = useCollection(db.eventos);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const tareas = useCollection(db.tareas).filter(isTaskOpen);
  const [expedientes, setExpedientes] = React.useState<{ id: string; folio: string; cliente_id: string; propiedad_slug: string | null; asesor_id: string }[]>([]);
  const [selectedExpedienteId, setSelectedExpedienteId] = React.useState("");
  const referencesEdited = React.useRef(false);
  const draftEdited = React.useRef(false);
  const [requestedExpedienteId, setRequestedExpedienteId] = React.useState("");
  const [expedientesStatus, setExpedientesStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [expedientesRetry, setExpedientesRetry] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    fetch("/api/admin/expedientes", { credentials: "same-origin", cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("No se pudieron consultar los expedientes.");
        return response.json();
      })
      .then(result => { if (active) {
        const rows = Array.isArray(result.expedientes) ? result.expedientes : [];
        setExpedientes(rows);
        const requested = new URLSearchParams(window.location.search).get("expediente");
        if (!referencesEdited.current && rows.some((row: { id: string }) => row.id === requested)) setSelectedExpedienteId(requested!);
        setExpedientesStatus("ready");
      } })
      .catch(() => { if (active) {
        setExpedientes([]);
        setExpedientesStatus("error");
      } });
    return () => { active = false; };
  }, [expedientesRetry]);
  const followups = projectFollowups(leads, clientes);
  const hoy = operationalDate();
  const [cursor, setCursor] = React.useState(() => {
    const [year, month] = hoy.split("-").map(Number);
    return { year, month: month - 1 };
  });
  const [seleccion, setSeleccion] = React.useState(hoy);
  const [captureDate, setCaptureDate] = React.useState(hoy);
  const [vista, setVista] = React.useState<"mes" | "semana" | "proximos">("mes");
  const [formContext, setFormContext] = React.useState<Record<string, string> | null>(null);
  const [context,setContext] = React.useState<Record<string,string>>({});
  React.useEffect(()=>{
    // Hydrate URL navigation after mounting the authenticated calendar.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params=new URLSearchParams(window.location.search);
    setRequestedExpedienteId(params.get("expediente") ?? "");
    const date=params.get("fecha");
    if(date && isCalendarDate(date)){
      setSeleccion(date);const [year,month]=date.split("-").map(Number);setCursor({year,month:month-1});
      if (!draftEdited.current) setCaptureDate(date);
    }
    setContext(Object.fromEntries(["leadId","clienteId","propiedadSlug","asesorId"].map(key=>[key,params.get(key)??""])));
    if(params.get("nueva")==="1")document.getElementById("cal-titulo")?.focus();
    /* eslint-enable react-hooks/set-state-in-effect */
  },[]);

  // UTC solo para aritmética de fechas, sin depender de la zona del dispositivo.
  const primerDia = new Date(Date.UTC(cursor.year, cursor.month, 1));
  const totalDias = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
  /* Lunes = 0 */
  const offset = (primerDia.getUTCDay() + 6) % 7;
  const celdas: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDias }, (_, i) =>
      `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];

  const porDia = new Map<string, number>();
  for (const e of eventos) porDia.set(e.fecha, (porDia.get(e.fecha) ?? 0) + 1);
  const tareasPorDia = new Map<string, number>();
  for (const tarea of tareas) if (tarea.vence) tareasPorDia.set(tarea.vence, (tareasPorDia.get(tarea.vence) ?? 0) + 1);
  const contactosPorDia = new Map<string, number>();
  for (const item of followups) contactosPorDia.set(item.fecha, (contactosPorDia.get(item.fecha) ?? 0) + 1);
  const tareasDelDia = tareas.filter(tarea => tarea.vence === seleccion);
  const contactosDelDia = followups.filter(item => item.fecha === seleccion);

  const delDia = eventos
    .filter((e) => e.fecha === seleccion)
    .sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));

  const calendarContext = { leads, clientes, propiedades, asesores, expedientes };
  const actividad: CalendarActivity[] = [
    ...eventos.map(event => ({ kind: "evento" as const, id: event.id, fecha: event.fecha, hora: event.hora, titulo: event.titulo, event })),
    ...tareas.filter(task => !!task.vence).map(task => ({ kind: "tarea" as const, id: task.id, fecha: task.vence!, titulo: task.titulo, task })),
    ...followups.map(contact => ({ kind: "contacto" as const, id: contact.id, fecha: contact.fecha, titulo: contact.personName, contact })),
  ].sort(compareCalendarEntries);
  const semana = calendarWeekDays(seleccion);
  const proximos = actividad.filter(item => item.fecha >= hoy);
  const selectedExpediente = expedientes.find(row => row.id === selectedExpedienteId);
  const requestedExpedienteUnresolved = !!requestedExpedienteId && !selectedExpediente;
  const requestedExpedienteUnavailable = requestedExpedienteUnresolved && expedientesStatus === "ready";
  const expedientesError = expedientesStatus === "error"
    ? "No se pudieron consultar los expedientes. Reintenta la consulta."
    : requestedExpedienteUnavailable
      ? "El expediente solicitado no está disponible. Reintenta la consulta o quita ese vínculo para continuar."
      : null;
  const formReferences = formContext ?? (selectedExpediente ? {
    clienteId: selectedExpediente.cliente_id,
    propiedadSlug: selectedExpediente.propiedad_slug ?? "",
    asesorId: selectedExpediente.asesor_id,
    leadId: "",
  } : context);
  const selectedReferences = selectedExpediente ? {
    expedienteId: selectedExpediente.id,
    clienteId: selectedExpediente.cliente_id,
    propiedadSlug: selectedExpediente.propiedad_slug ?? undefined,
    asesorId: selectedExpediente.asesor_id,
  } : { ...(formContext ?? context), expedienteId: selectedExpedienteId || undefined };

  function selectDate(fecha: string) {
    setSeleccion(fecha);
    const [year, month] = fecha.split("-").map(Number);
    setCursor({ year, month: month - 1 });
  }

  function selectDay(fecha: string) {
    selectDate(fecha);
    if (!draftEdited.current) setCaptureDate(fecha);
  }

  function openEvent(fecha: string) {
    selectDate(fecha);
    const heading = document.getElementById("calendar-selected-day");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView?.({ block: "start" });
  }

  function withdrawRequestedExpediente() {
    referencesEdited.current = true;
    setRequestedExpedienteId("");
    setSelectedExpedienteId("");
  }

  function retryExpedientes() {
    setExpedientesStatus("loading");
    setExpedientesRetry(current => current + 1);
  }

  function updateReference(event: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.currentTarget;
    referencesEdited.current = true;
    setRequestedExpedienteId("");
    setFormContext(current => ({ ...(current ?? formReferences), [name]: value }));
    setSelectedExpedienteId("");
  }

  function mover(delta: number) {
    if (vista === "semana") {
      selectDate(shiftCalendarDate(seleccion, delta * 7));
      return;
    }
    setCursor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  }

  async function agendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (requestedExpedienteUnresolved) {
      throw new Error("Confirma el expediente solicitado o quita ese vínculo antes de agendar.");
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    const expediente = expedientes.find(x => x.id === data.get("expedienteId"));
    await upsert(
      db.eventos,
      {
        id: uid(),
        titulo: String(data.get("titulo") ?? ""),
        fecha: String(data.get("fecha") ?? captureDate),
        hora: String(data.get("hora") ?? "") || undefined,
        tipo: String(data.get("tipo") ?? "otro") as EventoTipo,
        leadId: expediente ? undefined : String(data.get("leadId") ?? "") || undefined,
        clienteId: (expediente?.cliente_id ?? String(data.get("clienteId") ?? "")) || undefined,
        propiedadSlug: (expediente?.propiedad_slug ?? String(data.get("propiedadSlug") ?? "")) || undefined,
        expedienteId: String(data.get("expedienteId") ?? "") || undefined,
        asesorId: (expediente?.asesor_id ?? String(data.get("asesorId") ?? "")) || undefined,
      },
      null,
    );
    form.reset();
    setFormContext(selectedExpediente ? {
      clienteId: selectedExpediente.cliente_id,
      propiedadSlug: selectedExpediente.propiedad_slug ?? "",
      asesorId: selectedExpediente.asesor_id,
      leadId: "",
    } : { ...context });
    setCaptureDate(seleccion);
    draftEdited.current = false;
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Calendario"
        actions={<button type="button" className={btnPrimary} onClick={() => { document.getElementById("cal-titulo")?.focus(); document.getElementById("cal-titulo")?.scrollIntoView({ block: "center" }); }}>Nueva visita o evento</button>}
        description="Visitas, llamadas, firmas y reuniones del equipo. Horario de Tijuana."
      />

      <div className={styles.toolbar}>
        <div role="group" aria-label="Vista del calendario" className={styles.views}>
          {([["mes", "Mes"], ["semana", "Semana"], ["proximos", "Próximos"]] as const).map(([value, label]) => <button
            key={value} type="button" aria-pressed={vista === value} className={btnGhost + " " + styles.viewButton}
            onClick={() => setVista(value)}
          >{label}</button>)}
        </div>
        <button type="button" className={btnGhost} onClick={() => selectDay(hoy)}>Hoy</button>
      </div>

      <div className={styles.layout}>
        {vista === "mes" ? (
        <section aria-labelledby="calendar-month" className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="calendar-month" className="min-w-0 display-soft text-lg text-foreground">
              {MESES[cursor.month]}{" "}
              <span className="font-mono text-base text-muted-foreground">
                {cursor.year}
              </span>
            </h2>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => mover(-1)}
                className={btnGhost + " size-11 shrink-0 p-0"}
              >
                <ChevronLeft className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => mover(1)}
                className={btnGhost + " size-11 shrink-0 p-0"}
              >
                <ChevronRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mt-4 grid grid-cols-7 gap-0 text-center font-mono text-xs uppercase text-muted-foreground sm:gap-1">
              {DIAS.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0 sm:gap-1">
              {celdas.map((fecha, i) =>
                fecha === null ? (
                  <span key={`x-${i}`} />
                ) : (
                  <button
                    key={fecha}
                    type="button"
                    onClick={() => selectDay(fecha)}
                    aria-label={`${Number(fecha.slice(8, 10))} de ${MESES[cursor.month].toLowerCase()} de ${cursor.year}${porDia.get(fecha) ? `, ${porDia.get(fecha)} eventos` : ""}${tareasPorDia.get(fecha) ? `, ${tareasPorDia.get(fecha)} tareas` : ""}${contactosPorDia.get(fecha) ? `, ${contactosPorDia.get(fecha)} contactos` : ""}`}
                    aria-pressed={seleccion === fecha}
                    aria-current={fecha === hoy ? "date" : undefined}
                    className={
                      "relative min-h-11 min-w-0! w-full rounded-md border py-2 text-sm transition-colors sm:aspect-square " +
                      (seleccion === fecha
                        ? "border-primary/60 bg-primary/10 font-semibold text-primary-ink"
                        : fecha === hoy
                          ? "border-border bg-secondary font-semibold text-foreground"
                          : "border-transparent text-foreground/75 hover:bg-secondary/60")
                    }
                  >
                    {Number(fecha.slice(8, 10))}
                    {porDia.get(fecha) || tareasPorDia.get(fecha) || contactosPorDia.get(fecha) ? (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                      />
                    ) : null}
                  </button>
                ),
              )}
            </div>
          </div>
        </section>
        ) : vista === "semana" ? (
          <section aria-label="Agenda semanal" className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-5">
            <div className={styles.period}>
              <div className="min-w-0">
                <h2 className="text-lg text-foreground">Semana</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {Number(semana[0].slice(8))} de {MESES[Number(semana[0].slice(5, 7)) - 1].toLowerCase()} de {semana[0].slice(0, 4)}
                  {" — "}{Number(semana[6].slice(8))} de {MESES[Number(semana[6].slice(5, 7)) - 1].toLowerCase()} de {semana[6].slice(0, 4)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" aria-label="Semana anterior" onClick={() => mover(-1)} className={btnGhost + " size-11 shrink-0 p-0"}><ChevronLeft className="size-4" strokeWidth={1.5} /></button>
                <button type="button" aria-label="Semana siguiente" onClick={() => mover(1)} className={btnGhost + " size-11 shrink-0 p-0"}><ChevronRight className="size-4" strokeWidth={1.5} /></button>
              </div>
            </div>
            <div className={styles.week}>
              {semana.map((fecha, index) => {
                const items = actividad.filter(item => item.fecha === fecha);
                return <div key={fecha} className={styles.weekDay}>
                  <button type="button" className={styles.weekDate} aria-pressed={seleccion === fecha} aria-current={fecha === hoy ? "date" : undefined}
                    aria-label={Number(fecha.slice(8)) + " de " + MESES[Number(fecha.slice(5, 7)) - 1].toLowerCase() + " de " + fecha.slice(0, 4)}
                    onClick={() => selectDay(fecha)}>
                    <span>{DIAS_COMPLETOS[index]}</span><strong>{Number(fecha.slice(8))}</strong>
                  </button>
                  {items.length > 0 ? <CalendarActivityList items={items} context={calendarContext} onSelectEvent={openEvent} /> : <p className={styles.empty}>Sin actividad prevista.</p>}
                </div>;
              })}
            </div>
          </section>
        ) : (
          <section aria-label="Actividad próxima" className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-5">
            <h2 className="text-lg text-foreground">Próximos</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Desde hoy, en orden de fecha y hora. Los pendientes sin hora aparecen al final de cada día.</p>
            {proximos.length > 0 ? <CalendarActivityList items={proximos} context={calendarContext} onSelectEvent={openEvent} showDate /> : <div className={styles.empty}>
              <p className="font-medium text-foreground">Sin actividad próxima.</p>
              <p className="mt-1">Programa un evento o consulta otra fecha para revisar la agenda.</p>
            </div>}
          </section>
        )}

        {/* Día seleccionado */}
        <section aria-labelledby="calendar-selected-day" className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 id="calendar-selected-day" tabIndex={-1} className="scroll-mt-24 display-soft text-lg text-foreground">
            {Number(seleccion.slice(8, 10))} de{" "}
            {MESES[Number(seleccion.slice(5, 7)) - 1].toLowerCase()}
          </h2>

          {delDia.length > 0 ? (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {delDia.map((evento) => {
                const lead = leads.find((l) => l.id === evento.leadId);
                const cliente = clientes.find((c) => c.id === evento.clienteId);
                const propiedad = propiedades.find((p) => p.slug === evento.propiedadSlug);
                const expediente = expedientes.find((x) => x.id === evento.expedienteId);
                const asesor = asesores.find((a) => a.id === evento.asesorId);
                return (
                  <li
                    key={evento.id}
                    className="flex min-w-0 items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex min-w-0 flex-col items-start gap-1 text-sm text-foreground">
                        {evento.hora ? (
                          <span className="font-mono text-xs text-primary-ink">
                            {evento.hora}
                          </span>
                        ) : null}
                        <span className="max-w-full [overflow-wrap:anywhere]">{evento.titulo}</span>
                      </p>
                      <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <Badge>{EVENTO_TIPO_LABELS[evento.tipo]}</Badge>
                        {lead ? (
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="inline-flex min-h-11 max-w-full items-center text-primary-ink [overflow-wrap:anywhere] hover:text-foreground"
                          >
                            {lead.nombre}
                          </Link>
                        ) : null}
                        {cliente ? <Link href={`/admin/clientes/${encodeURIComponent(cliente.id)}`} className="inline-flex min-h-11 items-center text-primary-ink hover:text-foreground">Cliente: {cliente.nombre}</Link> : null}
                        {propiedad ? <Link href={`/admin/propiedades/${encodeURIComponent(propiedad.slug)}/editar`} className="inline-flex min-h-11 items-center text-primary-ink hover:text-foreground">Inmueble: {propiedad.codigo}</Link> : null}
                        {expediente ? <Link href={`/admin/operaciones?expediente=${encodeURIComponent(expediente.id)}`} className="inline-flex min-h-11 items-center text-primary-ink hover:text-foreground">Expediente: {expediente.folio}</Link> : null}
                        {asesor ? <span>Asesor: {asesor.nombre}</span> : null}
                      </p>
                    </div>
                    <AsyncButton
                      type="button"
                      aria-label={`Eliminar ${evento.titulo}`}
                      onClick={async () => {
                        if (await confirmAction("¿Eliminar este evento?"))
                          await removeById(
                            db.eventos,
                            evento.id,
                            db.eventos.version(evento),
                          );
                      }}
                      className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </AsyncButton>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Sin eventos este día.
            </p>
          )}

          {tareasDelDia.length > 0 && <section aria-label="Vencimientos de tareas" className="mt-5 border-t border-border pt-4">
            <h3 className="font-medium text-sm">Tareas que vencen este día</h3>
            <ul className="mt-2 divide-y divide-border">{tareasDelDia.map(tarea => <li key={tarea.id}>
              <Link href={`/admin/tareas/${tarea.id}`} className="flex min-h-11 min-w-0 flex-col gap-1 py-3 text-sm text-primary-ink [overflow-wrap:anywhere]">
                <span>{tarea.titulo}</span><span className="text-xs text-muted-foreground">{TASK_STATUSES[tarea.estado]}</span>
              </Link>
            </li>)}</ul>
          </section>}
          {contactosDelDia.length > 0 && <section aria-label="Próximos contactos" className="mt-5 border-t border-border pt-4">
            <h3 className="font-medium text-sm">Contactos previstos este día</h3>
            <ul className="mt-2 divide-y divide-border">{contactosDelDia.map(item => <li key={item.id}>
              <Link href={item.href} className="flex min-h-11 min-w-0 flex-col gap-1 py-3 text-sm text-primary-ink [overflow-wrap:anywhere]">
                <span>{item.personName}</span><span className="text-xs text-muted-foreground">{item.kind === "cliente" ? "Cliente" : "Prospecto"} · {asesores.find(a => a.id === item.asesorId)?.nombre ?? "Sin asesor"}</span>
              </Link>
            </li>)}</ul>
          </section>}
          <AsyncForm
            onSubmit={agendar}
            onChange={() => { draftEdited.current = true; }}
            className="mt-5 space-y-3 border-t border-border pt-5"
          >
            <section aria-label="Contexto del evento" className={styles.formContext}>
              <p>Vínculos del nuevo evento</p>
              {Object.values(selectedReferences).some(Boolean) ? <CalendarEventContext references={selectedReferences} context={calendarContext} /> : !requestedExpedienteUnresolved && <p className="mt-1 text-xs text-muted-foreground">Sin vínculos seleccionados. El evento quedará en la agenda del equipo.</p>}
              {expedientesStatus === "loading" && <p role="status" className="mt-2 text-xs text-muted-foreground">{requestedExpedienteUnresolved ? "Consultando el expediente solicitado. Puedes completar la captura mientras se confirma el vínculo." : "Consultando expedientes…"}</p>}
              <div className="mt-2"><ErrorNotice error={expedientesError} /></div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(expedientesStatus === "error" || requestedExpedienteUnavailable) && <button type="button" className={btnGhost} onClick={retryExpedientes}>Reintentar consulta de expedientes</button>}
                {requestedExpedienteUnresolved && <button type="button" className={btnGhost} onClick={withdrawRequestedExpediente}>Quitar expediente solicitado</button>}
              </div>
            </section>
            <Field label="Nuevo evento" htmlFor="cal-titulo">
              <input
                id="cal-titulo"
                name="titulo"
                required
                placeholder="Visita con prospecto…"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Fecha" htmlFor="cal-fecha">
                <input
                  id="cal-fecha"
                  name="fecha"
                  type="date"
                  value={captureDate}
                  onChange={event => setCaptureDate(event.currentTarget.value)}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Hora" htmlFor="cal-hora">
                <input
                  id="cal-hora"
                  name="hora"
                  type="time"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Tipo" htmlFor="cal-tipo">
                <select id="cal-tipo" name="tipo" className={selectClass}>
                  {EVENTO_TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {EVENTO_TIPO_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prospecto (opcional)" htmlFor="cal-lead">
                <select value={formReferences.leadId ?? ""} onChange={updateReference} id="cal-lead" name="leadId" className={selectClass}>
                  <option value="">Ninguno</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Cliente (opcional)" htmlFor="cal-cliente">
                <select value={formReferences.clienteId ?? ""} onChange={updateReference} id="cal-cliente" name="clienteId" className={selectClass}><option value="">Ninguno</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
              </Field>
              <Field label="Inmueble (opcional)" htmlFor="cal-propiedad">
                <select value={formReferences.propiedadSlug ?? ""} onChange={updateReference} id="cal-propiedad" name="propiedadSlug" className={selectClass}><option value="">Ninguno</option>{propiedades.map(p => <option key={p.slug} value={p.slug}>{p.codigo} · {p.titulo}</option>)}</select>
              </Field>
              <Field label="Expediente (opcional)" htmlFor="cal-expediente" hint="Si cambias una persona, inmueble o asesor, el expediente se desvincula.">
                <select id="cal-expediente" name="expedienteId" value={selectedExpedienteId} className={selectClass} onChange={event => {
                  referencesEdited.current = true;
                  setRequestedExpedienteId("");
                  setSelectedExpedienteId(event.currentTarget.value);
                  const selected = expedientes.find(x => x.id === event.currentTarget.value);
                  if (selected) setFormContext({
                    clienteId: selected.cliente_id,
                    propiedadSlug: selected.propiedad_slug ?? "",
                    asesorId: selected.asesor_id,
                    leadId: "",
                  });
                }}><option value="">Ninguno</option>{expedientes.map(x => <option key={x.id} value={x.id}>{x.folio}</option>)}</select>
              </Field>
              <Field label="Asesor (opcional)" htmlFor="cal-asesor">
                <select value={formReferences.asesorId ?? ""} onChange={updateReference} id="cal-asesor" name="asesorId" className={selectClass}><option value="">Ninguno</option>{asesores.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
              </Field>
            </div>
            {selectedExpedienteId ? <p className="text-xs text-muted-foreground">El expediente vincula automáticamente al cliente, inmueble y asesor al guardar el evento.</p> : null}
            <button type="submit" disabled={requestedExpedienteUnresolved} className={btnPrimary + " w-full"}>
              Agendar
            </button>
          </AsyncForm>
        </section>
      </div>
    </div>
  );
}
