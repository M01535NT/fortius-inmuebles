"use client";
import { useMemo, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor, Lead } from "@/lib/domain/records";
import { EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";
import { operacionSugerida } from "@/lib/panel/datos/consultas-acciones";
import { buscarPersonas, coincidenciasDeConsulta, hayDuplicadoFuerte, MOTIVO_COINCIDENCIA, operacionDeConsulta } from "@/lib/panel/datos/consultas-persona";
import { rutaPersona } from "@/lib/panel/datos/relacionado";

const TIPOS = Object.entries(EXPEDIENTE_OPERACIONES).map(([valor, etiqueta]) => ({ valor, etiqueta }));
const rutaAsunto = (id: string) => `/panel/asuntos?ver=${encodeURIComponent(id)}`;
const caja = { display: "grid", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;

export type DatosAsunto = { clienteId: string; asesorId: string; operacion: string; propiedadSlug?: string };
export type AsuntoReciente = { id: string; folio: string | null };

/**
 * La consulta y su persona (PN-05).
 * - Ya ligada: dice quién es, abre su ficha y ofrece abrir un asunto (o abrir el que se acaba de crear).
 * - Sin ligar: sugiere a quien pueda ser la misma persona (teléfono, correo, nombre) y deja buscar en Personas;
 *   «Crear persona» (con asunto si se elige) usa la conversión verificada de la base. Los parecidos avisan, no frenan.
 *   Ligar la consulta a una ficha que ya existe necesita una función de la base que todavía no hay (ver PLAN, PN-05).
 */
export function PersonaDeLaConsulta({ lead, personas, asesores, miAsesor, ocupado, asuntoReciente, alCrear, alAbrirAsunto }: {
  lead: Lead; personas: readonly Cliente[]; asesores: readonly Asesor[]; miAsesor: string | null; ocupado: boolean;
  asuntoReciente: AsuntoReciente | null;
  /** Crea la persona y, con `asunto`, abre también el asunto. Devuelve si se pudo. */
  alCrear: (asunto: { operacion: string; asesorId: string } | null) => Promise<boolean>;
  alAbrirAsunto: (d: DatosAsunto) => Promise<boolean>;
}) {
  const persona = lead.clienteId ? personas.find((p) => p.id === lead.clienteId) ?? null : null;
  const fijo = lead.asesorId || miAsesor || "";
  const [asesorId, setAsesorId] = useState<string>(fijo);
  const eligeAsesor = !fijo;
  const opcionesAsesor = asesores.map((a) => ({ valor: a.id, etiqueta: a.nombre }));

  if (lead.clienteId) {
    return <PersonaLigada lead={lead} clienteId={lead.clienteId} persona={persona} asuntoReciente={asuntoReciente} ocupado={ocupado}
      asesorId={asesorId} setAsesorId={setAsesorId} eligeAsesor={eligeAsesor} opcionesAsesor={opcionesAsesor} alAbrirAsunto={alAbrirAsunto} />;
  }
  return <PersonaSinLigar lead={lead} personas={personas} ocupado={ocupado}
    asesorId={asesorId} setAsesorId={setAsesorId} eligeAsesor={eligeAsesor} opcionesAsesor={opcionesAsesor} alCrear={alCrear} />;
}

type Asesoria = { asesorId: string; setAsesorId: (v: string) => void; eligeAsesor: boolean; opcionesAsesor: { valor: string; etiqueta: string }[] };

function PersonaLigada({ lead, clienteId, persona, asuntoReciente, ocupado, asesorId, setAsesorId, eligeAsesor, opcionesAsesor, alAbrirAsunto }: {
  lead: Lead; clienteId: string; persona: Cliente | null; asuntoReciente: AsuntoReciente | null; ocupado: boolean;
  alAbrirAsunto: (d: DatosAsunto) => Promise<boolean>;
} & Asesoria) {
  const [abriendo, setAbriendo] = useState(false);
  const [operacion, setOperacion] = useState<string>(() => operacionSugerida(persona?.tipo));
  return (
    <section style={caja} aria-labelledby={`persona-${lead.id}`}>
      <h3 id={`persona-${lead.id}`} className="pn-grupo" style={{ margin: 0 }}>Persona</h3>
      <p style={{ margin: 0 }}>Está en Personas{persona ? `: ${persona.nombre}` : ""}.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className="pn-btn pn-btn-secundario" href={rutaPersona(clienteId)}>Abrir su ficha</a>
        {asuntoReciente ? <a className="pn-btn pn-btn-secundario" href={rutaAsunto(asuntoReciente.id)}>Abrir el asunto{asuntoReciente.folio ? ` ${asuntoReciente.folio}` : ""}</a> : null}
        {!abriendo && !asuntoReciente ? <Boton variante="texto" onClick={() => { setOperacion(operacionSugerida(persona?.tipo)); setAbriendo(true); }}>Abrir un asunto</Boton> : null}
      </div>
      {abriendo ? (
        <form noValidate style={{ display: "grid", gap: 10 }} onSubmit={(e) => {
          e.preventDefault();
          if (!asesorId) return;
          void alAbrirAsunto({ clienteId, asesorId, operacion, ...(lead.propiedadSlug ? { propiedadSlug: lead.propiedadSlug } : {}) }).then((ok) => { if (ok) setAbriendo(false); });
        }}>
          <Desplegable etiqueta="Tipo de asunto" valor={operacion} opciones={TIPOS} alElegir={(v) => { if (v) setOperacion(v); }} />
          {eligeAsesor ? <Desplegable etiqueta="Lo lleva" valor={asesorId} vacio="Elige…" opciones={opcionesAsesor} alElegir={setAsesorId} /> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <Boton type="submit" deshabilitado={ocupado || !asesorId}>Abrir asunto</Boton>
            <Boton variante="texto" onClick={() => setAbriendo(false)}>Cancelar</Boton>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function PersonaSinLigar({ lead, personas, ocupado, asesorId, setAsesorId, eligeAsesor, opcionesAsesor, alCrear }: {
  lead: Lead; personas: readonly Cliente[]; ocupado: boolean;
  alCrear: (asunto: { operacion: string; asesorId: string } | null) => Promise<boolean>;
} & Asesoria) {
  const sugeridas = useMemo(() => coincidenciasDeConsulta(lead, personas), [lead, personas]);
  const [buscando, setBuscando] = useState(false);
  const [texto, setTexto] = useState("");
  const halladas = useMemo(() => buscarPersonas(texto, personas), [texto, personas]);
  const [conAsunto, setConAsunto] = useState<"no" | "si">("no");
  const [operacion, setOperacion] = useState<string>(() => operacionDeConsulta(lead));
  const fuerte = hayDuplicadoFuerte(sugeridas);
  const faltaAsesor = conAsunto === "si" && !asesorId;

  const filaPersona = (p: Cliente, motivo?: string) => (
    <li key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 44 }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ fontWeight: 500 }}>{p.nombre?.trim() || "Sin nombre"}</span>
        <span className="pn-sub" style={{ display: "block", margin: 0 }}>{[motivo, p.telefono, p.email].filter(Boolean).join(" · ")}</span>
      </span>
      <a className="pn-btn pn-btn-texto" href={rutaPersona(p.id)} aria-label={`Abrir la ficha de ${p.nombre?.trim() || "esta persona"}`}>Abrir su ficha</a>
    </li>
  );

  return (
    <section style={caja} aria-labelledby={`persona-${lead.id}`}>
      <h3 id={`persona-${lead.id}`} className="pn-grupo" style={{ margin: 0 }}>Persona</h3>
      {sugeridas.length ? (
        <div style={{ display: "grid", gap: 4 }}>
          <p style={{ margin: 0 }}>{sugeridas.length === 1 ? "Puede ser alguien que ya está en Personas:" : "Puede ser alguna de estas personas:"}</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid" }}>{sugeridas.map((c) => filaPersona(c.persona, MOTIVO_COINCIDENCIA[c.por]))}</ul>
        </div>
      ) : <p style={{ margin: 0 }}>Todavía no está en Personas.</p>}

      {buscando ? (
        <div style={{ display: "grid", gap: 4 }}>
          <Campo etiqueta="Buscar en Personas" placeholder="Teléfono, correo o nombre" value={texto} onChange={(e) => setTexto(e.target.value)} type="search" autoComplete="off" autoFocus />
          {texto.trim().length >= 3 ? (halladas.length
            ? <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid" }}>{halladas.map((p) => filaPersona(p))}</ul>
            : <p className="pn-sub" style={{ margin: 0 }}>Nadie coincide en Personas.</p>) : null}
        </div>
      ) : <div><Boton variante="texto" onClick={() => setBuscando(true)}>Buscar en Personas</Boton></div>}

      <form noValidate style={{ display: "grid", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }} onSubmit={(e) => {
        e.preventDefault();
        if (faltaAsesor) return;
        void alCrear(conAsunto === "si" ? { operacion, asesorId } : null);
      }}>
        <Interruptor etiqueta="Crear" valor={conAsunto} alElegir={setConAsunto}
          opciones={[{ valor: "no", etiqueta: "Solo la persona" }, { valor: "si", etiqueta: "Persona y asunto" }]} />
        {conAsunto === "si" ? (
          <>
            <Desplegable etiqueta="Tipo de asunto" valor={operacion} opciones={TIPOS} alElegir={(v) => { if (v) setOperacion(v); }} />
            {eligeAsesor ? <Desplegable etiqueta="Lo lleva" valor={asesorId} vacio="Elige…" opciones={opcionesAsesor} alElegir={setAsesorId} /> : null}
          </>
        ) : null}
        {fuerte ? <p className="pn-tono-aviso" style={{ margin: 0 }}>Ya hay alguien con su {sugeridas.some((c) => c.por === "telefono") ? "teléfono" : "correo"}. Si es la misma persona, abre su ficha; si no, créala.</p> : null}
        <div><Boton type="submit" variante={fuerte ? "secundario" : "primario"} deshabilitado={ocupado || faltaAsesor}>{conAsunto === "si" ? "Crear persona y asunto" : "Crear persona"}</Boton></div>
        <span className="pn-campo-ayuda">Se crea con su nombre y contacto, y la consulta queda ligada a la ficha.</span>
      </form>
    </section>
  );
}
