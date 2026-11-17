"use client";
import { useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import type { Asunto } from "@/lib/panel/asuntos/api";
import {
  copiarInmueble, estadosPara, guardarInmueble, leerInmueble, NOMBRE_ESTADO, NOMBRE_TIPO, nuevoInmueble, precioTexto, publicarVarios,
  type EstadoInmueble, type TipoInmueble,
} from "@/lib/panel/inmuebles/api";

import { Pildora } from "../asunto/pildora";
import { FichaInmueble } from "./ficha";

/**
 * El apartado Inmueble del asunto. Con uno, abre su ficha. Con varios (los cinco locales de la plaza), la lista
 * con el estado de cada uno, «Agregar otro igual» y «Publicar todos»; cada renglón abre su ficha.
 */
export function InmueblesDelAsunto({ a, recargar, nombreDe }: { a: Asunto; recargar: () => void; nombreDe?: (uid: string | null) => string }) {
  const { avisar } = useAvisos();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const solo = a.inmuebles.length === 1 ? a.inmuebles[0].id : null;
  const ver = abierto ?? solo;

  const hacer = async (accion: () => Promise<unknown>, aviso: string) => {
    setOcupado(true);
    try { await accion(); avisar(aviso); recargar(); } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); } finally { setOcupado(false); }
  };

  if (!a.inmuebles.length) {
    return (
      <div className="as-vacio">
        <Icono nombre="edif" tamano={26} /><b>Sin inmueble</b>
        <span className="as-m">Agrega el inmueble de este asunto para cargar su ficha, fotos y publicarlo.</span>
        <button type="button" className="as-btn as-pri" aria-disabled={ocupado}
          onClick={() => { if (!ocupado) void hacer(() => nuevoInmueble({ nombre: a.nombre, asunto_id: a.id }), "Inmueble agregado"); }}>
          <Icono nombre="mas" tamano={16} />Agregar inmueble
        </button>
      </div>
    );
  }

  if (ver) {
    return (
      <div className="as-form">
        {!solo ? (
          <button type="button" className="as-btn as-gho as-atras" onClick={() => setAbierto(null)}>
            <Icono nombre="at" tamano={16} />Los {a.inmuebles.length} inmuebles
          </button>
        ) : null}
        <FichaInmueble key={ver} id={ver} alCambiar={recargar} nombreDe={nombreDe} />
      </div>
    );
  }

  const base = a.inmuebles[a.inmuebles.length - 1];
  const sinPublicar = a.inmuebles.filter((i) => !i.publicado);
  return (
    <div className="as-form">
      <div className="as-card">
        {a.inmuebles.map((i) => (
          <div key={i.id} className="as-ren">
            <button type="button" className="as-ren-c in-abrir-c" onClick={() => setAbierto(i.id)}>
              <b>{i.nombre}</b>
              <span>{[i.tipo ? NOMBRE_TIPO[i.tipo as TipoInmueble] : null, precioTexto(i.precio, i.moneda, i.operacion), i.publicado ? "publicado" : null].filter(Boolean).join(" · ")}</span>
            </button>
            <Pildora etiqueta={`Estado de ${i.nombre}`} valor={i.estado as EstadoInmueble}
              opciones={estadosPara(i.operacion).map((e) => ({ valor: e, etiqueta: NOMBRE_ESTADO[e] }))}
              alElegir={(e) => void hacer(async () => { const x = await leerInmueble(i.id); await guardarInmueble(i.id, x.version, { estado: e }); }, `${i.nombre}: ${NOMBRE_ESTADO[e].toLowerCase()}`)} />
            <button type="button" className="as-btn as-gho as-ico" aria-label={`Abrir ${i.nombre}`} onClick={() => setAbierto(i.id)}><Icono nombre="ch" tamano={16} /></button>
          </div>
        ))}
      </div>
      <div className="as-fila">
        <button type="button" className="as-btn" aria-disabled={ocupado}
          onClick={() => { if (!ocupado) void hacer(() => copiarInmueble(base.id, a.id, siguienteNombre(base.nombre, a.inmuebles.length + 1)), "Agregado. Ponle su precio"); }}>
          <Icono nombre="copia" tamano={16} />Agregar otro igual
        </button>
        {sinPublicar.length ? (
          <button type="button" className="as-btn" aria-disabled={ocupado}
            onClick={() => { if (!ocupado) void hacer(() => publicarVarios(sinPublicar.map((i) => i.id), true), `${sinPublicar.length} publicados`); }}>
            <Icono nombre="globo" tamano={16} />Publicar {sinPublicar.length === a.inmuebles.length ? "todos" : `los ${sinPublicar.length} que faltan`}
          </button>
        ) : (
          <button type="button" className="as-btn" aria-disabled={ocupado}
            onClick={() => { if (!ocupado) void hacer(() => publicarVarios(a.inmuebles.map((i) => i.id), false), "Retirados del sitio"); }}>
            <Icono nombre="x" tamano={16} />Retirar todos del sitio
          </button>
        )}
      </div>
    </div>
  );
}

/** «Local 3» → «Local 4»; si no termina en número, «… (otro)». */
function siguienteNombre(nombre: string, n: number): string {
  const m = nombre.match(/^(.*?)(\d+)\s*$/);
  return m ? `${m[1]}${n}` : `${nombre} (otro)`;
}
