"use client";
import * as React from "react";
import { RelatedWork } from "@/components/admin/workspace/related-work";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClienteEditor, CLIENTE_TIPO_LABELS } from "@/components/admin/cliente-editor";
import { LeadProfileSummary } from "@/components/admin/lead-fields";
import { useRouter } from "next/navigation";
import { AsyncButton, Badge, EmptyState, ErrorNotice, PageHeader, btnGhost, btnPrimary } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { db, fechaCorta, removeById, useCollection, useLoadState } from "@/lib/admin/store";

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <ClienteDetail key={id} id={id} />;
}
function ClienteDetail({ id }: { id: string }) {
  const clientes = useCollection(db.clientes);
  const state = useLoadState(db.clientes);
  const asesores = useCollection(db.asesores);
  const [editing, setEditing] = React.useState(false);
  const router = useRouter();
  const cliente = clientes.find(item => item.id === id);
  if (!cliente) return <div className="space-y-6">
    <PageHeader title="Cliente." />
    {state.status === "idle" || state.status === "loading" ? <p role="status">Cargando cliente…</p> : state.error ? <ErrorNotice error={state.error} /> : <EmptyState title="Cliente no encontrado." />}
    <Link href="/admin/contactos?tab=clientes" className={btnGhost}>Volver a clientes</Link>
  </div>;
  const asesor = asesores.find(item => item.id === cliente.asesorId);
  return <div className="min-w-0 space-y-6 [overflow-wrap:anywhere]">
    <Link href="/admin/contactos?tab=clientes" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Volver a clientes</Link>
    <PageHeader title={cliente.nombre} description="Ficha del cliente: contacto, perfil y seguimiento."
      actions={!editing ? <><Link className={btnPrimary} href={`/admin/operaciones/nueva?${new URLSearchParams({clienteId:id,intencion:cliente.tipo==="inversionista"?"invertir":cliente.tipo==="comprador"?"comprar":cliente.tipo==="arrendador"?"arrendar":cliente.tipo==="arrendatario"?"rentar":"vender"})}`}>Abrir operación</Link><button type="button" className={btnGhost} onClick={() => setEditing(true)}>Editar cliente</button>
        {/* Quien vino de un prospecto conserva su historial; por eso solo se eliminan los capturados como cliente. */}
        {!cliente.leadId && <AsyncButton className={btnGhost} onClick={async () => {
          if (!await confirmAction(`¿Eliminar a ${cliente.nombre}?`)) return;
          await removeById(db.clientes, cliente.id, db.clientes.version(cliente));
          router.push("/admin/contactos?tab=clientes");
        }}>Eliminar cliente</AsyncButton>}</> : undefined} />
    {cliente.leadId ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-4">
      <p className="text-sm"><Badge tone="green">Convertido desde un lead</Badge>{cliente.convertidoEl ? ` · ${fechaCorta(cliente.convertidoEl)}` : ""}</p>
      <Link href={`/admin/leads/${encodeURIComponent(cliente.leadId)}`} className={btnGhost}>Ver historial y agenda del lead</Link>
    </div> : null}
    {editing ? <ClienteEditor initial={cliente} onDone={() => setEditing(false)} /> : <>
      <RelatedWork clienteId={id}/>
      <section className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5">
        <h2 className="display-soft text-lg">Datos del cliente</h2>
        <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
          {Object.entries({ "Teléfono": cliente.telefono, "Correo electrónico": cliente.email, "Tipo de cliente": CLIENTE_TIPO_LABELS[cliente.tipo], "Asesor responsable": asesor?.nombre ?? "Sin asignar", "Zonas de interés": cliente.zona, "Tipo de inmueble": cliente.tipoPropiedad }).map(([label, value]) => value ? <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value}</dd></div> : null)}
        </dl>
        {cliente.propiedadSlug ? <Link href={`/inventario/${encodeURIComponent(cliente.propiedadSlug)}`} className="inline-flex min-h-11 items-center text-sm text-primary-ink">Ver inmueble de interés</Link> : null}
        {cliente.mensaje ? <div className="text-sm"><h3 className="text-muted-foreground">Mensaje inicial</h3><p className="mt-1 whitespace-pre-wrap">{cliente.mensaje}</p></div> : null}
      </section>
      {cliente.perfil ? <section className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"><h2 className="display-soft text-lg">Perfil y necesidades</h2><LeadProfileSummary perfil={cliente.perfil} /></section> : null}
      <section className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"><h2 className="display-soft text-lg">Notas del cliente</h2><p className="whitespace-pre-wrap text-sm">{cliente.notas || "Sin notas adicionales."}</p></section>
    </>}
    {cliente.leadOriginal?.notas.length ? <section className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="display-soft text-lg">Seguimiento previo a la conversión</h2>
      <ol className="mt-4 space-y-3">{cliente.leadOriginal.notas.map(nota => <li key={nota.id} className="rounded-md bg-secondary/50 p-3 text-sm"><p className="whitespace-pre-wrap">{nota.texto}</p><p className="mt-2 text-xs text-muted-foreground">{fechaCorta(nota.fecha)}</p></li>)}</ol>
    </section> : null}
  </div>;
}
