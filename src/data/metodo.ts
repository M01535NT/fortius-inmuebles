import type { HomeTextKey } from "@/data/home-copy";
/* Vertical process. Main descriptions are edited through the content panel. */
export type Fase = {
  n: string;
  title: string;
  copy: HomeTextKey;
  image?: { src: string; alt: string };
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
    image: { src: "/hero/interior-depa.webp", alt: "Interior preparado para fotografía profesional" },
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
    image: { src: "/hero/casa-playa.webp", alt: "Residencia lista para entrega" },
  },
];
