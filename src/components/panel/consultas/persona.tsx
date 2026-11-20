"use client";
import { useMemo, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Interruptor } from "@/components/panel/kit/segmentado";
import type { PersonaDirectorio } from "@/lib/backend/directorio-contrato";
import type { Lead } from "@/lib/domain/records";

const caja = { display: "grid", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;
const rutaFicha = (id: string) => `/admin/directorio?id=${encodeURIComponent(id)}`;
const soloDigitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

/** La ficha del Directorio que ya tiene su mismo teléfono (últimos 10 dígitos) o su correo. Solo para avisar. */
function mismaPersona(lead: Lead, gente: readonly PersonaDirectorio[]) {
  const tel = soloDigitos(lead.telefono).slice(-10);
  const correo = lead.email?.trim().toLowerCase() ?? "";
  for (const p of gente) {
    if (tel.length >= 7 && p.telefonos.some((t) => soloDigitos(`${t.pais}${t.numero}`).endsWith(tel))) return { persona: p, por: "teléfono" };
    if (correo && p.correo?.toLowerCase() === correo) return { persona: p, por: "correo" };
  }
  return null;
}

/**
 * La consulta del sitio y su persona, sobre el Directorio (no sobre la lista vieja de clientes).
 * - Ya ligada: dice quién es, abre su ficha y empieza un asunto con ella (la consulta nueva, con la persona puesta).
 * - Sin ligar: «Crear persona» la liga a la ficha con su mismo teléfono o correo, o la crea; «Persona y asunto» hace eso
 *   y abre la consulta nueva. Si ya hay alguien parecido, se avisa antes; no frena.
 */
export function PersonaDeLaConsulta({ lead, directorio, ocupado, alCrear, alEmpezarAsunto }: {
  lead: Lead; directorio: readonly PersonaDirectorio[]; ocupado: boolean;
  /** Crea o liga la persona; con `conAsunto`, abre después la consulta nueva. Devuelve si se pudo. */
  alCrear: (conAsunto: boolean) => Promise<boolean>;
  /** Abre una consulta nueva desde esta del sitio, con la persona ya ligada. */
  alEmpezarAsunto: () => Promise<boolean>;
}) {
  // La ruta del Directorio marca la consulta con `personaId`.
  const personaId = lead.personaId ?? null;
  const ligada = personaId ? directorio.find((p) => p.id === personaId) ?? null : null;
  const parecida = useMemo(() => (personaId ? null : mismaPersona(lead, directorio)), [personaId, lead, directorio]);
  const [conAsunto, setConAsunto] = useState<"no" | "si">("no");

  if (personaId) {
    return (
      <section style={caja} aria-labelledby={`persona-${lead.id}`}>
        <h3 id={`persona-${lead.id}`} className="pn-grupo" style={{ margin: 0 }}>Persona</h3>
        <p style={{ margin: 0 }}>Está en el Directorio{ligada ? `: ${ligada.nombre}` : ""}.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="pn-btn pn-btn-secundario" href={rutaFicha(personaId)}>Abrir su ficha</a>
          <Boton variante="texto" deshabilitado={ocupado} onClick={() => void alEmpezarAsunto()}>Empezar un asunto</Boton>
        </div>
      </section>
    );
  }

  return (
    <section style={caja} aria-labelledby={`persona-${lead.id}`}>
      <h3 id={`persona-${lead.id}`} className="pn-grupo" style={{ margin: 0 }}>Persona</h3>
      {parecida ? (
        <p className="pn-tono-aviso" style={{ margin: 0 }}>
          Ya hay alguien con su {parecida.por}: {parecida.persona.nombre}. Al crearla, la consulta queda en esa ficha y no se repite.{" "}
          <a href={rutaFicha(parecida.persona.id)}>Ver su ficha</a>
        </p>
      ) : <p style={{ margin: 0 }}>Todavía no está en el Directorio.</p>}
      <form noValidate style={{ display: "grid", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }} onSubmit={(e) => {
        e.preventDefault();
        void alCrear(conAsunto === "si");
      }}>
        <Interruptor etiqueta="Crear" valor={conAsunto} alElegir={setConAsunto}
          opciones={[{ valor: "no", etiqueta: "Solo la persona" }, { valor: "si", etiqueta: "Persona y asunto" }]} />
        <div><Boton type="submit" deshabilitado={ocupado}>{conAsunto === "si" ? "Crear persona y empezar asunto" : "Crear persona"}</Boton></div>
        <span className="pn-campo-ayuda">
          {conAsunto === "si" ? "Queda en el Directorio y se abre la consulta con ella puesta; ahí nace el asunto." : "Queda en el Directorio con su nombre y contacto, y la consulta ligada a su ficha."}
        </span>
      </form>
    </section>
  );
}
