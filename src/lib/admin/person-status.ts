import { isOwnerRoute, signatureState, type OperationWorkflow } from "@/lib/formatos/operation-workflow";

/*
  Prospecto o cliente por contrato firmado (COR-10, RP-90 a RP-93, RP-97). Una persona es
  prospecto hasta que firma su contrato con Fortius; desde la firma registrada es cliente; cuando
  todos sus contratos terminaron es «Cliente anterior». Quien compra o renta al cliente de Fortius
  es lead y, si firma con él, «Contraparte»; nunca cliente. El inmueble está «En captación» hasta
  que el propietario firma la intermediación; mientras el director no la revisa está «Captado, por
  revisar». Todo se calcula de la firma guardada en cada operación: estar en la tabla `clientes`
  o tener una operación abierta no hace cliente a nadie.
*/

export type PersonStatus = "prospecto" | "cliente" | "cliente_anterior" | "contraparte";
export const PERSON_STATUS_LABEL: Record<PersonStatus, string> = { prospecto: "Prospecto", cliente: "Cliente", cliente_anterior: "Cliente anterior", contraparte: "Contraparte" };
export const PERSON_STATUS_TONE = { prospecto: "info", cliente: "success", cliente_anterior: "muted", contraparte: "neutral" } as const;

export type CaptureStatus = "en_captacion" | "captado_por_revisar" | "captado";
export const CAPTURE_STATUS_LABEL: Record<CaptureStatus, string> = { en_captacion: "En captación", captado_por_revisar: "Captado, por revisar", captado: "Captado" };

/** Lo que se necesita de cada operación para calcular la condición. */
export type StatusDossier = { cliente_id?: string | null; propiedad_slug?: string | null; etapa?: string | null; flujo?: Pick<OperationWorkflow, "ruta" | "firmaContrato" | "contraparteLeadId" | "estado"> | null };

/** Firma registrada: cuenta aunque falte la revisión del director; una incompleta, no. */
const signed = (d: StatusDossier) => { const state = signatureState(d.flujo); return state === "vigente" || state === "por_revisar"; };

/** Condición de una persona de la tabla `clientes`. */
export function clientStatus(clientId: string, dossiers: readonly StatusDossier[]): PersonStatus {
  const own = dossiers.filter(d => d.cliente_id === clientId);
  if (own.some(signed)) return "cliente";
  if (own.some(d => signatureState(d.flujo) === "terminada")) return "cliente_anterior";
  return "prospecto";
}

/** Condición de un lead: si ya tiene registro de cliente, la de ese registro; si firmó con un cliente, contraparte. */
export function leadStatus(lead: { id: string; clienteId?: string | null }, dossiers: readonly StatusDossier[]): PersonStatus {
  if (lead.clienteId) return clientStatus(lead.clienteId, dossiers);
  if (dossiers.some(d => d.flujo?.contraparteLeadId === lead.id)) return "contraparte";
  return "prospecto";
}

/**
  Captación de un inmueble según la firma de la intermediación en sus operaciones del propietario.
  Sin operación del propietario no hay dato (se conserva lo que diga el inmueble).
*/
export function captureStatus(slug: string, dossiers: readonly StatusDossier[]): CaptureStatus | null {
  const own = dossiers.filter(d => d.propiedad_slug === slug && isOwnerRoute(d.flujo?.ruta));
  if (!own.length) return null;
  const states = own.map(d => signatureState(d.flujo));
  if (states.includes("vigente")) return "captado";
  if (states.includes("por_revisar")) return "captado_por_revisar";
  return "en_captacion";
}

