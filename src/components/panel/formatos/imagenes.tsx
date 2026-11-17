"use client";
import { useId, useRef, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import {
  faltaParaSubir, opcionesDe, RANURAS_IMAGEN, rutaAdjunto, subirAdjunto, TIPOS_ADJUNTO, type Adjunto, type RanuraImagen,
} from "@/lib/panel/datos/formatos-adjuntos";

/**
 * Imágenes de un levantamiento (04) o de la opinión (07), PN-06: la foto principal y el croquis se eligen entre las imágenes
 * subidas al documento; se puede subir una nueva (o tomarla con la cámara del celular) y queda elegida enseguida.
 * Solo con autorización del propietario; se anota quién la tomó y cuándo.
 */
export function ElegirImagen({ ranura, documentoId, adjuntos, valor, alElegir, alSubir }: {
  ranura: RanuraImagen; documentoId: string; adjuntos: readonly Adjunto[]; valor: unknown;
  alElegir: (id: string) => void; alSubir: (a: Adjunto) => void;
}) {
  const r = RANURAS_IMAGEN[ranura];
  const opciones = opcionesDe(adjuntos, r.tipo);
  const elegido = typeof valor === "string" ? valor : "";
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {opciones.length ? (
        <Desplegable etiqueta={r.nombre} valor={elegido} vacio="Sin imagen" opciones={opciones} alElegir={alElegir} />
      ) : <p className="pn-sub" style={{ margin: 0 }}>Todavía no hay {r.tipo === "foto" ? "fotografías" : "croquis"} en este documento. Sube {r.tipo === "foto" ? "una" : "uno"} abajo.</p>}
      {elegido ? (
        <>
          <Miniatura id={elegido} texto={opciones.find((o) => o.valor === elegido)?.etiqueta ?? r.nombre} />
          {/* Saca la imagen de su espacio; la imagen sigue en el documento para elegirla otra vez. Se guarda con Deshacer. */}
          <div><Boton variante="texto" onClick={() => alElegir("")}>Quitar de la hoja</Boton></div>
        </>
      ) : null}
      <SubirImagen documentoId={documentoId} tipo={r.tipo} alSubir={(a) => { alSubir(a); alElegir(a.id); }} />
    </div>
  );
}

export function Miniatura({ id, texto }: { id: string; texto: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagen privada servida por la API con sesión; next/image no aplica
    <img src={rutaAdjunto(id)} alt={texto} style={{ width: "100%", maxHeight: 180, objectFit: "contain", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--muted)" }} />
  );
}

/**
 * Las imágenes subidas al documento, con «Quitar» (recuperable, con Deshacer). Si la hoja la usa, al quitarla también sale de su espacio.
 */
export function ImagenesDelDocumento({ adjuntos, enUso, ocupado, alQuitar }: {
  adjuntos: readonly Adjunto[]; enUso: ReadonlySet<string>; ocupado: boolean; alQuitar: (a: Adjunto) => void;
}) {
  if (!adjuntos.length) return null;
  const tipo = (k: Adjunto["kind"]) => TIPOS_ADJUNTO.find((t) => t.valor === k)?.etiqueta ?? "Imagen";
  return (
    <ul className="pn-captura-imagenes">
      {adjuntos.map((a) => (
        <li key={a.id}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen privada servida por la API con sesión; next/image no aplica */}
          <img src={rutaAdjunto(a.id)} alt="" loading="lazy" />
          <span>
            <strong>{a.caption}</strong>
            <span>{[tipo(a.kind), a.observed_on, enUso.has(a.id) ? "en la hoja" : null].filter(Boolean).join(" · ")}</span>
          </span>
          <Boton variante="texto" deshabilitado={ocupado} onClick={() => alQuitar(a)} aria-label={`Quitar la imagen ${a.caption}`}>Quitar</Boton>
        </li>
      ))}
    </ul>
  );
}

/** Subir una imagen al documento. Con `tipo` el tipo queda fijo (la ranura que se llena); sin él se elige. */
export function SubirImagen({ documentoId, tipo, alSubir }: { documentoId: string; tipo?: Adjunto["kind"]; alSubir: (a: Adjunto) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [elegido, setElegido] = useState<Adjunto["kind"]>(tipo ?? "foto");
  const [descripcion, setDescripcion] = useState("");
  const [fuente, setFuente] = useState("");
  const [fecha, setFecha] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const id = useId();
  const galeria = useRef<HTMLInputElement>(null);

  if (!abierto) {
    return <div><Boton variante="secundario" onClick={() => setAbierto(true)}>Subir {tipo === "croquis" ? "croquis" : tipo === "foto" ? "fotografía" : "imagen"}</Boton></div>;
  }
  const enviar = async () => {
    const falta = faltaParaSubir({ descripcion, fuente, archivo });
    if (falta || !archivo) { setError(falta); return; }
    setSubiendo(true); setError(null);
    try {
      const a = await subirAdjunto(documentoId, { tipo: elegido, descripcion, fuente, fecha, archivo });
      alSubir(a);
      setAbierto(false); setDescripcion(""); setFuente(""); setFecha(""); setArchivo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se subió. Vuelve a intentarlo.");
    } finally { setSubiendo(false); }
  };
  return (
    <fieldset className="pn-captura-fila" disabled={subiendo}>
      <legend>Subir imagen</legend>
      {!tipo ? <Desplegable etiqueta="Tipo" valor={elegido} opciones={TIPOS_ADJUNTO} alElegir={(v) => { if (v) setElegido(v); }} /> : null}
      <div className="pn-campo">
        <span id={`${id}-archivo`}>Imagen JPEG o PNG, hasta 10 MB</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Boton variante="secundario" aria-describedby={`${id}-archivo`} onClick={() => galeria.current?.click()}>Elegir archivo</Boton>
          {/* En la visita: abre la cámara del celular; la foto tomada queda como el archivo a subir. */}
          <label className="pn-btn pn-btn-secundario" style={{ cursor: "pointer" }}>
            Tomar foto
            <input type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          </label>
        </div>
        <input ref={galeria} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        {archivo ? <span className="pn-campo-ayuda">{archivo.name}</span> : null}
      </div>
      <Campo etiqueta="Qué muestra" placeholder="Fachada principal" maxLength={240} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} autoComplete="off" />
      <Campo etiqueta="Quién la tomó o de dónde salió" placeholder="Tomada por el asesor en la visita" maxLength={240} value={fuente} onChange={(e) => setFuente(e.target.value)} autoComplete="off" />
      <Campo etiqueta="Fecha en que se tomó (opcional)" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      {error ? <p className="pn-campo-error" role="alert" style={{ margin: 0 }}><Icono nombre="alerta" tamano={16} />{error}</p> : null}
      <p className="pn-sub" style={{ margin: 0 }}>Solo con autorización del propietario.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <Boton onClick={() => void enviar()} deshabilitado={subiendo}>{subiendo ? "Subiendo…" : "Subir"}</Boton>
        <Boton variante="texto" onClick={() => { setAbierto(false); setError(null); }}>Cancelar</Boton>
      </div>
    </fieldset>
  );
}
