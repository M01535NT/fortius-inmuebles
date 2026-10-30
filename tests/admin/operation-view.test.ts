import { expect, test } from "vitest";
import { advanceTarget, attentionOf, boardCard, contractLocked, currentRequirements, dueLabel, encodeProblem, initialStatus, itemCounted, itemDone, missingItems, nowItem, pastGaps, phaseGap, problemOf, stageDocuments, stageItems, stageTrack, requirementDetail, routeStages, stageTools, type OperationRecord } from "@/lib/admin/operation-view";
import { emptyWorkflow, processStageText, requiredReviews, type OperationWorkflow, type RequirementKey } from "@/lib/formatos/operation-workflow";
import type { Task } from "@/lib/tasks";

const today = "2026-10-16";
const reviewed = (extra: Record<string, unknown> = {}) => ({ estado: "revisado" as const, soporte: "Revisado con soporte", evidencia: { tipo: "externa" as const, referencia: "Escritura 4521, Notaría 9", fecha: "2026-10-14", responsable: "Jorge Salcedo", resultado: "Sin observaciones" }, ...extra });
const flow = (requisitos: Partial<Record<RequirementKey, unknown>> = {}, extra: Partial<OperationWorkflow> = {}, ruta: OperationWorkflow["ruta"] = "captacion") => ({ ...emptyWorkflow(ruta), requisitos, ...extra }) as OperationWorkflow;
const op = (over: Partial<OperationRecord> = {}): OperationRecord => ({ id: "51000000-0000-4000-8000-000000000001", folio: "EXP-1", version: 1, cliente_id: "c1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa", etapa: "captacion", flujo: flow(), ...over });
const task = (over: Partial<Task> = {}): Task => ({ id: "t1", titulo: "Llamar al propietario", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], expedienteId: "51000000-0000-4000-8000-000000000001", asesorId: "a1", vence: "2026-10-20", ...over });
const verified = { entrevista: reviewed(), levantamiento: reviewed(), titularidad: reviewed(), factibilidad: reviewed({ vigenteHasta: "2026-12-31" }), valor: reviewed(), precio: reviewed() };
const accepted = { resolucion: { tipo: "aceptada" as const, fecha: "2026-10-09", motivo: "Encargo aceptado", siguienteAccion: "Firmar", fechaSiguiente: "2026-10-12" } };

test("lo recibido sin revisar y la falta de próxima tarea no permiten pasar de etapa", () => {
  const done = { iniciada: true, emitida: true, levantamiento: "emitido" as const, documentos: "completo" as const };
  const current = op({ inicial: done, flujo: flow({ entrevista: { estado: "recibido", soporte: "Referencia ficticia v1" } }) });
  expect(advanceTarget(current, today)).toEqual({ target: "documentacion", label: "Dictamen jurídico" });
  expect(missingItems(current, [], today).map(m => [m.text, m.why])).toEqual([["Entrevista con el propietario", "falta revisarlo"], ["Agendar la próxima tarea", "con fecha y responsable"]]);
  expect(missingItems(op({ inicial: done, flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }) }), [task()], today)).toEqual([]);
});

test("el prospecto pasa a entrevista inicial al iniciar el 02 y no avanza sin su PDF", () => {
  const prospect = op({ flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }) });
  expect(routeStages(prospect, today)).toMatchObject({ current: 0, phase: "prospecto" });
  expect(advanceTarget(prospect, today)).toEqual({ label: "Entrevista inicial" });
  expect(currentRequirements(prospect, today)).toEqual([]);
  expect(missingItems(prospect, [task()], today).map(m => m.text)).toEqual(["Iniciar la entrevista inicial"]);
  const started = op({ inicial: { iniciada: true }, flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }) });
  expect(routeStages(started, today)).toMatchObject({ current: 1, phase: "captacion" });
  expect(advanceTarget(started, today)).toEqual({ label: "Levantamiento" });
  expect(missingItems(started, [task()], today).map(m => m.text)).toEqual(["Terminar la entrevista inicial (02)"]);
  expect(missingItems({ ...started, inicial: { iniciada: true, emitida: true } }, [task()], today).map(m => m.text)).toEqual(["Iniciar el levantamiento"]);
});

