"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { DayButtonProps } from "react-day-picker";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "@/components/admin/icons";
import { ActionsMenu, Avatar, Button, Kbd, Segmented, Sheet } from "@/components/admin/kit";
import { AsyncForm, ErrorNotice, Field, inputClass } from "@/components/admin/ui";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { DateField } from "@/components/ui/date-field";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/admin/store";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { LinkPicker, type LinkValue } from "@/components/admin/workspace/link-picker";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { useSingleKeyShortcuts } from "@/components/admin/workspace/shortcuts";
import { operationalDate } from "@/lib/admin/operational-date";
import { followupLabel, projectFollowups } from "@/lib/admin/followups";
import { useTodayData } from "@/components/admin/workspace/use-today-queue";
import { calendarWeekDays, isCalendarDate, shiftCalendarDate } from "@/lib/admin/calendar-dates";
import { HOUR_HEIGHT, dayLabel, daySummary, dayTitle, hourRange, placeEvents, weekTitle, weekdayShort } from "@/lib/admin/agenda-view";
import { isTaskOpen, TASK_STATUSES } from "@/lib/tasks";
import { EVENTO_TIPOS, EVENTO_TIPO_LABELS, db, removeById, uid, upsert, useCollection, type Evento, type EventoTipo } from "@/lib/admin/store";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import { cn } from "@/lib/utils";
import { adviserPhoto, RefLinks, RefMedia, resolveRefs, useAgendaKeys, type AgendaContext, type AgendaExpediente } from "./agenda-parts";
import { EventDetail } from "./event-detail";
import { useNotify } from "./notify";
import s from "./agenda.module.css";

/*
  Agenda (LV-10g, sistema de DEC-51 con el lenguaje de Trámites). Semana por horas o mes en
  computadora; en celular, la tira de días (o el mes) y la lista del día elegido. Las visitas van en
  el azul de información (RP-70). Cada cita lleva la cara de la persona y la foto del inmueble, y al
  tocarla abre su detalle en el panel del kit con «Lo que sigue». Las tareas con fecha y los próximos
  contactos se muestran sin crear eventos. Agendar es un panel (SIM-09, C25) que se abre con
  «Agendar», con «+ Nuevo», con la tecla A o al tocar un hueco de la semana, con la fecha y la hora ya
  puestas; el asesor es quien agenda, salvo que lo cambie. Cerrar el panel no borra lo escrito.
  «?fecha=», «?expediente=», «?leadId=», «?clienteId=», «?propiedadSlug=», «?asesorId=» y «?nueva=1»
  preparan la captura y la abren. Atajos (apagables con los de una tecla): T hoy, ← → semana o mes,
  S semana, M mes, A agendar.
*/

type View = "semana" | "mes";
const toDate = (iso: string) => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shiftMonth = (iso: string, by: number) => {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)) - 1 + by, d = Number(iso.slice(8, 10));
  const last = new Date(y, m + 1, 0).getDate();
  return toIso(new Date(y, m, Math.min(d, last)));
};
const MONTH_TITLE = (iso: string) => { const t = toDate(iso).toLocaleDateString("es-MX", { month: "long", year: "numeric" }); return t.charAt(0).toUpperCase() + t.slice(1); };

