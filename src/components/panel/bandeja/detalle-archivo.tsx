"use client";
import { useMemo, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { EXPEDIENTE_DOCUMENTOS } from "@/lib/formatos/expediente-operations";
import type { FilaAsunto } from "@/lib/panel/datos/asuntos";
import {
  asuntosDePersona, claseArchivo, CLASES_DESTINO, motivoDestino, opcionesDestino, tamano, textoEstado, tituloArchivo,
  type ArchivoBandeja, type ClaseDestino,
} from "@/lib/panel/datos/bandeja";

export type DestinoElegido =
  | { clase: "asunto"; asuntoId: string; titulo?: string }
  | { clase: "persona"; personaId: string; asuntoId: string; titulo?: string }
  | { clase: "inmueble"; slug: string };

type Datos = { asuntos: readonly FilaAsunto[]; inmuebles: readonly Property[]; personas: readonly Cliente[] };

/** Vista previa del archivo (sale de este navegador; todavía no tiene destino). */
export function VistaPrevia({ archivo, url }: { archivo: ArchivoBandeja; url: string | null }) {
  const clase = claseArchivo(archivo.tipo);
  if (clase === "pdf" || !url) {
    return (
      <div className="bj-bloque" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="bj-mini" aria-hidden>{clase === "pdf" ? "PDF" : clase === "video" ? "Video" : "Foto"}</span>
        <span style={{ flex: 1 }} className="pn-sub">{tamano(archivo.bytes)}</span>
        {url ? <a className="pn-btn pn-btn-texto" href={url} target="_blank" rel="noopener noreferrer">Ver el PDF</a> : null}
      </div>
    );
  }
  return (
    <div className="bj-vista">
      {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), next/image no aplica */}
      {clase === "foto" ? <img src={url} alt={`Vista previa de ${archivo.nombre}`} />
        : <video src={url} controls muted preload="metadata" aria-label={`Vista previa de ${archivo.nombre}`} />}
    </div>
  );
}

const QUE_ES = [
  ...(Object.keys(EXPEDIENTE_DOCUMENTOS) as (keyof typeof EXPEDIENTE_DOCUMENTOS)[]).map((k) => ({ valor: k as string, etiqueta: EXPEDIENTE_DOCUMENTOS[k] })),
  { valor: "otro", etiqueta: "Otro documento" },
];
const claseInicial = (tipo: string): ClaseDestino => (motivoDestino("asunto", tipo) === null ? "asunto" : "inmueble");

/**
 * Elegir a mano a dónde va el archivo: un asunto, un inmueble o una persona que ya existan.
 * La persona no tiene ruta propia para documentos: su archivo queda en uno de sus asuntos, y así se dice.
 */
