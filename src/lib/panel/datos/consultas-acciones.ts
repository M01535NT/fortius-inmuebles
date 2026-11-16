import type { Lead, LeadCanal } from "@/lib/domain/records";

/**
 * Acciones sobre una consulta (PN-05, boceto de Consultas). Funciones puras: reciben la consulta y devuelven la nueva,
 * para que la pantalla guarde con la versión que leyó y ofrezca Deshacer guardando la anterior.
 * El momento del primer contacto lo fija el servidor (basta con que el campo exista).
 */

const nota = (texto: string, ahora: Date) => ({ id: crypto.randomUUID(), texto, fecha: ahora.toISOString() });

/** «Atender yo»: pasa a En seguimiento a nombre de quien la toma (si dirección no tiene ficha, queda con quien ya estaba). */
export function atender(l: Lead, miAsesor: string | null, ahora = new Date()): Lead {
  return {
    ...l,
    estado: "contactado",
    ...(miAsesor ? { asesorId: miAsesor } : {}),
    firstContactedAt: l.firstContactedAt ?? ahora.toISOString(),
  };
}

export type ComoCierra = "no_es_cliente" | "sin_operacion";
export const NOMBRE_CIERRE: Record<ComoCierra, string> = { no_es_cliente: "No es cliente", sin_operacion: "Sin operación" };

/** Cerrar: «No es cliente» (spam, equivocados) queda descartada; «Sin operación», cerrada. Se puede reabrir. */
export function cerrarConsulta(l: Lead, como: ComoCierra, motivo = "", ahora = new Date()): Lead {
  const texto = `Se cerró: ${NOMBRE_CIERRE[como].toLowerCase()}${motivo.trim() ? `. ${motivo.trim()}` : ""}`;
  return { ...l, estado: como === "no_es_cliente" ? "descartado" : "cerrado", notas: [...l.notas, nota(texto, ahora)] };
}

/** Reabrir una cerrada: vuelve a En seguimiento. */
export function reabrir(l: Lead, ahora = new Date()): Lead {
  return { ...l, estado: "contactado", notas: [...l.notas, nota("Se reabrió", ahora)] };
}

/** Agregar una nota a la consulta (lo que se habló, lo que quedó pendiente). */
export function anotar(l: Lead, texto: string, ahora = new Date()): Lead {
  const t = texto.trim();
  if (!t) return l;
  return { ...l, notas: [...l.notas, nota(t.slice(0, 2000), ahora)] };
}

/** Fecha para volver a contactar y qué hacer. Sin fecha, se quita. */
export function programar(l: Lead, fecha: string | null, accion = ""): Lead {
  const perfil = { ...(l.perfil ?? {}) };
  if (fecha) perfil.proximoContacto = fecha; else delete perfil.proximoContacto;
  const a = accion.trim().slice(0, 160);
  if (a) perfil.proximaAccion = a; else delete perfil.proximaAccion;
  return { ...l, perfil };
}

export const CANALES_A_MANO: { valor: LeadCanal; etiqueta: string }[] = [
  { valor: "llamada", etiqueta: "Llamada" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
  { valor: "visita-oficina", etiqueta: "En persona" },
  { valor: "otro", etiqueta: "Otro" },
];

/** «Anotar una consulta»: para llamadas y visitas en persona. Queda en seguimiento a nombre de quien la anota. */
export function nuevaConsulta(datos: { nombre: string; telefono: string; email?: string; canal: LeadCanal; mensaje?: string }, miAsesor: string | null, ahora = new Date()): Lead {
  const mensaje = datos.mensaje?.trim();
  return {
    id: crypto.randomUUID(),
    nombre: datos.nombre.trim(),
    telefono: datos.telefono.trim(),
    ...(datos.email?.trim() ? { email: datos.email.trim() } : {}),
    origen: "manual",
    canal: datos.canal,
    estado: "contactado",
    ...(miAsesor ? { asesorId: miAsesor } : {}),
    ...(mensaje ? { mensaje } : {}),
    creadoEl: ahora.toISOString(),
    notas: [],
    firstContactedAt: ahora.toISOString(),
  };
}

/** Qué falta para poder guardar una consulta anotada a mano. */
export function faltaParaAnotar(d: { nombre: string; telefono: string }): string | null {
  if (!d.nombre.trim()) return "Escribe el nombre.";
  if (d.telefono.replace(/\D/g, "").length < 7) return "Escribe un teléfono de al menos 7 dígitos.";
  return null;
}

/** Tipo de asunto que conviene abrir según lo que la persona quiere; se puede cambiar antes de abrirlo. */
export function operacionSugerida(tipo: string | undefined): "venta" | "renta" | "inversion" | "otra" {
  if (tipo === "propietario" || tipo === "comprador") return "venta";
  if (tipo === "arrendador" || tipo === "arrendatario") return "renta";
  if (tipo === "inversionista") return "inversion";
  return "otra";
}
