"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2 } from "@/components/admin/icons";
import { Button, Notice, Sheet } from "@/components/admin/kit";
import { AsyncButton, AsyncForm, ErrorNotice, Field, inputClass, selectClass } from "@/components/admin/ui";
import { apiRequest } from "@/lib/admin/store";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { LinkPicker, type LinkValue } from "@/components/admin/workspace/link-picker";
import { operationalDate } from "@/lib/admin/operational-date";
import { followupLabel, projectFollowups } from "@/lib/admin/followups";
import { useTodayData } from "@/components/admin/workspace/use-today-queue";
import { calendarWeekDays, isCalendarDate, shiftCalendarDate } from "@/lib/admin/calendar-dates";
import { HOUR_HEIGHT, dayLabel, daySummary, dayTitle, hourRange, placeEvents, weekTitle, weekdayShort } from "@/lib/admin/agenda-view";
import { isTaskOpen, TASK_STATUSES } from "@/lib/tasks";
import { EVENTO_TIPOS, EVENTO_TIPO_LABELS, db, removeById, uid, upsert, useCollection, type AdminProperty, type Asesor, type Cliente, type Evento, type EventoTipo, type Lead } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import s from "./agenda.module.css";

/*
  Agenda (lienzo: AgendaEscritorio y AgendaMovil). Semana por horas en computadora; en
  celular, la tira de días y la lista del día elegido. Las visitas van en el azul de información. Las
  tareas con fecha y los próximos contactos se muestran sin crear eventos. Agendar es un panel
  (SIM-09, C25) que se abre con «Agendar», con «+ Nuevo» o al tocar un hueco de la semana, con
  la fecha y la hora ya puestas; el asesor es quien agenda, salvo que lo cambie. Cerrar el panel
  no borra lo escrito. «?fecha=», «?expediente=», «?leadId=», «?clienteId=», «?propiedadSlug=»,
  «?asesorId=» y «?nueva=1» preparan la captura y la abren.
*/

type Expediente = { id: string; folio: string; cliente_id: string; propiedad_slug: string | null; asesor_id: string };
type References = Pick<Evento, "leadId" | "clienteId" | "propiedadSlug" | "expedienteId" | "asesorId">;
type Context = { leads: Lead[]; clientes: Cliente[]; propiedades: AdminProperty[]; asesores: Asesor[]; expedientes: Expediente[] };

