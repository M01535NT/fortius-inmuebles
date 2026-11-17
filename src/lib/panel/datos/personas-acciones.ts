import type { Cliente } from "@/lib/backend/contracts";
import { esMoral } from "@/lib/panel/datos/personas-ficha";

/**
 * Alta y edición de personas (PN-03, boceto de Personas). Funciones puras: la pantalla guarda con la versión que leyó.
 * Mínimo para crear (decisión del titular, 14/11/2026): nombre, teléfono, motivo, canal preferido y en qué quedaron.
 */

export type Motivo = "vende" | "compra" | "pone_en_renta" | "renta" | "invierte" | "otro";
export const MOTIVOS: { valor: Motivo; etiqueta: string; tipo: Cliente["tipo"] }[] = [
  { valor: "vende", etiqueta: "Vende", tipo: "propietario" },
  { valor: "compra", etiqueta: "Compra", tipo: "comprador" },
  { valor: "pone_en_renta", etiqueta: "Pone en renta", tipo: "arrendador" },
  { valor: "renta", etiqueta: "Busca rentar", tipo: "arrendatario" },
  { valor: "invierte", etiqueta: "Invierte", tipo: "inversionista" },
  { valor: "otro", etiqueta: "Otro", tipo: "otro" },
];
export const motivoDeTipo = (tipo: Cliente["tipo"]): Motivo => MOTIVOS.find((m) => m.tipo === tipo)?.valor ?? "otro";

export type Canal = "llamada" | "whatsapp" | "correo";
export const CANALES: { valor: Canal; etiqueta: string }[] = [
  { valor: "whatsapp", etiqueta: "WhatsApp" },
  { valor: "llamada", etiqueta: "Llamada" },
  { valor: "correo", etiqueta: "Correo" },
];

export type DatosNuevaPersona = {
  nombre: string; telefono: string; email: string; motivo: Motivo; canal: Canal;
  /** En qué quedaron: lo siguiente que se hará y cuándo. */
  accion: string; fecha: string | null;
  /** Persona moral (empresa): cambia lo que se pide para contratos (razón social, RFC de 12, representante). */
  moral?: boolean;
};

const digitos = (t: string) => t.replace(/\D/g, "");
/** Para comparar teléfonos: los últimos 10 dígitos (quita +52, 1, espacios y guiones). */
export const claveTelefono = (t: string | undefined) => digitos(t ?? "").slice(-10);

/** Qué falta para guardar. Se pide lo mínimo; el correo es opcional, pero si se escribe debe parecer correo. */
export function faltaParaPersona(d: Pick<DatosNuevaPersona, "nombre" | "telefono" | "email" | "accion">): { campo: "nombre" | "telefono" | "email" | "accion"; texto: string } | null {
  if (!d.nombre.trim()) return { campo: "nombre", texto: "Escribe el nombre." };
  if (digitos(d.telefono).length < 10) return { campo: "telefono", texto: "Escribe un teléfono de 10 dígitos." };
  if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return { campo: "email", texto: "Revisa el correo." };
  if (!d.accion.trim()) return { campo: "accion", texto: "Anota en qué quedaron." };
  return null;
}

/** Ya existe alguien con ese teléfono o correo (aviso de duplicado; avisa, no frena). */
export function buscarDuplicado(personas: Cliente[], d: { telefono?: string; email?: string }, excluir?: string): Cliente | null {
  const tel = claveTelefono(d.telefono);
  const correo = d.email?.trim().toLowerCase();
  return personas.find((p) => p.id !== excluir && (
    (tel.length === 10 && claveTelefono(p.telefono) === tel)
    || (!!correo && p.email?.trim().toLowerCase() === correo))) ?? null;
}

