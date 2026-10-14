"use client";
import * as React from "react";
import Link from "next/link";
import { apiRequest, db, useCollection, upsert } from "@/lib/admin/store";
import { duplicateContacts } from "@/lib/admin/workspace";
import { AsyncButton, btnGhost } from "@/components/admin/ui";
import { TASK_STATUSES } from "@/lib/tasks";

export function RelatedWork({
  leadId,
  clienteId,
  propertySlug,
  expedienteId,
}: {
  leadId?: string;
  clienteId?: string;
  propertySlug?: string;
  expedienteId?: string;
}) {
  const leads = useCollection(db.leads),
    clients = useCollection(db.clientes),
    tasks = useCollection(db.tareas),
    events = useCollection(db.eventos),
    properties = useCollection(db.propiedades);
  const person = leadId
    ? leads.find((l) => l.id === leadId)
    : clients.find((c) => c.id === clienteId);
  const lead = leads.find((l) => l.id === leadId);
  const linkedLead =
    leadId ??
    (clienteId ? clients.find((c) => c.id === clienteId)?.leadId : undefined);
  const property = propertySlug ?? person?.propiedadSlug;
  const matches = (row: {
    leadId?: string;
    clienteId?: string;
    propiedadSlug?: string;
    expedienteId?: string;
  }) =>
    !!(
      (linkedLead && row.leadId === linkedLead) ||
      (clienteId && row.clienteId === clienteId) ||
      (propertySlug && row.propiedadSlug === propertySlug) ||
      (expedienteId && row.expedienteId === expedienteId)
    );
  const relatedTasks = tasks.filter((task) => expedienteId
    ? task.expedienteId === expedienteId || (!task.expedienteId && !!property && task.propiedadSlug === property)
    : matches(task)).sort((a, b) => expedienteId ? Number(b.expedienteId === expedienteId) - Number(a.expedienteId === expedienteId) : 0),
    relatedEvents = events
      .filter(matches)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const duplicates = person
    ? duplicateContacts(person, leadId ? leads : clients)
    : [];
  const interested = propertySlug
    ? leads.filter((l) => l.propiedadSlug === propertySlug && !l.clienteId)
    : [];
  const relatedClients = propertySlug
    ? clients.filter((c) => c.propiedadSlug === propertySlug)
    : [];
  const [dossiers, setDossiers] = React.useState<
    { id: string; folio: string; cliente_id: string; propiedad_slug?: string }[]
  >([]);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    let active = true;
    if (!clienteId && !propertySlug) return;
    apiRequest<{ expedientes: typeof dossiers }>("/api/admin/expedientes")
      .then((r) => {
        if (active)
          setDossiers(
            (r.expedientes ?? []).filter(
              (d) =>
                (!!clienteId && d.cliente_id === clienteId) ||
                (!!propertySlug && d.propiedad_slug === propertySlug),
            ),
          );
      })
      .catch(() => {
        if (active)
          setError("No se pudieron consultar los expedientes vinculados.");
      });
    return () => {
      active = false;
    };
  }, [clienteId, propertySlug]);
  const query = new URLSearchParams();
  if (linkedLead) query.set("leadId", linkedLead);
  if (clienteId) query.set("clienteId", clienteId);
  if (property) query.set("propiedadSlug", property);
  if (expedienteId) query.set("expediente", expedienteId);
  return (
    <section
      aria-label="Trabajo relacionado"
      className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Seguimiento conectado</h2>
        <div className="flex flex-wrap gap-2">
          <Link className={btnGhost} href={`/admin/tareas?nueva=1&${query}`}>
            Crear tarea relacionada
          </Link>
          <Link
            className={btnGhost}
            href={`/admin/calendario?nueva=1&${query}`}
          >
            Agendar visita
          </Link>
        </div>
      </div>
      {person && (
        <p className="text-sm">
          Próxima comunicación:{" "}
          <strong>{person.perfil?.proximoContacto ?? "Por programar"}</strong>
        </p>
      )}
      <p className="text-sm text-muted-foreground">La comunicación, las citas y las tareas conservan fechas propias. No todas las tareas requieren contactar a la persona.</p>
      {lead && (
        <div className="text-sm">
          {lead.firstContactedAt ? (
            <p>
              Primer contacto registrado:{" "}
              {new Date(lead.firstContactedAt).toLocaleString("es-MX")}
            </p>
          ) : (
            <AsyncButton
              className={btnGhost}
              onClick={async () => {
                await upsert(
                  db.leads,
                  {
                    ...lead,
                    firstContactedAt: new Date().toISOString(),
                    estado:
                      lead.estado === "nuevo" ? "contactado" : lead.estado,
                  },
                  db.leads.version(lead),
                );
              }}
            >
              Registrar primer contacto realizado
            </AsyncButton>
          )}
        </div>
      )}
      {leadId && (
        <p className="text-sm text-muted-foreground">
          Última nota:{" "}
          {leads
            .find((l) => l.id === leadId)
            ?.notas.slice()
            .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.texto ??
            "Sin interacción registrada"}
        </p>
      )}
      {duplicates.length > 0 && (
        <div className="rounded border border-warning-border bg-warning-surface p-3 text-sm">
          <p>
            Posibles contactos duplicados. Revisa antes de crear otro registro.
          </p>
          {duplicates.map((d) => (
            <Link
              key={d.id}
              href={`/admin/${leadId ? "leads" : "clientes"}/${d.id}`}
              className="mt-2 block underline"
            >
              {d.nombre}
            </Link>
          ))}
        </div>
      )}
      {property && (
        <Link
          className="inline-flex min-h-11 items-center text-sm text-primary-ink underline"
          href={`/admin/propiedades/${property}/editar`}
        >
          {properties.find((p) => p.slug === property)?.titulo ??
            "Abrir inmueble relacionado"}
        </Link>
      )}
      {propertySlug && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">
              Prospectos interesados · {interested.length}
            </h3>
            {interested.map((l) => (
              <Link
                key={l.id}
                className="block py-2 text-sm underline"
                href={`/admin/leads/${l.id}`}
              >
                {l.nombre}
              </Link>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              Clientes relacionados · {relatedClients.length}
            </h3>
            {relatedClients.map((c) => (
              <Link
                key={c.id}
                className="block py-2 text-sm underline"
                href={`/admin/clientes/${c.id}`}
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">
            Tareas · {relatedTasks.length}
          </h3>
          <ul>
            {relatedTasks.map((t) => (
              <li key={t.id}>
                <Link
                  className="block break-words py-2 text-sm hover:underline"
                  href={`/admin/tareas/${t.id}`}
                >
                  {t.titulo}
                  <span className="block text-xs text-muted-foreground">
                    {TASK_STATUSES[t.estado]} · {t.vence ?? "Sin fecha"}{expedienteId && !t.expedienteId ? " · Sin referencia a expediente" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!relatedTasks.length && (
            <p className="mt-2 text-sm text-muted-foreground">
              Sin tareas vinculadas.
            </p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">
            Agenda · {relatedEvents.length}
          </h3>
          <ul>
            {relatedEvents.map((e) => (
              <li key={e.id}>
                <Link
                  className="block break-words py-2 text-sm hover:underline"
                  href={`/admin/calendario?fecha=${e.fecha}&evento=${e.id}`}
                >
                  {e.titulo}
                  <span className="block text-xs text-muted-foreground">
                    {e.fecha} {e.hora}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!relatedEvents.length && (
            <p className="mt-2 text-sm text-muted-foreground">
              Sin eventos vinculados.
            </p>
          )}
        </div>
      </div>
      {error && (
        <p role="status" className="text-sm">
          {error}
        </p>
      )}
      {dossiers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Expedientes</h3>
          {dossiers.map((d) => (
            <Link
              key={d.id}
              className="inline-flex min-h-11 items-center pr-4 text-sm underline"
              href={`/admin/expedientes?expediente=${d.id}`}
            >
              {d.folio}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
