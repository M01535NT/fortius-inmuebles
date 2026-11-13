import { isTaskOpen, type Task } from "@/lib/tasks";
import { addMonths, lastOwnerReport, ownerReportApplies, ownerReportStatus, processStageText, WORKFLOW_REQUIREMENTS, type InitialInterviewStatus, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { interviewFields, INTENTS, type OperationalInterview } from "@/lib/intake/interview";
import { followupLabel, type Followup } from "@/lib/admin/followups";
import { attentionOf, pastGaps, recentOfferOf, type AttentionKind, type OperationRecord } from "@/lib/admin/operation-view";

/*
  Datos de la pantalla Hoy (encargo del panel guiado, sección 4). Todo se calcula
  con lo que el panel ya carga: operaciones, tareas, contactos, entrevistas,
  ofertas e informes al propietario. No hay servidor nuevo.
*/

export type TodayDossier = { id: string; folio: string; etapa?: WorkflowStage; propiedad_slug?: string | null; asesor_id?: string; cliente_id?: string; flujo?: OperationWorkflow | null;
  /** No viene de la base: Hoy lo calcula con `initialStatus`, igual que Operaciones (COR-03). */
  inicial?: InitialInterviewStatus };
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
  levantamiento: "Datos del levantamiento confirmados",
  plan: "Plan de publicación aprobado",
  publicacion: "Permiso para publicar",
  comprador: "Comprador con capacidad de pago",
  oferta: "Oferta aceptada por escrito",
  revision_cierre: "Documentos al día para firmar",
  instrumento: "Cómo se firma y se paga",
  contraparte: "Comprador y participantes identificados",
  firma: "Firma acreditada",
  pago: "Pagos para entregar cumplidos según contrato",
  entrega: "Entrega con acta",
  registro: "Trámite de registro",
  honorarios: "Honorarios cobrados",
  archivo: "Pendientes resueltos y operación archivada",
  perfil: "Qué busca el cliente y quién decide",
  capacidad: "Presupuesto y crédito comprobados",
  privacidad: "Aviso y controles de privacidad revisados",
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
/** En la renta del propietario algunos requisitos se llaman por lo que son en una renta (COR-04). */
const RENT_PLAIN_LABELS: Partial<Record<RequirementKey, string>> = {
  titularidad: "Identificación y prueba de propiedad revisadas",
  valor: "Opinión de renta con comparables",
  precio: "Renta acordada con el propietario",
  intermediacion: "Intermediación para renta firmada",
  oferta: "Arrendatario aceptado tras su investigación",
  contraparte: "Arrendatario identificado como contraparte",
  firma: "Contrato de arrendamiento firmado",
  pago: "Depósito y primera renta recibidos",
};
export function requirementName(key: RequirementKey, route?: string | null) {
  return (route === "arrendador" ? RENT_PLAIN_LABELS[key] : undefined) ?? REQUIREMENT_PLAIN_LABELS[key] ?? WORKFLOW_REQUIREMENTS[key].label;
}

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

/**
  La cola única de «Lo siguiente» (SIM-16, 11/11/2026): todo lo que espera algo del usuario en una
  sola lista, de lo más urgente a lo menos. Cada tipo conserva su origen (operación, contacto,
  entrevista, contrato, informe, llaves, aviso) y se distingue por una pastilla, no por una sección.
*/
export type QueueKind = "plazo" | "problema" | "vencida" | "nuevo" | "llaves" | "contrato" | "licencia" | "informe" | "falta" | "revisar" | "hoy" | "decidir" | "entrevista" | "seguimiento" | "agendar" | "aviso";
export type QueueItem = {
  id: string; kind: QueueKind;
  /** Quién o qué: la persona o el inmueble. */
  who: string;
  /** Qué espera: el motivo en una frase. */
  text: string; detail?: string; when?: string; late: boolean; href: string;
  /** Orden dentro de la misma urgencia (folio, fecha o posición). */
  sort: string;
  propertySlug?: string | null; folio?: string; taskId?: string;
  /** Prospecto nuevo del sitio: Hoy ofrece «Registrar contacto» (COR-21). */
  leadId?: string;
};
export const QUEUE_LABEL: Record<QueueKind, string> = { plazo: "Pasó el plazo", problema: "Problema", vencida: "Vencida", nuevo: "Nuevo", llaves: "Llaves", contrato: "Contrato", licencia: "Licencia", informe: "Informe", falta: "Falta", revisar: "Revisar", hoy: "Vence hoy", decidir: "Oferta", entrevista: "Entrevista", seguimiento: "Seguimiento", agendar: "Agendar", aviso: "Aviso" };
// Las operaciones siguen el orden de RP-84 (problema, vencida, falta, revisar, vence hoy, oferta, sin próxima tarea).
const QUEUE_RANK: Record<QueueKind, number> = { plazo: -1, problema: 0, vencida: 1, nuevo: 2, llaves: 3, contrato: 4, licencia: 4, informe: 5, falta: 6, revisar: 7, hoy: 8, decidir: 9, entrevista: 10, seguimiento: 11, agendar: 12, aviso: 13 };
const WAITING_KIND: Record<AttentionKind | "contacto", QueueKind> = { problema: "problema", vencida: "vencida", falta: "falta", revisar: "revisar", hoy: "hoy", oferta: "decidir", agendar: "agendar", contacto: "seguimiento" };

/** Lo vencido primero; después por tipo y, dentro del tipo, por folio o fecha. */
export function sortQueue(items: QueueItem[]): QueueItem[] {
  return [...items].sort((a, b) => Number(b.late) - Number(a.late) || QUEUE_RANK[a.kind] - QUEUE_RANK[b.kind] || a.sort.localeCompare(b.sort));
}
export function queueFromWaiting(items: WaitingItem[]): QueueItem[] {
  return items.map(item => ({ id: `espera:${item.id}`, kind: WAITING_KIND[item.kind], who: item.who, text: item.rank === 1 ? item.reason.replace(/^Tarea vencida: /, "") : item.reason, detail: item.detail, when: item.when, late: item.late, href: item.href, sort: item.sort, propertySlug: item.propertySlug, folio: item.folio, taskId: item.taskId }));
}
/**
  Al director, el prospecto de otro asesor que pasó el plazo de primera atención sube arriba como
  aviso propio (CRM-01, 12/11/2026): dice a quién le toca y lleva a reasignarlo. No se reasigna solo.
*/
export function queueFromLeads(items: NewLeadItem[], viewer?: { admin: boolean; me?: string | null }): QueueItem[] {
  return items.map((item, index) => {
    const sort = String(index).padStart(4, "0");
    if (viewer?.admin && item.late && item.responsible && item.responsible !== viewer.me) return {
      id: `plazo:${item.id}`, kind: "plazo", who: item.who, text: "Nadie le ha respondido", detail: `Le toca a ${item.responsibleName ?? "su asesor"}: llámale tú o reasígnala`,
      when: item.since, late: true, href: `${item.href}#reasignar`, sort,
    };
    return { id: `nuevo:${item.id}`, kind: "nuevo", who: item.who, text: item.detail, when: item.since, late: item.late, href: item.href, leadId: item.id, sort };
  });
}
export function queueFromInterviews(interviews: OperationalInterview[]): QueueItem[] {
  return interviews.map(interview => ({ id: `entrevista:${interview.id}`, kind: "entrevista", who: interview.contacto?.nombre || "Contacto sin nombre", text: interviewSummary(interview), late: false, href: `/admin/operaciones/nueva?entrevista=${encodeURIComponent(interview.id)}`, sort: interview.updated_at ?? "" }));
}
export function queueFromExpiry(items: ExpiryItem[]): QueueItem[] {
  return items.map(item => ({ id: item.id, kind: item.kind === "Contrato" ? "contrato" : "licencia", who: item.meta, text: item.text, when: shortDate(item.date), late: item.late, href: item.href, sort: item.date }));
}
export function queueFromReports(items: ReturnType<typeof overdueReports>): QueueItem[] {
  return items.map(report => ({ id: `informe:${report.id}`, kind: "informe", who: report.who, text: "Preparar el informe mensual al propietario", detail: report.property, when: report.status, late: report.status.startsWith("Vencido"), href: report.href, sort: report.id }));
}

export type WaitingItem = { id: string; who: string; folio?: string; detail?: string; reason: string; when: string; late: boolean; href: string; rank: number; kind: AttentionKind | "contacto"; sort: string; propertySlug?: string | null;
  /** La tarea vencida que motiva la tarjeta: «Tareas de hoy» no la repite (C10). */
  taskId?: string;
  /** Con un problema escrito, el requisito al que pertenece; va en la línea secundaria (C35). */
  requirement?: string };

/**
  «Esperan algo de ti»: una tarjeta por operación o contacto, con el motivo más urgente.
  El motivo de cada operación sale de `attentionOf` (RP-84, COR-05), la misma función de
  Operaciones; aquí solo se escribe en una frase. Después, los contactos a los que toca dar seguimiento.
*/
export function waitingItems({ dossiers, tasks, offers, followups, names, today, formats }: { dossiers: TodayDossier[]; tasks: Task[]; offers: OfferRun[] | null; followups: Followup[]; names: Names; today: string; formats?: ReadonlyMap<string, ReadonlyMap<string, boolean>> }): WaitingItem[] {
  const items: WaitingItem[] = [];
  for (const dossier of dossiers.filter(active)) {
    const flow = dossier.flujo;
    const requirements = Object.entries(flow?.requisitos ?? {}) as Array<[RequirementKey, NonNullable<OperationWorkflow["requisitos"][RequirementKey]>]>;
    const open = tasks.filter(t => t.expedienteId === dossier.id && isTaskOpen(t));
    const offer = recentOfferOf(dossier.id, offers, today);
    // Igual que Operaciones: solo se sabe qué formatos existen; se avisa del que falta por completo.
    const own = formats?.get(dossier.id);
    const gap = formats ? pastGaps(dossier as unknown as OperationRecord, today, formato => own?.has(formato) ? "terminado" : undefined)[0]?.gap : undefined;
    const attention = attentionOf(dossier, tasks, today, gap, !!offer);
    if (!attention) continue;
    const since = (value?: string) => value ? (value.slice(0, 10) === today ? "Hoy" : `Desde el ${shortDate(value)}`) : "";
    const base = { late: attention.late, rank: attention.rank, kind: attention.kind };
    let pick: Pick<WaitingItem, "reason" | "when" | "late" | "rank" | "kind" | "taskId" | "requirement">;
    if (attention.kind === "problema") {
      // El título es el problema; el requisito va en la línea secundaria (C35).
      const problem = requirements.find(([, r]) => r.estado === "observado")!;
      const name = requirementName(problem[0], flow?.ruta), said = problem[1].soporte.trim();
      pick = { ...base, reason: said ? said.replace(/^./, c => c.toUpperCase()) : `Hay un problema con «${name}».`, requirement: said ? name : undefined, when: since(problem[1].registradoEl) };
    } else if (attention.kind === "vencida") {
      const overdue = open.filter(t => t.vence && t.vence < today).sort((a, b) => a.vence!.localeCompare(b.vence!))[0];
      pick = { ...base, reason: `Tarea vencida: ${overdue.titulo}`, when: `Vencida desde el ${shortDate(overdue.vence!)}`, taskId: overdue.id };
    } else if (attention.kind === "falta") {
      pick = { ...base, reason: `${attention.label} de una etapa anterior.`, when: "" };
    } else if (attention.kind === "revisar") {
      const received = requirements.find(([, r]) => r.estado === "recibido")!;
      pick = { ...base, reason: `Ya tienes «${requirementName(received[0], flow?.ruta)}». Revísalo.`, when: since(received[1].registradoEl) };
    } else if (attention.kind === "hoy") {
      const due = open.filter(t => t.vence === today).sort((a, b) => a.titulo.localeCompare(b.titulo, "es"))[0];
      pick = { ...base, reason: `Vence hoy: ${due.titulo}`, when: "Hoy", taskId: due.id };
    } else if (attention.kind === "oferta") {
      pick = { ...base, reason: "Se registró una oferta. Revísala con el propietario.", when: offer!.updatedAt.slice(0, 10) === today ? "Hoy" : `El ${shortDate(offer!.updatedAt)}` };
    } else {
      pick = { ...base, reason: "No tiene una próxima tarea con fecha. Agenda el siguiente paso.", when: "" };
    }
    const property = names.property(dossier.propiedad_slug);
    items.push({ id: dossier.id, who: names.client(dossier.cliente_id) ?? property ?? dossier.folio, folio: dossier.folio, propertySlug: dossier.propiedad_slug, detail: [pick.requirement, property, processStageText(dossier.etapa, flow, today, dossier.inicial)].filter(Boolean).join(" · "), href: `/admin/operaciones/${encodeURIComponent(dossier.id)}`, sort: dossier.folio, ...pick });
  }
  // Quien tiene una operación activa la sigue por su operación, no por el «próximo contacto» del perfil (C40).
  const withOperation = new Set(dossiers.filter(active).map(d => d.cliente_id).filter(Boolean));
  for (const contact of followups.filter(f => f.fecha <= today && !(f.kind === "cliente" && withOperation.has(f.personId)))) {
    items.push({ id: contact.id, who: contact.personName, detail: followupLabel(contact), reason: "Darle seguimiento", when: contact.fecha === today ? "Hoy" : `Desde el ${shortDate(contact.fecha)}`, late: contact.fecha < today, href: contact.href, rank: 7, kind: "contacto", sort: contact.fecha });
  }
  return items.sort((a, b) => a.rank - b.rank || a.sort.localeCompare(b.sort));
}

/** Los siete días que siguen a hoy, en orden. */
export function weekDays(today: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));
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
    items.push({ id: `tarea:${task.id}`, date: task.vence!, kind: "Tarea", text: task.titulo, meta: d ? label(d) : names.property(task.propiedadSlug) ?? "Sin operación", href: `/admin/tareas/${encodeURIComponent(task.id)}` });
  }
  for (const d of dossiers.filter(active)) {
    for (const [key, r] of Object.entries(d.flujo?.requisitos ?? {}) as Array<[RequirementKey, NonNullable<OperationWorkflow["requisitos"][RequirementKey]>]>) {
      if (r.estado === "revisado" && inRange(r.vigenteHasta)) items.push({ id: `vigencia:${d.id}:${key}`, date: r.vigenteHasta!, kind: "Vence", text: requirementName(key, d.flujo?.ruta), meta: label(d), href: `/admin/operaciones/${encodeURIComponent(d.id)}` });
    }
    if (reports && ownerReportApplies(d.etapa, d.flujo)) {
      const last = lastOwnerReport(d.flujo, reports[d.id]);
      const next = last ? addMonths(last, 1) : undefined;
      if (inRange(next)) items.push({ id: `informe:${d.id}`, date: next!, kind: "Informe", text: "Informe mensual al propietario", meta: `${label(d)} · se cumple el mes`, href: `/admin/apps/informe-propietario?expedienteId=${encodeURIComponent(d.id)}` });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind) || a.text.localeCompare(b.text, "es"));
}

