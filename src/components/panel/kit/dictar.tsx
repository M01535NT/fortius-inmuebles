"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Icono } from "@/components/panel/icons";
import { constructorDeVoz, crearReconocedor, hayDictado, mensajeDeDictado, textoDictado, type Reconocedor } from "@/lib/panel/datos/formatos-dictado";

const nada = () => () => {};

/**
 * Botón de micrófono para dictar en lugar de escribir (SPEC.md, sección 15): una frase con la voz y se suma a lo escrito.
 * Usa el reconocimiento de voz del navegador; donde no existe, no se muestra. Tocarlo otra vez deja de escuchar.
 */
export function BotonDictar({ que, alDictar, alFallar, className = "as-btn as-gho as-ico" }: {
  /** Qué se dicta, para quien usa lector de pantalla («la nota», «la búsqueda»). */
  que: string;
  alDictar: (texto: string) => void; alFallar: (mensaje: string) => void; className?: string;
}) {
  const disponible = useSyncExternalStore(nada, hayDictado, () => false);
  const [escuchando, setEscuchando] = useState(false);
  const rec = useRef<Reconocedor | null>(null);
  const llamadas = useRef({ alDictar, alFallar });
  useEffect(() => { llamadas.current = { alDictar, alFallar }; }, [alDictar, alFallar]);
  useEffect(() => () => { rec.current?.abort(); rec.current = null; }, []);
  if (!disponible) return null;

  const alternar = async () => {
    if (rec.current) { rec.current.stop(); return; }
    const Ctor = constructorDeVoz();
    if (!Ctor) return;
    const r = await crearReconocedor(Ctor);
    r.onresult = (e) => { const t = textoDictado(e); if (t) llamadas.current.alDictar(t); };
    r.onerror = (e) => { const m = mensajeDeDictado(e.error); if (m) llamadas.current.alFallar(m); };
    r.onend = () => { if (rec.current === r) rec.current = null; setEscuchando(false); };
    rec.current = r;
    try { r.start(); setEscuchando(true); }
    catch { rec.current = null; setEscuchando(false); llamadas.current.alFallar("No se pudo dictar. Escríbelo a mano o vuelve a intentarlo."); }
  };
  return (
    <>
      <button type="button" className={className} data-dictando={escuchando || undefined} aria-pressed={escuchando}
        aria-label={escuchando ? `Dejar de dictar ${que}` : `Dictar ${que}`} title={escuchando ? "Escuchando… toca para parar" : "Dictar"}
        onMouseDown={(e) => e.preventDefault()} onClick={() => void alternar()}>
        <Icono nombre="mic" tamano={17} />
      </button>
      <span className="pn-solo-lector" aria-live="polite">{escuchando ? "Escuchando. Habla ahora." : ""}</span>
    </>
  );
}

/** Suma lo dictado a lo escrito, con un espacio en medio. */
export const sumarDictado = (antes: string, dicho: string) => (antes.trim() ? `${antes.replace(/\s+$/, "")} ${dicho}` : dicho);
