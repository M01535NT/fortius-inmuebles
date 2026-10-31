import type { HomeTextKey } from "@/data/home-copy";
/*
  Método de venta en cuatro etapas (30/10/2026). Cada etapa dice qué documento recibe
  el propietario y lleva una imagen. Los textos se editan desde el panel; títulos,
  documentos e imágenes viven aquí.
*/
type Fase = {
  n: string;
  title: string;
  copy: HomeTextKey;
  doc: string;
  src: string;
  alt: string;
};

export const FASES: Fase[] = [
  { n: "01", title: "Revisamos tu propiedad", copy: "captacionTexto", doc: "Análisis de factibilidad", src: "/hero/etapa-01-revisamos.webp", alt: "Escritura y pluma sobre un escritorio" },
  { n: "02", title: "Fijamos el precio con datos", copy: "diagnosticoTexto", doc: "Opinión de valor", src: "/hero/etapa-02-precio.webp", alt: "Cinta métrica sobre un plano" },
  { n: "03", title: "La publicamos y la mostramos", copy: "comercializacionTexto", doc: "Plan de comercialización y reportes", src: "/hero/etapa-03-telefono.webp", alt: "Teléfono en un trípode frente a la fachada de una casa" },
  { n: "04", title: "Cerramos contigo", copy: "cierreTexto", doc: "Estimación de gastos y cierre", src: "/hero/etapa-04-cerramos.webp", alt: "Llaves sobre un contrato firmado" },
];
