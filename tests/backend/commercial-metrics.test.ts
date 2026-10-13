import { expect, test } from "vitest";
import { commercialMetrics } from "@/lib/admin/commercial-metrics";
import type { Lead, Asesor } from "@/lib/admin/store";
import type { Cliente } from "@/lib/backend/contracts";
import type { Property } from "@/data/propiedades";
import type { Task } from "@/lib/tasks";

const lead = (id: string, fields: Partial<Lead> = {}): Lead => ({ id, nombre: id, telefono: "6641234567", origen: "manual", estado: "activo", asesorId: "a1", creadoEl: "2026-10-01", notas: [], ...fields });
const client = (id: string, fields: Partial<Cliente> = {}): Cliente => ({ id, nombre: id, telefono: "6641234567", tipo: "comprador", asesorId: "a1", notas: "", creadoEl: "2026-10-01", actualizadoEl: "2026-10-01", ...fields });
const task = (id: string, fields: Partial<Task> = {}): Task => ({ id, titulo: id, descripcion: "", categoria: "leads", estado: "pendiente", prioridad: "normal", asesorId: "a1", pasos: [], ...fields });
const adviser = { id: "a1", nombre: "Asesor 1" } as Asesor;
const property = { slug: "p1", asesorId: "a1" } as Property;
const base = { leads: [] as Lead[], clientes: [] as Cliente[], propiedades: [] as Property[], tareas: [] as Task[], asesores: [adviser], expedientes: [] as {id:string;etapa?:string|null;asesor_id:string}[], today: "2026-10-04" };

test("calculates historical conversion and avoids double counting a converted lead", () => {
  const metrics = commercialMetrics({ ...base,
    leads: [lead("converted", { clienteId: "c1", perfil: { proximoContacto: "2026-10-01" } }), lead("open", { perfil: { proximoContacto: "2026-10-03" } })],
    clientes: [client("c1", { leadId: "converted", perfil: { proximoContacto: "2026-10-02" } })],
    propiedades: [property], tareas: [task("late", { vence: "2026-10-03" }), task("done", { vence: "2026-10-01", estado: "completada" })],
    expedientes: [{ id: "e1", etapa: "negociacion", asesor_id: "a1" }],
  });
  expect(metrics.conversionPercent).toBe(50);
  expect(metrics.activeLeads).toBe(1);
  expect(metrics.overdueContacts).toBe(2);
  expect(metrics.overdueTasks).toBe(1);
  expect(metrics.portfolio[0]).toMatchObject({ leads: 1, clientes: 1, inmuebles: 1, expedientes: 1, contactosVencidos: 2, tareasVencidas: 1 });
  expect(metrics.stages).toEqual([["negociacion", 1]]);
});

test("reports no conversion rate without captured leads", () => {
  expect(commercialMetrics(base).conversionPercent).toBeNull();
});

test("demo properties are excluded from operative portfolios unless explicitly included", () => {
  const input={...base,propiedades:[property,{...property,slug:"demo",demo:true},{...property,slug:"demo-unassigned",demo:true,asesorId:""}]};
  expect(commercialMetrics(input).portfolio[0].inmuebles).toBe(1);
  expect(commercialMetrics(input).unassigned.inmuebles).toBe(0);
  expect(commercialMetrics({...input,includeDemo:true}).portfolio[0].inmuebles).toBe(2);
  expect(commercialMetrics({...input,includeDemo:true}).unassigned.inmuebles).toBe(1);
});


test("recognizes older client links and excludes closed leads from active portfolio", () => {
  const metrics = commercialMetrics({ ...base,
    leads: [lead("legacy"), lead("closed", { estado: "cerrado" }), lead("pending")],
    clientes: [client("c2", { leadId: "legacy" })],
  });
  expect(metrics.converted).toBe(1);
  expect(metrics.conversionPercent).toBe(33.3);
  expect(metrics.activeLeads).toBe(1);
  expect(metrics.portfolio[0].leads).toBe(1);
});
