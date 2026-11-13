import type { Lead, LeadOffer } from "@/lib/domain/records";
import { LEAD_PROFILE_OPTIONS } from "@/lib/lead-profile";

/*
  COR-18 (12/11/2026): la oferta por escrito (formato 14) vive en la operación del propietario; el
  interesado que la hizo la guarda en su ficha con el identificador del documento. Así la ficha y la
  operación muestran la misma oferta sin tocar los campos impresos del formato.
*/

/** El interesado dueño de una oferta, si ya se ligó. */
export function offerOwner(leads: readonly Lead[], documentoId: string) {
  return leads.find(lead => lead.ofertas?.some(o => o.documentoId === documentoId));
}

/** La ficha del interesado con la oferta ligada (una oferta tiene un solo dueño). */
export function withOffer(lead: Lead, offer: LeadOffer): Lead {
  return { ...lead, ofertas: [...(lead.ofertas ?? []).filter(o => o.documentoId !== offer.documentoId), offer] };
}
export function withoutOffer(lead: Lead, documentoId: string): Lead {
  const ofertas = (lead.ofertas ?? []).filter(o => o.documentoId !== documentoId);
  return { ...lead, ofertas };
}

/** Quién puede haber hecho la oferta: interesados en el inmueble, con visita en él o la contraparte. */
export function offerCandidates(leads: readonly Lead[], propertySlug: string | null | undefined, visitLeadIds: readonly string[], counterpartLeadId?: string) {
  return leads.filter(lead => lead.id === counterpartLeadId || visitLeadIds.includes(lead.id) || (!!propertySlug && lead.propiedadSlug === propertySlug))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Cómo paga, en una línea: «Crédito Infonavit · Preautorizado». Sin datos, undefined. */
export function creditSummary(profile: Lead["perfil"]): string | undefined {
  if (!profile?.formaPago) return undefined;
  const pay = LEAD_PROFILE_OPTIONS.formaPago[profile.formaPago];
  if (profile.formaPago === "contado") return pay;
  const kind = profile.tipoCredito ? LEAD_PROFILE_OPTIONS.tipoCredito[profile.tipoCredito] : undefined;
  const state = profile.estadoCredito ? LEAD_PROFILE_OPTIONS.estadoCredito[profile.estadoCredito] : undefined;
  return [kind ? `${pay} ${kind}` : pay, state].filter(Boolean).join(" · ");
}