/** Informes al propietario vencidos o que nunca se han preparado, mientras el inmueble se promueve o negocia. */
export function overdueReports({ dossiers, reports, names, today }: { dossiers: TodayDossier[]; reports: Record<string, string>; names: Names; today: string }) {
  return dossiers.filter(d => active(d) && ownerReportApplies(d.etapa, d.flujo)).map(d => ({ d, status: ownerReportStatus(lastOwnerReport(d.flujo, reports[d.id]), today) }))
    .filter(({ status }) => status.estado !== "al_dia")
    .map(({ d, status }) => ({ id: d.id, who: names.client(d.cliente_id) ?? d.folio, property: names.property(d.propiedad_slug) ?? "Sin inmueble vinculado", status: status.estado === "sin_informe" ? "Sin informe preparado" : `Vencido desde el ${shortDate(status.proximo!)}`, href: `/admin/apps/informe-propietario?expedienteId=${encodeURIComponent(d.id)}` }));
}

/** Fechas del contrato de intermediación (09) que entrega /api/admin/vencimientos. */
export type ContractDates = { expedienteId: string; folio: string; emitido: boolean; inicio?: string; fin?: string; exclusiva: boolean; licencia?: { numero?: string; vigencia?: string } };
export type ExpiryItem = { id: string; date: string; kind: "Contrato" | "Licencia"; text: string; meta: string; late: boolean; href: string };

