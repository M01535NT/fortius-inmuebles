"use client";
import { useMemo, useState } from "react";

import "@/components/panel/fichas/fichas.css";
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

/** Vista previa grande del archivo (boceto): la hoja del PDF, la foto o el video. Todavía no tiene destino. */
export function VistaPrevia({ archivo, url }: { archivo: ArchivoBandeja; url: string | null }) {
  const clase = claseArchivo(archivo.tipo);
  if (clase === "pdf" || !url) {
    return (
      <div className="fx-pv" aria-label={`Vista previa de ${archivo.nombre}`}>
        <div className="fx-pv-hoja" aria-hidden>
          <b style={{ fontSize: 12, color: "var(--ink-muted)" }}>{clase === "pdf" ? "PDF" : clase === "video" ? "Video" : "Foto"}</b>
          <i style={{ width: "70%" }} /><i /><i /><i style={{ width: "85%" }} /><i /><i style={{ width: "60%" }} />
        </div>
      </div>
    );
  }
  return (
    <div className="fx-pv">
      {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), next/image no aplica */}
      {clase === "foto" ? <img src={url} alt={`Vista previa de ${archivo.nombre}`} />
        : <video src={url} controls muted preload="metadata" aria-label={`Vista previa de ${archivo.nombre}`} />}
    </div>
  );
}

/** Cómo se llama un destino ya elegido, para el bloque «Va a». */
function nombreDestino(d: DestinoElegido, datos: Datos): string {
  if (d.clase === "inmueble") return datos.inmuebles.find((p) => p.slug === d.slug)?.titulo ?? "El inmueble anterior";
  const asunto = datos.asuntos.find((a) => a.id === d.asuntoId)?.titulo ?? "El asunto anterior";
  if (d.clase === "persona") return `${datos.personas.find((c) => c.id === d.personaId)?.nombre ?? "La persona anterior"} · ${asunto}`;
  return asunto;
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
  // Recomendación (boceto): sin lectura automática, se propone el lugar del archivo anterior. «Cambiar» abre el selector.
  const [cambiando, setCambiando] = useState(() => !repetir);

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
    <div className="bj-det">
      <VistaPrevia archivo={archivo} url={url} />
      <div className="bj-det-cab">
        <div className="fm-cab">
          <h2 className="fm-h1 bj-h2">{archivo.nombre}</h2>
          <span className="as-m">{tamano(archivo.bytes)} · {textoEstado(archivo)}</span>
        </div>
        {url ? <a className="pn-btn pn-btn-secundario" href={url} target="_blank" rel="noopener noreferrer">Abrir</a> : null}
      </div>
      {ocupado ? <div className="fx-pbar" aria-hidden><span /></div> : null}
      {archivo.error && archivo.estado !== "error" ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{archivo.error}</p> : null}

      {archivo.estado !== "error" && repetir && !cambiando ? (
        <section className="fx-recblk" aria-label="Dónde va">
          <span className="fx-rec-v">Va a</span>
          <span className="fx-rec-t">{nombreDestino(repetir, datos)}</span>
          <span className="fx-rec-r">Mismo lugar que el archivo anterior</span>
          <div className="fx-filas-btn" style={{ marginTop: 6 }}>
            <Boton variante="secundario" className="fx-btn-claro" deshabilitado={ocupado}
              onClick={() => { if (!ocupado) alGuardar(repetir.clase === "inmueble" ? repetir : { ...repetir, titulo: titulo.trim() || undefined }); }}>Confirmar</Boton>
            <Boton variante="secundario" className="fx-btn-oscuro" onClick={() => setCambiando(true)}>Cambiar</Boton>
          </div>
        </section>
      ) : archivo.estado !== "error" && !repetir ? (
        <div className="fx-warnbox" role="note"><b>Sin coincidencia clara</b><span>Elige a dónde va: un asunto, una persona o un inmueble.</span></div>
      ) : null}

      {archivo.estado === "error" ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Uno recuperado del servidor no tiene sus bytes aquí: no se puede volver a subir desde este navegador. */}
          {archivo.enMemoria ? <Boton onClick={alReintentar}>Volver a subir</Boton> : null}
          <Boton variante="texto" onClick={alQuitar}>Quitar de la Bandeja</Boton>
        </div>
      ) : !cambiando ? (
        <div><button type="button" className="fx-linkbtn" disabled={ocupado} onClick={() => { if (!ocupado) alQuitar(); }}>Quitar de la Bandeja</button></div>
      ) : (
        <section className="bj-bloque" aria-label="Dónde va">
          <h3 className="fm-t bj-bloque-t">Dónde va</h3>
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
              {inmueble?.publicada ? <p className="pn-sub" style={{ margin: 0 }}>Este inmueble está publicado: la foto entra a sus fotos sin mostrarse en el sitio. La muestras desde la ficha del inmueble.</p> : null}
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
          <button type="button" className="fx-linkbtn" disabled={ocupado} onClick={() => { if (!ocupado) alQuitar(); }}>Quitar de la Bandeja</button>
        </section>
      )}
    </div>
  );
}
