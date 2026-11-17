"use client";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import type { Cliente } from "@/lib/backend/contracts";
import { buscarDuplicado, claveTelefono, nuevaPersona, type Motivo } from "@/lib/panel/datos/personas-acciones";
import type { Papel } from "@/lib/panel/datos/asuntos-tipos";

/**
 * Alta corta de una persona desde el asunto: nombre y teléfono o correo, con el aviso de duplicado (avisa, no frena).
 * Usa la misma alta de Personas (`nuevaPersona` y `buscarDuplicado`); lo demás se completa después en su ficha.
 */
export type DatosAlta = { nombre: string; telefono: string; email: string };
export const ALTA_VACIA: DatosAlta = { nombre: "", telefono: "", email: "" };

export function faltaAlta(d: DatosAlta): { campo: keyof DatosAlta; texto: string } | null {
  if (!d.nombre.trim()) return { campo: "nombre", texto: "Escribe el nombre." };
  const tel = claveTelefono(d.telefono), correo = d.email.trim();
  if (!tel && !correo) return { campo: "telefono", texto: "Escribe un teléfono o un correo." };
  if (d.telefono.trim() && tel.length < 10) return { campo: "telefono", texto: "Escribe un teléfono de 10 dígitos." };
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { campo: "email", texto: "Revisa el correo." };
  return null;
}

const MOTIVO_DE_PAPEL: Partial<Record<Papel, Motivo>> = { vende: "vende", compra: "compra", pone_en_renta: "pone_en_renta", renta: "renta" };

/** La persona que se guarda en Personas, a nombre de quien la da de alta. */
export function personaDeAlta(d: DatosAlta, papel: Papel | null, miAsesor: string | null): Cliente {
  const soloCorreo = !claveTelefono(d.telefono) && !!d.email.trim();
  return nuevaPersona({
    nombre: d.nombre, telefono: d.telefono, email: d.email, motivo: (papel && MOTIVO_DE_PAPEL[papel]) || "otro",
    canal: soloCorreo ? "correo" : "whatsapp", accion: "", fecha: null,
  }, miAsesor);
}

export function AltaPersona({ valor, alCambiar, personas, intento, alUsarExistente }: {
  valor: DatosAlta; alCambiar: (d: DatosAlta) => void; personas: readonly Cliente[]; intento: boolean;
  /** Elegir a la persona que ya existe en lugar de crear otra. */
  alUsarExistente: (id: string) => void;
}) {
  const falta = intento ? faltaAlta(valor) : null;
  const duplicado = buscarDuplicado([...personas], valor);
  const error = (campo: keyof DatosAlta) => (falta?.campo === campo ? falta.texto : undefined);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Campo etiqueta="Nombre" autoComplete="off" maxLength={160} value={valor.nombre} onChange={(e) => alCambiar({ ...valor, nombre: e.target.value })} error={error("nombre")} autoFocus />
      <Campo etiqueta="Teléfono" type="tel" inputMode="tel" autoComplete="off" maxLength={40} value={valor.telefono} onChange={(e) => alCambiar({ ...valor, telefono: e.target.value })} error={error("telefono")} />
      <Campo etiqueta="Correo" type="email" autoComplete="off" maxLength={160} value={valor.email} onChange={(e) => alCambiar({ ...valor, email: e.target.value })} error={error("email")}
        ayuda="Basta con el teléfono o el correo." />
      {duplicado ? (
        <div role="status" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "var(--warning-soft)", border: "1px solid var(--warning)", borderRadius: "var(--r-lg)", padding: "8px 12px" }}>
          <span style={{ flex: 1, minWidth: 180 }}>Ya está en Personas: <strong>{duplicado.nombre}</strong>{duplicado.telefono ? ` · ${duplicado.telefono}` : ""}</span>
          <Boton variante="texto" onClick={() => alUsarExistente(duplicado.id)}>Usar a esta persona</Boton>
        </div>
      ) : null}
    </div>
  );
}
