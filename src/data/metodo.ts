import type { HomeTextKey } from "@/data/home-copy";
/* Vertical process. Main descriptions are edited through the content panel. */
type Fase = {
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
    title: "Verificación y precio",
    copy: "diagnosticoTexto",
  },
  {
    n: "03",
    title: "Contrato y preparación",
    copy: "preparacionTexto",
  },
  {
    n: "04",
    title: "Publicación y seguimiento",
    copy: "comercializacionTexto",
  },
  {
    n: "05",
    title: "Visitas y ofertas",
    copy: "visitasOfertasTexto",
  },
  {
    n: "06",
    title: "Cierre y entrega",
    copy: "cierreTexto",
  },
];