export function AgendaCalendar() {
  useQuickCreate("visita", () => openCapture());
  const eventos = useCollection(db.eventos);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const todasLasTareas = useCollection(db.tareas);
  const tareas = todasLasTareas.filter(isTaskOpen);
  const reduce = useReducedMotionSafe();
  const { value: keysOn } = useSingleKeyShortcuts();
  const [expedientes, setExpedientes] = React.useState<AgendaExpediente[]>([]);
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
        if (!response.ok) throw new Error("No se pudieron consultar los asuntos.");
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
  const followups = projectFollowups(leads, clientes, dossiers, todasLasTareas);
  const hoy = operationalDate();
  const [view, setView] = React.useState<View>("semana");
  const [seleccion, setSeleccion] = React.useState(hoy);
  const [captureDate, setCaptureDate] = React.useState(hoy);
  const [captureTime, setCaptureTime] = React.useState("");
  const [captureTipo, setCaptureTipo] = React.useState<EventoTipo>(EVENTO_TIPOS[0]);
  const [captureOpen, setCaptureOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const undo = useUndo();
  const { notify, node: inlineNotice } = useNotify();
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
  const monthPrefix = seleccion.slice(0, 7);
  const visits = (view === "mes" ? eventos.filter(e => e.fecha.startsWith(monthPrefix)) : weekEvents).filter(e => e.tipo === "visita").length;
  const counts = (fecha: string) => ({ events: eventos.filter(e => e.fecha === fecha).length, tasks: tareas.filter(t => t.vence === fecha).length, contacts: followups.filter(f => f.fecha === fecha).length });
  const delDia = eventos.filter(e => e.fecha === seleccion).sort((a, b) => (a.hora || "24:00").localeCompare(b.hora || "24:00") || a.titulo.localeCompare(b.titulo, "es"));
  const tareasDelDia = tareas.filter(t => t.vence === seleccion);
  const contactosDelDia = followups.filter(f => f.fecha === seleccion);
  const detail = eventos.find(e => e.id === detailId) ?? null;

  const calendarContext: AgendaContext = { leads, clientes, propiedades, asesores, expedientes };
  const selectedExpediente = expedientes.find(row => row.id === selectedExpedienteId);
  const requestedExpedienteUnresolved = !!requestedExpedienteId && !selectedExpediente;
  const requestedExpedienteUnavailable = requestedExpedienteUnresolved && expedientesStatus === "ready";
  const expedientesError = expedientesStatus === "error"
    ? "No se pudieron consultar los asuntos. Reintenta la consulta."
    : requestedExpedienteUnavailable
      ? "Ese asunto no está disponible. Reintenta o quita el vínculo."
      : null;
  // Sin asesor en la dirección ni elegido, el evento queda a nombre de quien agenda.
  const baseContext = context.asesorId || !me ? context : { ...context, asesorId: me };
  const formReferences = formContext ?? (selectedExpediente ? { clienteId: selectedExpediente.cliente_id, propiedadSlug: selectedExpediente.propiedad_slug ?? "", asesorId: selectedExpediente.asesor_id, leadId: "" } : baseContext);

  /** Abre el panel de agendar; un hueco de la semana trae su día y su hora si no hay algo escrito. */
  function openCapture(fecha?: string, hora?: string) {
    if (fecha && !draftEdited.current) setCaptureDate(fecha);
    if (hora && !draftEdited.current) setCaptureTime(hora);
    setDetailId(null);
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
    undo.clear();
    try {
      await removeById(db.eventos, evento.id, db.eventos.version(evento));
      setDetailId(current => current === evento.id ? null : current);
      // RP-16: se vuelve a crear con los mismos datos; el borrado no se deshace sobre el registro anterior.
      undo.offer({ text: `Se eliminó «${evento.titulo}».`, undo: () => upsert(db.eventos, { ...evento, id: uid() }, null) });
    } catch (error) {
      notify(`No se pudo eliminar: ${error instanceof Error ? error.message : "intenta de nuevo"}`, "error");
    }
  }
  function selectDay(fecha: string) {
    setSeleccion(fecha);
    if (!draftEdited.current) setCaptureDate(fecha);
  }
  function step(by: number) { selectDay(view === "mes" ? shiftMonth(seleccion, by) : shiftCalendarDate(seleccion, 7 * by)); }
  function openEvent(evento: Evento) {
    setSeleccion(evento.fecha);
    setDetailId(evento.id);
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
  function updateReference(name: "asesorId", value: string) {
    referencesEdited.current = true;
    draftEdited.current = true;
    setRequestedExpedienteId("");
    setFormContext(current => ({ ...(current ?? formReferences), [name]: value }));
    setSelectedExpedienteId("");
  }
  /** «¿Con quién o sobre qué?»: un asunto trae cliente, inmueble y asesor; lo demás lo desvincula. */
  function updateLinks(next: LinkValue, operation?: AgendaExpediente) {
    referencesEdited.current = true;
    draftEdited.current = true;
    setRequestedExpedienteId("");
    setSelectedExpedienteId(next.expedienteId ?? "");
    setFormContext({ leadId: next.leadId ?? "", clienteId: next.clienteId ?? "", propiedadSlug: next.propiedadSlug ?? "", asesorId: operation ? operation.asesor_id : (formReferences.asesorId ?? "") });
  }

  useAgendaKeys(keysOn, {
    t: () => selectDay(hoy),
    a: () => openCapture(seleccion),
    s: () => setView("semana"),
    m: () => setView("mes"),
    ArrowLeft: () => step(-1),
    ArrowRight: () => step(1),
  });

  async function agendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (requestedExpedienteUnresolved) throw new Error("Confirma el asunto solicitado o quita ese vínculo antes de agendar.");
    const form = e.currentTarget;
    const data = new FormData(form);
    const expediente = expedientes.find(x => x.id === data.get("expedienteId"));
    const titulo = String(data.get("titulo") ?? "");
    await upsert(db.eventos, {
      id: uid(),
      titulo,
      fecha: captureDate,
      hora: captureTime || undefined,
      tipo: captureTipo,
      leadId: expediente ? undefined : String(data.get("leadId") ?? "") || undefined,
      clienteId: (expediente?.cliente_id ?? String(data.get("clienteId") ?? "")) || undefined,
      propiedadSlug: (expediente?.propiedad_slug ?? String(data.get("propiedadSlug") ?? "")) || undefined,
      expedienteId: String(data.get("expedienteId") ?? "") || undefined,
      asesorId: (expediente?.asesor_id ?? String(data.get("asesorId") ?? "")) || undefined,
    }, null);
    form.reset();
    setFormContext(selectedExpediente ? { clienteId: selectedExpediente.cliente_id, propiedadSlug: selectedExpediente.propiedad_slug ?? "", asesorId: selectedExpediente.asesor_id, leadId: "" } : { ...baseContext });
    setSeleccion(captureDate);
    setCaptureDate(captureDate);
    setCaptureTime("");
    setCaptureTipo(EVENTO_TIPOS[0]);
    draftEdited.current = false;
    setCaptureOpen(false);
    notify(`Agendado: ${titulo}.`);
  }

  const visitDays = React.useMemo(() => [...new Set(eventos.filter(e => e.tipo === "visita").map(e => e.fecha))].map(toDate), [eventos]);
  const busyDays = React.useMemo(() => [...new Set([...eventos.filter(e => e.tipo !== "visita").map(e => e.fecha), ...tareas.map(t => t.vence).filter(Boolean) as string[], ...followups.map(f => f.fecha)])].map(toDate), [eventos, tareas, followups]);

  const prevLabel = view === "mes" ? "Mes anterior" : "Semana anterior";
  const nextLabel = view === "mes" ? "Mes siguiente" : "Semana siguiente";
  const fade = reduce ? {} : { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const } };

  return <div className="flex min-w-0 flex-col gap-5">
    <div className={s.toolbar}>
      <p className="text-muted-foreground"><span className="font-semibold text-foreground">{view === "mes" ? MONTH_TITLE(seleccion) : weekTitle(semana)}</span>{` · ${visits} ${visits === 1 ? "visita" : "visitas"}`}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Vista de la agenda" value={view} onChange={setView} options={[{ id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }]} />
        <span className="flex items-center gap-1">
          <Button iconOnly aria-label={prevLabel} title={`${prevLabel} (←)`} onClick={() => step(-1)}><ChevronLeft size={20} aria-hidden="true" /></Button>
          <Button onClick={() => selectDay(hoy)} title="Ir a hoy (T)">Hoy</Button>
          <Button iconOnly aria-label={nextLabel} title={`${nextLabel} (→)`} onClick={() => step(1)}><ChevronRight size={20} aria-hidden="true" /></Button>
        </span>
        <Button variant="primary" aria-haspopup="dialog" title="Agendar (A)" onClick={() => openCapture(seleccion)}><Plus size={16} aria-hidden="true" />Agendar</Button>
      </div>
    </div>
    {view === "semana" && <div className={s.legend} aria-hidden="true"><span><i className={s.swatchVisit} />Visita</span><span><i className={s.swatchOther} />Cita o llamada</span><span><i className={s.swatchTask} />Tarea o seguimiento</span>{keysOn && <span className={s.keys}><Kbd>T</Kbd> hoy <Kbd>←</Kbd><Kbd>→</Kbd> semana <Kbd>A</Kbd> agendar</span>}</div>}

    {view === "semana" ? <section aria-label="Agenda semanal" className={s.weekCard}>
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
            {eventos.filter(e => e.fecha === fecha && !e.hora).map(e => <li key={e.id}><button type="button" className={cn(s.chip, e.tipo === "visita" && s.chipVisit)} aria-label={`Ver evento: ${e.titulo}`} onClick={() => openEvent(e)}>{e.titulo}</button></li>)}
            {tareas.filter(t => t.vence === fecha).map(t => <li key={t.id}><Link className={cn(s.chip, s.chipTask)} href={`/admin-anterior/tareas/${encodeURIComponent(t.id)}`}>Tarea: {t.titulo}</Link></li>)}
            {followups.filter(f => f.fecha === fecha).map(f => <li key={f.id}><Link className={cn(s.chip, s.chipTask)} href={f.href}>Seguimiento: {f.personName}</Link></li>)}
          </ul>)}
        </div>
        <div className={s.grid}>
          <div className={s.hours} aria-hidden="true">{hours.map(h => <span key={h} style={{ height: HOUR_HEIGHT }}>{String(h).padStart(2, "0")}:00</span>)}</div>
          {/* Tocar un hueco abre «Agendar» con ese día y esa hora; con teclado, el botón «Agendar» (o la tecla A) hace lo mismo. */}
          {semana.map(fecha => <div key={fecha} className={cn(s.column, fecha === hoy && s.columnToday)} title="Toca un hueco para agendar a esa hora" onClick={event => slotAt(fecha, event)} style={{ height: hours.length * HOUR_HEIGHT, backgroundSize: `100% ${HOUR_HEIGHT}px` }}>
            {placeEvents(eventos.filter(e => e.fecha === fecha), range.start).map(p => {
              const refs = resolveRefs(p.event, calendarContext);
              return <button key={p.event.id} type="button" aria-label={`Ver evento: ${p.event.titulo}`} onClick={() => openEvent(p.event)}
                className={cn(s.block, p.event.tipo === "visita" && s.blockVisit)}
                style={{ top: p.top, height: p.height, left: `calc(${(p.lane / p.lanes) * 100}% + 4px)`, width: `calc(${100 / p.lanes}% - 8px)` }}>
                <span className={s.blockTitle} title={p.event.titulo}><span className="tabular-nums">{p.event.hora}</span> {p.event.titulo}</span>
                {refs.person && p.lanes === 1 && <span className={s.blockWho}><Avatar name={refs.person.name} size={16} />{refs.person.name}</span>}
              </button>;
            })}
          </div>)}
        </div>
      </div></div>
    </section> : <section aria-label="Agenda del mes" className={s.monthCard}>
      <DayCounts.Provider value={counts}><Calendar mode="single" required selected={toDate(seleccion)} month={toDate(seleccion)} onMonthChange={month => selectDay(toIso(new Date(month.getFullYear(), month.getMonth(), 1)))}
        onSelect={(day?: Date) => { if (day) selectDay(toIso(day)); }} hideNavigation
        modifiers={{ visita: visitDays, ocupado: busyDays }} components={MONTH_COMPONENTS}
        className={s.month} classNames={{ root: "w-full", months: "relative flex w-full flex-col", month: "flex w-full flex-col gap-2", month_caption: "sr-only" }} /></DayCounts.Provider>
    </section>}

    <div className={s.bottom}>
      <section aria-labelledby="calendar-selected-day" className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 id="calendar-selected-day" tabIndex={-1} className="m-0 scroll-mt-24 text-xl">{dayTitle(seleccion)}</h2>
          <p className="text-sm text-muted-foreground">{daySummary(delDia) ?? "Sin citas"}{tareasDelDia.length ? ` · ${tareasDelDia.length} ${tareasDelDia.length === 1 ? "tarea vence" : "tareas vencen"}` : ""}</p>
        </div>
        {delDia.length > 0 ? <ol className="flex flex-col gap-2.5"><AnimatePresence initial={false}>{delDia.map(evento => {
          const refs = resolveRefs(evento, calendarContext);
          const past = evento.fecha === hoy && !!evento.hora && evento.hora < nowTime();
          return <motion.li layout={!reduce} key={evento.id} {...fade} className={cn(s.dayItem, evento.tipo === "visita" && s.dayItemVisit, past && s.dayItemPast)}>
            <span className={s.dayTime}>{evento.hora ?? "Sin hora"}<span className={s.dayKind}>{EVENTO_TIPO_LABELS[evento.tipo]}</span></span>
            <RefMedia refs={refs} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <button type="button" className={s.dayOpen} onClick={() => openEvent(evento)} aria-label={`Abrir ${evento.titulo}`}><span className="font-semibold [overflow-wrap:anywhere]">{evento.titulo}</span></button>
              <RefLinks refs={refs} />
            </span>
            <ActionsMenu label={`Más opciones de ${evento.titulo}`} actions={[
              { label: "Ver detalle", onSelect: () => openEvent(evento) },
              { label: "Eliminar", icon: <Trash2 size={16} aria-hidden="true" />, danger: true, separated: true, onSelect: () => void removeEvent(evento) },
            ]} />
          </motion.li>;
        })}</AnimatePresence></ol> : <div className={s.free}><p className="font-semibold text-foreground">Sin citas este día</p><Button onClick={() => openCapture(seleccion)}>Agendar algo</Button></div>}
        <UndoNotice {...undo} onError={message => notify(message, "error")} />
        {inlineNotice}
      </section>

      <aside className="flex min-w-0 flex-col gap-4" aria-label="También este día">
        {tareasDelDia.length > 0 && <section aria-label="Vencimientos de tareas" className={s.sideCard}><h3>Tareas que vencen este día</h3>
          <ul>{tareasDelDia.map(t => { const refs = resolveRefs(t, calendarContext); return <li key={t.id}><Link href={`/admin-anterior/tareas/${t.id}`} className={s.link}><RefMedia refs={refs} size={32} /><span className="flex min-w-0 flex-col"><span>{t.titulo}</span><span className="text-xs text-muted-foreground">{TASK_STATUSES[t.estado]}</span></span></Link></li>; })}</ul>
        </section>}
        {contactosDelDia.length > 0 && <section aria-label="Próximos contactos" className={s.sideCard}><h3>Seguimientos previstos este día</h3>
          <ul>{contactosDelDia.map(f => <li key={f.id}><Link href={f.href} className={s.link}><Avatar name={f.personName} size={32} /><span className="flex min-w-0 flex-col"><span>{f.personName}</span><span className="text-xs text-muted-foreground">{followupLabel(f)} · {asesores.find(a => a.id === f.asesorId)?.nombre ?? "Sin asesor"}</span></span></Link></li>)}</ul>
        </section>}
      </aside>
    </div>

    <EventDetail evento={detail} eventos={eventos} tareas={tareas} followups={followups} context={calendarContext} today={hoy} onClose={() => setDetailId(null)} onDelete={evento => void removeEvent(evento)} />

    <Sheet open={captureOpen} onClose={() => setCaptureOpen(false)} title="Agendar" keepMounted>
      <AsyncForm onSubmit={agendar} onChange={() => { draftEdited.current = true; }} className="space-y-3">
        <Field label="Nuevo evento" htmlFor="cal-titulo"><input id="cal-titulo" name="titulo" required placeholder="Visita a la casa de…" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" htmlFor="cal-fecha" className="col-span-2"><DateField id="cal-fecha" name="fecha" value={captureDate} onChange={value => { draftEdited.current = true; setCaptureDate(value || captureDate); }} required /></Field>
          <Field label="Tipo" htmlFor="cal-tipo">
            <Select value={captureTipo} onValueChange={value => { draftEdited.current = true; setCaptureTipo(value as EventoTipo); }}>
              <SelectTrigger id="cal-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>{EVENTO_TIPOS.map(t => <SelectItem key={t} value={t}><i aria-hidden="true" className={cn(s.kindDot, t === "visita" && s.dotVisit)} />{EVENTO_TIPO_LABELS[t]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Hora" htmlFor="cal-hora"><input id="cal-hora" name="hora" type="time" value={captureTime} onChange={event => setCaptureTime(event.currentTarget.value)} className={inputClass} /></Field>
        </div>
        <section aria-label="Contexto del evento" className={s.formContext}>
          <LinkPicker id="cal-vinculo" leads={leads} clientes={clientes} propiedades={propiedades} operations={expedientes}
            value={{ leadId: formReferences.leadId || undefined, clienteId: formReferences.clienteId || undefined, propiedadSlug: formReferences.propiedadSlug || undefined, expedienteId: selectedExpedienteId || requestedExpedienteId || undefined }}
            onChange={(next, operation) => updateLinks(next, operation as AgendaExpediente | undefined)} unavailable={requestedExpedienteUnresolved && !requestedExpedienteUnavailable ? { expediente: "Consultando…" } : undefined}
            hint={formReferences.leadId || formReferences.clienteId || formReferences.propiedadSlug || selectedExpedienteId || requestedExpedienteUnresolved ? undefined : "Opcional."} />
          {["leadId", "clienteId", "propiedadSlug"].map(name => <input key={name} type="hidden" name={name} value={formReferences[name as "leadId"] ?? ""} />)}
          <input type="hidden" name="expedienteId" value={selectedExpedienteId} />
          {expedientesStatus === "loading" && <p role="status" className="mt-2 text-xs text-muted-foreground">{requestedExpedienteUnresolved ? "Consultando el asunto solicitado. Puedes seguir capturando mientras se confirma." : "Consultando asuntos…"}</p>}
          <div className="mt-2"><ErrorNotice error={expedientesError} /></div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(expedientesStatus === "error" || requestedExpedienteUnavailable) && <Button onClick={retryExpedientes}>Reintentar consulta de asuntos</Button>}
            {requestedExpedienteUnresolved && <Button onClick={withdrawRequestedExpediente}>Quitar asunto solicitado</Button>}
          </div>
        </section>
        <Field label="Asesor (opcional)" htmlFor="cal-asesor" hint={selectedExpedienteId ? "Lo pone el asunto; si lo cambias, el asunto se desvincula." : formReferences.asesorId && formReferences.asesorId === me ? "Tú, salvo que elijas a otra persona." : undefined}>
          <Combobox id="cal-asesor" name="asesorId" value={formReferences.asesorId ?? ""} onChange={value => updateReference("asesorId", value)} placeholder="Ninguno" searchPlaceholder="Buscar asesor…"
            options={[{ value: "", label: "Ninguno" }, ...asesores.filter(a => a.activo || a.id === formReferences.asesorId).map(a => ({ value: a.id, label: a.nombre, media: <Avatar name={a.nombre} src={adviserPhoto(a)} size={24} /> }))]} />
        </Field>
        <Button type="submit" variant="primary" disabled={requestedExpedienteUnresolved} className="w-full">Guardar en la agenda</Button>
      </AsyncForm>
    </Sheet>
  </div>;
}