export function AgendaCalendar() {
  useQuickCreate("visita", () => openCapture());
  const eventos = useCollection(db.eventos);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const tareas = useCollection(db.tareas).filter(isTaskOpen);
  const [expedientes, setExpedientes] = React.useState<Expediente[]>([]);
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
        if (!response.ok) throw new Error("No se pudieron consultar las operaciones.");
        return response.json();
      })
      .then(result => { if (active) {
        const rows = Array.isArray(result.expedientes) ? result.expedientes : [];
        setExpedientes(rows);
        const requested = new URLSearchParams(window.location.search).get("expediente");
        if (!referencesEdited.current && rows.some((row: { id: string }) => row.id === requested)) setSelectedExpedienteId(requested!);
        setExpedientesStatus("ready");
      } })
      .catch(() => { if (active) { setExpedientes([]); setExpedientesStatus("error"); } });
    return () => { active = false; };
  }, [expedientesRetry]);
  const { dossiers } = useTodayData(60_000);
  const followups = projectFollowups(leads, clientes, dossiers);
  const hoy = operationalDate();
  const [seleccion, setSeleccion] = React.useState(hoy);
  const [captureDate, setCaptureDate] = React.useState(hoy);
  const [captureTime, setCaptureTime] = React.useState("");
  const [captureOpen, setCaptureOpen] = React.useState(false);
  const [removed, setRemoved] = React.useState<Evento | null>(null);
  const [me, setMe] = React.useState<string>();
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ asesorId?: string | null }>("/api/admin/mi-asesor").then(r => { if (alive) setMe(r.asesorId ?? undefined); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const [formContext, setFormContext] = React.useState<Record<string, string> | null>(null);
  const [context, setContext] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    // La dirección se lee al montar la agenda ya autenticada.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = new URLSearchParams(window.location.search);
    setRequestedExpedienteId(params.get("expediente") ?? "");
    const date = params.get("fecha");
    if (date && isCalendarDate(date)) {
      setSeleccion(date);
      if (!draftEdited.current) setCaptureDate(date);
    }
    setContext(Object.fromEntries(["leadId", "clienteId", "propiedadSlug", "asesorId"].map(key => [key, params.get(key) ?? ""])));
    if (params.get("nueva") === "1" || ["expediente", "leadId", "clienteId", "propiedadSlug", "asesorId"].some(key => params.get(key))) setCaptureOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const semana = calendarWeekDays(seleccion);
  const weekEvents = eventos.filter(e => semana.includes(e.fecha));
  const range = hourRange(weekEvents);
  const hours = Array.from({ length: range.end - range.start }, (_, i) => range.start + i);
  const visits = weekEvents.filter(e => e.tipo === "visita").length;
  const counts = (fecha: string) => ({ events: eventos.filter(e => e.fecha === fecha).length, tasks: tareas.filter(t => t.vence === fecha).length, contacts: followups.filter(f => f.fecha === fecha).length });
  const delDia = eventos.filter(e => e.fecha === seleccion).sort((a, b) => (a.hora || "24:00").localeCompare(b.hora || "24:00") || a.titulo.localeCompare(b.titulo, "es"));
  const tareasDelDia = tareas.filter(t => t.vence === seleccion);
  const contactosDelDia = followups.filter(f => f.fecha === seleccion);

  const calendarContext: Context = { leads, clientes, propiedades, asesores, expedientes };
  const selectedExpediente = expedientes.find(row => row.id === selectedExpedienteId);
  const requestedExpedienteUnresolved = !!requestedExpedienteId && !selectedExpediente;
  const requestedExpedienteUnavailable = requestedExpedienteUnresolved && expedientesStatus === "ready";
  const expedientesError = expedientesStatus === "error"
    ? "No se pudieron consultar las operaciones. Reintenta la consulta."
    : requestedExpedienteUnavailable
      ? "Esa operación no está disponible. Reintenta o quita el vínculo."
      : null;
  // Sin asesor en la dirección ni elegido, el evento queda a nombre de quien agenda.
  const baseContext = context.asesorId || !me ? context : { ...context, asesorId: me };
  const formReferences = formContext ?? (selectedExpediente ? { clienteId: selectedExpediente.cliente_id, propiedadSlug: selectedExpediente.propiedad_slug ?? "", asesorId: selectedExpediente.asesor_id, leadId: "" } : baseContext);

  /** Abre el panel de agendar; un hueco de la semana trae su día y su hora si no hay algo escrito. */
  function openCapture(fecha?: string, hora?: string) {
    if (fecha && !draftEdited.current) setCaptureDate(fecha);
    if (hora && !draftEdited.current) setCaptureTime(hora);
    setCaptureOpen(true);
  }
  function slotAt(fecha: string, event: React.MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().top;
    const half = Math.max(0, Math.floor((y / HOUR_HEIGHT) * 2));
    const minutes = range.start * 60 + half * 30;
    openCapture(fecha, `${String(Math.min(23, Math.floor(minutes / 60))).padStart(2, "0")}:${minutes % 60 === 0 ? "00" : "30"}`);
  }
  async function removeEvent(evento: Evento) {
    await removeById(db.eventos, evento.id, db.eventos.version(evento));
    setRemoved(evento);
  }
  async function undoRemove() {
    if (!removed) return;
    // Se vuelve a crear con los mismos datos (RP-16): el borrado no se deshace sobre el registro anterior.
    await upsert(db.eventos, { ...removed, id: uid() }, null);
    setRemoved(null);
  }
  function selectDay(fecha: string) {
    setSeleccion(fecha);
    if (!draftEdited.current) setCaptureDate(fecha);
  }
  function openEvent(fecha: string) {
    setSeleccion(fecha);
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
  /** «¿Con quién o sobre qué?»: una operación trae cliente, inmueble y asesor; lo demás la desvincula. */
  function updateLinks(next: LinkValue, operation?: Expediente) {
    referencesEdited.current = true;
    draftEdited.current = true;
    setRequestedExpedienteId("");
    setSelectedExpedienteId(next.expedienteId ?? "");
    setFormContext({ leadId: next.leadId ?? "", clienteId: next.clienteId ?? "", propiedadSlug: next.propiedadSlug ?? "", asesorId: operation ? operation.asesor_id : (formReferences.asesorId ?? "") });
  }

  async function agendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (requestedExpedienteUnresolved) throw new Error("Confirma la operación solicitada o quita ese vínculo antes de agendar.");
    const form = e.currentTarget;
    const data = new FormData(form);
    const expediente = expedientes.find(x => x.id === data.get("expedienteId"));
    await upsert(db.eventos, {
      id: uid(),
      titulo: String(data.get("titulo") ?? ""),
      fecha: String(data.get("fecha") ?? captureDate),
      hora: captureTime || undefined,
      tipo: String(data.get("tipo") ?? "otro") as EventoTipo,
      leadId: expediente ? undefined : String(data.get("leadId") ?? "") || undefined,
      clienteId: (expediente?.cliente_id ?? String(data.get("clienteId") ?? "")) || undefined,
      propiedadSlug: (expediente?.propiedad_slug ?? String(data.get("propiedadSlug") ?? "")) || undefined,
      expedienteId: String(data.get("expedienteId") ?? "") || undefined,
      asesorId: (expediente?.asesor_id ?? String(data.get("asesorId") ?? "")) || undefined,
    }, null);
    form.reset();
    setFormContext(selectedExpediente ? { clienteId: selectedExpediente.cliente_id, propiedadSlug: selectedExpediente.propiedad_slug ?? "", asesorId: selectedExpediente.asesor_id, leadId: "" } : { ...baseContext });
    setCaptureDate(seleccion);
    setCaptureTime("");
    draftEdited.current = false;
    setCaptureOpen(false);
  }

  return <div className="flex min-w-0 flex-col gap-5">
    <div className={s.toolbar}>
      <p className="text-muted-foreground"><span className="font-semibold text-foreground">{weekTitle(semana)}</span>{` · ${visits} ${visits === 1 ? "visita" : "visitas"}`}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button iconOnly aria-label="Semana anterior" onClick={() => selectDay(shiftCalendarDate(seleccion, -7))}><ChevronLeft size={20} aria-hidden="true" /></Button>
        <Button onClick={() => selectDay(hoy)}>Hoy</Button>
        <Button iconOnly aria-label="Semana siguiente" onClick={() => selectDay(shiftCalendarDate(seleccion, 7))}><ChevronRight size={20} aria-hidden="true" /></Button>
        <Button className="ml-2" data-tour="agenda-agendar" aria-haspopup="dialog" onClick={() => openCapture(seleccion)}><Plus size={16} aria-hidden="true" />Agendar</Button>
      </div>
    </div>
    <div className={s.legend} aria-hidden="true"><span><i className={s.swatchVisit} />Visita</span><span><i className={s.swatchOther} />Cita o llamada</span><span><i className={s.swatchTask} />Tarea o seguimiento</span></div>

    <section aria-label="Agenda semanal" data-tour="agenda-semana" className={s.weekCard}>
      <div className={s.scroller}><div className={s.weekInner}>
        <div className={s.dayRow}>
          <span className={s.gutter} aria-hidden="true" />
          {semana.map(fecha => {
            const c = counts(fecha);
            return <button key={fecha} type="button" className={s.dayButton} aria-pressed={seleccion === fecha} aria-current={fecha === hoy ? "date" : undefined}
              aria-label={`${dayLabel(fecha)}${c.events ? `, ${c.events} eventos` : ""}${c.tasks ? `, ${c.tasks} tareas` : ""}${c.contacts ? `, ${c.contacts} contactos` : ""}`}
              onClick={() => selectDay(fecha)}>
              <span className={s.dayName}>{weekdayShort(fecha)}</span><span className={s.dayNumber}>{Number(fecha.slice(8))}</span>
              <span aria-hidden="true" className={cn(s.dot, eventos.some(e => e.fecha === fecha && e.tipo === "visita") ? s.dotVisit : c.events + c.tasks + c.contacts ? s.dotOther : "")} />
            </button>;
          })}
        </div>
        <div className={s.allDay}>
          <span className={s.gutter}>Sin hora</span>
          {semana.map(fecha => <ul key={fecha} className={s.allDayCell} aria-label={`Sin hora el ${dayLabel(fecha)}`}>
            {eventos.filter(e => e.fecha === fecha && !e.hora).map(e => <li key={e.id}><button type="button" className={cn(s.chip, e.tipo === "visita" && s.chipVisit)} aria-label={`Ver evento: ${e.titulo}`} onClick={() => openEvent(fecha)}>{e.titulo}</button></li>)}
            {tareas.filter(t => t.vence === fecha).map(t => <li key={t.id}><Link className={cn(s.chip, s.chipTask)} href={`/admin/tareas/${encodeURIComponent(t.id)}`}>Tarea: {t.titulo}</Link></li>)}
            {followups.filter(f => f.fecha === fecha).map(f => <li key={f.id}><Link className={cn(s.chip, s.chipTask)} href={f.href}>Seguimiento: {f.personName}</Link></li>)}
          </ul>)}
        </div>
        <div className={s.grid}>
          <div className={s.hours} aria-hidden="true">{hours.map(h => <span key={h} style={{ height: HOUR_HEIGHT }}>{String(h).padStart(2, "0")}:00</span>)}</div>
          {/* Tocar un hueco abre «Agendar» con ese día y esa hora; con teclado, el botón «Agendar» hace lo mismo. */}
          {semana.map(fecha => <div key={fecha} className={cn(s.column, fecha === hoy && s.columnToday)} title="Toca un hueco para agendar a esa hora" onClick={event => slotAt(fecha, event)} style={{ height: hours.length * HOUR_HEIGHT, backgroundSize: `100% ${HOUR_HEIGHT}px` }}>
            {placeEvents(eventos.filter(e => e.fecha === fecha), range.start).map(p => <button key={p.event.id} type="button" aria-label={`Ver evento: ${p.event.titulo}`} onClick={() => openEvent(fecha)}
              className={cn(s.block, p.event.tipo === "visita" && s.blockVisit)}
              style={{ top: p.top, height: p.height, left: `calc(${(p.lane / p.lanes) * 100}% + 4px)`, width: `calc(${100 / p.lanes}% - 8px)` }}>
              <span className={s.blockTitle} title={p.event.titulo}><span className="tabular-nums">{p.event.hora}</span> {p.event.titulo}</span>
            </button>)}
          </div>)}
        </div>
      </div></div>
    </section>

    <div className={s.bottom}>
      <section aria-labelledby="calendar-selected-day" className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 id="calendar-selected-day" tabIndex={-1} className="m-0 scroll-mt-24 text-xl">{dayTitle(seleccion)}</h2>
          <p className="text-sm text-muted-foreground">{daySummary(delDia) ?? "Sin citas"}{tareasDelDia.length ? ` · ${tareasDelDia.length} ${tareasDelDia.length === 1 ? "tarea vence" : "tareas vencen"}` : ""}</p>
        </div>
        {delDia.length > 0 ? <ol className="flex flex-col gap-2.5">{delDia.map(evento => <li key={evento.id} className={cn(s.dayItem, evento.tipo === "visita" && s.dayItemVisit)}>
          <span className={s.dayTime}>{evento.hora ?? "Sin hora"}<span className={s.dayKind}>{EVENTO_TIPO_LABELS[evento.tipo]}</span></span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-semibold [overflow-wrap:anywhere]">{evento.titulo}</span>
            <EventContext references={evento} context={calendarContext} />
          </span>
          <details className={s.eventMenu}>
            <summary aria-label={`Más opciones de ${evento.titulo}`}><MoreHorizontal size={18} aria-hidden="true" /></summary>
            <div className={s.eventMenuBody}><AsyncButton type="button" aria-label={`Eliminar ${evento.titulo}`} className={s.eventDelete} onClick={() => removeEvent(evento)}><Trash2 size={16} aria-hidden="true" />Eliminar</AsyncButton></div>
          </details>
        </li>)}</ol> : <div className={s.free}><p className="font-semibold text-foreground">Sin citas este día</p><Button onClick={() => openCapture(seleccion)}>Agendar algo</Button></div>}
        {removed && <Notice tone="info" title={`Se eliminó «${removed.titulo}».`} actions={<><AsyncButton type="button" className="min-h-11 rounded-md px-3 text-sm font-semibold underline underline-offset-4" onClick={undoRemove}>Deshacer</AsyncButton><Button variant="ghost" onClick={() => setRemoved(null)}>Cerrar aviso</Button></>} />}
        {tareasDelDia.length > 0 && <section aria-label="Vencimientos de tareas"><h3 className="text-sm font-semibold">Tareas que vencen este día</h3>
          <ul className="mt-1">{tareasDelDia.map(t => <li key={t.id}><Link href={`/admin/tareas/${t.id}`} className={s.link}><span>{t.titulo}</span><span className="text-xs text-muted-foreground">{TASK_STATUSES[t.estado]}</span></Link></li>)}</ul>
        </section>}
        {contactosDelDia.length > 0 && <section aria-label="Próximos contactos"><h3 className="text-sm font-semibold">Seguimientos previstos este día</h3>
          <ul className="mt-1">{contactosDelDia.map(f => <li key={f.id}><Link href={f.href} className={s.link}><span>{f.personName}</span><span className="text-xs text-muted-foreground">{followupLabel(f)} · {asesores.find(a => a.id === f.asesorId)?.nombre ?? "Sin asesor"}</span></Link></li>)}</ul>
        </section>}
      </section>

      <Sheet open={captureOpen} onClose={() => setCaptureOpen(false)} title="Agendar" keepMounted>
        <AsyncForm onSubmit={agendar} onChange={() => { draftEdited.current = true; }} className="space-y-3">
          <Field label="Nuevo evento" htmlFor="cal-titulo"><input id="cal-titulo" name="titulo" required placeholder="Visita a la casa de…" className={inputClass} /></Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Tipo" htmlFor="cal-tipo"><select id="cal-tipo" name="tipo" className={selectClass}>{EVENTO_TIPOS.map(t => <option key={t} value={t}>{EVENTO_TIPO_LABELS[t]}</option>)}</select></Field>
            <Field label="Fecha" htmlFor="cal-fecha"><input id="cal-fecha" name="fecha" type="date" value={captureDate} onChange={event => setCaptureDate(event.currentTarget.value)} required className={inputClass} /></Field>
            <Field label="Hora" htmlFor="cal-hora"><input id="cal-hora" name="hora" type="time" value={captureTime} onChange={event => setCaptureTime(event.currentTarget.value)} className={inputClass} /></Field>
          </div>
          <section aria-label="Contexto del evento" className={s.formContext}>
            <LinkPicker id="cal-vinculo" leads={leads} clientes={clientes} propiedades={propiedades} operations={expedientes}
              value={{ leadId: formReferences.leadId || undefined, clienteId: formReferences.clienteId || undefined, propiedadSlug: formReferences.propiedadSlug || undefined, expedienteId: selectedExpedienteId || requestedExpedienteId || undefined }}
              onChange={(next, operation) => updateLinks(next, operation as Expediente | undefined)} unavailable={requestedExpedienteUnresolved && !requestedExpedienteUnavailable ? { expediente: "Consultando…" } : undefined}
              hint={formReferences.leadId || formReferences.clienteId || formReferences.propiedadSlug || selectedExpedienteId || requestedExpedienteUnresolved ? undefined : "Opcional."} />
            {["leadId", "clienteId", "propiedadSlug"].map(name => <input key={name} type="hidden" name={name} value={formReferences[name as "leadId"] ?? ""} />)}
            <input type="hidden" name="expedienteId" value={selectedExpedienteId} />
            {expedientesStatus === "loading" && <p role="status" className="mt-2 text-xs text-muted-foreground">{requestedExpedienteUnresolved ? "Consultando la operación solicitada. Puedes seguir capturando mientras se confirma." : "Consultando operaciones…"}</p>}
            <div className="mt-2"><ErrorNotice error={expedientesError} /></div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(expedientesStatus === "error" || requestedExpedienteUnavailable) && <Button onClick={retryExpedientes}>Reintentar consulta de operaciones</Button>}
              {requestedExpedienteUnresolved && <Button onClick={withdrawRequestedExpediente}>Quitar operación solicitada</Button>}
            </div>
          </section>
          <Field label="Asesor (opcional)" htmlFor="cal-asesor" hint={selectedExpedienteId ? "Lo pone la operación; si lo cambias, la operación se desvincula." : formReferences.asesorId && formReferences.asesorId === me ? "Tú, salvo que elijas a otra persona." : undefined}><select value={formReferences.asesorId ?? ""} onChange={updateReference} id="cal-asesor" name="asesorId" className={selectClass}><option value="">Ninguno</option>{asesores.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
          <Button type="submit" variant="primary" disabled={requestedExpedienteUnresolved} className="w-full">Guardar en la agenda</Button>
        </AsyncForm>
      </Sheet>
    </div>
  </div>;
}

function EventContext({ references, context }: { references: References; context: Context }) {
  const lead = context.leads.find(row => row.id === references.leadId);
  const cliente = context.clientes.find(row => row.id === references.clienteId);
  const propiedad = context.propiedades.find(row => row.slug === references.propiedadSlug);
  const expediente = context.expedientes.find(row => row.id === references.expedienteId);
  const asesor = context.asesores.find(row => row.id === references.asesorId);
  if (!lead && !cliente && !propiedad && !expediente && !asesor) return null;
  return <span className={s.context}>
    {lead && <Link href={`/admin/leads/${encodeURIComponent(lead.id)}`}>{lead.nombre}</Link>}
    {cliente && <Link href={`/admin/clientes/${encodeURIComponent(cliente.id)}`}>Cliente: {cliente.nombre}</Link>}
    {propiedad && <Link href={`/admin/propiedades/${encodeURIComponent(propiedad.slug)}/editar`}>{propiedad.titulo}</Link>}
    {expediente && <Link href={`/admin/operaciones/${encodeURIComponent(expediente.id)}`}>Operación: {expediente.folio}</Link>}
    {asesor && <span>Asesor: {asesor.nombre}</span>}
  </span>;
}
