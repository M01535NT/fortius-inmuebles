"use client";
import * as React from "react";
import { lastNotice, pendingNotices, priceDroppedSince, seekersFrom } from "@/lib/admin/buyer-matches";
import { keyDueDate, keyLoanLate, openKeyLoans } from "@/lib/propiedad-seguimiento";
import { apiRequest, db, onAdminCacheClear, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import type { OperationalInterview } from "@/lib/intake/interview";
import { expiryItems, overdueReports, queueFromExpiry, queueFromInterviews, queueFromLeads, queueFromReports, queueFromWaiting, shortDate, sortQueue, unattendedLeads, waitingItems, type ContractDates, type OfferRun, type QueueItem, type TodayDossier } from "@/lib/admin/today";
import { initialStatus } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";

/*
  La cola de «Lo siguiente» en un solo lugar (COR-05, RP-84): Hoy la muestra y el número del
  menú cuenta sus tarjetas, así los dos siempre dicen lo mismo. Los datos del servidor se guardan
  una vez para todo el panel y se vuelven a pedir al abrir Hoy o al regresar a la ventana.
*/
type Load<T> = T | undefined | null; // undefined: cargando · null: no se pudo consultar
type Who = { administrador: boolean; asesorId: string | null };
type Remote = {
  dossiers: Load<TodayDossier[]>; interviews: Load<OperationalInterview[]>; offers: Load<OfferRun[]>;
  reports: Load<Record<string, string>>; contracts: Load<ContractDates[]>; who: Load<Who>;
  formats: Map<string, Map<string, boolean>>;
};
type DocumentsPage = { documentos?: Array<{ expedienteId: string; formatoId: string; emitido?: boolean }>; nextOffset?: number | null };

const EMPTY: Remote = { dossiers: undefined, interviews: undefined, offers: undefined, reports: undefined, contracts: undefined, who: undefined, formats: new Map() };
let remote: Remote = EMPTY;
let loading: Promise<void> | null = null;
let loadedAt = 0;
// Cambia al cerrar o cambiar de sesión: lo que llegue de una consulta anterior se descarta.
let epoch = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());
const publish = (patch: Partial<Remote>, from = epoch) => { if (from !== epoch) return; remote = { ...remote, ...patch }; notify(); };

async function loadFormats() {
  const byOperation = new Map<string, Map<string, boolean>>();
  for (let offset: number | null = 0; offset !== null && offset < 5000;) {
    const page: DocumentsPage = await apiRequest(`/api/admin/documentos?limit=100&offset=${offset}`);
    for (const d of page.documentos ?? []) {
      const formato = d.formatoId.startsWith("04") ? "04" : d.formatoId;
      if (!byOperation.has(d.expedienteId)) byOperation.set(d.expedienteId, new Map());
      const own = byOperation.get(d.expedienteId)!;
      if (!own.has(formato)) own.set(formato, d.emitido === true);
    }
    offset = page.nextOffset ?? null;
  }
  return byOperation;
}

/** Pide de nuevo los datos si pasaron más de `maxAge` ms (0: siempre). Una sola consulta a la vez. */
export function refreshTodayData(maxAge = 0) {
  if (loading || (loadedAt && Date.now() - loadedAt < maxAge)) return loading ?? Promise.resolve();
  const from = epoch;
  const settle = <K extends keyof Remote>(key: K, promise: Promise<Remote[K]>) => promise.then(value => publish({ [key]: value } as Partial<Remote>, from)).catch(() => publish({ [key]: null } as Partial<Remote>, from));
  loading = Promise.all([
    settle("dossiers", apiRequest<{ expedientes?: TodayDossier[] }>("/api/admin/expedientes").then(r => r.expedientes ?? [])),
    settle("interviews", apiRequest<{ entrevistas?: OperationalInterview[] }>("/api/admin/entrevistas").then(r => (r.entrevistas ?? []).filter(i => i.estado === "borrador"))),
    settle("offers", apiRequest<{ runs?: OfferRun[] }>("/api/admin/apps/runs?slug=ofertas").then(r => r.runs ?? [])),
    settle("reports", apiRequest<{ ultimos?: Record<string, string> }>("/api/admin/apps/runs?slug=informe-propietario&vista=ultimo-por-expediente").then(r => r.ultimos ?? {})),
    settle("contracts", apiRequest<{ contratos?: ContractDates[] }>("/api/admin/vencimientos").then(r => r.contratos ?? [])),
    settle("who", apiRequest<Who>("/api/admin/entrevistas/config")),
    loadFormats().then(formats => publish({ formats }, from)).catch(() => undefined),
  ]).then(() => { if (from === epoch) loadedAt = Date.now(); }).finally(() => { if (from === epoch) loading = null; });
  return loading;
}

