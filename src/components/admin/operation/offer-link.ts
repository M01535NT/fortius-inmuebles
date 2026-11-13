import { offerOwner, withOffer, withoutOffer } from "@/lib/admin/lead-offers";
import type { Lead } from "@/lib/admin/store";

type LeadOffer = NonNullable<Lead["ofertas"]>[number];

/*
  C-22: ligar una oferta por escrito (14) a otro interesado son dos guardados (quien la recibe y
  quien la tenía). Primero se liga al nuevo y después se quita al anterior; si eso falla, se
  deshace el primero. Así una falla a la mitad nunca deja la oferta sin dueño ni con dos.
*/
export async function moverOferta(
  leads: readonly Lead[], offer: LeadOffer, leadId: string,
  put: (lead: Lead, version: number | null) => Promise<Lead>, version: (lead: Lead) => number | null,
) {
  const next = leads.find(l => l.id === leadId);
  if (!next) throw new Error("Ese interesado ya no está disponible. Recarga e inténtalo de nuevo.");
  const before = offerOwner(leads, offer.documentoId);
  const linked = await put(withOffer(next, offer), version(next));
  if (!before || before.id === leadId) return;
  try {
    await put(withoutOffer(before, offer.documentoId), version(before));
  } catch (cause) {
    // Si tampoco se puede deshacer, el error de origen es el que se muestra; al recargar se ve el estado real.
    await put(withoutOffer(linked, offer.documentoId), version(linked)).catch(() => undefined);
    throw cause;
  }
}
