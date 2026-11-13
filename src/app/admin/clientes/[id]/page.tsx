"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarPlus, Trash2 } from "@/components/admin/icons";
import { Button, ButtonLink, Notice, Pill, Surface } from "@/components/admin/kit";
import { ErrorNotice } from "@/components/admin/ui";
import { ClienteEditor, CLIENTE_TIPO_LABELS } from "@/components/admin/cliente-editor";
import { LeadProfileSummary } from "@/components/admin/lead-fields";
import { MatchingProperties } from "@/components/admin/properties/matching-properties";
import { NextStepCard, PersonCard, PersonHeader, Timeline, personStyles as s, type MenuItem } from "@/components/admin/contacts/person";
import { confirmDelete } from "@/components/admin/workspace/confirm";
import { seekersFrom } from "@/lib/admin/buyer-matches";
import { nextStep } from "@/lib/admin/contacts-view";
import { humanDay, personTimeline } from "@/lib/admin/person-view";
import { operationalDate } from "@/lib/admin/operational-date";
import { duplicateContacts } from "@/lib/admin/workspace";
import { processStageText, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { apiRequest, db, removeById, useCollection, useLoadState } from "@/lib/admin/store";
import { PERSON_STATUS_LABEL, PERSON_STATUS_TONE } from "@/lib/admin/person-status";
import { usePersonStatus } from "@/components/admin/workspace/use-person-status";

/*
  Ficha del cliente (SIM-07, 11/11/2026), con el mismo marco que la del prospecto. El «Siguiente
  paso» sale de su operación cuando la tiene (C40) y la acción principal la abre; sus operaciones
  se nombran por lo que son («Vende · Casa en Playas»), no por folio. Editar y eliminar conservan
  sus reglas: solo se elimina a quien se capturó directamente como cliente.
*/

type Dossier = { id: string; folio: string; cliente_id?: string; propiedad_slug?: string | null; etapa?: WorkflowStage; flujo?: OperationWorkflow | null; operacion?: string };
const VERB: Record<string, string> = { captacion: "Vende", arrendador: "Ofrece en renta", compra: "Compra", arrendatario: "Busca renta", inversion: "Invierte" };
const INTENT = { inversionista: "invertir", comprador: "comprar", arrendador: "arrendar", arrendatario: "rentar" } as const;

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <ClienteDetail key={id} id={id} />;
}

