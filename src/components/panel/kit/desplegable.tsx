"use client";
import { useId, useState } from "react";

import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { sumarDias } from "@/lib/panel/datos/agenda";

import { Seleccion } from "../ui/select";
import { Interruptor } from "./segmentado";
import { SelectorFecha } from "./selector-fecha";

/**
 * Elegir una opción entre varias en una sola línea (regla del titular, 16/11/2026: nada de filas de botones).
 * Con 2 opciones se vuelve interruptor; con 3 o más, la lista flotante del panel (`Seleccion`), con teclado y lector de pantalla. 44 px de alto.
 * Con `vacio`, la primera opción deja el campo sin elegir y devuelve "".
 */
export function Desplegable<T extends string>({ etiqueta, valor, opciones, alElegir, vacio, ayuda }: {
  etiqueta: string; valor: T | ""; opciones: readonly { valor: T; etiqueta: string }[];
  alElegir: (v: T | "") => void; vacio?: string; ayuda?: string;
}) {
  const id = useId();
  // Dos opciones sin «vacío»: interruptor (regla del titular, 16/11/2026).
  if (opciones.length === 2 && vacio === undefined && valor !== "") {
    return <Interruptor etiqueta={etiqueta} opciones={[opciones[0], opciones[1]]} valor={valor} alElegir={alElegir} />;
  }
  return (
    <div className="pn-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <Seleccion id={id} valor={valor} opciones={opciones} alElegir={(v) => alElegir(v as T | "")} vacio={vacio} describedBy={ayuda ? `${id}-ayuda` : undefined} />
      {ayuda ? <span id={`${id}-ayuda`} className="pn-campo-ayuda">{ayuda}</span> : null}
    </div>
  );
}

const ATAJOS = [{ dias: 1, etiqueta: "Mañana" }, { dias: 3, etiqueta: "En 3 días" }, { dias: 7, etiqueta: "En una semana" }] as const;

/** «Cuándo» en un desplegable: Sin fecha, Mañana, En 3 días, En una semana u Otra fecha (abre el calendario). */
export function DesplegableFecha({ etiqueta = "Cuándo", valor, alElegir, hoy, sinFecha = "Sin fecha", etiquetaCalendario }: {
  etiqueta?: string; valor: string | null; alElegir: (fecha: string | null) => void; hoy: Date; sinFecha?: string | null; etiquetaCalendario?: string;
}) {
  const atajos = ATAJOS.map((a) => ({ ...a, fecha: aTexto(sumarDias(hoy, a.dias)) }));
  const [otra, setOtra] = useState(() => valor !== null && !atajos.some((a) => a.fecha === valor));
  const elegido = otra ? "otra" : valor ? String(atajos.find((a) => a.fecha === valor)?.dias ?? "otra") : "";
  const opciones = [
    ...atajos.map((a) => ({ valor: String(a.dias), etiqueta: `${a.etiqueta} (${diaLargo(a.fecha)})` })),
    { valor: "otra", etiqueta: otra && valor ? `Otra fecha: ${diaLargo(valor)}` : "Otra fecha…" },
  ];
  return (
    <>
      <Desplegable
        etiqueta={etiqueta}
        valor={elegido}
        opciones={opciones}
        vacio={sinFecha ?? undefined}
        alElegir={(v) => {
          if (v === "otra") { setOtra(true); return; }
          setOtra(false);
          alElegir(v ? atajos.find((a) => String(a.dias) === v)?.fecha ?? null : null);
        }}
      />
      {otra ? <SelectorFecha valor={valor} alElegir={alElegir} hoy={hoy} etiqueta={etiquetaCalendario ?? etiqueta} /> : null}
    </>
  );
}