export function DetalleArchivo({ archivo, url, datos, anterior, alGuardar, alQuitar, alReintentar }: {
  archivo: ArchivoBandeja; url: string | null; datos: Datos;
  /** El destino del último archivo guardado (AUD-06, 7): varios archivos seguidos suelen ir al mismo lugar. */
  anterior?: DestinoElegido | null;
  alGuardar: (d: DestinoElegido) => void; alQuitar: () => void; alReintentar: () => void;
}) {
  const repetir = anterior && motivoDestino(anterior.clase, archivo.tipo) === null ? anterior : null;
  const [clase, setClase] = useState<ClaseDestino>(() => repetir?.clase ?? claseInicial(archivo.tipo));
  const [buscar, setBuscar] = useState("");
  const [elegido, setElegido] = useState(() => !repetir ? "" : repetir.clase === "asunto" ? repetir.asuntoId : repetir.clase === "persona" ? repetir.personaId : repetir.slug);
  const [asuntoPersona, setAsuntoPersona] = useState(() => (repetir?.clase === "persona" ? repetir.asuntoId : ""));
  // Qué es (AUD-06, 8): el documento no se queda con el nombre del teléfono («IMG 2026…»).
  const [que, setQue] = useState("");
  const [titulo, setTitulo] = useState(() => tituloArchivo(archivo.nombre));
  const motivo = motivoDestino(clase, archivo.tipo);
  const opciones = useMemo(() => opcionesDestino(clase, datos, buscar), [clase, datos, buscar]);
  const deLaPersona = useMemo(() => (clase === "persona" && elegido ? asuntosDePersona(elegido, datos.asuntos) : []), [clase, elegido, datos.asuntos]);
  const inmueble = clase === "inmueble" ? datos.inmuebles.find((p) => p.slug === elegido) ?? null : null;
  const ocupado = archivo.estado === "subiendo" || archivo.estado === "guardando";
  const nombreClase = { asunto: "asunto", inmueble: "inmueble", persona: "persona" }[clase];

  const destino: DestinoElegido | null = motivo || !elegido ? null
    : clase === "asunto" ? { clase, asuntoId: elegido, titulo: titulo.trim() || undefined }
    : clase === "inmueble" ? { clase, slug: elegido }
    : asuntoPersona ? { clase, personaId: elegido, asuntoId: asuntoPersona, titulo: titulo.trim() || undefined } : null;
  const porQueNo = ocupado ? (archivo.estado === "subiendo" ? "Espera a que termine de subir." : "Guardando…")
    : motivo ? motivo
    : !elegido ? `Elige ${clase === "persona" ? "una persona" : clase === "inmueble" ? "un inmueble" : "un asunto"}.`
    : clase === "persona" && !deLaPersona.length ? "Esta persona todavía no tiene asuntos."
    : clase === "persona" && !asuntoPersona ? "Elige en cuál de sus asuntos." : "";

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
      <VistaPrevia archivo={archivo} url={url} />
      <p className="pn-sub" style={{ margin: 0 }}>{textoEstado(archivo)}</p>
      {archivo.error && archivo.estado !== "error" ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{archivo.error}</p> : null}

      {archivo.estado === "error" ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Boton onClick={alReintentar}>Volver a subir</Boton>
          <Boton variante="texto" onClick={alQuitar}>Quitar de la Bandeja</Boton>
        </div>
      ) : (
        <section className="bj-bloque" aria-label="Dónde va">
          <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Dónde va</h3>
          <Desplegable etiqueta="Guardar en" valor={clase} opciones={CLASES_DESTINO}
            alElegir={(v) => { if (v) { setClase(v); setElegido(""); setAsuntoPersona(""); setBuscar(""); } }} />
          {motivo ? <p style={{ margin: 0, color: "var(--warning)" }}>{motivo}</p> : (
            <>
              <Campo etiqueta="Buscar" type="search" autoComplete="off" value={buscar} onChange={(e) => setBuscar(e.target.value)}
                placeholder={clase === "asunto" ? "Título, folio o persona" : clase === "inmueble" ? "Nombre, código o zona" : "Nombre o teléfono"} />
              <Desplegable etiqueta={clase === "asunto" ? "Asunto" : clase === "inmueble" ? "Inmueble" : "Persona"} valor={opciones.some((o) => o.valor === elegido) ? elegido : ""}
                opciones={opciones} vacio={opciones.length ? `Elige ${clase === "persona" ? "una" : "un"} ${nombreClase}` : "Nada coincide"}
                alElegir={(v) => { setElegido(v); setAsuntoPersona(""); }} />
              {clase === "persona" ? (
                <p className="pn-sub" style={{ margin: 0 }}>Los documentos de una persona se guardan en uno de sus asuntos.</p>
              ) : null}
              {clase === "persona" && deLaPersona.length ? (
                <Desplegable etiqueta="En cuál de sus asuntos" valor={asuntoPersona} vacio="Elige un asunto"
                  opciones={deLaPersona.map((a) => ({ valor: a.id, etiqueta: a.folio ? `${a.titulo} · ${a.folio}` : a.titulo }))}
                  alElegir={setAsuntoPersona} />
              ) : null}
              {clase !== "inmueble" ? (
                <>
                  <Desplegable etiqueta="Qué es" valor={que} vacio="Elige qué documento es" opciones={QUE_ES}
                    alElegir={(v) => { setQue(v); if (v && v !== "otro") setTitulo(EXPEDIENTE_DOCUMENTOS[v as keyof typeof EXPEDIENTE_DOCUMENTOS]); }} />
                  <Campo etiqueta="Nombre del documento" value={titulo} maxLength={240} onChange={(e) => setTitulo(e.target.value)} />
                </>
              ) : null}
              {inmueble?.publicada ? <p style={{ margin: 0, color: "var(--warning)" }}>Este inmueble está publicado: la foto se verá en el sitio en cuanto la guardes.</p> : null}
              {clase === "inmueble" ? <p className="pn-sub" style={{ margin: 0 }}>Va al final de sus fotos, sin datos de ubicación ni de la cámara.</p> : null}
            </>
          )}
          <div style={{ display: "grid", gap: 6 }}>
            <Boton bloque deshabilitado={!destino || ocupado} onClick={() => { if (destino && !ocupado) alGuardar(destino); }} aria-describedby={porQueNo ? `pq-${archivo.id}` : undefined}>Guardar ahí</Boton>
            {porQueNo ? <span id={`pq-${archivo.id}`} className="pn-sub" style={{ margin: 0 }}>{porQueNo}</span> : null}
            {/* Se abre en otra pestaña para no perder lo que espera en la Bandeja; al volver, la lista de asuntos se lee de nuevo. */}
            {!ocupado && !motivo && clase === "persona" && elegido && !deLaPersona.length ? (
              <a href="/panel/asuntos" target="_blank" rel="noopener" className="pn-btn pn-btn-secundario">Abrir un asunto en otra pestaña</a>
            ) : null}
          </div>
          <Boton variante="texto" deshabilitado={ocupado} onClick={() => { if (!ocupado) alQuitar(); }}>Quitar de la Bandeja</Boton>
        </section>
      )}
    </div>
  );
}
