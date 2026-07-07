/*
  Modo de motion del sitio. Pivote de UNA constante:

  - "espectacular": Método horizontal pinned en desktop, hero con kinetic
    reveal + parallax, relato con TextReveal al scroll.
  - "equilibrado": Método vertical siempre, hero con entrada simple,
    relato con BlurFade. Mantiene spotlight/beam/ticker (micro-motion).

  Mobile y prefers-reduced-motion SIEMPRE reciben la variante tranquila,
  sin importar el modo. Ver DesignDirection.md § Modos de motion.
*/
export const MOTION_MODE: "espectacular" | "equilibrado" = "espectacular";

export const ESPECTACULAR = MOTION_MODE === "espectacular";
