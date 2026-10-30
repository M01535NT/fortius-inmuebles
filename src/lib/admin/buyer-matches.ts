import { TIPO_LABELS, formatPrecio } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { AdminProperty, Lead } from "@/lib/domain/records";
import type { BuyerNotice } from "@/lib/propiedad-seguimiento";

/*
  Avisos al comprador (titular, 29/10/2026): qué prospectos o clientes que buscan
  comprar o rentar podrían interesarse en un inmueble, y al revés. Solo se proponen
  inmuebles publicados y disponibles: sin intermediación firmada no se ofrece un
  inmueble, tampoco en privado (RP-91). Un criterio capturado que no se cumple
  descarta; un criterio sin capturar no descarta. Hace falta al menos una razón
  concreta (tipo, zona o presupuesto) para proponer a alguien.
*/

export type Seeker = {
  id: string; kind: "lead" | "cliente"; nombre: string; telefono: string; email?: string;
  zona?: string; tipoPropiedad?: string; perfil?: Lead["perfil"]; asesorId?: string; href: string;
};
export type BuyerMatch = { seeker: Seeker; reasons: string[] };
export type PropertyMatch = { property: AdminProperty; reasons: string[] };

const CLIENT_INTENT: Partial<Record<Cliente["tipo"], "comprar" | "rentar" | "invertir">> = { comprador: "comprar", arrendatario: "rentar", inversionista: "invertir" };

/** Prospectos sin convertir y clientes que buscan comprar, rentar o invertir. */
export function seekersFrom(leads: Lead[], clients: Cliente[]): Seeker[] {
  const fromLeads = leads.filter(l => !l.clienteId && l.estado !== "descartado" && l.estado !== "cerrado")
    .map(l => ({ id: l.id, kind: "lead" as const, nombre: l.nombre, telefono: l.telefono, email: l.email, zona: l.zona, tipoPropiedad: l.tipoPropiedad, perfil: l.perfil, asesorId: l.asesorId, href: `/admin/leads/${encodeURIComponent(l.id)}` }));
  const fromClients = clients.map(c => ({ id: c.id, kind: "cliente" as const, nombre: c.nombre, telefono: c.telefono, email: c.email, zona: c.zona, tipoPropiedad: c.tipoPropiedad, perfil: c.perfil?.operacion ? c.perfil : { ...c.perfil, operacion: CLIENT_INTENT[c.tipo] }, asesorId: c.asesorId, href: `/admin/clientes/${encodeURIComponent(c.id)}` }));
  return [...fromLeads, ...fromClients].filter(s => ["comprar", "rentar", "invertir"].includes(s.perfil?.operacion ?? ""));
}

const plain = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/** Zonas escritas a mano: «Playas, Otay y Chapultepec» → ["playas", "otay", "chapultepec"]. */
export function zoneTokens(value?: string) {
  return (value ?? "").split(/[,;/]|\sy\s|\so\s/).map(plain).filter(token => token.length >= 3);
}

/** Razones por las que el inmueble le sirve a la persona, o null si un criterio capturado no se cumple. */
export function matchReasons(property: AdminProperty, seeker: Seeker): string[] | null {
  if (property.estado !== "disponible" || property.publicada !== true) return null;
  const intent = seeker.perfil?.operacion;
  if (property.operacion === "venta" ? intent !== "comprar" && intent !== "invertir" : intent !== "rentar") return null;
  const reasons: string[] = [];
  if (seeker.tipoPropiedad) {
    if (seeker.tipoPropiedad !== property.tipo) return null;
    reasons.push(`Busca ${TIPO_LABELS[property.tipo].toLowerCase()}`);
  }
  const zones = zoneTokens(seeker.zona);
  if (zones.length) {
    const place = plain(`${property.zona} ${property.direccionAproximada}`);
    const zone = zones.find(token => place.includes(token));
    if (!zone) return null;
    reasons.push(`Busca en ${seeker.zona!.split(/[,;/]|\sy\s|\so\s/).find(part => plain(part) === zone)?.trim() ?? property.zona}`);
  }
  const profile = seeker.perfil ?? {};
  if (property.precio.modalidad === "publico" && profile.presupuestoMax !== undefined && profile.moneda === property.precio.moneda) {
    if (property.precio.monto > profile.presupuestoMax * 1.05) return null;
    reasons.push(property.precio.monto > profile.presupuestoMax ? "Hasta 5 % arriba de su presupuesto" : "Dentro de su presupuesto");
  }
  const facts = property.ficha;
  if (profile.recamaras !== undefined && facts.recamaras !== undefined && facts.recamaras < profile.recamaras) return null;
  if (profile.estacionamientos !== undefined && facts.estacionamientos !== undefined && facts.estacionamientos < profile.estacionamientos) return null;
  const area = property.tipo === "terreno" ? facts.terrenoM2 : facts.construccionM2 ?? facts.terrenoM2;
  if (profile.superficieMin !== undefined && area !== undefined && area < profile.superficieMin * 0.9) return null;
  return reasons.length ? reasons : null;
}

