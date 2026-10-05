import type { Lead } from "@/lib/admin/store";
import type { Cliente } from "@/lib/backend/contracts";

export type Followup = {
  id: string;
  kind: "lead" | "cliente";
  personId: string;
  personName: string;
  asesorId?: string;
  fecha: string;
  href: string;
};

/** A live projection of the profile date. It creates no event or task records. */
export function projectFollowups(leads: Lead[], clientes: Cliente[]): Followup[] {
  const convertedLeadIds = new Set(clientes.map(cliente => cliente.leadId).filter(Boolean));
  const followups: Followup[] = [];
  for (const cliente of clientes) {
    const fecha = cliente.perfil?.proximoContacto;
    if (fecha) followups.push({ id: `cliente:${cliente.id}`, kind: "cliente", personId: cliente.id, personName: cliente.nombre, asesorId: cliente.asesorId, fecha, href: `/admin/clientes/${encodeURIComponent(cliente.id)}` });
  }
  for (const lead of leads) {
    const fecha = lead.perfil?.proximoContacto;
    if (!fecha || lead.clienteId || convertedLeadIds.has(lead.id) || lead.estado === "cerrado" || lead.estado === "descartado") continue;
    followups.push({ id: `lead:${lead.id}`, kind: "lead", personId: lead.id, personName: lead.nombre, asesorId: lead.asesorId, fecha, href: `/admin/leads/${encodeURIComponent(lead.id)}` });
  }
  return followups.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.personName.localeCompare(b.personName));
}

export function overdueFollowups(followups: Followup[], today: string): Followup[] {
  return followups.filter(item => item.fecha < today);
}
