/*
  «Tu primer día» (COR-26): para el asesor que todavía no tiene nada suyo en el panel, tres pasos en
  Hoy. Cada paso se marca solo cuando ya hay algo suyo; la tarjeta se va al completar los tres.
*/
export type FirstDayStep = { id: "llamada" | "entrevista" | "operacion"; label: string; hint: string; href: string; done: boolean };

export function firstDaySteps({ mine, leads, events, operations }: {
  mine: string;
  leads: ReadonlyArray<{ asesorId?: string }>;
  events: ReadonlyArray<{ asesorId?: string }>;
  operations: ReadonlyArray<{ asesor_id?: string }>;
}): FirstDayStep[] {
  return [
    { id: "llamada", label: "Registra una llamada", hint: "Pulsa «+ Nuevo» → «Atender a alguien» con la primera persona que te llame.", href: "/admin/operaciones/nueva", done: leads.some(l => l.asesorId === mine) || operations.some(o => o.asesor_id === mine) },
    { id: "entrevista", label: "Agenda la entrevista", hint: "Una cita en la agenda con la persona y el inmueble.", href: "/admin/agenda", done: events.some(e => e.asesorId === mine) },
    { id: "operacion", label: "Abre tu primera operación", hint: "Se crea al terminar la entrevista del propietario.", href: "/admin/operaciones/nueva", done: operations.some(o => o.asesor_id === mine) },
  ];
}