test("COR-03: Hoy, Operaciones y la operación nombran igual la etapa con el mismo estado inicial", () => {
  const checklist = { pasos: [{ id: "p1", texto: "INE", hecho: false }] } as Pick<Task, "pasos">;
  expect(initialStatus(undefined)).toEqual({ iniciada: false, emitida: false, levantamiento: undefined, documentos: undefined });
  expect(initialStatus(new Map([["02", true], ["04", false]]), checklist)).toEqual({ iniciada: true, emitida: true, levantamiento: "borrador", documentos: "pendiente" });
  const cases: Array<[Map<string, boolean> | undefined, string]> = [
    // La etapa cambia al empezar el siguiente documento (titular, 26/10/2026): con la 02 terminada sigue «Entrevista inicial».
    [undefined, "Prospecto"], [new Map([["02", false]]), "Entrevista inicial"], [new Map([["02", true]]), "Entrevista inicial"],
    [new Map([["02", true], ["04", false]]), "Levantamiento"],
  ];
  for (const [formats, label] of cases) {
    const record = op({ inicial: initialStatus(formats), flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }) });
    expect(processStageText(record.etapa, record.flujo, today, record.inicial)).toBe(label);
    const track = stageTrack(record, today);
    expect(track.stages[track.current].label).toBe(label);
  }
});

test("levantamiento y checklist de documentos llevan a verificación solo con todo recibido", () => {
  const surveying = op({ inicial: { iniciada: true, emitida: true, levantamiento: "borrador" }, flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }) });
  expect(routeStages(surveying, today)).toMatchObject({ current: 2, phase: "levantamiento" });
  expect(advanceTarget(surveying, today)).toEqual({ label: "Checklist de documentos" });
  expect(missingItems(surveying, [task()], today).map(m => m.text)).toEqual(["Terminar el levantamiento (04)"]);
  expect(missingItems({ ...surveying, inicial: { ...surveying.inicial, levantamiento: "emitido" } }, [task()], today).map(m => m.text)).toEqual(["Iniciar el checklist de documentos"]);
  const collecting = op({ inicial: { iniciada: true, emitida: true, levantamiento: "emitido", documentos: "pendiente" }, flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }) });
  expect(routeStages(collecting, today)).toMatchObject({ current: 3, phase: "documentos" });
  expect(advanceTarget(collecting, today)).toEqual({ target: "documentacion", label: "Dictamen jurídico" });
  expect(missingItems(collecting, [task()], today).map(m => m.text)).toEqual(["Recibir los documentos del checklist"]);
  expect(missingItems({ ...collecting, inicial: { ...collecting.inicial, documentos: "completo" } }, [task()], today)).toEqual([]);
});

