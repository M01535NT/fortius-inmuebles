"use client";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { LeadFields, readLeadFields } from "@/components/admin/lead-fields";
import { LeadBoard } from "@/components/admin/workspace/lead-board";
import { duplicateContacts } from "@/lib/admin/workspace";
import { ConvertLeadButton } from "@/components/admin/convert-lead-button";
import { AsyncForm, AsyncSelect } from "@/components/admin/ui";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

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
  const [estado, setEstado] = React.useState<LeadEstado | "todos" | "convertidos">("todos");
  const [busqueda, setBusqueda] = React.useState("");
  const [capturaAbierta, setCapturaAbierta] = React.useState(()=>typeof window!=="undefined" && new URLSearchParams(window.location.search).get("nuevo")==="1");
  useQuickCreate("/admin/leads", () => setCapturaAbierta(true));
  const [view,setView] = React.useState<"lista"|"etapas">("lista");
  const [guardando, setGuardando] = React.useState(false);
  const nombreInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (capturaAbierta) nombreInput.current?.focus();
  }, [capturaAbierta]);

  const filtrados = leads
    .filter((l) => estado === "convertidos" ? !!l.clienteId : !l.clienteId)
    .filter((l) => estado === "todos" || estado === "convertidos" || l.estado === estado)
    .filter((l) => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return `${l.nombre} ${l.telefono} ${l.email ?? ""} ${l.mensaje ?? ""} ${l.zona ?? ""} ${l.tipoPropiedad ?? ""} ${l.perfil?.requisitos ?? ""} ${l.perfil?.caracteristicas ?? ""}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => b.creadoEl.localeCompare(a.creadoEl));

  async function nuevoManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const lead: Lead = {
      id: uid(),
      ...readLeadFields(form),
      origen: "manual",
      estado: "nuevo",
      creadoEl: new Date().toISOString(),
      notas: [],
    };
    setGuardando(true);
    try {
      await upsert(db.leads, lead, null);
      form.reset();
      setCapturaAbierta(false);
      router.push(`/admin/leads/${lead.id}`);
    } finally {
      setGuardando(false);
    }
  }

  const chip =
    "inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium transition-colors";

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Leads."
        description="Captura y da seguimiento a tus leads. Convierte un lead en cliente con sus datos e historial; consúltalo después en Convertidos."
        actions={
          <button
            type="button"
            aria-expanded={capturaAbierta}
            aria-controls="captura-manual-lead"
            disabled={guardando}
            onClick={() => setCapturaAbierta((abierta) => !abierta)}
            className={btnPrimary}
          >
            {capturaAbierta ? (
              <X className="size-4" strokeWidth={1.5} />
            ) : (
              <Plus className="size-4" strokeWidth={1.5} />
            )}
            {capturaAbierta ? "Cerrar captura" : "Nuevo lead"}
          </button>
        }
      />
      <DemoBanner />

      {/* Alta manual rápida */}
      <div id="captura-manual-lead" hidden={!capturaAbierta}>
        <AsyncForm
          onSubmit={nuevoManual}
          className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4"
        >
          <LeadFields nombreRef={nombreInput} />
          <button type="submit" className={btnPrimary}>
            <Plus className="size-4" strokeWidth={1.5} /> Capturar lead
          </button>
        </AsyncForm>
      </div>

      {/* Filtros */}
      <div className="flex min-w-0 flex-col gap-3">
        <input
          type="search"
          aria-label="Buscar lead"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono, correo, zona…"
          className={inputClass + " lg:max-w-sm"}
        />
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
            Todos ({leads.filter(l => !l.clienteId).length})
          </button>
          {LEAD_ESTADOS.map((e) => {
            const count = leads.filter((l) => !l.clienteId && l.estado === e).length;
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
          <button type="button" aria-pressed={estado === "convertidos"} onClick={() => setEstado("convertidos")}
            className={chip + (estado === "convertidos" ? " border-primary/50 bg-secondary text-foreground" : " border-border text-foreground/70 hover:bg-secondary")}>
            Convertidos ({leads.filter(l => !!l.clienteId).length})
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Vista de prospectos"><button type="button" className={btnPrimary} aria-pressed={view==="lista"} onClick={()=>setView("lista")}>Lista</button><button type="button" className={btnPrimary} aria-pressed={view==="etapas"} onClick={()=>setView("etapas")}>Por etapas</button><span className="self-center text-sm text-muted-foreground">{leads.filter(l=>duplicateContacts(l,leads).length>0).length} registros con posible duplicado</span></div>
      {view === "etapas" ? <LeadBoard leads={filtrados}/> : filtrados.length === 0 ? (
        <EmptyState
          title="Sin leads con esos criterios."
          hint="Los formularios del sitio capturan leads en el servidor."
        />
      ) : (
        <>
          <ul aria-label="Leads" className="min-w-0 space-y-3 lg:hidden">
            {filtrados.map((lead) => {
              const asesor = asesores.find((a) => a.id === lead.asesorId);
              return (
                <li
                  key={lead.id}
                  className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 [overflow-wrap:anywhere]"
                >
                  <h2>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="flex min-h-11 items-center text-base font-semibold text-foreground hover:text-primary-ink"
                    >
                      {lead.nombre}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {lead.telefono}
                    {lead.zona ? ` · ${lead.zona}` : ""}
                  </p>
                  <dl className="grid min-w-0 grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Origen</dt>
                      <dd className="mt-1">{LEAD_ORIGEN_LABELS[lead.origen]}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Recibido</dt>
                      <dd className="mt-1">{fechaCorta(lead.creadoEl)}</dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-xs text-muted-foreground">Asesor</dt>
                      <dd className="mt-1">{asesor?.nombre ?? "Sin asignar"}</dd>
                    </div>
                  </dl>
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <LeadStatus lead={lead} />
                  </div>
                  <ConvertLeadButton lead={lead} compact />
                </li>
              );
            })}
          </ul>
          <div className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card lg:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Asesor</th>
                  <th className="px-4 py-3 font-medium">Recibido</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
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
                          className="group block min-h-11 min-w-0"
                        >
                          <p className="truncate font-medium text-foreground group-hover:text-primary-ink">
                            {lead.nombre}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {lead.telefono}
                            {lead.zona ? ` · ${lead.zona}` : ""}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {LEAD_ORIGEN_LABELS[lead.origen]}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {asesor?.nombre ?? "Sin asignar"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {fechaCorta(lead.creadoEl)}
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatus lead={lead} />
                      </td>
                      <td className="px-4 py-3"><ConvertLeadButton lead={lead} compact /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {leads.some((l) => !l.clienteId && l.estado === "nuevo") ? (
        <p className="text-sm text-muted-foreground">
          <Badge tone="green">Tip</Badge> Abre cada lead para asignar asesor,
          registrar notas y agendar el siguiente contacto.
        </p>
      ) : null}
    </div>
  );
}

function LeadStatus({ lead }: { lead: Lead }) {
  if (lead.clienteId) return <Badge tone="green">Convertido en cliente</Badge>;
  return (
    <AsyncSelect
      aria-label={`Estado de ${lead.nombre}`}
      value={lead.estado}
      onChange={async (value) =>
        await upsert(
          db.leads,
          { ...lead, estado: value as LeadEstado },
          db.leads.version(lead),
        )
      }
      className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-base text-foreground lg:text-sm"
    >
      {LEAD_ESTADOS.map((value) => (
        <option key={value} value={value}>
          {LEAD_ESTADO_LABELS[value]}
        </option>
      ))}
    </AsyncSelect>
  );
}
