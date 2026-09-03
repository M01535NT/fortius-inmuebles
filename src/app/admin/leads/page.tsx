"use client";
import { AsyncForm, AsyncSelect } from "@/components/admin/ui";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import {
  Badge,
  DemoBanner,
  EmptyState,
  PageHeader,
  btnPrimary,
  inputClass,
} from "@/components/admin/ui";
import {
  LEAD_ESTADOS,
  LEAD_ESTADO_LABELS,
  LEAD_ORIGEN_LABELS,
  db,
  fechaCorta,
  uid,
  upsert,
  useCollection,
  type Lead,
  type LeadEstado,
} from "@/lib/admin/store";

/*
  Bandeja de leads: todos los formularios públicos capturan aquí
  (evaluación, contacto, interés, checklist, documentos) más los manuales.
*/
export default function AdminLeadsPage() {
  const router = useRouter();
  const leads = useCollection(db.leads);
  const asesores = useCollection(db.asesores);
  const [estado, setEstado] = React.useState<LeadEstado | "todos">("todos");
  const [busqueda, setBusqueda] = React.useState("");

  const filtrados = leads
    .filter((l) => estado === "todos" || l.estado === estado)
    .filter((l) => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return `${l.nombre} ${l.telefono} ${l.mensaje ?? ""} ${l.zona ?? ""}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => b.creadoEl.localeCompare(a.creadoEl));

  async function nuevoManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const lead: Lead = {
      id: uid(),
      nombre: String(data.get("nombre") ?? ""),
      telefono: String(data.get("telefono") ?? ""),
      origen: "manual",
      estado: "nuevo",
      creadoEl: new Date().toISOString(),
      notas: [],
    };
    await upsert(db.leads, lead, null);
    router.push(`/admin/leads/${lead.id}`);
  }

  const chip =
    "inline-flex h-8 items-center rounded-md border px-3 text-[12.5px] font-medium transition-colors";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads."
        description="Cada formulario del sitio captura aquí: evaluación, contacto, interés por propiedad, checklist y descargas de documentos."
      />
      <DemoBanner />

      {/* Alta manual rápida */}
      <AsyncForm
        onSubmit={nuevoManual}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label
            htmlFor="nuevo-nombre"
            className="text-[12.5px] font-medium text-foreground"
          >
            Nombre
          </label>
          <input
            id="nuevo-nombre"
            name="nombre"
            required
            placeholder="Lead capturado por teléfono…"
            className={inputClass}
          />
        </div>
        <div className="flex min-w-[150px] flex-col gap-1.5">
          <label
            htmlFor="nuevo-telefono"
            className="text-[12.5px] font-medium text-foreground"
          >
            Teléfono
          </label>
          <input
            id="nuevo-telefono"
            name="telefono"
            required
            type="tel"
            placeholder="664 000 0000"
            className={inputClass}
          />
        </div>
        <button type="submit" className={btnPrimary}>
          <Plus className="size-4" strokeWidth={1.5} /> Capturar lead
        </button>
      </AsyncForm>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filtrar por estado"
        >
          <button
            type="button"
            aria-pressed={estado === "todos"}
            onClick={() => setEstado("todos")}
            className={
              chip +
              (estado === "todos"
                ? " border-primary/50 bg-secondary text-foreground"
                : " border-border text-foreground/70 hover:bg-secondary")
            }
          >
            Todos ({leads.length})
          </button>
          {LEAD_ESTADOS.map((e) => {
            const count = leads.filter((l) => l.estado === e).length;
            return (
              <button
                key={e}
                type="button"
                aria-pressed={estado === e}
                onClick={() => setEstado(e)}
                className={
                  chip +
                  (estado === e
                    ? " border-primary/50 bg-secondary text-foreground"
                    : " border-border text-foreground/70 hover:bg-secondary")
                }
              >
                {LEAD_ESTADO_LABELS[e]} ({count})
              </button>
            );
          })}
        </div>
        <input
          type="search"
          aria-label="Buscar lead"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono, zona…"
          className={inputClass + " h-8 max-w-[260px] text-[12.5px]"}
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          title="Sin leads con esos criterios."
          hint="Los formularios del sitio capturan leads en el servidor."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-border font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Asesor</th>
                <th className="px-4 py-3 font-medium">Recibido</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((lead) => {
                const asesor = asesores.find((a) => a.id === lead.asesorId);
                return (
                  <tr
                    key={lead.id}
                    className="transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="group block min-w-0"
                      >
                        <p className="truncate font-medium text-foreground group-hover:text-primary">
                          {lead.nombre}
                        </p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {lead.telefono}
                          {lead.zona ? ` · ${lead.zona}` : ""}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {LEAD_ORIGEN_LABELS[lead.origen]}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {asesor?.nombre ?? "Sin asignar"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {fechaCorta(lead.creadoEl)}
                    </td>
                    <td className="px-4 py-3">
                      <label
                        className="sr-only"
                        htmlFor={`lead-estado-${lead.id}`}
                      >
                        Estado de {lead.nombre}
                      </label>
                      <AsyncSelect
                        id={`lead-estado-${lead.id}`}
                        value={lead.estado}
                        onChange={async (value) =>
                          await upsert(
                            db.leads,
                            { ...lead, estado: value as LeadEstado },
                            db.leads.version(lead),
                          )
                        }
                        className="h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground"
                      >
                        {LEAD_ESTADOS.map((value) => (
                          <option key={value} value={value}>
                            {LEAD_ESTADO_LABELS[value]}
                          </option>
                        ))}
                      </AsyncSelect>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {leads.some((l) => l.estado === "nuevo") ? (
        <p className="text-[12.5px] text-muted-foreground">
          <Badge tone="green">Tip</Badge> Abre cada lead para asignar asesor,
          registrar notas y agendar el siguiente contacto.
        </p>
      ) : null}
    </div>
  );
}
