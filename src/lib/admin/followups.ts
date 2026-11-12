import type { Lead } from "@/lib/domain/records";
import type { Cliente } from "@/lib/backend/contracts";
import { clientStatus, leadStatus, PERSON_STATUS_LABEL, type PersonStatus, type StatusDossier } from "@/lib/admin/person-status";

export type Followup = {
  id: string;
  kind: "lead" | "cliente";
  personId: string;
  personName: string;
  asesorId?: string;
  fecha: string;
  href: string;
  /** Prospecto o cliente por contrato firmado (COR-10); sin las operaciones no se sabe. */
  status?: PersonStatus;
};
/** «Prospecto», «Cliente»… según la firma; sin datos de operaciones, «Contacto» para no adivinar. */
export const followupLabel = (f: Followup) => f.status ? PERSON_STATUS_LABEL[f.status] : f.kind === "lead" ? "Prospecto" : "Contacto";

/** A live projection of the profile date. It creates no event or task records. */
export function projectFollowups(leads: Lead[], clientes: Cliente[], dossiers?: readonly StatusDossier[] | null): Followup[] {
  const convertedLeadIds = new Set(clientes.map(cliente => cliente.leadId).filter(Boolean));
  const followups: Followup[] = [];
  for (const cliente of clientes) {
    const fecha = cliente.perfil?.proximoContacto;
    if (fecha) followups.push({ id: `cliente:${cliente.id}`, kind: "cliente", personId: cliente.id, personName: cliente.nombre, asesorId: cliente.asesorId, fecha, href: `/admin/clientes/${encodeURIComponent(cliente.id)}`, ...(dossiers ? { status: clientStatus(cliente.id, dossiers) } : {}) });
  }
  for (const lead of leads) {
    const fecha = lead.perfil?.proximoContacto;
    if (!fecha || lead.clienteId || convertedLeadIds.has(lead.id) || lead.estado === "cerrado" || lead.estado === "descartado") continue;
    followups.push({ id: `lead:${lead.id}`, kind: "lead", personId: lead.id, personName: lead.nombre, asesorId: lead.asesorId, fecha, href: `/admin/leads/${encodeURIComponent(lead.id)}`, ...(dossiers ? { status: leadStatus(lead, dossiers) } : {}) });
  }
  return followups.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.personName.localeCompare(b.personName));
}

export function overdueFollowups(followups: Followup[], today: string): Followup[] {
  return followups.filter(item => item.fecha < today);
}
