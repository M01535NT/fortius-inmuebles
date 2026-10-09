"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen, TASK_STATUSES } from "@/lib/tasks";

import {
  Badge,
  Field,
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

export default function CalendarioPage() {
  useQuickCreate("/admin/calendario", () => document.getElementById("cal-titulo")?.focus());
  const eventos = useCollection(db.eventos);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const tareas = useCollection(db.tareas).filter(isTaskOpen);
  const [expedientes, setExpedientes] = React.useState<{ id: string; folio: string; cliente_id: string; propiedad_slug: string | null; asesor_id: string }[]>([]);
  const [selectedExpedienteId, setSelectedExpedienteId] = React.useState("");
  React.useEffect(() => {
    let active = true;
    fetch("/api/admin/expedientes", { credentials: "same-origin", cache: "no-store" })
      .then(response => response.ok ? response.json() : { expedientes: [] })
      .then(result => { if (active) {
        const rows = Array.isArray(result.expedientes) ? result.expedientes : [];
        setExpedientes(rows);
        const requested = new URLSearchParams(window.location.search).get("expediente");
        if (rows.some((row: { id: string }) => row.id === requested)) setSelectedExpedienteId(requested!);
      } })
      .catch(() => { if (active) setExpedientes([]); });
    return () => { active = false; };
  }, []);
  const followups = projectFollowups(leads, clientes);
  const hoy = operationalDate();
  const [cursor, setCursor] = React.useState(() => {
    const [year, month] = hoy.split("-").map(Number);
    return { year, month: month - 1 };
  });
  const [seleccion, setSeleccion] = React.useState(hoy);
  const [context,setContext] = React.useState<Record<string,string>>({});
  React.useEffect(()=>{
    // Hydrate URL navigation after mounting the authenticated calendar.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params=new URLSearchParams(window.location.search);
    const date=params.get("fecha");
    if(date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))){
      setSeleccion(date);const [year,month]=date.split("-").map(Number);setCursor({year,month:month-1});
    }
    setContext(Object.fromEntries(["leadId","clienteId","propiedadSlug"].map(key=>[key,params.get(key)??""])));
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

  function mover(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  }

  async function agendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const expediente = expedientes.find(x => x.id === data.get("expedienteId"));
    await upsert(
      db.eventos,
      {
        id: uid(),
        titulo: String(data.get("titulo") ?? ""),
        fecha: String(data.get("fecha") ?? seleccion),
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
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Calendario"
        actions={<button type="button" className={btnPrimary} onClick={() => { document.getElementById("cal-titulo")?.focus(); document.getElementById("cal-titulo")?.scrollIntoView({ block: "center" }); }}>Nueva visita o evento</button>}
        description="Visitas, llamadas, firmas y reuniones del equipo. Horario de Tijuana."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        {/* Mes */}
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
                    onClick={() => setSeleccion(fecha)}
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

        {/* Día seleccionado */}
        <section aria-labelledby="calendar-selected-day" className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 id="calendar-selected-day" className="display-soft text-lg text-foreground">
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
                        {expediente ? <Link href={`/admin/expedientes?expediente=${encodeURIComponent(expediente.id)}`} className="inline-flex min-h-11 items-center text-primary-ink hover:text-foreground">Expediente: {expediente.folio}</Link> : null}
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
            className="mt-5 space-y-3 border-t border-border pt-5"
          >
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
                  defaultValue={seleccion}
                  key={seleccion}
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
                <select key={context.leadId} defaultValue={leads.some(l=>l.id===context.leadId)?context.leadId:""} id="cal-lead" name="leadId" className={selectClass}>
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
                <select key={context.clienteId} defaultValue={clientes.some(c=>c.id===context.clienteId)?context.clienteId:""} id="cal-cliente" name="clienteId" className={selectClass}><option value="">Ninguno</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
              </Field>
              <Field label="Inmueble (opcional)" htmlFor="cal-propiedad">
                <select key={context.propiedadSlug} defaultValue={propiedades.some(p=>p.slug===context.propiedadSlug)?context.propiedadSlug:""} id="cal-propiedad" name="propiedadSlug" className={selectClass}><option value="">Ninguno</option>{propiedades.map(p => <option key={p.slug} value={p.slug}>{p.codigo} · {p.titulo}</option>)}</select>
              </Field>
              <Field label="Expediente (opcional)" htmlFor="cal-expediente">
                <select id="cal-expediente" name="expedienteId" value={selectedExpedienteId} className={selectClass} onChange={event => {
                  setSelectedExpedienteId(event.currentTarget.value);
                  const selected = expedientes.find(x => x.id === event.currentTarget.value);
                  const form = event.currentTarget.form;
                  if (!selected || !form) return;
                  for (const [name, value] of [["clienteId", selected.cliente_id], ["propiedadSlug", selected.propiedad_slug ?? ""], ["asesorId", selected.asesor_id], ["leadId", ""]]) {
                    const field = form.elements.namedItem(name);
                    if (field instanceof HTMLSelectElement) field.value = value;
                  }
                }}><option value="">Ninguno</option>{expedientes.map(x => <option key={x.id} value={x.id}>{x.folio}</option>)}</select>
              </Field>
              <Field label="Asesor (opcional)" htmlFor="cal-asesor">
                <select id="cal-asesor" name="asesorId" className={selectClass}><option value="">Ninguno</option>{asesores.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
              </Field>
            </div>
            {selectedExpedienteId ? <p className="text-xs text-muted-foreground">El expediente vincula automáticamente al cliente, inmueble y asesor al guardar el evento.</p> : null}
            <button type="submit" className={btnPrimary + " w-full"}>
              Agendar
            </button>
          </AsyncForm>
        </section>
      </div>
    </div>
  );
}
