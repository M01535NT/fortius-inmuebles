"use client";
import { useId, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/panel/ui/popover";
import { aTexto, diaLargo } from "@/lib/panel/calendario";

import { SelectorFecha } from "./selector-fecha";

const conMayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Campo de fecha del panel (patrón «date picker» de shadcn/ui: botón + ventana flotante + calendario), en lugar del
 * control del navegador. Se ve como cualquier campo (juego único) y dice la fecha con letra: «Jueves 20 de noviembre».
 * `valor` y lo que devuelve `alElegir` son AAAA-MM-DD. Con `vacio`, se puede dejar sin fecha («Quitar la fecha»).
 * Por omisión acepta días pasados, como el control que reemplaza; `soloFuturo` los apaga.
 */
export function CampoFecha({ etiqueta, valor, alElegir, vacio, soloFuturo, minimo, ayuda, autoFocus, sinEtiqueta }: {
  etiqueta: string; valor: string | null; alElegir: (fecha: string | null) => void;
  vacio?: string; soloFuturo?: boolean; minimo?: string; ayuda?: string; autoFocus?: boolean; sinEtiqueta?: boolean;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const hoy = new Date();
  const elegido = valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
  const texto = elegido ? conMayuscula(diaLargo(elegido)) : vacio ?? "Elige un día";
  const elegir = (f: string | null) => { alElegir(f); setAbierto(false); };
  return (
    <div className="pn-campo">
      <label htmlFor={id} className={sinEtiqueta ? "pn-solo-lector" : undefined}>{etiqueta}</label>
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger id={id} className="pn-control pn-control-boton" data-vacio={!elegido || undefined} autoFocus={autoFocus}
          aria-describedby={ayuda ? `${id}-ayuda` : undefined}>
          <span className="pn-control-valor">{texto}</span>
          <Icono nombre="cal" tamano={16} aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="pn-fecha-flota" align="start">
          <SelectorFecha valor={elegido} hoy={hoy} etiqueta={etiqueta} pasados={!soloFuturo} minimo={minimo} sinTitulo alElegir={(f) => elegir(f)} />
          <div className="pn-fecha-pie">
            <button type="button" className="pn-btn pn-btn-fantasma" onClick={() => elegir(aTexto(hoy))}>Hoy</button>
            {vacio !== undefined && elegido ? <button type="button" className="pn-btn pn-btn-fantasma" onClick={() => elegir(null)}>Quitar la fecha</button> : null}
          </div>
        </PopoverContent>
      </Popover>
      {ayuda ? <span id={`${id}-ayuda`} className="pn-campo-ayuda">{ayuda}</span> : null}
    </div>
  );
}
