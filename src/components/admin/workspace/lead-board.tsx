"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarDays, Phone, MoreHorizontal } from "lucide-react";
import { AsyncSelect, selectClass, btnGhost, Badge } from "@/components/admin/ui";
import { db, LEAD_ESTADOS, LEAD_ESTADO_LABELS, upsert, type Lead, type LeadEstado } from "@/lib/admin/store";
import { duplicateContacts } from "@/lib/admin/workspace";

export function LeadBoard({ leads }: { leads: Lead[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = leads.find(lead => lead.id === selectedId) ?? leads[0];
  const stages = [...LEAD_ESTADOS, "convertido"] as const;
  const initials = (name: string) => name.trim().split(/\s+/).slice(0,2).map(word => word[0]).join("");
  const interest = (lead: Lead) => [lead.tipoPropiedad, lead.zona].filter(Boolean).join(" · ") || "Interés sin registrar";
  const budget = selected?.perfil?.presupuestoMax;
  const currency = selected?.perfil?.moneda;
  const phone = selected?.telefono.replace(/[^\d+]/g, "");
  return <div className="admin-crm-layout">
    <div className="admin-crm-board" aria-label="Tablero de prospectos">
      {stages.map(stage => {
        const rows = leads.filter(lead => stage === "convertido" ? !!lead.clienteId : !lead.clienteId && lead.estado === stage);
        if (stage === "convertido" && !rows.length) return null;
        return <section key={stage} aria-label={stage === "convertido" ? "Convertidos" : LEAD_ESTADO_LABELS[stage]} className="admin-crm-column">
          <h2>{stage === "convertido" ? "Convertidos" : LEAD_ESTADO_LABELS[stage]}<Badge>{rows.length}</Badge></h2>
          <ul>{rows.map(lead => <li key={lead.id} className="admin-crm-contact" data-selected={selected?.id === lead.id}>
            <button type="button" className="admin-crm-select" aria-label={`Ver resumen de ${lead.nombre}`} aria-pressed={selected?.id === lead.id} onClick={() => setSelectedId(lead.id)}>
              <span className="admin-contact-avatar" aria-hidden="true">{initials(lead.nombre)}</span><span><strong>{lead.nombre}</strong><small>{interest(lead)}</small></span>
            </button>
            <p className="admin-crm-date"><CalendarDays size={16} aria-hidden="true"/>{lead.perfil?.proximoContacto ?? "Contacto sin programar"}</p>
            {duplicateContacts(lead, leads).length > 0 && <p className="text-xs text-warning">Revisar posible duplicado</p>}
            <Link className="admin-crm-profile-link" href={`/admin/leads/${lead.id}`} aria-label={`Abrir ficha de ${lead.nombre}`}><MoreHorizontal size={18}/></Link>
          </li>)}</ul>
          {!rows.length && <p className="admin-crm-empty">Sin prospectos en esta etapa.</p>}
        </section>;
      })}
    </div>
    {selected && <aside className="admin-card admin-crm-inspector" aria-label="Resumen del prospecto">
      <div className="admin-crm-person"><span className="admin-contact-avatar" aria-hidden="true">{initials(selected.nombre)}</span><div><h2>{selected.nombre}</h2><Badge>{selected.clienteId ? "Convertido" : LEAD_ESTADO_LABELS[selected.estado]}</Badge></div><Link href={selected.clienteId ? `/admin/clientes/${selected.clienteId}` : `/admin/leads/${selected.id}`} className="admin-crm-full-profile" aria-label="Abrir ficha completa" title="Abrir ficha completa"><MoreHorizontal size={20}/></Link></div>
      {phone && <a href={`tel:${phone}`} className={btnGhost}><Phone size={17}/> Llamar</a>}
      <dl><div><dt>Interés</dt><dd>{interest(selected)}</dd></div><div><dt>Presupuesto máximo</dt><dd>{budget !== undefined && currency ? `${new Intl.NumberFormat("es-MX").format(budget)} ${currency}` : "Sin registrar"}</dd></div><div><dt>Próximo contacto</dt><dd>{selected.perfil?.proximoContacto ?? "Sin programar"}</dd></div></dl>
      {!selected.clienteId && <label className="admin-crm-stage">Etapa<AsyncSelect className={selectClass} aria-label={`Etapa de ${selected.nombre}`} value={selected.estado} onChange={value => upsert(db.leads, { ...selected, estado: value as LeadEstado }, db.leads.version(selected))}>{LEAD_ESTADOS.map(stage => <option key={stage} value={stage}>{LEAD_ESTADO_LABELS[stage]}</option>)}</AsyncSelect></label>}
      <div className="admin-crm-notes"><h3>Notas</h3><p>{selected.notas.at(-1)?.texto || selected.mensaje || "Sin notas registradas."}</p></div>
    </aside>}
  </div>;
}