/* El día del mes con su punto y su nombre accesible con lo que tiene. Es un componente estable (no se
   vuelve a montar en cada render, para no perder el foco); lee las cuentas del día por contexto. */
type Counts = { events: number; tasks: number; contacts: number };
const DayCounts = React.createContext<(iso: string) => Counts>(() => ({ events: 0, tasks: 0, contacts: 0 }));
function MonthDayButton(props: DayButtonProps) {
  const counts = React.useContext(DayCounts);
  const iso = toIso(props.day.date);
  const c = counts(iso);
  const total = c.events + c.tasks + c.contacts;
  return <CalendarDayButton {...props} aria-label={`${dayLabel(iso)}${c.events ? `, ${c.events} eventos` : ""}${c.tasks ? `, ${c.tasks} tareas` : ""}${c.contacts ? `, ${c.contacts} contactos` : ""}`}>
    {props.children}
    <i aria-hidden="true" className={cn(s.monthDot, props.modifiers.visita ? s.dotVisit : total ? s.dotOther : "")} />
  </CalendarDayButton>;
}

// Estable a nivel de módulo: el calendario del kit ya fija su raíz (no se vuelve a montar en cada render).
const MONTH_COMPONENTS = { DayButton: MonthDayButton };

/** Hora de Tijuana «HH:mm», para atenuar las citas de hoy que ya pasaron. */
function nowTime() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Tijuana", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
}
