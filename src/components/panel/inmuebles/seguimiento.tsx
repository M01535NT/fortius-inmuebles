"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { normalizar } from "@/lib/panel/buscar";
import { datosLlaves, propietariosDe } from "@/lib/panel/datos/inmueble-seguimiento";
import { rutaPersona } from "@/lib/panel/datos/relacionado";
import { KEY_PLACES, type KeyPlace } from "@/lib/propiedad-seguimiento";

/** Propietario: ligado a Personas o «Sin propietario ligado», que se permite. */
export function PropietarioInmueble({ inmueble, personas, ocupado, alLigar, alDesligar }: {
  inmueble: Property; personas: readonly Cliente[]; ocupado: boolean;
  alLigar: (c: Cliente) => void; alDesligar: (c: Cliente) => void;
}) {
  const ligados = propietariosDe(personas, inmueble.slug);
  const [buscando, setBuscando] = useState(false);
  const [q, setQ] = useState("");
  const opciones = useMemo(() => {
    const n = normalizar(q);
    if (n.length < 2) return [];
    return personas.filter((c) => c.propiedadSlug !== inmueble.slug && (normalizar(c.nombre ?? "").includes(n) || (c.telefono ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~"))).slice(0, 6);
  }, [personas, q, inmueble.slug]);
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 20 }}>
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Propietario</h3>
      {ligados.length ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
          {ligados.map((c) => (
            <li key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
              <Link href={rutaPersona(c.id)} style={{ color: "var(--accent)", fontWeight: 500, minHeight: 44, display: "inline-flex", alignItems: "center" }}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}</Link>
              <Boton variante="texto" deshabilitado={ocupado} onClick={() => alDesligar(c)}>Quitar</Boton>
            </li>
          ))}
        </ul>
      ) : <p className="pn-sub" style={{ margin: 0 }}>Sin propietario ligado.</p>}
      {buscando ? (
        <div style={{ display: "grid", gap: 6 }}>
          <Campo etiqueta="Buscar en Personas" type="search" autoComplete="off" placeholder="Nombre o teléfono" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          {opciones.length ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
              {opciones.map((c) => (
                <li key={c.id}>
                  <button type="button" className="pn-btn pn-btn-texto" style={{ width: "100%", justifyContent: "flex-start" }} disabled={ocupado} onClick={() => { alLigar(c); setBuscando(false); setQ(""); }}>
                    {c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : q.trim().length >= 2 ? <p className="pn-sub" style={{ margin: 0 }}>Nadie coincide. Dalo de alta en Personas y vuelve a ligarlo.</p> : null}
          <div><Boton variante="texto" onClick={() => { setBuscando(false); setQ(""); }}>Cancelar</Boton></div>
        </div>
      ) : <div><Boton variante="secundario" onClick={() => setBuscando(true)}>{ligados.length ? "Ligar a otra persona" : "Ligar propietario"}</Boton></div>}
    </section>
  );
}

const LUGARES = Object.entries(KEY_PLACES) as [KeyPlace, string][];

/** Llaves: dónde están y a quién se prestaron, para no perder visitas. Privado. */
export function LlavesInmueble({ inmueble, hoy, ocupado, alGuardar, alPrestar, alRegresar }: {
  inmueble: Property; hoy: Date; ocupado: boolean;
  alGuardar: (d: { lugar?: KeyPlace; copias?: number; detalle: string }) => void;
  alPrestar: (d: { persona: string; regresoPrevisto: string | null }) => void;
  alRegresar: (id: string) => void;
}) {
  const actual = datosLlaves(inmueble);
  const [lugar, setLugar] = useState<KeyPlace | undefined>(actual.lugar);
  const [copias, setCopias] = useState(actual.copias !== undefined ? String(actual.copias) : "");
  const [detalle, setDetalle] = useState(actual.detalle);
  const [prestando, setPrestando] = useState(false);
  const [persona, setPersona] = useState("");
  const [regreso, setRegreso] = useState<string | null>(aTexto(hoy));
  const n = copias.trim() === "" ? undefined : Number.parseInt(copias, 10);
  const cambio = lugar !== actual.lugar || n !== actual.copias || detalle.trim() !== actual.detalle;
  const hoyTexto = aTexto(hoy);
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 20 }}>
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Llaves</h3>
      <Desplegable<KeyPlace> etiqueta="Dónde están" valor={lugar ?? ""} vacio="Sin anotar" opciones={LUGARES.map(([valor, etiqueta]) => ({ valor, etiqueta }))} alElegir={(v) => setLugar(v || undefined)} />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "120px 1fr" }}>
        <Campo etiqueta="Copias" inputMode="numeric" autoComplete="off" maxLength={2} value={copias} onChange={(e) => setCopias(e.target.value.replace(/\D/g, ""))} />
        <Campo etiqueta="Detalle" placeholder="Ej. en el llavero azul" autoComplete="off" maxLength={500} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
      </div>
      {cambio ? <div><Boton variante="secundario" deshabilitado={ocupado} onClick={() => alGuardar({ lugar, copias: n, detalle })}>Guardar llaves</Boton></div> : null}
      {actual.prestadas.length ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
          {actual.prestadas.map((x) => {
            const tarde = x.regresoPrevisto ? x.regresoPrevisto < hoyTexto : false;
            return (
              <li key={x.id} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
                <span style={{ color: tarde ? "var(--warning)" : undefined }}>
                  Las tiene {x.persona}{x.regresoPrevisto ? ` · ${tarde ? "debían volver" : "vuelven"} el ${diaLargo(x.regresoPrevisto)}` : ""}
                </span>
                <Boton variante="texto" deshabilitado={ocupado} onClick={() => alRegresar(x.id)}>Regresaron</Boton>
              </li>
            );
          })}
        </ul>
      ) : null}
      {prestando ? (
        <form style={{ display: "grid", gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (persona.trim()) { alPrestar({ persona, regresoPrevisto: regreso }); setPrestando(false); setPersona(""); } }}>
          <Campo etiqueta="¿Quién se las lleva?" autoComplete="off" maxLength={160} value={persona} onChange={(e) => setPersona(e.target.value)} autoFocus />
          <DesplegableFecha etiqueta="Regresan" valor={regreso} alElegir={setRegreso} hoy={hoy} sinFecha="Sin fecha prevista" etiquetaCalendario="Regresan el" />
          <div style={{ display: "flex", gap: 8 }}>
            <Boton type="submit" variante="secundario" deshabilitado={!persona.trim() || ocupado}>Anotar préstamo</Boton>
            <Boton variante="texto" onClick={() => setPrestando(false)}>Cancelar</Boton>
          </div>
        </form>
      ) : <div><Boton variante="texto" onClick={() => setPrestando(true)}>Prestar llaves</Boton></div>}
    </section>
  );
}