test("el propietario ve las diez etapas: dictamen, luego valor, y el contrato espera la verificación", () => {
  const checking = op({ etapa: "documentacion", flujo: flow({ entrevista: reviewed(), levantamiento: reviewed(), titularidad: reviewed() }) });
  expect(routeStages(checking, today)).toMatchObject({ labels: ["Prospecto", "Entrevista inicial", "Levantamiento", "Checklist de documentos", "Dictamen jurídico", "Opinión de valor y precio", "Contrato y preparación", "Publicación y seguimiento", "Visitas y ofertas", "Cierre y entrega"], current: 4, phase: "dictamen" });
  expect(contractLocked(checking, today)).toBe(true);
  expect(currentRequirements(checking, today).map(r => r.key)).toEqual(["titularidad", "factibilidad"]);
  expect(advanceTarget(checking, today)).toEqual({ label: "Opinión de valor y precio" });
  expect(missingItems(checking, [task()], today).map(m => m.text)).toEqual(["Que se pueda vender sin obstáculos"]);
  const valuing = op({ etapa: "documentacion", flujo: flow({ entrevista: reviewed(), levantamiento: reviewed(), titularidad: reviewed(), factibilidad: reviewed({ vigenteHasta: "2026-12-31" }) }) });
  expect(routeStages(valuing, today)).toMatchObject({ current: 5, phase: "verificacion" });
  expect(currentRequirements(valuing, today).map(r => r.key)).toEqual(["valor", "precio"]);
  expect(advanceTarget(valuing, today)).toEqual({ label: "Contrato y preparación" });
  expect(missingItems(valuing, [task()], today).map(m => m.text)).toEqual(["Opinión de valor", "Precio de salida acordado", "Registrar si tomas el encargo"]);
  const contract = op({ etapa: "documentacion", flujo: flow(verified, accepted) });
  expect(routeStages(contract, today).current).toBe(6);
  expect(contractLocked(contract, today)).toBe(false);
  // El levantamiento se confirma en su etapa (3), ya no en la del contrato.
  expect(currentRequirements(contract, today).map(r => r.key)).toEqual(["intermediacion", "plan", "publicacion"]);
  expect(currentRequirements(op({ etapa: "captacion", flujo: flow({ entrevista: reviewed() }), inicial: { iniciada: true, emitida: true, levantamiento: "borrador" } }), today).map(r => r.key)).toEqual(["levantamiento"]);
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
  expect(card).toMatchObject({ who: "Familia Navarro", property: "Casa en Playas", next: "Pedir la firma", date: "2026-10-14", late: true, mine: true, column: 4, href: "/admin/operaciones/51000000-0000-4000-8000-000000000001" });
  expect(boardCard(op({ cliente_id: "x", propiedad_slug: null }), [], today, names).next).toBe("Agendar la próxima tarea");
  expect([dueLabel("2026-10-14", today), dueLabel(today, today), dueLabel("2026-10-20", today), dueLabel(undefined, today)]).toEqual(["Vencido · 14 oct", "Hoy", "20 oct", "Sin fecha"]);
});

test("una etapa pasada dice qué documento le falta: el formato, su PDF o el checklist", () => {
  const status = (map: Record<string, "terminado" | "borrador">) => (f: string) => map[f];
  expect(phaseGap("captacion", status({}))).toBe("Falta el 02");
  expect(phaseGap("captacion", status({ "02": "terminado" }))).toBe("");
  expect(phaseGap("levantamiento", status({ "04": "borrador" }))).toBe("Falta el PDF del 04");
  expect(phaseGap("dictamen", status({ "05": "borrador" }))).toBe("Falta el PDF del 05 y el 06");
  expect(phaseGap("documentos", status({}))).toBe("Falta el checklist");
  expect(phaseGap("documentos", status({}), "pendiente")).toBe("Faltan documentos");
  expect(phaseGap("documentos", status({}), "completo")).toBe("");
  expect(phaseGap("prospecto", status({}))).toBe("");
});

test("las etapas se nombran por sí mismas, sin fases; compra, renta e inversión usan sus propios pasos", () => {
  const owner = stageTrack(op({ etapa: "documentacion", flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }) }), today);
  expect(owner.stages).toHaveLength(10);
  expect(owner.current).toBe(4);
  expect(owner.stages[owner.current]).toMatchObject({ n: 5, label: "Dictamen jurídico", key: "dictamen" });
  expect(owner.stages.every(st => !("group" in st))).toBe(true);
  const buyer = stageTrack(op({ etapa: "negociacion", flujo: flow({}, {}, "compra") }), today);
  expect(buyer.stages).toHaveLength(7);
  expect(buyer.stages[buyer.current]).toMatchObject({ n: 4, label: "Oferta y negociación" });
});

