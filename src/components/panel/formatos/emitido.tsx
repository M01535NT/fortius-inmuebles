"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAvisos } from "@/components/panel/kit/avisos";
import { Icono } from "@/components/panel/icons";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { cuandoCorto } from "@/lib/panel/datos/personas-ficha";
import { avanceBorrador, type FilaDocumento } from "@/lib/panel/datos/formatos";
import { descargarEmision, leerDocumento, type EmisionFormato } from "@/lib/panel/datos/formatos-acciones";
import {
  emisionActual, faltaParaFirmado, leerCopiasFirmadas, quitarFirmado, rutaCopiaFirmada, subirFirmado, type CopiaFirmada,
} from "@/lib/panel/datos/formatos-adjuntos";

const fecha = (iso: string) => diaLargo(aTexto(new Date(iso)));
const linea = (...partes: string[]) => partes.filter(Boolean).join(" · ");

/** Cabeza de una tarjeta de documento (boceto): número en su cuadro, nombre del formato y «asunto · folio». */
function Cabeza({ fila, extra, lado }: { fila: FilaDocumento; extra?: string; lado?: string }) {
  return (
    <span className="pn-fmt-dcab">
      <span className="pn-fmt-num" aria-hidden>{fila.numero}</span>
      <span className="pn-fmt-ctx">
        <span className="pn-fmt-cn">{fila.nombre}</span>
        <span className="pn-fmt-ch">{linea(fila.asunto, fila.folio, extra ?? "")}</span>
      </span>
      {lado ? <span className="pn-fmt-lado">{lado}</span> : null}
    </span>
  );
}

/**
 * Un borrador (boceto «Borradores»): la tarjeta entera abre su captura y abajo lleva su avance, «8 de 12 datos».
 * El avance cuenta los datos que pide el formato (los mismos que revisa el servidor al emitir).
 */
export function TarjetaBorrador({ fila, href }: { fila: FilaDocumento; href: string }) {
  const [avance, setAvance] = useState<{ hechos: number; total: number } | null>(null);
  useEffect(() => {
    const c = new AbortController();
    leerDocumento(fila.id, c.signal)
      .then(({ documento }) => setAvance(avanceBorrador(documento.formato_id, documento.data ?? {}, fila.folio)))
      .catch(() => { /* sin avance si no se pudo leer: la tarjeta sigue sirviendo */ });
    return () => c.abort();
  }, [fila.id, fila.folio]);
  const pct = avance && avance.total ? Math.round((avance.hechos * 100) / avance.total) : 0;
  return (
    <Link href={href} className="pn-fmt-dcard pn-fmt-dcard-enlace">
      <Cabeza fila={fila} lado={cuandoCorto(aTexto(new Date(fila.actualizadoEl)), new Date())} />
      {avance && avance.total > 0 ? (
        <span className="pn-fmt-avance">
          <span className="pn-fmt-pbar" role="progressbar" aria-label="Datos llenos" aria-valuemin={0} aria-valuemax={avance.total} aria-valuenow={avance.hechos}>
            <span style={{ width: `${pct}%` }} />
          </span>
          <span className="pn-fmt-ch">{avance.hechos} de {avance.total} datos</span>
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Un emitido (boceto «Emitidos»): «PDF» descarga la versión emitida y «Subir copia firmada» guarda la que se firmó fuera
 * del sistema (con Deshacer). Ya subida, dice «Copia firmada guardada» y deja verla. El nombre abre el documento.
 */
export function FilaEmitido({ fila, href }: { fila: FilaDocumento; href: string }) {
  const { avisar } = useAvisos();
  const [emision, setEmision] = useState<EmisionFormato | null>(null);
  const [copias, setCopias] = useState<CopiaFirmada[] | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [bajando, setBajando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const c = new AbortController();
    leerDocumento(fila.id, c.signal)
      .then(async ({ documento, emisiones }) => {
        const e = emisionActual(emisiones, documento.version);
        setEmision(e);
        setCopias(e ? await leerCopiasFirmadas(e.id, c.signal) : []);
      })
      .catch(() => { if (!c.signal.aborted) setCopias([]); });
    return () => c.abort();
  }, [fila.id]);

  const descargar = async () => {
    if (!emision || bajando) return;
    setBajando(true);
    try { await descargarEmision(emision.id, `${fila.folio || "Fortius"} ${fila.formatoId} ${fila.nombre}.pdf`); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo descargar el PDF."); }
    finally { setBajando(false); }
  };

  const subir = async (archivo: File | null) => {
    const falta = faltaParaFirmado(archivo);
    if (falta || !archivo || !emision) { avisar(falta ?? "Elige el PDF firmado."); return; }
    setSubiendo(true);
    try {
      const copia = await subirFirmado(emision.id, archivo);
      setCopias((xs) => [copia, ...(xs ?? [])]);
      avisar("Copia firmada guardada", {
        etiqueta: "Deshacer",
        alAccionar: () => {
          quitarFirmado(copia.id).then(
            () => { setCopias((xs) => (xs ?? []).filter((x) => x.id !== copia.id)); avisar("Se deshizo"); },
            (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."),
          );
        },
      });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se subió. Vuelve a intentarlo.");
    } finally { setSubiendo(false); }
  };

  const copia = copias?.[0];
  return (
    <div className="pn-fmt-dcard">
      <Link href={href} className="pn-fmt-dcab-enlace"><Cabeza fila={fila} extra={fecha(fila.actualizadoEl)} /></Link>
      <div className="pn-fmt-acciones">
        <button type="button" className="pn-btn pn-btn-secundario pn-fmt-sbtn" onClick={() => void descargar()} aria-disabled={!emision || bajando || undefined}
          aria-label={`Descargar el PDF de ${fila.nombre}`}>
          <Icono nombre="descargar" tamano={18} />{bajando ? "Descargando…" : "PDF"}
        </button>
        {copias === null || !emision ? null : copia ? (
          <a href={rutaCopiaFirmada(copia.id)} target="_blank" rel="noopener noreferrer" className="pn-fmt-firmada"
            aria-label={`Copia firmada guardada el ${fecha(copia.created_at)}. Verla`}>Copia firmada guardada</a>
        ) : (
          <>
            <button type="button" className="pn-btn pn-btn-secundario pn-fmt-sbtn" aria-disabled={subiendo || undefined}
              onClick={() => { if (!subiendo) entrada.current?.click(); }} aria-label={`Subir la copia firmada de ${fila.nombre}`}>
              <Icono nombre="contrato" tamano={18} />{subiendo ? "Subiendo…" : "Subir copia firmada"}
            </button>
            <input ref={entrada} type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} aria-hidden
              onChange={(e) => { void subir(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          </>
        )}
      </div>
    </div>
  );
}