export function nuevaPersona(d: DatosNuevaPersona, miAsesor: string | null, ahora = new Date()): Cliente {
  const hoy = ahora.toISOString();
  const tipo = MOTIVOS.find((m) => m.valor === d.motivo)?.tipo ?? "otro";
  return {
    id: crypto.randomUUID(),
    nombre: d.nombre.trim().replace(/\s+/g, " "),
    telefono: d.telefono.trim(),
    ...(d.email.trim() ? { email: d.email.trim() } : {}),
    tipo,
    ...(miAsesor ? { asesorId: miAsesor } : {}),
    notas: "",
    creadoEl: hoy,
    actualizadoEl: hoy,
    perfil: {
      canalPreferido: d.canal,
      proximaAccion: d.accion.trim().slice(0, 160),
      ...(d.fecha ? { proximoContacto: d.fecha } : {}),
      ...(d.moral ? { personaMoral: true } : {}),
    },
  };
}

/** Campos que se editan en «Datos». Vacío quita el dato. */
export type DatosEditables = {
  nombre: string; telefono: string; email: string; motivo: Motivo; canal: Canal | "";
  estadoCivil: string; domicilio: string; identificacion: string; curp: string; rfc: string;
  /** La casilla manda; si nunca se marcó, se deduce del RFC de 12 caracteres (respaldo). */
  moral: boolean;
};

export function datosDe(c: Cliente): DatosEditables {
  const canal = (c.perfil as { canalPreferido?: unknown } | undefined)?.canalPreferido;
  return {
    nombre: c.nombre ?? "", telefono: c.telefono ?? "", email: c.email ?? "", motivo: motivoDeTipo(c.tipo),
    canal: canal === "llamada" || canal === "whatsapp" || canal === "correo" ? canal : "",
    estadoCivil: c.estadoCivil ?? "", domicilio: c.domicilio ?? "", identificacion: c.identificacion ?? "",
    curp: c.curp ?? "", rfc: c.rfc ?? "",
    moral: esMoral(c),
  };
}

/** CURP: 18 caracteres; RFC: 13 (persona física) o 12 (moral). Se avisa, no se frena, salvo lo que el servidor rechaza. */
export function avisosDeDatos(d: Pick<DatosEditables, "curp" | "rfc">): { curp?: string; rfc?: string } {
  const curp = d.curp.trim(), rfc = d.rfc.trim();
  return {
    ...(curp && curp.length !== 18 ? { curp: `La CURP lleva 18 caracteres; van ${curp.length}.` } : {}),
    ...(rfc && rfc.length !== 12 && rfc.length !== 13 ? { rfc: `El RFC lleva 13 caracteres (12 si es empresa); van ${rfc.length}.` } : {}),
  };
}

export function editarPersona(c: Cliente, d: DatosEditables, ahora = new Date()): Cliente {
  const sig: Cliente = { ...c, nombre: d.nombre.trim().replace(/\s+/g, " "), telefono: d.telefono.trim(), tipo: MOTIVOS.find((m) => m.valor === d.motivo)?.tipo ?? c.tipo, actualizadoEl: ahora.toISOString() };
  const poner = (k: "email" | "estadoCivil" | "domicilio" | "identificacion" | "curp" | "rfc", v: string, mayus = false) => {
    const t = mayus ? v.trim().toUpperCase() : v.trim();
    if (t) sig[k] = t; else delete sig[k];
  };
  poner("email", d.email);
  poner("estadoCivil", d.estadoCivil);
  poner("domicilio", d.domicilio);
  poner("identificacion", d.identificacion);
  poner("curp", d.curp, true);
  poner("rfc", d.rfc, true);
  const perfil: Record<string, unknown> = { ...(c.perfil ?? {}) };
  if (d.canal) perfil.canalPreferido = d.canal; else delete perfil.canalPreferido;
  // Se guarda también «no» para que un RFC de 12 caracteres no la vuelva moral sin querer.
  if (d.moral !== esMoral(c) || typeof perfil.personaMoral === "boolean") perfil.personaMoral = d.moral;
  sig.perfil = perfil as Cliente["perfil"];
  return sig;
}

/** Qué falta para editar: nombre y un medio de contacto (teléfono o correo), como pide el servidor. */
export function faltaParaEditar(d: Pick<DatosEditables, "nombre" | "telefono" | "email">) {
  if (!d.telefono.trim() && d.email.trim()) return faltaParaPersona({ ...d, telefono: "0000000000", accion: "-" });
  return faltaParaPersona({ ...d, accion: "-" });
}