/** Olvida lo cargado (al cambiar de sesión y en las pruebas). */
export function resetTodayData() { epoch++; remote = EMPTY; loadedAt = 0; loading = null; notify(); }
onAdminCacheClear(resetTodayData);

/** Los datos del servidor compartidos (operaciones, ofertas, contratos…). */
export function useTodayData(maxAge: number) {
  const value = React.useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => remote, () => EMPTY);
  React.useEffect(() => {
    void refreshTodayData(maxAge);
    const again = () => { void refreshTodayData(30_000); };
    window.addEventListener("focus", again);
    return () => window.removeEventListener("focus", again);
  }, [maxAge]);
  return value;
}

/** Todo lo que espera algo del usuario, de lo más urgente a lo menos, y los datos con que se armó. */
export function useTodayQueue({ maxAge = 0 }: { maxAge?: number } = {}) {
  const { dossiers, interviews, offers, reports, contracts, who, formats } = useTodayData(maxAge);
  const tasks = useCollection(db.tareas), leads = useCollection(db.leads), clients = useCollection(db.clientes), properties = useCollection(db.propiedades), advisers = useCollection(db.asesores);
  const today = operationalDate();
  const names = {
    client: (id?: string) => id ? clients.find(c => c.id === id)?.nombre : undefined,
    property: (slug?: string | null) => slug ? properties.find(p => p.slug === slug)?.titulo : undefined,
  };
  // Misma etapa que Operaciones: documentos de cada operación y su checklist (COR-03).
  const staged = (dossiers ?? []).map(d => ({ ...d, inicial: initialStatus(formats.get(d.id), tasks.find(t => t.id === checklistTaskId(d.id))) }));
  const waiting = dossiers === undefined ? [] : waitingItems({ dossiers: staged, tasks, offers: offers ?? null, followups: projectFollowups(leads, clients, dossiers), names, today, formats });
  const toDay = (instant: string) => operationalDate(new Date(instant));
  const newLeads = who ? unattendedLeads({ leads, properties, me: who.asesorId, admin: who.administrador, now: new Date(), adviserName: id => advisers.find(a => a.id === id)?.nombre }) : [];
  const expiring = dossiers && contracts ? expiryItems({ contracts, dossiers, names, today }) : [];
  const lateReports = dossiers && reports ? overdueReports({ dossiers, reports, names, today }) : [];
  const lateKeys: QueueItem[] = properties.flatMap(p => openKeyLoans(p.llaves).filter(loan => keyLoanLate(loan, today, toDay)).map(loan => ({
    id: `llaves:${p.slug}:${loan.id}`, kind: "llaves" as const, who: p.titulo, text: `Las llaves las tiene ${loan.persona} desde el ${shortDate(toDay(loan.salida))}`, detail: loan.motivo || undefined, when: `Debían volver el ${shortDate(keyDueDate(loan, toDay))}`, late: true, propertySlug: p.slug, sort: loan.salida,
    href: `/admin/propiedades/${encodeURIComponent(p.slug)}/seguimiento?seccion=llaves`,
  })));
  const notices: QueueItem[] = pendingNotices(properties, seekersFrom(leads, clients)).map(({ property, pending }) => ({
    id: `aviso:${property.slug}`, kind: "aviso" as const, who: property.titulo, late: false, propertySlug: property.slug, sort: property.titulo,
    text: `${pending.some(m => priceDroppedSince(property, lastNotice(property, m.seeker))) ? "Bajó de precio · " : ""}${pending.length === 1 ? `Le puede servir a ${pending[0].seeker.nombre}` : `Le puede servir a ${pending[0].seeker.nombre} y ${pending.length - 1} más`}`,
    href: `/admin/propiedades/${encodeURIComponent(property.slug)}/seguimiento?seccion=compradores`,
  }));
  // La cola única: cada pendiente una sola vez, lo vencido primero (C47).
  const queue = dossiers === undefined ? [] : sortQueue([...queueFromWaiting(waiting), ...queueFromLeads(newLeads), ...queueFromInterviews(interviews ?? []), ...queueFromExpiry(expiring), ...queueFromReports(lateReports), ...lateKeys, ...notices]);
  return { queue, waiting, dossiers, staged, interviews, offers, reports, contracts, expiring, names, today };
}

/** El número del menú: las tarjetas de la cola de Hoy (RP-84). Mientras carga, nada. */
export function usePendingCount() {
  return useTodayQueue({ maxAge: 60_000 }).queue.length;
}
