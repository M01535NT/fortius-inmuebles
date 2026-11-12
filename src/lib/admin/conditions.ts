"use client";
import * as React from "react";
import { apiRequest } from "@/lib/admin/store";
import type { PropertyCondition } from "@/lib/intake/condition";

/*
  Condiciones declaradas en la llamada (CAP-05), para el chip de Operaciones, Hoy y Contactos.
  Se piden en una sola consulta ligera; si falla, las listas siguen sin chip.
*/
type Row = PropertyCondition & { expedienteId: string | null; clienteId: string | null; leadId: string | null };
export type ConditionLookup = {
  ofOperation: (id?: string | null) => PropertyCondition | undefined;
  ofPerson: (kind: "lead" | "cliente", id?: string | null) => PropertyCondition | undefined;
};

export function conditionLookup(rows: Row[]): ConditionLookup {
  const ops = new Map<string, PropertyCondition>(), people = new Map<string, PropertyCondition>();
  // Las filas llegan de la más reciente a la más antigua: gana la primera.
  for (const { expedienteId, clienteId, leadId, ...condition } of rows) {
    if (expedienteId && !ops.has(expedienteId)) ops.set(expedienteId, condition);
    if (clienteId && !people.has(`cliente:${clienteId}`)) people.set(`cliente:${clienteId}`, condition);
    if (leadId && !people.has(`lead:${leadId}`)) people.set(`lead:${leadId}`, condition);
  }
  return {
    ofOperation: id => (id ? ops.get(id) : undefined),
    ofPerson: (kind, id) => (id ? people.get(`${kind}:${id}`) : undefined),
  };
}

const EMPTY = conditionLookup([]);
export function useConditions(): ConditionLookup {
  const [lookup, setLookup] = React.useState(EMPTY);
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ condiciones?: Row[] }>("/api/admin/entrevistas?condiciones=1")
      .then(r => { if (alive && Array.isArray(r.condiciones)) setLookup(conditionLookup(r.condiciones)); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);
  return lookup;
}
