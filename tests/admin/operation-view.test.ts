import { expect, test } from "vitest";
import { advanceTarget, boardCard, contractLocked, currentRequirements, dueLabel, encodeProblem, missingItems, problemOf, requirementDetail, routeStages, stageTools, type OperationRecord } from "@/lib/admin/operation-view";
import { emptyWorkflow, type OperationWorkflow, type RequirementKey } from "@/lib/formatos/operation-workflow";
import type { Task } from "@/lib/tasks";

const today = "2026-10-16";
const reviewed = (extra: Record<string, unknown> = {}) => ({ estado: "revisado" as const, soporte: "Revisado con soporte", evidencia: { tipo: "externa" as const, referencia: "Escritura 4521, Notaría 9", fecha: "2026-10-14", responsable: "Jorge Salcedo", resultado: "Sin observaciones" }, ...extra });
const flow = (requisitos: Partial<Record<RequirementKey, unknown>> = {}, extra: Partial<OperationWorkflow> = {}, ruta: OperationWorkflow["ruta"] = "captacion") => ({ ...emptyWorkflow(ruta), requisitos, ...extra }) as OperationWorkflow;
const op = (over: Partial<OperationRecord> = {}): OperationRecord => ({ id: "51000000-0000-4000-8000-000000000001", folio: "EXP-1", version: 1, cliente_id: "c1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa", etapa: "captacion", flujo: flow(), ...over });
const task = (over: Partial<Task> = {}): Task => ({ id: "t1", titulo: "Llamar al propietario", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], expedienteId: "51000000-0000-4000-8000-000000000001", asesorId: "a1", vence: "2026-10-20", ...over });
const verified = { entrevista: reviewed(), titularidad: reviewed(), factibilidad: reviewed({ vigenteHasta: "2026-12-31" }), valor: reviewed(), precio: reviewed() };
const accepted = { resolucion: { tipo: "aceptada" as const, fecha: "2026-10-09", motivo: "Encargo aceptado", siguienteAccion: "Firmar", fechaSiguiente: "2026-10-12" } };

test("lo recibido sin revisar y la falta de próxima tarea no permiten pasar de etapa", () => {
  const current = op({ flujo: flow({ entrevista: { estado: "recibido", soporte: "Referencia ficticia v1" } }) });
  expect(advanceTarget(current, today)).toEqual({ target: "documentacion", label: "Verificación y precio" });
  expect(missingItems(current, [], today).map(m => [m.text, m.why])).toEqual([["Entrevista con el propietario", "falta revisarlo"], ["Agendar la próxima tarea", "con fecha y responsable"]]);
  expect(missingItems(op({ flujo: flow({ entrevista: reviewed() }) }), [task()], today)).toEqual([]);
});

test("el propietario ve las seis etapas y el contrato queda bloqueado hasta terminar la verificación", () => {
  const checking = op({ etapa: "documentacion", flujo: flow({ entrevista: reviewed(), titularidad: reviewed() }) });
  expect(routeStages(checking, today)).toMatchObject({ labels: ["Captación", "Verificación y precio", "Contrato y preparación", "Publicación y seguimiento", "Visitas y ofertas", "Cierre y entrega"], current: 1, phase: "verificacion" });
  expect(contractLocked(checking, today)).toBe(true);
  expect(currentRequirements(checking, today).map(r => r.key)).toEqual(["titularidad", "factibilidad", "valor", "precio"]);
  expect(advanceTarget(checking, today)).toEqual({ label: "Contrato y preparación" });
  expect(missingItems(checking, [task()], today).map(m => m.text)).toEqual(["Que se pueda vender sin obstáculos", "Opinión de valor", "Precio de salida acordado", "Registrar si tomas el encargo"]);
  const contract = op({ etapa: "documentacion", flujo: flow(verified, accepted) });
  expect(routeStages(contract, today).current).toBe(2);
  expect(contractLocked(contract, today)).toBe(false);
  expect(currentRequirements(contract, today).map(r => r.key)).toEqual(["intermediacion", "levantamiento", "plan", "publicacion"]);
  expect(advanceTarget(contract, today)).toEqual({ target: "comercializacion", label: "Publicación y seguimiento" });
});

