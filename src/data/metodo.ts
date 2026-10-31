import type { HomeTextKey } from "@/data/home-copy";
/*
  Método de venta en cinco etapas (31/10/2026), las mismas del panel para la ruta
  «Propietario venta» (src/lib/formatos/operation-workflow.ts). Cada etapa lista los
  formatos que recibe el propietario, con su nombre público; el número de formato va
  en el comentario para no perder la correspondencia. Los textos se editan desde el
  panel; títulos, documentos e imágenes viven aquí.
*/
type Doc = { name: string; note: string };
type Fase = {
  n: string;
  title: string;
  copy: HomeTextKey;
  docs: Doc[];
  src: string;
  alt: string;
};

export const FASES: Fase[] = [
  {
    n: "01", title: "Conocemos tu caso", copy: "captacionTexto",
    docs: [
      { name: "Entrevista inicial", note: "Qué buscas, plazos y quién firma." }, // 02
      { name: "Aviso de privacidad", note: "Cómo cuidamos tus datos." }, // 01
    ],
    src: "/hero/etapa-01-revisamos.webp", alt: "Escritura y pluma sobre un escritorio",
  },
  {
    n: "02", title: "Revisamos papeles y precio", copy: "diagnosticoTexto",
    docs: [
      { name: "Levantamiento del inmueble", note: "Medidas, estado y fotos." }, // 04
      { name: "Opinión jurídica", note: "Escritura, adeudos y lo que falta." }, // 05 y 06
      { name: "Opinión de valor", note: "Precio propuesto y comparables." }, // 07
      { name: "Estimación de lo que recibes", note: "Lo que te queda tras gastos e impuestos." }, // 08
      { name: "Contrato de intermediación", note: "Alcance, honorarios y plazo." }, // 09
    ],
    src: "/hero/etapa-02-precio.webp", alt: "Cinta métrica sobre un plano",
  },
  {
    n: "03", title: "La publicamos", copy: "comercializacionTexto",
    docs: [
      { name: "Plan de comercialización", note: "Canales, fechas y precio de salida." }, // 10
      { name: "Reporte de comercialización", note: "Consultas y avance, cada mes." }, // 11
    ],
    src: "/hero/etapa-03-telefono.webp", alt: "Teléfono en un trípode frente a la fachada de una casa",
  },
  {
    n: "04", title: "Visitas y ofertas", copy: "ofertasTexto",
    docs: [
      { name: "Registro de visitas", note: "Quién vino y qué opinó." }, // 13
      { name: "Propuesta de compra", note: "La oferta por escrito y tu respuesta." }, // 14
    ],
    src: "/hero/interior-depa.webp", alt: "Sala de un departamento lista para una visita",
  },
  {
    n: "05", title: "Firma y entrega", copy: "cierreTexto",
    docs: [
      { name: "Promesa de compraventa", note: "Precio, fechas y condiciones firmadas." }, // 15
      { name: "Acta de entrega", note: "Accesos, servicios, documentos y pendientes." }, // 16
      { name: "Cierre del expediente", note: "Cómo terminó la operación y qué queda pendiente." }, // 17
    ],
    src: "/hero/etapa-04-cerramos.webp", alt: "Llaves sobre un contrato firmado",
  },
];
