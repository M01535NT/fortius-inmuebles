"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "@/components/admin/icons";
import { Button, Card } from "@/components/admin/kit";
import { AsyncButton, AsyncForm, ErrorNotice, Field, inputClass, selectClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { calendarWeekDays, isCalendarDate, shiftCalendarDate } from "@/lib/admin/calendar-dates";
import { HOUR_HEIGHT, dayLabel, daySummary, dayTitle, hourRange, placeEvents, weekTitle, weekdayShort } from "@/lib/admin/agenda-view";
import { isTaskOpen, TASK_STATUSES } from "@/lib/tasks";
import { EVENTO_TIPOS, EVENTO_TIPO_LABELS, db, removeById, uid, upsert, useCollection, type AdminProperty, type Asesor, type Cliente, type Evento, type EventoTipo, type Lead } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import s from "./agenda.module.css";

/*
  Agenda (lienzo: AgendaEscritorio y AgendaMovil). Semana por horas en computadora; en
  celular, la tira de días y la lista del día elegido. Las visitas van en guinda. Las
  tareas con fecha y los próximos contactos se muestran sin crear eventos. «?fecha=»,
  «?expediente=», «?leadId=», «?clienteId=», «?propiedadSlug=», «?asesorId=» y «?nueva=1»
  preparan la captura.
*/

type Expediente = { id: string; folio: string; cliente_id: string; propiedad_slug: string | null; asesor_id: string };
type References = Pick<Evento, "leadId" | "clienteId" | "propiedadSlug" | "expedienteId" | "asesorId">;
type Context = { leads: Lead[]; clientes: Cliente[]; propiedades: AdminProperty[]; asesores: Asesor[]; expedientes: Expediente[] };

export function AgendaCalendar() {
  useQuickCreate("visita", () => focusCapture());
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
  const followups = projectFollowups(leads, clientes);
  const hoy = operationalDate();
  const [seleccion, setSeleccion] = React.useState(hoy);
  const [captureDate, setCaptureDate] = React.useState(hoy);
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
    if (params.get("nueva") === "1") document.getElementById("cal-titulo")?.focus();
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
      ? "La operación solicitada no está disponible. Reintenta la consulta o quita ese vínculo para continuar."
      : null;
  const formReferences = formContext ?? (selectedExpediente ? { clienteId: selectedExpediente.cliente_id, propiedadSlug: selectedExpediente.propiedad_slug ?? "", asesorId: selectedExpediente.asesor_id, leadId: "" } : context);
  const selectedReferences: References = selectedExpediente
    ? { expedienteId: selectedExpediente.id, clienteId: selectedExpediente.cliente_id, propiedadSlug: selectedExpediente.propiedad_slug ?? undefined, asesorId: selectedExpediente.asesor_id }
    : { ...(formContext ?? context), expedienteId: selectedExpedienteId || undefined };

  function focusCapture() {
    const title = document.getElementById("cal-titulo");
    title?.focus();
    title?.scrollIntoView?.({ block: "center" });
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
      hora: String(data.get("hora") ?? "") || undefined,
      tipo: String(data.get("tipo") ?? "otro") as EventoTipo,
      leadId: expediente ? undefined : String(data.get("leadId") ?? "") || undefined,
      clienteId: (expediente?.cliente_id ?? String(data.get("clienteId") ?? "")) || undefined,
      propiedadSlug: (expediente?.propiedad_slug ?? String(data.get("propiedadSlug") ?? "")) || undefined,
      expedienteId: String(data.get("expedienteId") ?? "") || undefined,
      asesorId: (expediente?.asesor_id ?? String(data.get("asesorId") ?? "")) || undefined,
    }, null);
    form.reset();
    setFormContext(selectedExpediente ? { clienteId: selectedExpediente.cliente_id, propiedadSlug: selectedExpediente.propiedad_slug ?? "", asesorId: selectedExpediente.asesor_id, leadId: "" } : { ...context });
    setCaptureDate(seleccion);
    draftEdited.current = false;
  }

  return <div className="flex min-w-0 flex-col gap-5">
    <div className={s.toolbar}>
      <p className="text-muted-foreground"><span className="font-semibold text-foreground">{weekTitle(semana)}</span>{` · ${visits} ${visits === 1 ? "visita" : "visitas"}`}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button iconOnly aria-label="Semana anterior" onClick={() => selectDay(shiftCalendarDate(seleccion, -7))}><ChevronLeft size={20} aria-hidden="true" /></Button>
        <Button onClick={() => selectDay(hoy)}>Hoy</Button>
        <Button iconOnly aria-label="Semana siguiente" onClick={() => selectDay(shiftCalendarDate(seleccion, 7))}><ChevronRight size={20} aria-hidden="true" /></Button>
        <Button className="ml-2" onClick={focusCapture}><Plus size={16} aria-hidden="true" />Agendar</Button>
      </div>
    </div>
    <div className={s.legend} aria-hidden="true"><span><i className={s.swatchVisit} />Visita</span><span><i className={s.swatchOther} />Cita o llamada</span><span><i className={s.swatchTask} />Tarea o seguimiento</span></div>

    <section aria-label="Agenda semanal" className={s.weekCard}>
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
          {semana.map(fecha => <div key={fecha} className={cn(s.column, fecha === hoy && s.columnToday)} style={{ height: hours.length * HOUR_HEIGHT, backgroundSize: `100% ${HOUR_HEIGHT}px` }}>
            {placeEvents(eventos.filter(e => e.fecha === fecha), range.start).map(p => <button key={p.event.id} type="button" aria-label={`Ver evento: ${p.event.titulo}`} onClick={() => openEvent(fecha)}
              className={cn(s.block, p.event.tipo === "visita" && s.blockVisit)}
              style={{ top: p.top, height: p.height, left: `calc(${(p.lane / p.lanes) * 100}% + 4px)`, width: `calc(${100 / p.lanes}% - 8px)` }}>
              <span className={s.blockTitle} title={p.event.titulo}><span className="font-mono">{p.event.hora}</span> {p.event.titulo}</span>
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
          <span className={s.dayTime}>{evento.hora ?? "Sin hora"}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className={s.dayKind}>{EVENTO_TIPO_LABELS[evento.tipo]}</span>
            <span className="font-semibold [overflow-wrap:anywhere]">{evento.titulo}</span>
            <EventContext references={evento} context={calendarContext} />
          </span>
          <AsyncButton type="button" aria-label={`Eliminar ${evento.titulo}`} className={s.remove} onClick={async () => {
            if (await confirmAction("¿Eliminar este evento?")) await removeById(db.eventos, evento.id, db.eventos.version(evento));
          }}><Trash2 size={16} aria-hidden="true" /></AsyncButton>
        </li>)}</ol> : <div className={s.free}><p className="font-semibold text-foreground">Sin citas este día</p><Button onClick={focusCapture}>Agendar algo</Button></div>}
        {tareasDelDia.length > 0 && <section aria-label="Vencimientos de tareas"><h3 className="text-sm font-semibold">Tareas que vencen este día</h3>
          <ul className="mt-1">{tareasDelDia.map(t => <li key={t.id}><Link href={`/admin/tareas/${t.id}`} className={s.link}><span>{t.titulo}</span><span className="text-xs text-muted-foreground">{TASK_STATUSES[t.estado]}</span></Link></li>)}</ul>
        </section>}
        {contactosDelDia.length > 0 && <section aria-label="Próximos contactos"><h3 className="text-sm font-semibold">Seguimientos previstos este día</h3>
          <ul className="mt-1">{contactosDelDia.map(f => <li key={f.id}><Link href={f.href} className={s.link}><span>{f.personName}</span><span className="text-xs text-muted-foreground">{f.kind === "cliente" ? "Cliente" : "Prospecto"} · {asesores.find(a => a.id === f.asesorId)?.nombre ?? "Sin asesor"}</span></Link></li>)}</ul>
        </section>}
      </section>

      <Card as="section" aria-labelledby="agendar-titulo" className="min-w-0 p-4 sm:p-5">
        <h2 id="agendar-titulo" className="m-0 text-lg">Agendar</h2>
        <AsyncForm onSubmit={agendar} onChange={() => { draftEdited.current = true; }} className="mt-4 space-y-3">
          <section aria-label="Contexto del evento" className={s.formContext}>
            <p className="text-sm font-semibold">Con quién y para qué</p>
            {Object.values(selectedReferences).some(Boolean) ? <EventContext references={selectedReferences} context={calendarContext} /> : !requestedExpedienteUnresolved && <p className="mt-1 text-xs text-muted-foreground">Sin vínculos. Quedará en la agenda del equipo.</p>}
            {expedientesStatus === "loading" && <p role="status" className="mt-2 text-xs text-muted-foreground">{requestedExpedienteUnresolved ? "Consultando la operación solicitada. Puedes seguir capturando mientras se confirma." : "Consultando operaciones…"}</p>}
            <div className="mt-2"><ErrorNotice error={expedientesError} /></div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(expedientesStatus === "error" || requestedExpedienteUnavailable) && <Button onClick={retryExpedientes}>Reintentar consulta de operaciones</Button>}
              {requestedExpedienteUnresolved && <Button onClick={withdrawRequestedExpediente}>Quitar operación solicitada</Button>}
            </div>
          </section>
          <Field label="Nuevo evento" htmlFor="cal-titulo"><input id="cal-titulo" name="titulo" required placeholder="Visita a la casa de…" className={inputClass} /></Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Fecha" htmlFor="cal-fecha"><input id="cal-fecha" name="fecha" type="date" value={captureDate} onChange={event => setCaptureDate(event.currentTarget.value)} required className={inputClass} /></Field>
            <Field label="Hora" htmlFor="cal-hora"><input id="cal-hora" name="hora" type="time" className={inputClass} /></Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="cal-tipo"><select id="cal-tipo" name="tipo" className={selectClass}>{EVENTO_TIPOS.map(t => <option key={t} value={t}>{EVENTO_TIPO_LABELS[t]}</option>)}</select></Field>
            <Field label="Prospecto (opcional)" htmlFor="cal-lead"><select value={formReferences.leadId ?? ""} onChange={updateReference} id="cal-lead" name="leadId" className={selectClass}><option value="">Ninguno</option>{leads.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}</select></Field>
            <Field label="Cliente (opcional)" htmlFor="cal-cliente"><select value={formReferences.clienteId ?? ""} onChange={updateReference} id="cal-cliente" name="clienteId" className={selectClass}><option value="">Ninguno</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
            <Field label="Inmueble (opcional)" htmlFor="cal-propiedad"><select value={formReferences.propiedadSlug ?? ""} onChange={updateReference} id="cal-propiedad" name="propiedadSlug" className={selectClass}><option value="">Ninguno</option>{propiedades.map(p => <option key={p.slug} value={p.slug}>{p.codigo} · {p.titulo}</option>)}</select></Field>
            <Field label="Operación (opcional)" htmlFor="cal-expediente" hint="Si cambias la persona, el inmueble o el asesor, la operación se desvincula.">
              <select id="cal-expediente" name="expedienteId" value={selectedExpedienteId} className={selectClass} onChange={event => {
                referencesEdited.current = true;
                setRequestedExpedienteId("");
                setSelectedExpedienteId(event.currentTarget.value);
                const selected = expedientes.find(x => x.id === event.currentTarget.value);
                if (selected) setFormContext({ clienteId: selected.cliente_id, propiedadSlug: selected.propiedad_slug ?? "", asesorId: selected.asesor_id, leadId: "" });
              }}><option value="">Ninguno</option>{expedientes.map(x => <option key={x.id} value={x.id}>{x.folio}</option>)}</select>
            </Field>
            <Field label="Asesor (opcional)" htmlFor="cal-asesor"><select value={formReferences.asesorId ?? ""} onChange={updateReference} id="cal-asesor" name="asesorId" className={selectClass}><option value="">Ninguno</option>{asesores.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
          </div>
          {selectedExpedienteId ? <p className="text-xs text-muted-foreground">La operación vincula sola al cliente, el inmueble y el asesor al guardar.</p> : null}
          <Button type="submit" variant="primary" disabled={requestedExpedienteUnresolved} className="w-full">Guardar en la agenda</Button>
        </AsyncForm>
      </Card>
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
    {propiedad && <Link href={`/admin/propiedades/${encodeURIComponent(propiedad.slug)}/editar`}>Inmueble: {propiedad.codigo}</Link>}
    {expediente && <Link href={`/admin/operaciones/${encodeURIComponent(expediente.id)}`}>Operación: {expediente.folio}</Link>}
    {asesor && <span>Asesor: {asesor.nombre}</span>}
  </span>;
}
