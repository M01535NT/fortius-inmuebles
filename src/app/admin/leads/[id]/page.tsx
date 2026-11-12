"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarPlus, Trash2 } from "@/components/admin/icons";
import { Button, ButtonLink, Notice, Pill, Surface } from "@/components/admin/kit";
import { AsyncButton, AsyncForm, AsyncSelect, Field, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { LeadProfileEditor } from "@/components/admin/lead-profile-editor";
import { MatchingProperties } from "@/components/admin/properties/matching-properties";
import { NextStepCard, PersonCard, PersonHeader, Timeline, personStyles as s, useInterview, type MenuItem } from "@/components/admin/contacts/person";
import { nextStep } from "@/lib/admin/contacts-view";
import { estadoForStage, humanDay, leadStage, personTimeline, LEAD_STAGE_CHOICES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/admin/person-view";
import { operationalDate } from "@/lib/admin/operational-date";
import { duplicateContacts } from "@/lib/admin/workspace";
import { EVENTO_TIPOS, EVENTO_TIPO_LABELS, LEAD_CANAL_LABELS, LEAD_ORIGEN_LABELS, db, removeById, uid, upsert, useCollection, type EventoTipo, type Lead } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import { PERSON_STATUS_LABEL, PERSON_STATUS_TONE } from "@/lib/admin/person-status";
import { usePersonStatus } from "@/components/admin/workspace/use-person-status";

/*
  Ficha del prospecto (SIM-07, 11/11/2026). Arriba, quién es y cómo contactarlo; después el
  «Siguiente paso» con la única acción principal (continuar su entrevista o preparar la operación);
  la línea de tiempo con la nota de la llamada, las citas y las tareas; y a la derecha sus datos y
  su seguimiento. La etapa se elige entre tres (DEC-46); convertir y eliminar van en «Más opciones».
  No cambian los datos ni las reglas: la nota conserva su versión al refrescar, las capturas a
  medias bloquean convertir y abrir la operación, y un prospecto convertido conserva su historial.
*/
export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <LeadDetail key={id} id={id} />;
}

function LeadDetail({ id }: { id: string }) {
  const router = useRouter();
  const leads = useCollection(db.leads), asesores = useCollection(db.asesores), propiedades = useCollection(db.propiedades), eventos = useCollection(db.eventos), tareas = useCollection(db.tareas);
  const personStatus = usePersonStatus();
  const [profileDraft, setProfileDraft] = React.useState<Lead | null>(null);
  const [noteDirty, setNoteDirty] = React.useState(false);
  const [agendaOpen, setAgendaOpen] = React.useState(false);
  const [agendaDirty, setAgendaDirty] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState<{ lead: Lead; version: number | null } | null>(null);
  const interview = useInterview({ leadId: id });
  const today = operationalDate();

  const lead = leads.find(l => l.id === id) ?? noteDraft?.lead ?? profileDraft;
  if (!lead) return <Surface className={s.page}>
    <h1 className={s.name}>Prospecto no encontrado</h1>
    <p className={s.muted}>Este prospecto no existe o se eliminó.</p>
    <span><ButtonLink href="/admin/contactos">Volver a Contactos</ButtonLink></span>
  </Surface>;

  const busy = !!profileDraft || noteDirty || agendaDirty;
  const propiedad = propiedades.find(p => p.slug === lead.propiedadSlug);
  const stage = leadStage(lead.estado);
  const seller = lead.perfil?.operacion === "vender" || lead.perfil?.operacion === "arrendar";
  const duplicates = duplicateContacts(lead, leads);
  const step = lead.clienteId ? null : nextStep(lead, "lead", tareas, eventos, today);
  const { upcoming, past } = personTimeline({
    notes: lead.notas, events: eventos.filter(e => e.leadId === lead.id), tasks: tareas.filter(t => t.leadId === lead.id), today,
    records: [
      { id: "llegada", text: lead.canal ? `Llegó por ${LEAD_CANAL_LABELS[lead.canal]}` : `Llegó: ${LEAD_ORIGEN_LABELS[lead.origen] ?? lead.origen}`, at: lead.creadoEl },
      { id: "contacto", text: "Primer contacto", at: lead.firstContactedAt },
      { id: "cliente", text: "Pasó a ser cliente", at: lead.convertidoEl },
    ],
  });
  const operationUrl = `/admin/operaciones/nueva?${new URLSearchParams({ ...(lead.clienteId ? { clienteId: lead.clienteId } : { leadId: lead.id }), ...(lead.perfil?.operacion ? { intencion: lead.perfil.operacion } : {}) })}`;
  const linkQuery = new URLSearchParams({ leadId: lead.id, ...(lead.propiedadSlug ? { propiedadSlug: lead.propiedadSlug } : {}) });

  async function agregarNota(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;
    const form = event.currentTarget;
    const texto = String(new FormData(form).get("nota") ?? "").trim();
    if (!texto) return;
    const base = noteDraft?.lead ?? lead;
    await upsert(db.leads, { ...base, notas: [{ id: uid(), texto, fecha: new Date().toISOString() }, ...base.notas] }, noteDraft ? noteDraft.version : db.leads.version(base));
    form.reset(); setNoteDraft(null); setNoteDirty(false);
  }
  async function agendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;
    const form = event.currentTarget, data = new FormData(form);
    await upsert(db.eventos, { id: uid(), titulo: String(data.get("titulo") ?? ""), fecha: String(data.get("fecha") ?? ""), hora: String(data.get("hora") ?? "") || undefined, tipo: String(data.get("tipo") ?? "llamada") as EventoTipo, leadId: lead.id, propiedadSlug: lead.propiedadSlug }, null);
    form.reset(); setAgendaDirty(false); setAgendaOpen(false);
  }
  // COR-10: con su registro de cliente, la condición la da la firma; si firmó con un cliente de Fortius, es contraparte.
  const condition = personStatus.ofLead(lead);
  const menu: MenuItem[] = lead.clienteId ? [] : [
    { label: "Eliminar prospecto", icon: <Trash2 size={18} aria-hidden="true" />, danger: true, onSelect: async () => {
      if (!await confirmAction(`¿Eliminar al prospecto "${lead.nombre}" y su historial?`)) return;
      await removeById(db.leads, lead.id, db.leads.version(lead));
      router.push("/admin/contactos");
    } },
  ];
  const prepare = busy ? <Button variant="primary" disabled>Abrir operación</Button> : <ButtonLink variant="primary" href={operationUrl}>Abrir operación<ArrowRight size={18} aria-hidden="true" /></ButtonLink>;
  const draft = interview.current?.estado === "borrador" ? interview.current : null;

  return <Surface className={s.page}>
    <PersonHeader back={{ href: "/admin/contactos", label: "Volver a Contactos" }} name={lead.nombre} phone={lead.telefono} email={lead.email} menu={menu}
      stage={condition && condition !== "prospecto" ? <Pill size="sm" tone={PERSON_STATUS_TONE[condition]}>{PERSON_STATUS_LABEL[condition]}</Pill> : <Pill size="sm" tone={stage === "descartado" || stage === "cerrado" ? "muted" : stage === "nuevo" ? "brand" : "info"}>{LEAD_STAGE_LABELS[stage]}</Pill>}
      sub={<span>Prospecto · llegó el {humanDay(lead.creadoEl)}</span>} />

    {busy && <p role="status" className={s.muted}>Guarda o cancela los cambios pendientes antes de abrir su operación.</p>}
    {lead.clienteId && <p className={s.muted}>Ya es cliente. Esta ficha conserva su historial y su agenda como prospecto.</p>}
    {duplicates.length > 0 && <Notice title="Puede estar repetido">Revisa antes de crear otro registro: {duplicates.map((d, i) => <React.Fragment key={d.id}>{i > 0 && ", "}<Link className="font-semibold underline" href={`/admin/leads/${encodeURIComponent(d.id)}`}>{d.nombre}</Link></React.Fragment>)}.</Notice>}

    <NextStepCard step={step} today={today} fallback={lead.clienteId ? "Su seguimiento continúa en su ficha de cliente." : draft ? "Terminar su entrevista inicial" : stage === "descartado" || stage === "cerrado" ? "Sin seguimiento: está descartado." : "Sin siguiente paso con fecha. Agenda una llamada o una tarea."}>
      {!lead.clienteId && !lead.firstContactedAt && <AsyncButton className={cn("inline-flex min-h-11 items-center rounded-[10px] border px-4 text-[.9375rem] font-[560]", s.onNavy)} onClick={async () => { await upsert(db.leads, { ...lead, firstContactedAt: new Date().toISOString(), estado: lead.estado === "nuevo" ? "contactado" : lead.estado }, db.leads.version(lead)); }}>Ya hablé con esta persona</AsyncButton>}
      {lead.clienteId && <ButtonLink className={s.onNavy} href={`/admin/clientes/${encodeURIComponent(lead.clienteId)}`}>Ver cliente</ButtonLink>}
      {interview.current?.estado === "completada" && <ButtonLink className={s.onNavy} href={`/admin/operaciones/nueva?entrevista=${encodeURIComponent(interview.current.id)}`}>Ver entrevista</ButtonLink>}
      {draft ? (busy ? <Button variant="primary" disabled>Continuar entrevista</Button> : <ButtonLink variant="primary" href={`/admin/operaciones/nueva?entrevista=${encodeURIComponent(draft.id)}`}>Continuar entrevista<ArrowRight size={18} aria-hidden="true" /></ButtonLink>) : prepare}
    </NextStepCard>
    {interview.error && <p className={s.small}>No se pudo consultar su entrevista. <button type="button" className="font-semibold underline" onClick={interview.reload}>Reintentar</button></p>}

    <div className={s.grid}>
      <div className={s.col}>
        <PersonCard id="ficha-seguimiento" title="Seguimiento" action={<span className="flex flex-wrap gap-2">
          <Button aria-expanded={agendaOpen} onClick={() => setAgendaOpen(open => !open)}><CalendarPlus size={16} aria-hidden="true" />Agendar</Button>
          <ButtonLink href={`/admin/agenda?tab=tareas&nueva=1&${linkQuery}`}>Nueva tarea</ButtonLink>
        </span>}>
          <Timeline upcoming={upcoming} past={past} empty="Todavía no hay nada registrado.">
            <AsyncForm onSubmit={agregarNota} className={s.compose}>
              <label htmlFor="nueva-nota" className="sr-only">Nueva nota</label>
              <textarea id="nueva-nota" name="nota" rows={2} required placeholder="Qué se habló, qué sigue, compromisos…" className={textareaClass}
                onFocus={() => { if (!noteDraft) setNoteDraft({ lead, version: db.leads.version(lead) }); }}
                onChange={event => { setNoteDirty(event.target.value.trim().length > 0); if (!noteDraft) setNoteDraft({ lead, version: db.leads.version(lead) }); }} />
              <div className={s.composeFoot}><Button type="submit">Agregar nota</Button></div>
            </AsyncForm>
            {/* La cita solo se oculta al cerrarla, para no perder lo escrito. */}
            <AsyncForm hidden={!agendaOpen} onSubmit={agendar} aria-label="Agendar con este prospecto" className={cn(s.inlineForm, !agendaOpen && "hidden")}
              onChange={event => { const data = new FormData(event.currentTarget); setAgendaDirty(["titulo", "fecha", "hora"].some(key => String(data.get(key) ?? "").trim() !== "") || data.get("tipo") !== EVENTO_TIPOS[0]); }}>
              <Field label="Título" htmlFor="ev-titulo"><input id="ev-titulo" name="titulo" required placeholder="Visita, llamada…" className={inputClass} /></Field>
              <Field label="Fecha" htmlFor="ev-fecha"><input id="ev-fecha" name="fecha" type="date" required className={inputClass} /></Field>
              <Field label="Hora" htmlFor="ev-hora"><input id="ev-hora" name="hora" type="time" className={inputClass} /></Field>
              <Field label="Tipo" htmlFor="ev-tipo"><select id="ev-tipo" name="tipo" className={selectClass}>{EVENTO_TIPOS.map(tipo => <option key={tipo} value={tipo}>{EVENTO_TIPO_LABELS[tipo]}</option>)}</select></Field>
              <div className={s.inlineFoot}>
                <Button type="submit">Guardar cita</Button>
                <Button variant="ghost" onClick={event => { event.currentTarget.form?.reset(); setAgendaDirty(false); setAgendaOpen(false); }}>Cancelar</Button>
              </div>
            </AsyncForm>
          </Timeline>
        </PersonCard>

        <LeadProfileEditor key={lead.id} lead={lead} readOnly={!!lead.clienteId} onDraftChange={setProfileDraft} />
        {!lead.clienteId && stage !== "descartado" && stage !== "cerrado" && <MatchingProperties seeker={{ id: lead.id, kind: "lead", nombre: lead.nombre, telefono: lead.telefono, email: lead.email, zona: lead.zona, tipoPropiedad: lead.tipoPropiedad, perfil: lead.perfil, asesorId: lead.asesorId, href: `/admin/leads/${encodeURIComponent(lead.id)}` }} />}
      </div>

      <aside className={s.col}>
        <PersonCard id="ficha-contacto" title="Contacto">
          <dl className={s.facts}>
            <div><dt>Teléfono</dt><dd>{lead.telefono || "Sin teléfono"}</dd></div>
            {lead.email && <div><dt>Correo electrónico</dt><dd>{lead.email}</dd></div>}
            {lead.zona && <div><dt>{seller ? "Ubicación" : "Zona de interés"}</dt><dd>{lead.zona}</dd></div>}
            {lead.tipoPropiedad && <div><dt>Tipo de inmueble</dt><dd>{lead.tipoPropiedad[0].toUpperCase() + lead.tipoPropiedad.slice(1)}</dd></div>}
          </dl>
          {lead.mensaje && <p className={s.quote}>«{lead.mensaje}»</p>}
        </PersonCard>

        <PersonCard id="ficha-asignacion" title="Etapa y responsable">
          <Field label="Etapa" htmlFor="lead-etapa" hint={lead.clienteId ? "Ya es cliente." : undefined}>
            <AsyncSelect id="lead-etapa" disabled={!!lead.clienteId} value={stage} className={selectClass}
              onChange={async value => { await upsert(db.leads, { ...lead, estado: estadoForStage(value as LeadStage, lead.estado) }, db.leads.version(lead)); }}>
              {LEAD_STAGE_CHOICES.map(choice => <option key={choice} value={choice}>{LEAD_STAGE_LABELS[choice]}</option>)}
              {stage === "cerrado" && <option value="cerrado" disabled>Cerrado</option>}
            </AsyncSelect>
          </Field>
          <Field label="Asesor responsable" htmlFor="lead-asesor" hint={lead.clienteId ? "Se reasigna desde su ficha de cliente." : undefined}>
            <AsyncSelect id="lead-asesor" disabled={!!lead.clienteId} value={lead.asesorId ?? ""} className={selectClass}
              onChange={async value => { await upsert(db.leads, { ...lead, asesorId: value || undefined }, db.leads.version(lead)); }}>
              <option value="">Sin asignar</option>
              {asesores.filter(a => a.activo).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </AsyncSelect>
          </Field>
          <Field label={seller ? "Su inmueble" : "Inmueble que le interesa"} htmlFor="lead-propiedad">
            <AsyncSelect id="lead-propiedad" value={lead.propiedadSlug ?? ""} className={selectClass}
              onChange={async value => { await upsert(db.leads, { ...lead, propiedadSlug: value || undefined }, db.leads.version(lead)); }}>
              <option value="">Ninguno</option>
              {propiedades.map(p => <option key={p.slug} value={p.slug}>{p.titulo}</option>)}
            </AsyncSelect>
          </Field>
          {propiedad && <Link href={`/admin/propiedades/${encodeURIComponent(propiedad.slug)}/editar`} className={s.textLink}>Abrir {propiedad.titulo}</Link>}
        </PersonCard>
      </aside>
    </div>
  </Surface>;
}
