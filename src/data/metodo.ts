import type { HomeTextKey } from "@/data/home-copy";
/* Vertical process. Main descriptions are edited through the content panel. */
export type Fase = {
  n: string;
  title: string;
  copy: HomeTextKey;
};

export const FASES: Fase[] = [
  {
    n: "01",
    title: "Captación",
    copy: "captacionTexto",
  },
  {
    n: "02",
    title: "Preparación",
    copy: "preparacionTexto",
  },
  {
    n: "03",
    title: "Comercialización",
    copy: "comercializacionTexto",
  },
  {
    n: "04",
    title: "Cierre",
    copy: "cierreTexto",
  },
];
