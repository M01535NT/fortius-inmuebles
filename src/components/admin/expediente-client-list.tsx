"use client";

import Link from "next/link";
import { stageLabel, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { ChevronDown, Plus, Search } from "lucide-react";
import type { Cliente } from "@/lib/backend/contracts";
import { EXPEDIENTE_ETAPAS } from "@/lib/formatos/expediente-operations";
import { btnGhost, btnPrimary, inputClass } from "@/components/admin/ui";

type Operation = {
  id: string;
  cliente_id: string;
  folio: string;
  propiedad_slug: string | null;
  etapa?: keyof typeof EXPEDIENTE_ETAPAS;
  operacion?: string;
  flujo?: { ruta: OperationWorkflow["ruta"] } | null;
  fecha_objetivo?: string | null;
};

const groups = [
  { type: "comprador", label: "Compradores" },
  { type: "propietario", label: "Vendedores" },
  { type: "arrendador", label: "Arrendadores" },
  { type: "arrendatario", label: "Arrendatarios" },
  { type: "inversionista", label: "Inversionistas" },
  { type: "otro", label: "Otros clientes" },
] as const;

function searchable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function ExpedienteClientList({ expedientes, clientes, propiedades, selectedId, showDeleted, busy, query, onQueryChange, onStateChange, onSelect }: {
  expedientes: Operation[];
  clientes: Cliente[];
  propiedades: { slug: string; titulo: string }[];
  selectedId: string;
  showDeleted: boolean;
  busy: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onStateChange: (deleted: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const clientsById = new Map(clientes.map(client => [client.id, client]));
  const propertiesBySlug = new Map(propiedades.map(property => [property.slug, property.titulo]));
  const needle = searchable(query.trim());
  const visible = expedientes.filter(item => searchable(`${item.folio} ${clientsById.get(item.cliente_id)?.nombre ?? ""}`).includes(needle));

  return <aside aria-labelledby="operation-clients-title" className="min-w-0 rounded-lg border border-border bg-card p-5">
    <h2 id="operation-clients-title" className="mb-5 text-xl font-semibold tracking-tight">Clientes y operaciones</h2>
    <Link href="/admin/operaciones/nueva" aria-disabled={busy} tabIndex={busy ? -1 : undefined} onClick={event => { if (busy) event.preventDefault(); }} className={btnPrimary + " mb-4 w-full"}><Plus aria-hidden="true" size={18} />Nueva operación</Link>
    <label className="relative mb-4 block">
      <span className="sr-only">Buscar cliente o folio</span>
      <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" />
      <input type="search" className={inputClass + " pl-10"} placeholder="Buscar cliente o folio" value={query} onChange={event => onQueryChange(event.target.value)} />
    </label>
    <div className="mb-5 flex flex-wrap gap-2" aria-label="Estado de los expedientes">
      <button type="button" className={showDeleted ? btnGhost : btnPrimary} aria-pressed={!showDeleted} disabled={busy} onClick={() => { if (showDeleted) onStateChange(false); }}>Activos</button>
      <button type="button" className={showDeleted ? btnPrimary : btnGhost} aria-pressed={showDeleted} disabled={busy} onClick={() => { if (!showDeleted) onStateChange(true); }}>Eliminados</button>
    </div>
    {expedientes.length === 0 ? <p className="text-sm text-muted-foreground">{showDeleted ? "No hay expedientes eliminados visibles para tu cuenta." : "Aún no hay expedientes activos visibles para tu cuenta."}</p>
      : visible.length === 0 ? <p role="status" className="text-sm text-muted-foreground">No hay coincidencias. Prueba otro nombre o folio.</p>
      : <div>{groups.map(group => {
        const items = visible.filter(item => (groups.some(candidate => candidate.type === clientsById.get(item.cliente_id)?.tipo) ? clientsById.get(item.cliente_id)?.tipo : "otro") === group.type);
        if (items.length === 0 && group.type !== "comprador" && group.type !== "propietario") return null;
        return <details key={group.type} open className="group border-t border-border py-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-base font-semibold [&::-webkit-details-marker]:hidden">
            <span>{group.label}</span><span className="font-normal text-muted-foreground">({items.length})</span>
            <ChevronDown size={18} aria-hidden="true" className="ml-auto shrink-0 transition-transform group-not-open:-rotate-90 motion-reduce:transition-none" />
          </summary>
          {items.length === 0 ? <p className="px-1 pb-3 text-sm text-muted-foreground">{needle ? "Sin coincidencias en este grupo." : "Sin operaciones en este grupo."}</p> : <ul className="divide-y divide-border">
            {items.map(item => {
              const client = clientsById.get(item.cliente_id);
              const property = item.propiedad_slug ? propertiesBySlug.get(item.propiedad_slug) : null;
              return <li key={item.id} className="py-1"><button type="button" disabled={busy} aria-pressed={item.id === selectedId} aria-current={item.id === selectedId ? "true" : undefined} onClick={() => onSelect(item.id)}
                style={{ borderLeftColor: item.id === selectedId ? "var(--primary)" : "transparent", backgroundColor: item.id === selectedId ? "var(--panel-selected)" : undefined }}
                className="admin-dossier-select w-full min-w-0 rounded-r-md border-l-4 px-3 py-3 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
                <strong className="block break-words text-base font-semibold">{client?.nombre?.trim() || "Cliente sin nombre"}</strong>
                <span className="mt-1 block break-words text-sm text-muted-foreground">{property ?? (item.propiedad_slug ? "Inmueble vinculado" : "Sin inmueble vinculado")}</span>
                <span className="mt-1 block break-words text-sm text-muted-foreground">{item.operacion === "venta" ? stageLabel(item.etapa ?? "captacion", item.flujo?.ruta) : EXPEDIENTE_ETAPAS[item.etapa ?? "captacion"]} · {item.folio} · {item.fecha_objetivo ?? "Sin fecha objetivo"}</span>
              </button></li>;
            })}
          </ul>}
        </details>;
      })}</div>}
  </aside>;
}