export function buyersFor(property: AdminProperty, seekers: Seeker[]): BuyerMatch[] {
  return seekers.flatMap(seeker => { const reasons = matchReasons(property, seeker); return reasons ? [{ seeker, reasons }] : []; })
    .sort((a, b) => b.reasons.length - a.reasons.length || a.seeker.nombre.localeCompare(b.seeker.nombre, "es"));
}
export function propertiesFor(seeker: Seeker, properties: AdminProperty[]): PropertyMatch[] {
  return properties.flatMap(property => { const reasons = matchReasons(property, seeker); return reasons ? [{ property, reasons }] : []; })
    .sort((a, b) => b.reasons.length - a.reasons.length || (b.property.publicadaEl ?? "").localeCompare(a.property.publicadaEl ?? ""));
}

/** Último aviso registrado a esa persona sobre ese inmueble. */
export function lastNotice(property: AdminProperty, seeker: Pick<Seeker, "id" | "kind">): BuyerNotice | undefined {
  return (property.avisosCompradores ?? []).filter(n => n.personaId === seeker.id && n.tipo === seeker.kind).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
}

/** El precio publicado bajó desde el último aviso (misma moneda). */
export function priceDroppedSince(property: AdminProperty, notice?: BuyerNotice) {
  return !!notice?.precio && property.precio.modalidad === "publico" && property.precio.moneda === notice.precio.moneda && property.precio.monto < notice.precio.monto;
}
/** Por avisar: nunca se le avisó o el precio bajó desde el último aviso. */
export function needsNotice(property: AdminProperty, seeker: Pick<Seeker, "id" | "kind">) {
  const notice = lastNotice(property, seeker);
  return !notice || priceDroppedSince(property, notice);
}

/** Inmuebles publicados con compradores por avisar, del más reciente al más antiguo. */
export function pendingNotices(properties: AdminProperty[], seekers: Seeker[]) {
  return properties.map(property => ({ property, pending: buyersFor(property, seekers).filter(match => needsNotice(property, match.seeker)) }))
    .filter(item => item.pending.length > 0)
    .sort((a, b) => (b.property.publicadaEl ?? "").localeCompare(a.property.publicadaEl ?? ""));
}

/** Teléfono en formato de WhatsApp: diez dígitos se toman como celular de México. */
export function whatsappDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `52${digits}` : digits;
}
/** Mensaje que el asesor revisa antes de enviarlo; abrir WhatsApp no registra el aviso. */
export function noticeMessage(property: AdminProperty, seeker: Pick<Seeker, "id" | "kind" | "nombre">, origin: string) {
  const first = seeker.nombre.trim().split(/\s+/)[0] ?? "";
  const price = property.precio.modalidad === "publico" ? ` por ${formatPrecio(property.precio)}` : "";
  const dropped = priceDroppedSince(property, lastNotice(property, { id: seeker.id, kind: seeker.kind }));
  return `Hola${first ? ` ${first}` : ""}, ${dropped ? "bajó de precio un inmueble que te compartí" : "te comparto un inmueble que puede interesarte"}: ${property.titulo}, en ${property.zona}${price}. ${origin}/inventario/${property.slug}`;
}
