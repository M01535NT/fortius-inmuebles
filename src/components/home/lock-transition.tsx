import * as React from "react";

/*
  Candado de la transición entre páginas (31/10/2026, tercera versión): minimalista, de un solo
  color y con relleno (--lock-ink: azul de marca en claro, crema en oscuro; ver .page-curtain en
  globals.css). La cerradura está en la base: la llave sube y entra por debajo (va detrás del
  cuerpo, así que lo que entra se oculta), gira un cuarto de vuelta sobre su eje (se ve de canto)
  y el arco salta y gira sobre su pata larga. Un contorno del color del fondo separa la llave del
  cuerpo. PublicExperience anima las piezas por sus clases; el eje de la llave es x = 100 y la
  pata larga del arco, x = 142.
*/
const INK = { fill: "var(--lock-ink)" };
const CUT = { fill: "var(--background)" };
const OUTLINE = { stroke: "var(--background)", strokeWidth: 3, paintOrder: "stroke" } as const;

export function LockTransition() {
  return (
    <svg viewBox="0 0 200 320" className="lock-svg" aria-hidden="true" focusable="false">
      <g className="lock-shackle">
        <path d="M58 128 V80 a42 42 0 0 1 84 0 V160" style={{ fill: "none", stroke: "var(--lock-ink)", strokeWidth: 18 }} />
      </g>
      <g className="lock-key">
        <path d="M94 150 h12 v80 h-12 z M106 164 l6 5 -6 5 6 6 -6 5 6 6 -6 5 z" style={{ ...INK, ...OUTLINE }} />
        <path d="M100 236 c-17 0 -28 11 -28 26 c0 15 11 26 28 26 c17 0 28 -11 28 -26 c0 -15 -11 -26 -28 -26 z M88 228 h24 v10 h-24 z"
          style={{ ...INK, ...OUTLINE }} />
        <circle cx="100" cy="266" r="7" style={CUT} />
      </g>
      <rect x="34" y="112" width="132" height="124" rx="22" style={INK} />
    </svg>
  );
}
