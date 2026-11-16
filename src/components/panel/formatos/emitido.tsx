"use client";
import { useEffect, useRef, useState } from "react";

import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Fila } from "@/components/panel/kit/lista";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import type { FilaDocumento } from "@/lib/panel/datos/formatos";
import { leerDocumento, type EmisionFormato } from "@/lib/panel/datos/formatos-acciones";
import {
  emisionActual, faltaParaFirmado, leerCopiasFirmadas, rutaCopiaFirmada, subirFirmado, type CopiaFirmada,
} from "@/lib/panel/datos/formatos-adjuntos";

const fecha = (iso: string) => diaLargo(aTexto(new Date(iso)));

/**
 * Un emitido en la lista: dice si ya tiene su copia firmada y deja subirla (o verla) sin abrir la captura (PN-06).
 * La copia va con el PDF de la versión actual.
 */
export function FilaEmitido({ fila, href }: { fila: FilaDocumento; href: string }) {
  const { avisar } = useAvisos();
  const [emision, setEmision] = useState<EmisionFormato | null>(null);
  const [copias, setCopias] = useState<CopiaFirmada[] | null>(null);
  const [subiendo, setSubiendo] = useState(false);
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

  const subir = async (archivo: File | null) => {
    const falta = faltaParaFirmado(archivo);
    if (falta || !archivo || !emision) { avisar(falta ?? "Elige el PDF firmado."); return; }
    setSubiendo(true);
    try {
      const copia = await subirFirmado(emision.id, archivo);
      setCopias((xs) => [copia, ...(xs ?? [])]);
      avisar("Copia firmada guardada");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se subió. Vuelve a intentarlo.");
    } finally { setSubiendo(false); }
  };

  const copia = copias?.[0];
  const detalle = copias === null ? "Revisando la copia firmada…" : copia ? `Copia firmada del ${fecha(copia.created_at)}` : emision ? "Falta la copia firmada" : undefined;
  return (
    // La fecha va en la línea de abajo para dejar lugar a la acción en el teléfono.
    <Fila titulo={fila.titulo} subtitulo={[fila.linea, fecha(fila.actualizadoEl)].filter(Boolean).join(" · ")} href={href}
      detalle={detalle} tonoDetalle={copias && !copia && emision ? "aviso" : "normal"}
      acciones={copias === null || !emision ? undefined : copia ? (
        <a href={rutaCopiaFirmada(copia.id)} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 12px", color: "var(--accent)", fontWeight: 500 }}
          aria-label={`Ver la copia firmada de ${fila.titulo}`}>Ver firmada</a>
      ) : (
        <>
          <Boton variante="texto" deshabilitado={subiendo} onClick={() => entrada.current?.click()} aria-label={`Subir la copia firmada de ${fila.titulo}`}>
            {subiendo ? "Subiendo…" : "Subir firmada"}
          </Boton>
          <input ref={entrada} type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void subir(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </>
      )} />
  );
}
