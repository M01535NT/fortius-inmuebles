import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Lead, Asesor } from "@/lib/domain/records";
import type { Task } from "@/lib/tasks";
import { isTaskOpen } from "@/lib/tasks";
import { projectFollowups, overdueFollowups } from "@/lib/admin/followups";
import { operationalInventory } from "@/lib/admin/operational-inventory";
import { clientStatus, type StatusDossier } from "@/lib/admin/person-status";

export type StageRecord = StatusDossier & { id: string; etapa?: string | null; asesor_id: string };

export function commercialMetrics(input: {
  leads: Lead[]; clientes: Cliente[]; propiedades: Property[];
  tareas: Task[]; asesores: Asesor[]; expedientes: StageRecord[]; today: string;
  includeDemo?: boolean;
}) {
  const { leads, clientes, tareas, asesores, expedientes, today } = input;
  const propiedades = operationalInventory(input.propiedades, input.includeDemo);
  const convertedLeadIds = new Set(clientes.map(cliente => cliente.leadId).filter(Boolean));
  // COR-10 (RP-90): cliente es quien firmó su contrato; quien tiene registro de cliente sin firma sigue como prospecto.
  const signed = (cliente: Cliente) => clientStatus(cliente.id, expedientes) !== "prospecto";
  const signedClients = clientes.filter(signed), prospectClients = clientes.filter(cliente => !signed(cliente));
  const openLeads = leads.filter(lead => !lead.clienteId && !convertedLeadIds.has(lead.id) && lead.estado !== "cerrado" && lead.estado !== "descartado");
  const activeLeads: Array<{ asesorId?: string }> = [...openLeads, ...prospectClients];
  const converted = leads.filter(lead => clientes.some(cliente => (cliente.id === lead.clienteId || cliente.leadId === lead.id) && signed(cliente))).length;
  const overdueTasks = tareas.filter(task => isTaskOpen(task) && !!task.vence && task.vence < today);
  const overdueContacts = overdueFollowups(projectFollowups(leads, clientes, expedientes), today);
  const stages = new Map<string, number>();
  for (const record of expedientes) stages.set(record.etapa || "sin-etapa", (stages.get(record.etapa || "sin-etapa") ?? 0) + 1);
  const portfolio = asesores.map(asesor => ({
    id: asesor.id, nombre: asesor.nombre,
    leads: activeLeads.filter(lead => lead.asesorId === asesor.id).length,
    clientes: signedClients.filter(cliente => cliente.asesorId === asesor.id).length,
    inmuebles: propiedades.filter(property => property.asesorId === asesor.id).length,
    expedientes: expedientes.filter(record => record.asesor_id === asesor.id).length,
    tareasVencidas: overdueTasks.filter(task => task.asesorId === asesor.id).length,
    contactosVencidos: overdueContacts.filter(item => item.asesorId === asesor.id).length,
  }));
  return {
    capturedLeads: leads.length, converted, conversionPercent: leads.length ? Math.round(1000 * converted / leads.length) / 10 : null,
    activeLeads: activeLeads.length, overdueTasks: overdueTasks.length, overdueContacts: overdueContacts.length,
    stages: [...stages].sort(([a], [b]) => a.localeCompare(b, "es")), portfolio,
    unassigned: {
      leads: activeLeads.filter(lead => !lead.asesorId).length,
      clientes: signedClients.filter(cliente => !cliente.asesorId).length,
      inmuebles: propiedades.filter(property => !property.asesorId).length,
      expedientes: expedientes.filter(record => !record.asesor_id).length,
      tareasVencidas: overdueTasks.filter(task => !task.asesorId).length,
      contactosVencidos: overdueContacts.filter(item => !item.asesorId).length,
    },
  };
}
