"use client";
import { forwardRef, useImperativeHandle, useRef, useState, type DragEvent } from "react";

import { Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { TIPOS_BANDEJA } from "@/lib/panel/datos/bandeja";

export type ZonaSubirRef = { elegir: () => void };

/**
 * Zona para soltar varios archivos o elegirlos con «Subir archivos». En el teléfono suma «Tomar foto» (abre la cámara)
 * y, cuando ya hay archivos en la cola, se encoge a una fila para que la cola quede a la vista.
 */
export const ZonaSubir = forwardRef<ZonaSubirRef, { alSoltar: (archivos: File[]) => void; compacta: boolean }>(function ZonaSubir({ alSoltar, compacta }, ref) {
  const entrada = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  const telefono = useEsTelefono();
  useImperativeHandle(ref, () => ({ elegir: () => entrada.current?.click() }), []);

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setEncima(false);
    if (e.dataTransfer.files.length) alSoltar(Array.from(e.dataTransfer.files));
  };
  const elegidos = (lista: FileList | null, input: HTMLInputElement) => {
    if (lista?.length) alSoltar(Array.from(lista));
    input.value = "";
  };
  const chica = compacta && telefono;

  return (
    <div
      className="bj-zona"
      data-encima={encima || undefined}
      data-compacta={chica || undefined}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setEncima(true); } }}
      onDragLeave={() => setEncima(false)}
      onDrop={soltar}
    >
      {chica ? null : (
        <>
          <span className="bj-zona-icono" aria-hidden><Icono nombre="descargar" tamano={28} /></span>
          <p style={{ margin: 0, fontWeight: 500 }}>{telefono ? "Sube lo que traes" : "Suelta aquí los archivos"}</p>
          <p className="pn-sub" style={{ margin: 0 }}>PDF y fotos de hasta 20 MB. Después eliges a dónde va cada uno.</p>
        </>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <Boton variante={chica ? "secundario" : "primario"} onClick={() => entrada.current?.click()} aria-keyshortcuts="U">Subir archivos</Boton>
        {telefono ? <Boton variante="secundario" onClick={() => camara.current?.click()}>Tomar foto</Boton> : null}
      </div>
      <input ref={entrada} type="file" multiple accept={TIPOS_BANDEJA.join(",")} hidden onChange={(e) => elegidos(e.target.files, e.target)} />
      <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={(e) => elegidos(e.target.files, e.target)} />
    </div>
  );
});