test("a las etapas pasadas se les pide su documento y el motivo de atención es el más urgente", () => {
  const dictamen = op({ etapa: "documentacion", flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }), inicial: { iniciada: true, emitida: true } });
  const status = (f: string) => f === "02" ? "terminado" as const : undefined;
  expect(pastGaps(dictamen, today, status).map(g => [g.n, g.gap])).toEqual([[3, "Falta el 04"], [4, "Falta el checklist"]]);
  expect(attentionOf(dictamen, [task({ vence: "2026-10-20" })], today, "Falta el 04")).toEqual({ label: "Falta el 04", rank: 2, late: false });
  expect(attentionOf(dictamen, [task({ vence: "2026-10-10" })], today, "Falta el 04")).toMatchObject({ label: "Tarea vencida", late: true });
  expect(attentionOf(op({ flujo: flow({ entrevista: { estado: "observado", soporte: "Sin escritura" } }) }), [], today)).toMatchObject({ label: "Hay un problema", rank: 0 });
  expect(attentionOf(op(), [task({ vence: today })], today)).toMatchObject({ label: "Vence hoy" });
  expect(attentionOf(op(), [task({ vence: "2026-10-20" })], today)).toBeNull();
  expect(attentionOf(op(), [], today)).toMatchObject({ label: "Sin próxima tarea" });
  expect(attentionOf(op({ etapa: "cerrado" }), [], today)).toBeNull();
});

test("«Para terminar la etapa» junta documentos, revisiones y lo demás; «Ahora toca» es lo primero sin terminar", () => {
  const dictamen = op({ etapa: "documentacion", flujo: flow({ entrevista: reviewed(), levantamiento: reviewed() }), inicial: { iniciada: true, emitida: true, levantamiento: "emitido", documentos: "completo" } });
  const items = stageItems(dictamen, [task()], today, f => f === "05" ? "borrador" : undefined);
  expect(items.map(i => i.kind === "documento" ? i.formato : i.kind === "requisito" ? i.key : i.kind)).toEqual(["05", "06", "titularidad", "factibilidad"]);
  expect(nowItem(items)).toMatchObject({ kind: "documento", formato: "05" });
  expect(items.filter(itemCounted).filter(itemDone)).toHaveLength(0);
  const problem = op({ ...dictamen, flujo: flow({ entrevista: reviewed(), levantamiento: reviewed(), titularidad: { estado: "observado", soporte: "Copropietario sin firma" } }) });
  expect(nowItem(stageItems(problem, [task()], today, () => "terminado"))).toMatchObject({ kind: "requisito", key: "titularidad" });
  const interview = op({ inicial: { iniciada: true, emitida: true } });
  const intake = stageItems(interview, [task()], today, f => f === "02" ? "terminado" : undefined);
  expect(intake.map(i => i.kind)).toEqual(["documento", "documento", "inicio", "requisito"]);
  expect(nowItem(intake)).toMatchObject({ kind: "inicio", step: "levantamiento" });
  expect(itemCounted(intake[1])).toBe(false);
});

test("cada etapa ofrece su documento; de la publicación al cierre no detienen y la renta no recibe los de compraventa", () => {
  const formatos = (phase: Parameters<typeof stageDocuments>[0], ruta: Parameters<typeof stageDocuments>[1]) => stageDocuments(phase, ruta).map(item => item.formato);
  expect(formatos("levantamiento", "captacion")).toEqual(["04"]);
  expect(formatos("publicacion", "captacion")).toEqual(["11"]);
  expect(formatos("visitas", "captacion")).toEqual(["12", "13", "14"]);
  expect(formatos("cierre", "captacion")).toEqual(["15", "16", "17", "18"]);
  expect(formatos("visitas", "arrendador")).toEqual(["13"]);
  expect(formatos("cierre", "arrendador")).toEqual(["16", "17", "18"]);
  expect(stageDocuments("cierre", "captacion").every(item => item.optional)).toBe(true);
});

