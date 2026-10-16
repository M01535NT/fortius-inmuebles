import { isTaskOpen, type Task } from "@/lib/tasks";
import { addMonths, ownerReportApplies, ownerReportStatus, processStageText, WORKFLOW_REQUIREMENTS, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { interviewFields, INTENTS, type OperationalInterview } from "@/lib/intake/interview";
import type { Followup } from "@/lib/admin/followups";

/*
  Datos de la pantalla Hoy (encargo del panel guiado, sección 4). Todo se calcula
  con lo que el panel ya carga: operaciones, tareas, contactos, entrevistas,
  ofertas e informes al propietario. No hay servidor nuevo.
*/

export type TodayDossier = { id: string; folio: string; etapa?: WorkflowStage; propiedad_slug?: string | null; asesor_id?: string; cliente_id?: string; flujo?: OperationWorkflow | null };
export type OfferRun = { id: string; updatedAt: string; context?: { expedienteId?: string } };
type Names = { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined };

/** Nombres sencillos de los requisitos (encargo, sección 4). */
export const REQUIREMENT_PLAIN_LABELS: Record<RequirementKey, string> = {
  entrevista: "Entrevista con el propietario",
  titularidad: "Quién es dueño y quién firma",
  factibilidad: "Que se pueda vender sin obstáculos",
  valor: "Opinión de valor",
  precio: "Precio de salida acordado",
  intermediacion: "Contrato de servicio firmado",
  levantamiento: "Fotos, medidas y datos revisados",
  plan: "Plan de publicación aprobado",
  publicacion: "Permiso para publicar",
  comprador: "Comprador con capacidad de pago",
  oferta: "Oferta aceptada por escrito",
  revision_cierre: "Documentos al día para firmar",
  instrumento: "Cómo se firma y se paga",
  contraparte: "Comprador y participantes identificados",
  firma: "Firma ante notario",
  pago: "Pago completo antes de entregar",
  entrega: "Entrega con acta",
  registro: "Trámite de registro",
  honorarios: "Honorarios cobrados",
  archivo: "Pendientes resueltos y operación archivada",
  perfil: "Qué busca el cliente y quién decide",
  capacidad: "Presupuesto y crédito comprobados",
  privacidad: "Aviso de privacidad firmado",
  opciones: "Opciones que le sirven al cliente",
  visitas: "Visitas hechas e inmueble elegido",
  arrendatario: "Inquilino con capacidad de pago",
  contrato_renta: "Contrato de renta acordado",
  garantias_renta: "Depósito y garantías",
  inventario_entrega: "Inventario y entrega de llaves",
  termino_renta: "Fin del encargo y seguimiento",
  criterios_inversion: "Qué busca invertir y sus límites",
  escenarios_inversion: "Escenarios revisados",
  riesgos_inversion: "Riesgos revisados",
  decision_inversion: "Decisión y capital autorizados",
  ejecucion_inversion: "Operación de compra vinculada",
  seguimiento_inversion: "Seguimiento de resultados",
};
export function requirementName(key: RequirementKey) { return REQUIREMENT_PLAIN_LABELS[key] ?? WORKFLOW_REQUIREMENTS[key].label; }

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const dayOf = (date: string) => new Date(date.slice(0, 10) + "T12:00:00.000Z");
/** «16 oct». */
export function shortDate(date: string) { const d = dayOf(date); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; }
/** «Viernes 16 oct 2026». */
export function longDate(date: string) { const d = dayOf(date); return `${WEEKDAYS[d.getUTCDay()]} ${shortDate(date)} ${d.getUTCFullYear()}`; }
/** «Lun 19». */
export function weekdayDate(date: string) { const d = dayOf(date); return `${WEEKDAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()}`; }
export function addDays(date: string, days: number) { const d = dayOf(date); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
export function greeting(hour: number) { return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"; }

const active = (d: TodayDossier) => d.etapa !== "cerrado" && d.flujo?.estado !== "descartada";

export type WaitingItem = { id: string; who: string; folio?: string; detail?: string; reason: string; when: string; late: boolean; href: string; rank: number; sort: string };

/**
  «Esperan algo de ti»: una tarjeta por operación o contacto, con el motivo más
  urgente. Orden: hay un problema, tarea vencida, documento por revisar, oferta
  nueva, sin próxima tarea; después los contactos a los que toca dar seguimiento.
*/
export function waitingItems({ dossiers, tasks, offers, followups, names, today }: { dossiers: TodayDossier[]; tasks: Task[]; offers: OfferRun[] | null; followups: Followup[]; names: Names; today: string }): WaitingItem[] {
  const items: WaitingItem[] = [];
  const recentOffer = addDays(today, -3);
  for (const dossier of dossiers.filter(active)) {
    const flow = dossier.flujo;
    const requirements = Object.entries(flow?.requisitos ?? {}) as Array<[RequirementKey, NonNullable<OperationWorkflow["requisitos"][RequirementKey]>]>;
    const open = tasks.filter(t => t.expedienteId === dossier.id && isTaskOpen(t));
    const overdue = open.filter(t => t.vence && t.vence < today).sort((a, b) => a.vence!.localeCompare(b.vence!));
    const problem = requirements.find(([, r]) => r.estado === "observado");
    const received = requirements.find(([, r]) => r.estado === "recibido");
    const offer = offers?.filter(o => o.context?.expedienteId === dossier.id && o.updatedAt.slice(0, 10) >= recentOffer).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const since = (value?: string) => value ? (value.slice(0, 10) === today ? "Hoy" : `Desde el ${shortDate(value)}`) : "";
    let pick: Pick<WaitingItem, "reason" | "when" | "late" | "rank"> | null = null;
    if (problem) pick = { reason: `Hay un problema con «${requirementName(problem[0])}»${problem[1].soporte.trim() ? `: ${problem[1].soporte.trim()}` : "."}`, when: since(problem[1].registradoEl), late: true, rank: 0 };
    else if (overdue.length) pick = { reason: `Tarea vencida: ${overdue[0].titulo}`, when: `Vencida desde el ${shortDate(overdue[0].vence!)}`, late: true, rank: 1 };
    else if (received) pick = { reason: `Ya tienes «${requirementName(received[0])}». Revísalo.`, when: since(received[1].registradoEl), late: false, rank: 2 };
    else if (offer) pick = { reason: "Se registró una oferta. Revísala con el propietario.", when: offer.updatedAt.slice(0, 10) === today ? "Hoy" : `El ${shortDate(offer.updatedAt)}`, late: false, rank: 3 };
    else if (flow?.estado !== "pausada" && !open.some(t => !!t.vence)) pick = { reason: "No tiene una próxima tarea con fecha. Agenda el siguiente paso.", when: "", late: false, rank: 4 };
    if (!pick) continue;
    const property = names.property(dossier.propiedad_slug);
    items.push({ id: dossier.id, who: names.client(dossier.cliente_id) ?? property ?? dossier.folio, folio: dossier.folio, detail: [property, processStageText(dossier.etapa, flow, today)].filter(Boolean).join(" · "), href: `/admin/operaciones/${encodeURIComponent(dossier.id)}`, sort: dossier.folio, ...pick });
  }
  for (const contact of followups.filter(f => f.fecha <= today)) {
    items.push({ id: contact.id, who: contact.personName, detail: contact.kind === "lead" ? "Prospecto" : "Cliente", reason: "Toca darle seguimiento.", when: contact.fecha === today ? "Hoy" : `Desde el ${shortDate(contact.fecha)}`, late: contact.fecha < today, href: contact.href, rank: 5, sort: contact.fecha });
  }
  return items.sort((a, b) => a.rank - b.rank || a.sort.localeCompare(b.sort));
}

/** Avance de una entrevista: secciones con preguntas obligatorias que ya tienen todas sus respuestas. */
export function interviewProgress(interview: Pick<OperationalInterview, "intencion" | "respuestas">) {
  const sections = new Map<string, boolean>();
  for (const field of interviewFields(interview.intencion).filter(f => f.required)) {
    sections.set(field.section, (sections.get(field.section) ?? true) && !!interview.respuestas?.[field.key]?.trim());
  }
  const total = sections.size, done = [...sections.values()].filter(Boolean).length;
  return { total, missing: total - done };
}
const WANTS: Record<string, string> = { vender: "Quiere vender", arrendar: "Quiere rentar su inmueble", comprar: "Quiere comprar", rentar: "Busca una renta", invertir: "Quiere invertir" };
export function interviewSummary(interview: Pick<OperationalInterview, "intencion" | "respuestas">) {
  const { total, missing } = interviewProgress(interview);
  const wants = WANTS[interview.intencion] ?? INTENTS[interview.intencion]?.label ?? "";
  return [wants, missing ? `Faltan ${missing} de ${total} secciones` : "Lista para terminar"].filter(Boolean).join(" · ");
}

/** Tareas de hoy: las abiertas que vencen hoy o antes y las que se terminaron hoy. */
export function todayTasks(tasks: Task[], today: string) {
  return tasks.filter(t => !!t.vence && t.vence <= today && (isTaskOpen(t) || (t.estado === "completada" && t.completadoEl?.slice(0, 10) === today)))
    .sort((a, b) => Number(!isTaskOpen(a)) - Number(!isTaskOpen(b)) || a.vence!.localeCompare(b.vence!) || a.titulo.localeCompare(b.titulo, "es"));
}

export type UpcomingItem = { id: string; date: string; kind: "Tarea" | "Vence" | "Informe"; text: string; meta: string; href: string };

/** Próximos 7 días (pedido del titular): tareas, requisitos que dejan de estar vigentes e informes mensuales. */
export function upcomingItems({ tasks, dossiers, reports, names, today }: { tasks: Task[]; dossiers: TodayDossier[]; reports: Record<string, string> | null | undefined; names: Names; today: string }): UpcomingItem[] {
  const end = addDays(today, 7), inRange = (date?: string) => !!date && date > today && date <= end;
  const dossierOf = (id?: string) => dossiers.find(d => d.id === id);
  const label = (d: TodayDossier) => names.client(d.cliente_id) ?? names.property(d.propiedad_slug) ?? d.folio;
  const items: UpcomingItem[] = [];
  for (const task of tasks.filter(t => isTaskOpen(t) && inRange(t.vence))) {
    const d = dossierOf(task.expedienteId);
    items.push({ id: `tarea:${task.id}`, date: task.vence!, kind: "Tarea", text: task.titulo, meta: d ? `${d.folio} · ${label(d)}` : names.property(task.propiedadSlug) ?? "Sin operación", href: `/admin/tareas/${encodeURIComponent(task.id)}` });
  }
  for (const d of dossiers.filter(active)) {
    for (const [key, r] of Object.entries(d.flujo?.requisitos ?? {}) as Array<[RequirementKey, NonNullable<OperationWorkflow["requisitos"][RequirementKey]>]>) {
      if (r.estado === "revisado" && inRange(r.vigenteHasta)) items.push({ id: `vigencia:${d.id}:${key}`, date: r.vigenteHasta!, kind: "Vence", text: requirementName(key), meta: `${label(d)} · ${d.folio}`, href: `/admin/operaciones/${encodeURIComponent(d.id)}` });
    }
    if (reports && ownerReportApplies(d.etapa, d.flujo)) {
      const last = reports[d.id];
      const next = last ? addMonths(last.slice(0, 10), 1) : undefined;
      if (inRange(next)) items.push({ id: `informe:${d.id}`, date: next!, kind: "Informe", text: "Informe mensual al propietario", meta: `${label(d)} · se cumple el mes`, href: `/admin/apps/informe-propietario?expedienteId=${encodeURIComponent(d.id)}` });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind) || a.text.localeCompare(b.text, "es"));
}

/** Informes al propietario vencidos o que nunca se han preparado, mientras el inmueble se promueve o negocia. */
export function overdueReports({ dossiers, reports, names, today }: { dossiers: TodayDossier[]; reports: Record<string, string>; names: Names; today: string }) {
  return dossiers.filter(d => active(d) && ownerReportApplies(d.etapa, d.flujo)).map(d => ({ d, status: ownerReportStatus(reports[d.id], today) }))
    .filter(({ status }) => status.estado !== "al_dia")
    .map(({ d, status }) => ({ id: d.id, who: names.client(d.cliente_id) ?? d.folio, property: names.property(d.propiedad_slug) ?? d.folio, status: status.estado === "sin_informe" ? "Sin informe preparado" : `Vencido desde el ${shortDate(status.proximo!)}`, href: `/admin/apps/informe-propietario?expedienteId=${encodeURIComponent(d.id)}` }));
}
