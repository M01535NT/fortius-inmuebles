"use client";
import { useEffect, useRef, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { formatoById, type FormatoField } from "@/lib/formatos/catalog";
import { datoParaCelda, llenarDesdeDatos, valorPara, type DatosGuardados } from "@/lib/formatos/datos-expediente";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { textoDe } from "@/lib/panel/datos/formatos";
import {
  faltaParaFirmado, leerArchivosDelCliente, leerCopiasFirmadas, rutaArchivoDelCliente, rutaCopiaFirmada, subirFirmado,
  type ArchivoDelCliente, type CopiaFirmada,
} from "@/lib/panel/datos/formatos-adjuntos";
import type { EmisionFormato } from "@/lib/panel/datos/formatos-acciones";

const fecha = (iso: string) => diaLargo(aTexto(new Date(iso)));

/**
 * Datos del asunto junto a la captura (CSR, PN-06): lo confirmado en el asunto llena los espacios vacíos con un botón
 * (con Deshacer) y, si la hoja dice otra cosa, se muestra la diferencia sin cambiar nada solo.
 */
export function DatosDelAsunto({ formatoId, valores, datos, ocupado, alLlenar }: {
  formatoId: string; valores: Record<string, unknown>; datos: DatosGuardados | null; ocupado: boolean;
  alLlenar: (cambio: Record<string, unknown>, aviso: string) => void;
}) {
  if (!datos) return null;
  const { patch, conflictos } = llenarDesdeDatos(formatoId, valores, datos);
  const n = Object.keys(patch).length;
  if (!n && !conflictos.length) return null;
  const campos = new Map(formatoById(formatoId).fields.map((f) => [f.key, f]));
  const mostrar = (key: string, v: unknown) => { const f = campos.get(key); return f ? textoDe(f, v) : String(v ?? ""); };
  return (
    <section className="pn-captura-campo" aria-labelledby="datos-asunto">
      <h2 id="datos-asunto">Datos del asunto</h2>
      {n ? (
        <>
          <p className="pn-sub" style={{ margin: 0 }}>{n === 1 ? "Hay 1 dato confirmado" : `Hay ${n} datos confirmados`} en el asunto para espacios vacíos de esta hoja.</p>
          <div><Boton deshabilitado={ocupado} onClick={() => alLlenar(patch, n === 1 ? "Se llenó 1 dato con el asunto" : `Se llenaron ${n} datos con el asunto`)}>Llenar con los datos del asunto</Boton></div>
        </>
      ) : null}
      {conflictos.length ? (
        <ul className="pn-captura-faltan">
          {conflictos.slice(0, 12).map((c) => (
            <li key={c.key} style={{ display: "grid", gap: 4, padding: "8px 0" }}>
              <span style={{ padding: 0, minHeight: 0 }}>{c.etiqueta}: la hoja dice «{mostrar(c.key, c.actual)}»; el asunto, «{mostrar(c.key, c.propuesto)}».</span>
              <div><Boton variante="texto" deshabilitado={ocupado} onClick={() => alLlenar({ [c.key]: c.propuesto }, `${c.etiqueta}: se usó el del asunto`)}>Usar el del asunto</Boton></div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Mientras se llena un espacio: el dato confirmado del asunto para ese campo, si es distinto de lo escrito. */
export function DatoDelAsunto({ formatoId, campo, valor, datos, alUsar }: {
  formatoId: string; campo: FormatoField; valor: unknown; datos: DatosGuardados | null; alUsar: (v: unknown) => void;
}) {
  const def = datoParaCelda(formatoId, campo.key);
  const dato = def && datos?.[def.clave];
  if (!def || !dato || dato.estado !== "confirmado") return null;
  const propuesto = valorPara(campo, dato.valor);
  if (propuesto === undefined || textoDe(campo, propuesto) === textoDe(campo, valor)) return null;
  return (
    <p className="pn-sub" style={{ margin: "-4px 0 0", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      En el asunto: {textoDe(campo, propuesto)}
      <Boton variante="texto" onClick={() => alUsar(propuesto)} aria-label={`Usar ${textoDe(campo, propuesto)} del asunto en ${campo.label}`}>Usar</Boton>
    </p>
  );
}

/** Documentos que el cliente entregó para el asunto (INE, escrituras, recibos), para copiar de ellos sin salir de la hoja. */
export function DocumentosDelCliente({ expedienteId }: { expedienteId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [archivos, setArchivos] = useState<ArchivoDelCliente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!abierto || archivos) return;
    const c = new AbortController();
    leerArchivosDelCliente(expedienteId, c.signal).then(setArchivos, (e: unknown) => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : "No se pudieron leer."); });
    return () => c.abort();
  }, [abierto, archivos, expedienteId]);
  return (
    <section className="pn-captura-campo" aria-labelledby="docs-cliente">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 id="docs-cliente">Documentos del cliente</h2>
        <Boton variante="texto" aria-expanded={abierto} onClick={() => setAbierto((x) => !x)}>{abierto ? "Ocultar" : "Ver"}</Boton>
      </div>
      {abierto ? (error ? <p className="pn-sub" role="alert" style={{ margin: 0 }}>{error}</p>
        : !archivos ? <p className="pn-sub" role="status" style={{ margin: 0 }}>Cargando…</p>
        : archivos.length ? (
          <ul className="pn-captura-faltan">
            {archivos.map((a) => (
              <li key={a.id}><a href={rutaArchivoDelCliente(a.id)} target="_blank" rel="noopener noreferrer" style={{ display: "block", minHeight: 44, padding: "10px 8px", color: "var(--ink)" }}>
                {a.titulo || a.nombre_original}<span className="pn-sub" style={{ display: "block", margin: 0 }}>{fecha(a.created_at)}</span>
              </a></li>
            ))}
          </ul>
        ) : <p className="pn-sub" style={{ margin: 0 }}>El asunto todavía no tiene documentos del cliente. Se suben desde Asuntos.</p>) : null}
    </section>
  );
}

/** Un PDF emitido: se descarga y se le sube la copia firmada (un PDF de hasta 20 MB), que queda junto a él. */
export function PdfEmitido({ emision, actual, alDescargar, alAvisar }: {
  emision: EmisionFormato; actual: boolean; alDescargar: () => void; alAvisar: (t: string) => void;
}) {
  const [copias, setCopias] = useState<CopiaFirmada[] | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const c = new AbortController();
    leerCopiasFirmadas(emision.id, c.signal).then(setCopias, () => { if (!c.signal.aborted) setCopias([]); });
    return () => c.abort();
  }, [emision.id]);
  const subir = async (archivo: File | null) => {
    const falta = faltaParaFirmado(archivo);
    if (falta || !archivo) { alAvisar(falta ?? "Elige el PDF firmado."); return; }
    setSubiendo(true);
    try {
      const copia = await subirFirmado(emision.id, archivo);
      setCopias((xs) => [copia, ...(xs ?? [])]);
      alAvisar("Copia firmada guardada");
    } catch (e) {
      alAvisar(e instanceof Error ? e.message : "No se subió. Vuelve a intentarlo.");
    } finally { setSubiendo(false); }
  };
  return (
    <li style={{ display: "grid", gap: 2, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
      <button type="button" onClick={alDescargar}>{fecha(emision.created_at)}{actual ? " · versión actual" : ""}</button>
      {copias?.length ? (
        <a href={rutaCopiaFirmada(copias[0].id)} target="_blank" rel="noopener noreferrer" style={{ display: "block", minHeight: 44, padding: "10px 8px", color: "var(--accent)", fontSize: 14 }}>
          Copia firmada del {fecha(copias[0].created_at)}{copias.length > 1 ? ` (y ${copias.length - 1} más)` : ""}
        </a>
      ) : null}
      <div style={{ paddingLeft: 0 }}>
        <Boton variante="texto" deshabilitado={subiendo || copias === null} onClick={() => entrada.current?.click()}>
          {subiendo ? "Subiendo…" : copias?.length ? "Subir otra copia firmada" : "Subir copia firmada"}
        </Boton>
        <input ref={entrada} type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void subir(e.target.files?.[0] ?? null); e.target.value = ""; }} />
      </div>
    </li>
  );
}