test("la etapa 10 dice en qué paso va y muestra sus cuatro pasos con el actual marcado (COR-09)", () => {
  const at = (etapa: OperationRecord["etapa"]) => stageTrack(op({ etapa, flujo: flow(verified, accepted) }), today);
  const entrega = at("entrega");
  expect(entrega.stages[entrega.current].label).toBe("Cierre y entrega · entrega");
  expect(entrega.stages[entrega.current].pasos?.map(p => [p.label, p.state])).toEqual([["Firma y pago", "done"], ["Entrega", "now"], ["Postventa", "next"], ["Archivo", "next"]]);
  expect(at("cierre").stages[9].label).toBe("Cierre y entrega · firma y pago");
  expect(at("cerrado").stages[9].pasos?.every(p => p.state === "done")).toBe(true);
  // Antes del cierre, la etapa 10 conserva su nombre y sus pasos quedan pendientes.
  const antes = at("comercializacion");
  expect(antes.stages[9]).toMatchObject({ label: "Cierre y entrega" });
  expect(antes.stages[9].pasos?.every(p => p.state === "next")).toBe(true);
  // En renta, los pasos llevan sus propios nombres.
  const renta = stageTrack(op({ operacion: "renta", etapa: "postventa", flujo: flow(verified, accepted, "arrendador") }), today);
  expect(renta.stages[renta.current].pasos?.find(p => p.state === "now")?.label).toBe("Honorarios y seguimiento");
});

test("la renta del propietario sigue su propio camino y nombra igual sus etapas en Hoy y en la operación (COR-04)", () => {
  const rent = (etapa: OperationRecord["etapa"], requisitos: Partial<Record<RequirementKey, unknown>> = {}, extra: Partial<OperationWorkflow> = {}) =>
    op({ operacion: "renta", etapa, inicial: { iniciada: true, emitida: true, levantamiento: "emitido", documentos: "completo" }, flujo: flow(requisitos, extra, "arrendador") });
  const track = stageTrack(rent("documentacion"), today);
  expect(track.stages.map(s => s.label)).toEqual(["Prospecto", "Entrevista inicial", "Levantamiento", "Documentos básicos", "Revisión de titularidad", "Opinión de renta", "Intermediación para renta", "Publicación y seguimiento", "Selección del arrendatario", "Cierre y entrega"]);
  // Hoy y la operación dicen lo mismo en cada estado.
  for (const [etapa, requisitos, extra] of [["documentacion", {}, {}], ["documentacion", { titularidad: reviewed() }, {}], ["documentacion", { titularidad: reviewed(), valor: reviewed(), precio: reviewed() }, accepted], ["comercializacion", {}, {}], ["negociacion", {}, {}]] as const) {
    const current = rent(etapa, requisitos, extra), t = stageTrack(current, today);
    expect(processStageText(etapa, current.flujo, today, current.inicial)).toBe(t.stages[t.current].label);
  }
  expect(processStageText("negociacion", rent("negociacion").flujo, today)).toBe("Selección del arrendatario");
  // Sin dictamen completo ni plan de comercialización, ni revisión jurídica para el cierre (MRP-01).
  const all = requiredReviews("arrendador", "cerrado");
  for (const key of ["factibilidad", "plan", "revision_cierre", "comprador", "instrumento", "registro"] as RequirementKey[]) expect(all).not.toContain(key);
  expect(requiredReviews("arrendador", "comercializacion")).toEqual(["entrevista", "titularidad", "valor", "precio", "intermediacion", "levantamiento", "publicacion"]);
  expect(requiredReviews("arrendador", "entrega")).toEqual(expect.arrayContaining(["contrato_renta", "garantias_renta", "firma", "pago"]));
  // La titularidad basta para pasar a la opinión de renta; el 06 y el 08 no se piden.
  expect(routeStages(rent("documentacion", { titularidad: reviewed() }), today).phase).toBe("verificacion");
  expect(stageDocuments("dictamen", "arrendador")).toEqual([{ formato: "05", optional: true }]);
  expect(stageDocuments("verificacion", "arrendador").map(d => d.formato)).toEqual(["07"]);
  expect(advanceTarget(rent("documentacion", { titularidad: reviewed() }), today)).toEqual({ label: "Intermediación para renta" });
  // Lo que falta se dice con palabras de renta.
  expect(missingItems(rent("documentacion", { titularidad: reviewed() }), [task()], today).map(m => m.text)).toEqual(["Opinión de renta con comparables", "Renta acordada con el propietario", "Registrar si tomas el encargo"]);
  // La venta no cambia.
  expect(requiredReviews("captacion", "comercializacion")).toContain("factibilidad");
});
