import type { SVGProps } from "react";

import { ICONOS_BOCETO, type NombreIconoBoceto } from "./iconos-boceto";
import { ICONOS, type NombreIcono as NombreIconoPdf } from "./iconos-datos";
import { LOGO } from "./logo-datos";

/** Íconos del boceto aprobado y, mientras se rehacen las pantallas viejas, los del sistema anterior. Si un nombre está en los dos, manda el boceto. */
export type NombreIcono = NombreIconoBoceto | NombreIconoPdf;

type Props = Omit<SVGProps<SVGSVGElement>, "name"> & { tamano?: number; titulo?: string };

const esBoceto = (n: NombreIcono): n is NombreIconoBoceto => n in ICONOS_BOCETO;

/** Ícono del panel: trazo de 1.7 en el color del texto, como el boceto. */
export function Icono({ nombre, tamano = 20, titulo, ...rest }: Props & { nombre: NombreIcono }) {
  const boceto = esBoceto(nombre);
  const pdf = boceto ? null : ICONOS[nombre as NombreIconoPdf];
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={boceto ? 1.7 : 1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      {...rest}
    >
      {boceto ? <path d={ICONOS_BOCETO[nombre]} /> : null}
      {pdf ? <path d={pdf.ink} /> : null}
      {pdf?.acc ? <path d={pdf.acc} /> : null}
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
  // Dónde se abre una ventana (SPEC.md, «Las ventanas»): a un lado, al centro o en toda la pantalla.
  ventanaDerecha: "M5 4.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM14.5 4.5v15",
  ventanaIzquierda: "M5 4.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM9.5 4.5v15",
  ventanaCentro: "M5 4.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM8 9h8v6H8z",
  ventanaCompleta: "M5 4.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM3 9h18",
  ampliar: "M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15",
  reducir: "M4.5 9H9V4.5M19.5 9H15V4.5M4.5 15H9v4.5M19.5 15H15v4.5",
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
