import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Lead, Asesor } from "@/lib/admin/store";
import type { Task } from "@/lib/tasks";
import { isTaskOpen } from "@/lib/tasks";
import { projectFollowups, overdueFollowups } from "@/lib/admin/followups";

export type StageRecord = { id: string; etapa?: string | null; asesor_id: string };

export function commercialMetrics(input: {
  leads: Lead[]; clientes: Cliente[]; propiedades: Property[];
  tareas: Task[]; asesores: Asesor[]; expedientes: StageRecord[]; today: string;
}) {
  const { leads, clientes, propiedades, tareas, asesores, expedientes, today } = input;
  const convertedLeadIds = new Set(clientes.map(cliente => cliente.leadId).filter(Boolean));
  const activeLeads = leads.filter(lead => !lead.clienteId && !convertedLeadIds.has(lead.id) && lead.estado !== "cerrado" && lead.estado !== "descartado");
  const converted = leads.filter(lead => !!lead.clienteId || convertedLeadIds.has(lead.id)).length;
  const overdueTasks = tareas.filter(task => isTaskOpen(task) && !!task.vence && task.vence < today);
  const overdueContacts = overdueFollowups(projectFollowups(leads, clientes), today);
  const stages = new Map<string, number>();
  for (const record of expedientes) stages.set(record.etapa || "sin-etapa", (stages.get(record.etapa || "sin-etapa") ?? 0) + 1);
  const portfolio = asesores.map(asesor => ({
    id: asesor.id, nombre: asesor.nombre,
    leads: activeLeads.filter(lead => lead.asesorId === asesor.id).length,
    clientes: clientes.filter(cliente => cliente.asesorId === asesor.id).length,
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
      clientes: clientes.filter(cliente => !cliente.asesorId).length,
      inmuebles: propiedades.filter(property => !property.asesorId).length,
      expedientes: expedientes.filter(record => !record.asesor_id).length,
      tareasVencidas: overdueTasks.filter(task => !task.asesorId).length,
      contactosVencidos: overdueContacts.filter(item => !item.asesorId).length,
    },
  };
}