function ClienteDetail({ id }: { id: string }) {
  const router = useRouter();
  const clientes = useCollection(db.clientes), asesores = useCollection(db.asesores), propiedades = useCollection(db.propiedades), eventos = useCollection(db.eventos), tareas = useCollection(db.tareas);
  const state = useLoadState(db.clientes);
  const [editing, setEditing] = React.useState(false);
  const [dossiers, setDossiers] = React.useState<Dossier[] | null | undefined>(undefined);
  const today = operationalDate();
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ expedientes?: Dossier[] }>("/api/admin/expedientes")
      .then(result => { if (alive) setDossiers((result.expedientes ?? []).filter(d => d.cliente_id === id && d.etapa !== "cerrado" && d.flujo?.estado !== "descartada")); })
      .catch(() => { if (alive) setDossiers(null); });
    return () => { alive = false; };
  }, [id]);

  const cliente = clientes.find(item => item.id === id);
  // COR-10: prospecto hasta que firma su contrato; las operaciones cerradas cuentan para «Cliente anterior».
  const condition = usePersonStatus().ofClient(id);
  if (!cliente) return <Surface className={s.page}>
    <h1 className={s.name}>Cliente</h1>
    {state.status === "idle" || state.status === "loading" ? <p role="status">Cargando cliente…</p> : state.error ? <ErrorNotice error={state.error} /> : <p className={s.muted}>Cliente no encontrado.</p>}
    <span><ButtonLink href="/admin/contactos?tab=clientes">Volver a Contactos</ButtonLink></span>
  </Surface>;

  const asesor = asesores.find(item => item.id === cliente.asesorId);
  const owner = cliente.tipo === "propietario" || cliente.tipo === "arrendador";
  const operations = (dossiers ?? []).map(d => ({
    id: d.id, clienteId: d.cliente_id,
    stage: processStageText(d.etapa, d.flujo, today) || "curso",
    label: `${VERB[d.flujo?.ruta ?? ""] ?? "Operación"} · ${propiedades.find(p => p.slug === d.propiedad_slug)?.titulo ?? "sin inmueble vinculado"}`,
  }));
  const opIds = new Set(operations.map(op => op.id));
  const mine = (ref: { leadId?: string; clienteId?: string; expedienteId?: string }) => ref.clienteId === id || (!!cliente.leadId && ref.leadId === cliente.leadId) || (!!ref.expedienteId && opIds.has(ref.expedienteId));
  const step = nextStep(cliente, "cliente", tareas, eventos, today, operations);
  const { upcoming, past } = personTimeline({
    notes: cliente.leadOriginal?.notas, events: eventos.filter(mine), tasks: tareas.filter(mine), today,
    records: [{ id: "alta", text: "Se registró", at: cliente.creadoEl }, { id: "conversion", text: "Empezó su operación", at: cliente.convertidoEl },
      ...(dossiers ?? []).flatMap(d => d.flujo?.firmaContrato ? [{ id: `firma:${d.id}`, text: "Firmó su contrato con Fortius", at: d.flujo.firmaContrato.fecha }] : [])],
  });
  const duplicates = duplicateContacts(cliente, clientes);
  const newOperation = `/admin/operaciones/nueva?${new URLSearchParams({ clienteId: id, intencion: INTENT[cliente.tipo as keyof typeof INTENT] ?? "vender" })}`;
  const linkQuery = new URLSearchParams({ clienteId: id, ...(cliente.leadId ? { leadId: cliente.leadId } : {}), ...(cliente.propiedadSlug ? { propiedadSlug: cliente.propiedadSlug } : {}) });
  // Quien vino de un prospecto conserva su historial; por eso solo se eliminan los capturados como cliente.
  const menu: MenuItem[] = cliente.leadId || editing ? [] : [{ label: "Eliminar cliente", icon: <Trash2 size={18} aria-hidden="true" />, danger: true, onSelect: async () => {
    if (!await confirmDelete("cliente", `Se elimina a ${cliente.nombre}.`, false)) return;
    await removeById(db.clientes, cliente.id, db.clientes.version(cliente));
    router.push("/admin/contactos?tab=clientes");
  } }];
  const facts: Array<[string, string | undefined]> = [
    ["Teléfono", cliente.telefono], ["Correo electrónico", cliente.email], ["Tipo de cliente", CLIENTE_TIPO_LABELS[cliente.tipo]], ["Asesor responsable", asesor?.nombre ?? "Sin asignar"],
    [owner ? "Ubicación" : "Zonas de interés", cliente.zona], ["Tipo de inmueble", cliente.tipoPropiedad],
  ];

  return <Surface className={s.page}>
    <PersonHeader back={{ href: "/admin/contactos?tab=clientes", label: "Volver a Contactos" }} name={cliente.nombre} phone={cliente.telefono} email={cliente.email} menu={menu}
      stage={condition ? <Pill size="sm" tone={PERSON_STATUS_TONE[condition]}>{PERSON_STATUS_LABEL[condition]}</Pill> : undefined} sub={<span>{CLIENTE_TIPO_LABELS[cliente.tipo]}{cliente.creadoEl ? ` · desde el ${humanDay(cliente.creadoEl)}` : ""}</span>}
      actions={!editing ? <Button onClick={() => setEditing(true)}>Editar cliente</Button> : undefined} />

    {editing ? <ClienteEditor initial={cliente} onDone={() => setEditing(false)} /> : <>
      {duplicates.length > 0 && <Notice title="Puede estar repetido">Revisa antes de crear otro registro: {duplicates.map((d, i) => <React.Fragment key={d.id}>{i > 0 && ", "}<Link className="font-semibold underline" href={`/admin/clientes/${encodeURIComponent(d.id)}`}>{d.nombre}</Link></React.Fragment>)}.</Notice>}

      <NextStepCard step={step} today={today} fallback={dossiers === undefined ? "Consultando sus operaciones…" : operations.length ? "Su operación sigue en curso." : "Sin operación abierta ni seguimiento con fecha."}>
        {operations.length > 0
          ? <ButtonLink variant="primary" href={`/admin/operaciones/${encodeURIComponent(operations[0].id)}`}>Abrir operación<ArrowRight size={18} aria-hidden="true" /></ButtonLink>
          : <ButtonLink variant="primary" href={newOperation}>Nueva operación<ArrowRight size={18} aria-hidden="true" /></ButtonLink>}
      </NextStepCard>
      {dossiers === null && <p role="status" className={s.small}>No se pudieron consultar sus operaciones. Recarga la página para reintentar.</p>}

      <div className={s.grid}>
        <div className={s.col}>
          {operations.length > 0 && <PersonCard id="ficha-operaciones" title={operations.length === 1 ? "Su operación" : "Sus operaciones"} action={<ButtonLink href={newOperation}>Nueva operación</ButtonLink>}>
            <ul className="m-0 flex list-none flex-col p-0">{operations.map(op => <li key={op.id}><Link href={`/admin/operaciones/${encodeURIComponent(op.id)}`} className={s.linkRow}><strong className="font-[560]">{op.label}</strong><span className={s.small}>{op.stage.charAt(0).toUpperCase() + op.stage.slice(1)}</span></Link></li>)}</ul>
          </PersonCard>}

          <PersonCard id="ficha-seguimiento" title="Seguimiento" action={<span className="flex flex-wrap gap-2">
            <ButtonLink href={`/admin/agenda?nueva=1&${linkQuery}`}><CalendarPlus size={16} aria-hidden="true" />Agendar</ButtonLink>
            <ButtonLink href={`/admin/agenda?tab=tareas&nueva=1&${linkQuery}`}>Nueva tarea</ButtonLink>
          </span>}>
            <Timeline upcoming={upcoming} past={past} empty="Todavía no hay citas, tareas ni notas con esta persona." />
          </PersonCard>

          {cliente.perfil && <PersonCard id="ficha-perfil" title={owner ? "Lo que quiere hacer" : "Lo que busca"}><LeadProfileSummary perfil={cliente.perfil} /></PersonCard>}
          {seekersFrom([], [cliente]).map(seeker => <MatchingProperties key={seeker.id} seeker={seeker} />)}
        </div>

        <aside className={s.col}>
          <PersonCard id="ficha-contacto" title="Datos del cliente">
            <dl className={s.facts}>{facts.map(([label, value]) => value ? <div key={label}><dt>{label}</dt><dd>{value}</dd></div> : null)}</dl>
            {cliente.mensaje && <p className={s.quote}>«{cliente.mensaje}»</p>}
            {cliente.propiedadSlug && <Link href={`/admin/propiedades/${encodeURIComponent(cliente.propiedadSlug)}/editar`} className={s.textLink}>{owner ? "Abrir su inmueble" : "Abrir el inmueble que le interesa"}</Link>}
          </PersonCard>
          <PersonCard id="ficha-notas" title="Notas">
            <p className="whitespace-pre-wrap text-[.9375rem]">{cliente.notas || <span className={s.muted}>Sin notas. Agrégalas con «Editar cliente».</span>}</p>
          </PersonCard>
          {cliente.leadId && <PersonCard id="ficha-origen" title="Antes era prospecto">
            {cliente.convertidoEl && <p className={s.muted}>Pasó a cliente el {humanDay(cliente.convertidoEl)}.</p>}
            <Link href={`/admin/leads/${encodeURIComponent(cliente.leadId)}`} className={s.textLink}>Ver su historial como prospecto</Link>
          </PersonCard>}
        </aside>
      </div>
    </>}
  </Surface>;
}