test("un comprador sigue sus propios pasos con perfil y capacidad, no título ni intermediación", () => {
  const buyer = op({ flujo: flow({}, {}, "compra") });
  expect(routeStages(buyer, today)).toMatchObject({ labels: ["Perfil y capacidad", "Opciones", "Visitas", "Oferta y negociación", "Firma y pago", "Entrega", "Postventa"], current: 0, phase: undefined });
  expect(currentRequirements(buyer, today).map(r => r.key)).toEqual(["perfil", "privacidad"]);
  expect(advanceTarget(buyer, today)).toEqual({ target: "documentacion", label: "Opciones" });
  expect(stageTools(buyer, today).map(t => t.label)).toEqual(["Comparar casas parecidas", "Hipoteca", "Comparar ofertas"]);
});

test("pide vincular el inmueble antes de negociar y los requisitos abiertos de etapas anteriores siguen visibles", () => {
  const promoting = op({ etapa: "comercializacion", propiedad_slug: null, flujo: flow({ ...verified, intermediacion: reviewed(), levantamiento: reviewed(), plan: reviewed(), publicacion: reviewed(), valor: { estado: "observado", soporte: "Comparables viejos\nHay que actualizarlos" } }, accepted) });
  const texts = missingItems(promoting, [task()], today).map(m => m.text);
  expect(texts).toContain("Vincular el inmueble");
  expect(texts).toContain("Resolver los problemas marcados");
  expect(currentRequirements(promoting, today)).toEqual([{ key: "comprador", earlier: false }, { key: "valor", earlier: true }]);
});

test("el cierre pasa paso a paso hasta archivar", () => {
  const closing = (etapa: OperationRecord["etapa"]) => op({ etapa, flujo: flow({}, accepted) });
  expect(advanceTarget(closing("cierre"), today)?.label).toBe("Entrega");
  expect(advanceTarget(closing("postventa"), today)?.label).toBe("Archivar la operación");
  expect(advanceTarget(closing("cerrado"), today)).toBeNull();
});

test("un problema guarda título y explicación; un revisado dice quién y cuándo", () => {
  const soporte = encodeProblem("Falta la firma del copropietario", "Vive en San Diego.");
  expect(problemOf({ estado: "observado", soporte })).toEqual({ title: "Falta la firma del copropietario", body: "Vive en San Diego." });
  expect(requirementDetail(flow({ titularidad: reviewed() }), "titularidad")).toBe("Sin observaciones · Revisó Jorge Salcedo el 14 oct");
  expect(requirementDetail(flow({ factibilidad: reviewed({ vigenteHasta: "2027-01-14" }) }), "factibilidad")).toContain("Vigente hasta el 14 ene");
  expect(requirementDetail(flow({ valor: { estado: "recibido", soporte: "" } }), "valor")).toBe("Ya lo tienes. Falta revisarlo.");
});

test("la tarjeta del tablero muestra la próxima tarea, lo vencido y su columna", () => {
  const names = { client: (id?: string) => id === "c1" ? "Familia Navarro" : undefined, property: (slug?: string | null) => slug === "casa" ? "Casa en Playas" : undefined };
  const card = boardCard(op({ etapa: "documentacion" }), [task({ vence: "2026-10-14", titulo: "Pedir la firma" }), task({ id: "t2", vence: "2026-10-30" })], today, names, "a1");
  expect(card).toMatchObject({ who: "Familia Navarro", property: "Casa en Playas", next: "Pedir la firma", date: "2026-10-14", late: true, mine: true, column: 1, href: "/admin/operaciones/51000000-0000-4000-8000-000000000001" });
  expect(boardCard(op({ cliente_id: "x", propiedad_slug: null }), [], today, names).next).toBe("Agendar la próxima tarea");
  expect([dueLabel("2026-10-14", today), dueLabel(today, today), dueLabel("2026-10-20", today), dueLabel(undefined, today)]).toEqual(["Vencido · 14 oct", "Hoy", "20 oct", "Sin fecha"]);
});
