import type { SVGProps } from "react";

import { ICONOS, type NombreIcono } from "./iconos-datos";
import { LOGO } from "./logo-datos";

export type { NombreIcono };

type Props = Omit<SVGProps<SVGSVGElement>, "name"> & { tamano?: number; titulo?: string };

/** Ícono del sistema de diseño: trazo fino en el color del texto y un toque de acento. */
export function Icono({ nombre, tamano = 20, titulo, ...rest }: Props & { nombre: NombreIcono }) {
  const ic = ICONOS[nombre];
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      {...rest}
    >
      <path d={ic.ink} />
      {ic.acc ? <path d={ic.acc} style={{ stroke: "var(--accent)" }} /> : null}
    </svg>
  );
}

/** Gestos de interfaz que el sistema no trae como ícono: mismo trazo, un poco más firme a tamaño chico. */
const GESTOS = {
  mas: "M12 5v14M5 12h14",
  cerrar: "M18 6 6 18M6 6l12 12",
  izquierda: "m15 18-6-6 6-6",
  derecha: "m9 18 6-6-6-6",
  abajo: "m6 9 6 6 6-6",
  palomita: "m5 13 4 4L19 7",
  puntos: "M5 12h.01M12 12h.01M19 12h.01",
  agarre: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  panel: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18",
} as const;
export type NombreGesto = keyof typeof GESTOS;

export function Gesto({ nombre, tamano = 18, ...rest }: Props & { nombre: NombreGesto }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={nombre === "agarre" || nombre === "puntos" ? 2.4 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={GESTOS[nombre]} />
    </svg>
  );
}

/** Logotipo completo; con `solo="o"` solo la O de dos cortes (menú contraído). Las letras toman el color del texto. */
export function Logo({ alto = 18, solo, ...rest }: Omit<SVGProps<SVGSVGElement>, "height"> & { alto?: number; solo?: "o" }) {
  return (
    <svg
      viewBox={solo === "o" ? LOGO.cajaO : LOGO.caja}
      height={alto}
      role="img"
      aria-label="Fortius"
      style={{ display: "block", flex: "none" }}
      {...rest}
    >
      {solo === "o" ? null : (
        <g fill="var(--ink)">
          {LOGO.letras.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
      <path d={LOGO.azul} fill="#1B3FA6" />
      <path d={LOGO.ambar} fill="#E0A030" />
    </svg>
  );
}
