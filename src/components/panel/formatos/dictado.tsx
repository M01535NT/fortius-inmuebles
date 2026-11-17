"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { constructorDeVoz, crearReconocedor, hayDictado, mensajeDeDictado, textoDictado, type Reconocedor } from "@/lib/panel/datos/formatos-dictado";

const nada = () => () => {};

/**
 * «Dictar» junto a un espacio de texto (PN-06): una frase con la voz y se suma a lo escrito.
 * Usa el reconocimiento del navegador; donde no existe, no se muestra. Tocarlo otra vez deja de escuchar.
 */
export function Dictar({ etiqueta, alDictar, alFallar }: { etiqueta: string; alDictar: (texto: string) => void; alFallar: (mensaje: string) => void }) {
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Boton variante="texto" aria-pressed={escuchando} aria-label={escuchando ? `Dejar de dictar ${etiqueta}` : `Dictar ${etiqueta}`} onClick={() => void alternar()}>
        {escuchando ? "Escuchando… Parar" : "Dictar"}
      </Boton>
      <span className="sr-only" aria-live="polite">{escuchando ? "Escuchando. Habla ahora." : ""}</span>
    </span>
  );
}
