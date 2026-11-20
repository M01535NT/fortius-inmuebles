import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { EVENTO_TIPO_LABELS, type Evento, type Lead } from "@/lib/domain/records";
import { diaLargo } from "@/lib/panel/calendario";

/**
 * «Relacionado» (AUD-03, G2): enlaces de solo lectura entre fichas con los datos que ya llegan del servidor.
 * Una sola función por ficha para que, cuando el modelo base ligue todo por el asunto (PN-02), se cambie aquí y no en cada pantalla.
 * Los enlaces usan ids internos o folios, nunca nombres ni teléfonos.
 */

export type Enlace = { id: string; texto: string; detalle?: string; href: string };
export type GrupoRelacionado = { titulo: string; enlaces: Enlace[] };

export const rutaPersona = (id: string) => `/panel/directorio?id=${encodeURIComponent(id)}`;
export const rutaConsulta = (id: string) => `/panel/consultas?ver=${encodeURIComponent(id)}`;
export const rutaCita = (id: string) => `/panel/agenda?cita=${encodeURIComponent(id)}`;
export const rutaInmueble = (codigo: string) => `/panel/inmuebles?ver=${encodeURIComponent(codigo)}`;

/** Últimos 10 dígitos: así «+52 664 123 4567» y «6641234567» son el mismo teléfono. */
export function mismoTelefono(a?: string, b?: string): boolean {
  const x = (a ?? "").replace(/\D/g, "").slice(-10);
  const y = (b ?? "").replace(/\D/g, "").slice(-10);
  return x.length === 10 && x === y;
}

const grupo = (titulo: string, enlaces: Enlace[]): GrupoRelacionado | null => (enlaces.length ? { titulo, enlaces } : null);
const solo = (g: (GrupoRelacionado | null)[]) => g.filter((x): x is GrupoRelacionado => x !== null);

const enlaceInmueble = (p: Pick<Property, "codigo" | "titulo">): Enlace => ({ id: p.codigo, texto: p.titulo, detalle: p.codigo, href: rutaInmueble(p.codigo) });
const enlaceCita = (e: Evento): Enlace => ({
  id: e.id, texto: e.titulo?.trim() || EVENTO_TIPO_LABELS[e.tipo] || "Cita",
  detalle: [diaLargo(e.fecha), e.hora].filter(Boolean).join(" · "), href: rutaCita(e.id),
});
const enlaceConsulta = (l: Lead): Enlace => ({ id: l.id, texto: l.nombre?.trim() || "Sin nombre", detalle: l.mensaje?.trim().slice(0, 80) || "Sin mensaje", href: rutaConsulta(l.id) });

/** Citas de hoy en adelante, de la más próxima a la más lejana. */
const proximas = (eventos: readonly Evento[], hoy: string) => eventos.filter((e) => e.fecha >= hoy).sort((a, b) => `${a.fecha} ${a.hora ?? "99"}`.localeCompare(`${b.fecha} ${b.hora ?? "99"}`));

export function relacionadoPersona(c: Cliente, d: { leads: readonly Lead[]; eventos: readonly Evento[]; inmuebles: readonly Property[]; hoy: string }): GrupoRelacionado[] {
  const consultas = d.leads.filter((l) => l.id === c.leadId || l.clienteId === c.id);
  const citas = proximas(d.eventos.filter((e) => e.clienteId === c.id || (c.leadId && e.leadId === c.leadId)), d.hoy);
  const inmueble = c.propiedadSlug ? d.inmuebles.find((p) => p.slug === c.propiedadSlug) : undefined;
  return solo([
    grupo(c.tipo === "propietario" || c.tipo === "arrendador" ? "Su inmueble" : "Inmueble que le interesa", inmueble ? [enlaceInmueble(inmueble)] : []),
    grupo("Próximas citas", citas.map(enlaceCita)),
    grupo("Consultas", consultas.map(enlaceConsulta)),
  ]);
}

export function relacionadoInmueble(p: Property, d: { leads: readonly Lead[]; eventos: readonly Evento[]; hoy: string }): GrupoRelacionado[] {
  return solo([
    grupo("Quién pregunta por él", d.leads.filter((l) => l.propiedadSlug === p.slug).map(enlaceConsulta)),
    grupo("Próximas visitas y citas", proximas(d.eventos.filter((e) => e.propiedadSlug === p.slug), d.hoy).map(enlaceCita)),
  ]);
}

/** La persona de una consulta: la ligada o, si no hay, alguien de Personas con el mismo teléfono (para no duplicar). */
export function personaDeConsulta(l: Lead, clientes: readonly Cliente[]): { persona: Cliente; porTelefono: boolean } | null {
  const ligada = l.clienteId ? clientes.find((c) => c.id === l.clienteId) : undefined;
  if (ligada) return { persona: ligada, porTelefono: false };
  const igual = clientes.find((c) => mismoTelefono(c.telefono, l.telefono));
  return igual ? { persona: igual, porTelefono: true } : null;
}

export function relacionadoConsulta(l: Lead, d: { clientes: readonly Cliente[]; inmuebles: readonly Property[] }): GrupoRelacionado[] {
  const p = personaDeConsulta(l, d.clientes);
  const inmueble = l.propiedadSlug ? d.inmuebles.find((x) => x.slug === l.propiedadSlug) : undefined;
  return solo([
    grupo(p?.porTelefono ? "Ya está en Personas (mismo teléfono)" : "Su ficha", p ? [{ id: p.persona.id, texto: p.persona.nombre?.trim() || "Sin nombre", detalle: p.porTelefono ? "Revisa si es la misma persona" : undefined, href: rutaPersona(p.persona.id) }] : []),
    grupo("Inmueble por el que pregunta", inmueble ? [enlaceInmueble(inmueble)] : []),
  ]);
}

export function relacionadoCita(c: { clienteId?: string; leadId?: string; propiedadSlug?: string }, d: { clientes: readonly Cliente[]; leads: readonly Lead[]; inmuebles: readonly Property[] }): GrupoRelacionado[] {
  const persona = c.clienteId ? d.clientes.find((x) => x.id === c.clienteId) : undefined;
  const consulta = !persona && c.leadId ? d.leads.find((x) => x.id === c.leadId) : undefined;
  const inmueble = c.propiedadSlug ? d.inmuebles.find((x) => x.slug === c.propiedadSlug) : undefined;
  return solo([
    grupo("Con quién", persona ? [{ id: persona.id, texto: persona.nombre?.trim() || "Sin nombre", detalle: persona.telefono || undefined, href: rutaPersona(persona.id) }] : consulta ? [enlaceConsulta(consulta)] : []),
    grupo("Dónde", inmueble ? [enlaceInmueble(inmueble)] : []),
  ]);
}
