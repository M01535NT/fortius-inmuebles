"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor } from "@/lib/domain/records";
import { OPCIONES_TIPO_ASUNTO, OPERACION_DE_TIPO, type TipoAsunto } from "@/lib/panel/datos/asuntos-tipos";

import { ALTA_VACIA, AltaPersona, faltaAlta, type DatosAlta } from "./alta-persona";

export type DatosNuevoAsunto = {
  titulo: string; clienteId: string; asesorId: string; tipo: TipoAsunto; operacion: string; propiedadSlug: string;
  /** Persona que se da de alta aquí mismo; la página la guarda en Personas antes de abrir el asunto. */
  personaNueva: DatosAlta | null;
};

const NUEVA = "__nueva__";

/**
 * «Nuevo asunto» (boceto): el título primero; tipo, persona e inmueble después. Mientras el servidor no guarde el título
 * (PN-02 sin aplicar), el título queda como nota «Título: …». La persona se elige o se da de alta aquí mismo.
 * Hasta PN-04 la base pide una persona para abrir el asunto: si no hay, se explica con un aviso, no con un error.
 * El tipo es el de PN-02; la operación que pide la ruta de alta se deduce de él.
 */
export function FormularioAsunto({ personas, inmuebles, asesores, miAsesor, ocupado, alGuardar }: {
  personas: readonly Cliente[]; inmuebles: readonly Property[]; asesores: readonly Asesor[]; miAsesor: string | null; ocupado: boolean;
  alGuardar: (d: DatosNuevoAsunto) => void;
}) {
  const [d, setD] = useState<DatosNuevoAsunto>({ titulo: "", clienteId: "", asesorId: miAsesor ?? "", tipo: "venta", operacion: "venta", propiedadSlug: "", personaNueva: null });
  const [intento, setIntento] = useState(false);
  const nueva = d.personaNueva !== null;
  const sinPersona = !d.clienteId && !nueva;
  const falta = !d.titulo.trim() ? "Escribe el título." : nueva && d.personaNueva && faltaAlta(d.personaNueva) ? faltaAlta(d.personaNueva)?.texto ?? null
    : !d.asesorId ? "Elige quién lo lleva." : null;
  const ordenadas = [...personas].sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  const elegirPersona = (v: string) => {
    if (v === NUEVA) { setD({ ...d, clienteId: "", personaNueva: d.personaNueva ?? ALTA_VACIA }); return; }
    setD({ ...d, clienteId: v, personaNueva: null, propiedadSlug: d.propiedadSlug || (personas.find((c) => c.id === v)?.propiedadSlug ?? "") });
  };
  return (
    <form noValidate style={{ display: "grid", gap: 14 }} onSubmit={(e) => { e.preventDefault(); setIntento(true); if (!falta && !sinPersona) alGuardar(d); }}>
      <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>Basta con el título. Personas, inmueble y guía se agregan cuando quieras.</p>
      <Campo etiqueta="Título" placeholder="Ej. Venta de la casa de Mariana" maxLength={160} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} autoComplete="off" />
      <Desplegable etiqueta="Tipo" valor={d.tipo} opciones={OPCIONES_TIPO_ASUNTO} alElegir={(tipo) => { if (tipo) setD({ ...d, tipo, operacion: OPERACION_DE_TIPO[tipo] }); }} />
      <Desplegable etiqueta="Persona" valor={nueva ? NUEVA : d.clienteId} vacio="Sin persona"
        opciones={[{ valor: NUEVA, etiqueta: "Persona nueva…" }, ...ordenadas.map((c) => ({ valor: c.id, etiqueta: `${c.nombre?.trim() || "Sin nombre"}${c.telefono ? ` · ${c.telefono}` : ""}` }))]}
        alElegir={(v) => (v ? elegirPersona(v) : setD({ ...d, clienteId: "", personaNueva: null }))} />
      {d.personaNueva ? (
        <AltaPersona valor={d.personaNueva} alCambiar={(personaNueva) => setD({ ...d, personaNueva })} personas={personas} intento={intento}
          alUsarExistente={(id) => elegirPersona(id)} />
      ) : null}
      {sinPersona ? (
        <div role="status" style={{ background: "var(--warning-soft)", border: "1px solid var(--warning)", borderRadius: "var(--r-lg)", padding: "8px 12px", fontSize: 14, color: "var(--ink)" }}>
          Por ahora un asunto se abre con una persona: elige una o crea una nueva aquí mismo. Abrirlo sin nadie llega con la siguiente actualización del servidor.
        </div>
      ) : null}
      <Desplegable etiqueta="Inmueble (opcional)" valor={d.propiedadSlug} vacio="Sin inmueble" opciones={inmuebles.map((p) => ({ valor: p.slug, etiqueta: `${p.titulo} · ${p.codigo}` }))} alElegir={(propiedadSlug) => setD({ ...d, propiedadSlug })} />
      {miAsesor ? null : (
        <Desplegable etiqueta="Lo lleva" valor={d.asesorId} vacio="Elige…" opciones={asesores.map((a) => ({ valor: a.id, etiqueta: a.nombre }))} alElegir={(asesorId) => setD({ ...d, asesorId })} />
      )}
      {intento && falta ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{falta}</p> : null}
      <Boton type="submit" bloque deshabilitado={ocupado || sinPersona}>Crear asunto</Boton>
    </form>
  );
}
