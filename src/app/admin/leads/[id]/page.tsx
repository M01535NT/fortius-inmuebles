"use client";
import { LeadProfileEditor } from "@/components/admin/lead-profile-editor";
import { ConvertLeadButton } from "@/components/admin/convert-lead-button";
import { AsyncForm, AsyncButton, AsyncSelect } from "@/components/admin/ui";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, Trash2 } from "lucide-react";

import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  btnDanger,
  btnGhost,
  btnPrimary,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  EVENTO_TIPOS,
  EVENTO_TIPO_LABELS,
  LEAD_ESTADOS,
  LEAD_ESTADO_LABELS,
  LEAD_ORIGEN_LABELS,
  db,
  fechaCorta,
  removeById,
  uid,
  upsert,
  useCollection,
  type EventoTipo,
  type LeadEstado,
  type Lead,
} from "@/lib/admin/store";

/*
  Expediente del lead: datos, pipeline, asignación, notas con historial y
  agenda vinculada. Es la vista de trabajo diario del asesor.
*/
export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <LeadDetail key={id} id={id} />;
}

function LeadDetail({ id }: { id: string }) {
  const router = useRouter();
  const leads = useCollection(db.leads);
  const asesores = useCollection(db.asesores);
  const propiedades = useCollection(db.propiedades);
  const eventos = useCollection(db.eventos);
  const [profileDraft, setProfileDraft] = React.useState<Lead | null>(null);
  const [noteDirty, setNoteDirty] = React.useState(false);
  const [agendaDirty, setAgendaDirty] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState<{
    lead: Lead;
    version: number | null;
  } | null>(null);

  const lead = leads.find((l) => l.id === id) ?? noteDraft?.lead ?? profileDraft;

  if (!lead) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead no encontrado." />
        <EmptyState title="Este lead no existe o fue eliminado." />
        <Link href="/admin/leads" className={btnGhost}>
          Volver a leads
        </Link>
      </div>
    );
  }

  const propiedad = propiedades.find((p) => p.slug === lead.propiedadSlug);
  const eventosDelLead = eventos
    .filter((e) => e.leadId === lead.id)
    .sort((a, b) =>
      (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")),
    );

  async function agregarNota(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lead) return;
    const form = e.currentTarget;
    const texto = String(new FormData(form).get("nota") ?? "").trim();
    if (!texto) return;
    const base = noteDraft?.lead ?? lead;
    await upsert(
      db.leads,
      {
        ...base,
        notas: [
          { id: uid(), texto, fecha: new Date().toISOString() },
          ...base.notas,
        ],
      },
      noteDraft ? noteDraft.version : db.leads.version(base),
    );
    form.reset();
    setNoteDraft(null);
    setNoteDirty(false);
  }

  async function agendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lead) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    await upsert(
      db.eventos,
      {
        id: uid(),
        titulo: String(data.get("titulo") ?? ""),
        fecha: String(data.get("fecha") ?? ""),
        hora: String(data.get("hora") ?? "") || undefined,
        tipo: String(data.get("tipo") ?? "llamada") as EventoTipo,
        leadId: lead.id,
        propiedadSlug: lead.propiedadSlug,
      },
      null,
    );
    form.reset();
    setAgendaDirty(false);
  }

  async function eliminar() {
    if (!lead) return;
    if (window.confirm(`¿Eliminar el lead "${lead.nombre}" y su historial?`)) {
      await removeById(db.leads, lead.id, db.leads.version(lead));
      router.push("/admin/leads");
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} /> Volver a leads
      </Link>

      <PageHeader
        title={lead.nombre}
        description={`${LEAD_ORIGEN_LABELS[lead.origen]} · recibido el ${fechaCorta(lead.creadoEl)}`}
        actions={
          <>
            <ConvertLeadButton lead={lead} disabled={!!profileDraft || noteDirty || agendaDirty} />
            {!lead.clienteId ? <AsyncButton type="button" onClick={eliminar} className={btnDanger}>
              <Trash2 className="size-3.5" strokeWidth={1.5} /> Eliminar
            </AsyncButton> : null}
          </>
        }
      />

      {profileDraft || noteDirty || agendaDirty ? <p role="status" className="text-sm text-muted-foreground">Guarda o cancela los cambios pendientes antes de convertir el lead.</p> : null}
      {lead.clienteId ? <p className="text-sm text-muted-foreground">Convertido en cliente. Esta ficha conserva el historial y la agenda del lead.</p> : null}

      <LeadProfileEditor key={lead.id} lead={lead} readOnly={!!lead.clienteId} onDraftChange={setProfileDraft} />

      {/* Pipeline */}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Estado del lead"
      >
        {LEAD_ESTADOS.map((estado) => (
          <AsyncButton
            key={estado}
            type="button"
            aria-pressed={lead.estado === estado}
            onClick={async () =>
              await upsert(
                db.leads,
                { ...lead, estado: estado as LeadEstado },
                db.leads.version(lead),
              )
            }
            className={
              "inline-flex h-9 items-center rounded-md border px-3.5 text-sm font-medium transition-colors " +
              (lead.estado === estado
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-foreground/70 hover:bg-secondary")
            }
          >
            {LEAD_ESTADO_LABELS[estado]}
          </AsyncButton>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        {/* Columna principal: notas */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="display-soft text-lg text-foreground">
              Notas de seguimiento
            </h2>
            <AsyncForm onSubmit={agregarNota} className="mt-4">
              <label htmlFor="nueva-nota" className="sr-only">
                Nueva nota
              </label>
              <textarea
                id="nueva-nota"
                name="nota"
                onFocus={() => {
                  if (!noteDraft)
                    setNoteDraft({ lead, version: db.leads.version(lead) });
                }}
                onChange={(event) => {
                  setNoteDirty(event.target.value.trim().length > 0);
                  if (!noteDraft)
                    setNoteDraft({ lead, version: db.leads.version(lead) });
                }}
                rows={3}
                required
                placeholder="Qué se habló, qué sigue, compromisos…"
                className={textareaClass}
              />
              <button type="submit" className={btnPrimary + " mt-3"}>
                Agregar nota
              </button>
            </AsyncForm>

            {lead.notas.length > 0 ? (
              <ol className="mt-6 space-y-4 border-t border-border pt-5">
                {lead.notas.map((nota) => (
                  <li
                    key={nota.id}
                    className="rounded-md bg-secondary/50 p-3.5"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {nota.texto}
                    </p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {fechaCorta(nota.fecha)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Sin notas aún. La primera llamada siempre deja una.
              </p>
            )}
          </section>

          {/* Agenda del lead */}
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="display-soft text-lg text-foreground">
              Agenda del lead
            </h2>
            <AsyncForm
              onSubmit={agendar}
              onChange={(event) => {
                const data = new FormData(event.currentTarget);
                setAgendaDirty(["titulo", "fecha", "hora"].some(key => String(data.get(key) ?? "").trim() !== "") || data.get("tipo") !== EVENTO_TIPOS[0]);
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              <Field label="Título" htmlFor="ev-titulo">
                <input
                  id="ev-titulo"
                  name="titulo"
                  required
                  placeholder="Visita, llamada…"
                  className={inputClass}
                />
              </Field>
              <Field label="Fecha" htmlFor="ev-fecha">
                <input
                  id="ev-fecha"
                  name="fecha"
                  type="date"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Hora" htmlFor="ev-hora">
                <input
                  id="ev-hora"
                  name="hora"
                  type="time"
                  className={inputClass}
                />
              </Field>
              <Field label="Tipo" htmlFor="ev-tipo">
                <select id="ev-tipo" name="tipo" className={selectClass}>
                  {EVENTO_TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {EVENTO_TIPO_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <button
                  type="submit"
                  className={btnPrimary + " h-10 w-full"}
                  aria-label="Agendar evento"
                >
                  <CalendarPlus className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              {agendaDirty ? <button type="button" className={btnGhost} onClick={(event) => {
                event.currentTarget.form?.reset();
                setAgendaDirty(false);
              }}>Cancelar cita</button> : null}
            </AsyncForm>

            {eventosDelLead.length > 0 ? (
              <ul className="mt-5 divide-y divide-border border-t border-border">
                {eventosDelLead.map((evento) => (
                  <li
                    key={evento.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="shrink-0 font-mono text-xs text-primary">
                        {evento.fecha.slice(8, 10)}/{evento.fecha.slice(5, 7)}
                        {evento.hora ? ` ${evento.hora}` : ""}
                      </span>
                      <p className="truncate text-sm text-foreground">
                        {evento.titulo}
                      </p>
                      <Badge>{EVENTO_TIPO_LABELS[evento.tipo]}</Badge>
                    </div>
                    <AsyncButton
                      type="button"
                      aria-label={`Eliminar evento ${evento.titulo}`}
                      onClick={async () =>
                        await removeById(
                          db.eventos,
                          evento.id,
                          db.eventos.version(evento),
                        )
                      }
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </AsyncButton>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        {/* Lateral: datos + asignación */}
        <aside className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="display-soft text-lg text-foreground">Datos</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Teléfono</dt>
                <dd className="font-mono text-sm text-foreground">
                  {lead.telefono}
                </dd>
              </div>
              {lead.email ? <div><dt className="text-muted-foreground">Correo electrónico</dt><dd className="mt-1 break-all">{lead.email}</dd></div> : null}
              {lead.zona ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Zona</dt>
                  <dd className="text-foreground">{lead.zona}</dd>
                </div>
              ) : null}
              {lead.tipoPropiedad ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="text-foreground">{lead.tipoPropiedad}</dd>
                </div>
              ) : null}
              {lead.mensaje ? (
                <div>
                  <dt className="text-muted-foreground">Mensaje</dt>
                  <dd className="mt-1 rounded-md bg-secondary/50 p-3 text-sm leading-relaxed text-foreground/90">
                    {lead.mensaje}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="display-soft text-lg text-foreground">Asignación</h2>
            <div className="mt-4 space-y-4">
              <Field label="Asesor responsable" htmlFor="lead-asesor" hint={lead.clienteId ? "Reasigna al asesor desde Clientes; el historial se conserva con el mismo responsable." : undefined}>
                <AsyncSelect
                  id="lead-asesor"
                  disabled={!!lead.clienteId}
                  value={lead.asesorId ?? ""}
                  onChange={async (value) =>
                    await upsert(
                      db.leads,
                      { ...lead, asesorId: value || undefined },
                      db.leads.version(lead),
                    )
                  }
                  className={selectClass}
                >
                  <option value="">Sin asignar</option>
                  {asesores
                    .filter((a) => a.activo)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                </AsyncSelect>
              </Field>
              <Field label="Propiedad vinculada" htmlFor="lead-propiedad">
                <AsyncSelect
                  id="lead-propiedad"
                  value={lead.propiedadSlug ?? ""}
                  onChange={async (value) =>
                    await upsert(
                      db.leads,
                      { ...lead, propiedadSlug: value || undefined },
                      db.leads.version(lead),
                    )
                  }
                  className={selectClass}
                >
                  <option value="">Ninguna</option>
                  {propiedades.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.codigo} · {p.titulo}
                    </option>
                  ))}
                </AsyncSelect>
              </Field>
              {propiedad ? (
                <Link
                  href={`/inventario/${propiedad.slug}`}
                  target="_blank"
                  className="block text-sm font-medium text-primary hover:text-foreground"
                >
                  Ver {propiedad.codigo} en el sitio →
                </Link>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
