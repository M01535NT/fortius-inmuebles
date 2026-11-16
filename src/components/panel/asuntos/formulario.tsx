"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor } from "@/lib/domain/records";
import { EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";

export type DatosNuevoAsunto = { clienteId: string; asesorId: string; operacion: string; propiedadSlug: string };

const TIPOS = Object.entries(EXPEDIENTE_OPERACIONES).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/**
 * «Nuevo asunto» (primer corte): tipo, persona e inmueble. Hasta que lleguen las columnas de PN-02 (título libre, persona opcional)
 * la base pide persona y responsable; el folio lo pone la base.
 */
export function FormularioAsunto({ personas, inmuebles, asesores, miAsesor, ocupado, alGuardar }: {
  personas: readonly Cliente[]; inmuebles: readonly Property[]; asesores: readonly Asesor[]; miAsesor: string | null; ocupado: boolean;
  alGuardar: (d: DatosNuevoAsunto) => void;
}) {
  const [d, setD] = useState<DatosNuevoAsunto>({ clienteId: "", asesorId: miAsesor ?? "", operacion: "venta", propiedadSlug: "" });
  const [intento, setIntento] = useState(false);
  const falta = !d.clienteId ? "Elige la persona." : !d.asesorId ? "Elige quién lo lleva." : null;
  const ordenadas = [...personas].sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  return (
    <form noValidate style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); setIntento(true); if (!falta) alGuardar(d); }}>
      <Desplegable etiqueta="Tipo" valor={d.operacion} opciones={TIPOS} alElegir={(operacion) => { if (operacion) setD({ ...d, operacion }); }} />
      <Desplegable etiqueta="Persona" valor={d.clienteId} vacio="Elige…" opciones={ordenadas.map((c) => ({ valor: c.id, etiqueta: `${c.nombre}${c.telefono ? ` · ${c.telefono}` : ""}` }))}
        alElegir={(clienteId) => setD({ ...d, clienteId, propiedadSlug: d.propiedadSlug || (personas.find((c) => c.id === clienteId)?.propiedadSlug ?? "") })}
        ayuda="Si no está, dala de alta en Personas." />
      <Desplegable etiqueta="Inmueble (opcional)" valor={d.propiedadSlug} vacio="Sin inmueble" opciones={inmuebles.map((p) => ({ valor: p.slug, etiqueta: `${p.titulo} · ${p.codigo}` }))} alElegir={(propiedadSlug) => setD({ ...d, propiedadSlug })} />
      {miAsesor ? null : (
        <Desplegable etiqueta="Lo lleva" valor={d.asesorId} vacio="Elige…" opciones={asesores.map((a) => ({ valor: a.id, etiqueta: a.nombre }))} alElegir={(asesorId) => setD({ ...d, asesorId })} />
      )}
      {intento && falta ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{falta}</p> : null}
      <Boton type="submit" bloque deshabilitado={ocupado}>Abrir asunto</Boton>
    </form>
  );
}