const daysBetween = (from: string, to: string) => Math.round((dayOf(to).getTime() - dayOf(from).getTime()) / 86400000);
const inDays = (n: number) => n === 0 ? "hoy" : n === 1 ? "mañana" : `en ${n} días`;
/** Etapas en que el contrato firmado sostiene el encargo: desde la firma hasta antes de entregar. */
const CONTRACT_STAGES: WorkflowStage[] = ["documentacion", "comercializacion", "negociacion", "cierre"];

/**
  Contratos y licencias por vencer (titular, 29/10/2026). El contrato de servicio (09)
  avisa 30 días antes de su fin y la licencia estatal, 60; ambos siguen avisando ya
  vencidos. Solo cuentan los 09 con su versión actual emitida y operaciones activas.
*/
export function expiryItems({ contracts, dossiers, names, today }: { contracts: ContractDates[]; dossiers: TodayDossier[]; names: Names; today: string }): ExpiryItem[] {
  const items: ExpiryItem[] = [], licences = new Set<string>();
  for (const contract of contracts.filter(c => c.emitido)) {
    const d = dossiers.find(x => x.id === contract.expedienteId);
    if (!d || !active(d)) continue;
    const who = names.client(d.cliente_id) ?? names.property(d.propiedad_slug) ?? d.folio;
    const href = `/admin/operaciones/${encodeURIComponent(d.id)}`;
    if (contract.fin && CONTRACT_STAGES.includes(d.etapa ?? "captacion")) {
      const left = daysBetween(today, contract.fin);
      if (left <= 30) items.push({ id: `contrato:${d.id}`, date: contract.fin, kind: "Contrato", late: left < 0, href,
        text: left < 0 ? `El contrato de servicio venció el ${shortDate(contract.fin)}. Renuévalo o retira la publicación.` : `El contrato de servicio vence ${inDays(left)}, el ${shortDate(contract.fin)}. Habla con el propietario para renovarlo.`,
        meta: [who, names.property(d.propiedad_slug) !== who ? names.property(d.propiedad_slug) : undefined, contract.exclusiva ? "Exclusiva" : undefined].filter(Boolean).join(" · ") });
    }
    const vigencia = contract.licencia?.vigencia, key = contract.licencia?.numero ?? vigencia;
    if (vigencia && key && !licences.has(key)) {
      const left = daysBetween(today, vigencia);
      if (left <= 60) {
        licences.add(key);
        items.push({ id: `licencia:${key}`, date: vigencia, kind: "Licencia", late: left < 0, href,
          text: left < 0 ? `La licencia estatal venció el ${shortDate(vigencia)}. Renuévala antes de firmar más contratos.` : `La licencia estatal vence ${inDays(left)}, el ${shortDate(vigencia)}. Tramita la renovación.`,
          meta: [contract.licencia?.numero ? `Licencia ${contract.licencia.numero}` : undefined, `en la operación de ${who}`].filter(Boolean).join(" · ") });
      }
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
}

/** RP-23: horas para la primera atención de un prospecto nuevo; se ajusta en Configuración. */
export const FIRST_RESPONSE_HOURS = 2;
/** El plazo guardado en Configuración, o 2 h si no hay uno válido. */
export function firstResponseHours(settings?: { horasPrimeraAtencion?: unknown } | null): number {
  const value = settings?.horasPrimeraAtencion;
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 72 ? value : FIRST_RESPONSE_HOURS;
}
export type NewLeadItem = { id: string; who: string; detail: string; since: string; late: boolean; href: string; responsible?: string; responsibleName?: string; forDirector: boolean };
type LeadLike = { id: string; nombre: string; estado: string; origen: string; creadoEl: string; asesorId?: string; propiedadSlug?: string; zona?: string; mensaje?: string; clienteId?: string; firstContactedAt?: string };

/**
  «Nuevos sin atender» (COR-21): prospectos en estado «Nuevo» a los que nadie ha contactado. Le
  tocan a su asesor, si tiene; si no, al asesor del inmueble que le interesó; si tampoco, al
  director. El director los ve todos. Salen de la lista al registrar el primer contacto o al
  cambiar el estado.
*/
export function unattendedLeads({ leads, properties, me, admin, now, hours = FIRST_RESPONSE_HOURS, adviserName }: {
  leads: LeadLike[]; properties: Array<{ slug: string; titulo: string; asesorId?: string }>; me?: string | null; admin: boolean; now: Date; hours?: number; adviserName?: (id?: string) => string | undefined;
}): NewLeadItem[] {
  return leads
    // Los capturados a mano ya hablaron con alguien; aquí van los que llegan solos (sitio web).
    .filter(l => l.origen !== "manual" && l.estado === "nuevo" && !l.firstContactedAt && !l.clienteId)
    .sort((a, b) => a.creadoEl.localeCompare(b.creadoEl))
    .map(l => {
      const property = l.propiedadSlug ? properties.find(p => p.slug === l.propiedadSlug) : undefined;
      const responsible = l.asesorId || property?.asesorId || undefined;
      const elapsed = Math.max(0, now.getTime() - new Date(l.creadoEl).getTime());
      const minutes = Number.isFinite(elapsed) ? Math.floor(elapsed / 60000) : 0;
      const since = minutes < 60 ? `Llegó hace ${Math.max(1, minutes)} min` : minutes < 48 * 60 ? `Lleva ${Math.floor(minutes / 60)} h sin respuesta` : `Lleva ${Math.floor(minutes / 1440)} días sin respuesta`;
      const interest = property ? `Le interesa ${property.titulo}` : l.mensaje?.trim() ? `«${l.mensaje.trim().slice(0, 80)}${l.mensaje.trim().length > 80 ? "…" : ""}»` : l.zona ? `Busca en ${l.zona}` : "Dejó sus datos";
      const owner = responsible ? adviserName?.(responsible) : undefined;
      return { id: l.id, who: l.nombre, detail: admin ? `${interest} · ${owner ? `le toca a ${owner}` : "sin asesor: te toca a ti"}` : interest, since, late: minutes >= hours * 60, href: `/admin/leads/${encodeURIComponent(l.id)}`, ...(responsible ? { responsible } : {}), ...(owner ? { responsibleName: owner } : {}), forDirector: !responsible };
    })
    .filter(item => admin || (!!me && item.responsible === me));
}
