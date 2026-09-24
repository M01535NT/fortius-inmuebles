/*
  Modo de motion del sitio. Pivote de UNA constante:

  - "espectacular": hero con kinetic reveal por líneas + parallax + CTA
    magnético; relato con TextReveal (palabras que se iluminan al scroll).
  - "equilibrado": hero con entrada simple; relato con BlurFade.

  Constantes en ambos modos: KineticTitle en títulos de sección, tilt 3D +
  spotlight en entregables, parallax interno en segmentos, banda de zonas
  doble outline, BorderBeam único en el formulario, NumberTicker en
  calculadoras, compromisos con líneas que crecen.

  Nota (7-jul-2026): el Método horizontal pinned se probó como pieza
  "espectacular" y SE DESCARTÓ por feedback; el Método es siempre vertical.

  Mobile conserva la coreografía con recorridos ajustados; prefers-reduced-motion
  recibe una variante estática,
  sin importar el modo. Los perfiles se adaptan al cambiar el viewport.
*/
export const MOTION_MODE: "espectacular" | "equilibrado" = "espectacular";

export const ESPECTACULAR = MOTION_MODE === "espectacular";
