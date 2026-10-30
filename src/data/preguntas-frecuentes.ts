import { homeText, type HomeTextKey } from "@/data/home-copy";
import type { PreguntaFrecuente, SiteContent } from "@/lib/domain/records";

export type GrupoPregunta = PreguntaFrecuente["grupo"];
export type AnswerLink = { href: string; label: string };
export type Pregunta = { id: string; q: string; a: string; link?: AnswerLink };

export const GRUPOS_PREGUNTAS: { key: GrupoPregunta; title: string }[] = [
  { key: "vender", title: "Para vender" },
  { key: "comprar", title: "Para comprar" },
  { key: "general", title: "En general" },
];

/* Las respuestas para vender salen de los textos editables del panel. */
const OWNER_QUESTIONS: { q: string; copy: HomeTextKey; link?: AnswerLink }[] = [
  { q: "¿Qué necesito para empezar?", copy: "inicioRespuesta" },
  { q: "¿Cómo definen el precio de salida?", copy: "precioRespuesta", link: { href: "/opinion-de-valor", label: "Conocer la opinión de valor" } },
  { q: "¿Qué gastos debo considerar al vender?", copy: "gastosRespuesta", link: { href: "/herramientas/gastos-de-cierre", label: "Estimar gastos de cierre" } },
  { q: "¿Cuánto tarda en venderse una propiedad?", copy: "tiempoRespuesta" },
];

export const BUYER_QUESTIONS: Pregunta[] = [
  { id: "inventario", q: "¿Dónde consulto las propiedades?", a: "En el inventario puedes explorar las fichas, revisar fotografías y características y consultar la disponibilidad.", link: { href: "/inventario", label: "Explorar propiedades" } },
  { id: "visita", q: "¿Cómo solicito información o una visita?", a: "Abre la ficha del inmueble y utiliza su opción de contacto para consultar esa propiedad y coordinar una visita." },
];

/* Preguntas base de la página completa; el equipo agrega más desde el panel. */
const BUYER_EXTRA: Pregunta[] = [
  { id: "documentos", q: "¿Qué documentos debo pedir antes de comprar?", a: "Escritura, certificado de libertad de gravamen, recibos de predial, agua y luz al corriente, y la identificación de quien vende. Conviene revisarlos antes de apartar o firmar.", link: { href: "/comprar-propiedad#documentos", label: "Ver qué revisar" } },
  { id: "gastos", q: "¿Qué gastos se suman al precio de compra?", a: "Además del precio, considera el impuesto de adquisición (ISAI), honorarios notariales, derechos de registro, avalúo y, si hay crédito, los gastos de la institución financiera. Los importes se confirman con la notaría.", link: { href: "/herramientas/gastos-de-cierre", label: "Estimar gastos de cierre" } },
  { id: "credito", q: "¿Puedo comprar con crédito?", a: "Sí, con crédito bancario o de instituciones como Infonavit o Fovissste, sujeto a su aprobación. Puedes estimar la mensualidad como referencia; las condiciones las confirma la institución.", link: { href: "/herramientas/hipoteca", label: "Calcular mi mensualidad" } },
];

const GENERAL_QUESTIONS: Pregunta[] = [
  { id: "contacto", q: "¿Cómo puedo contactarlos?", a: "Desde la página de contacto puedes elegir el canal que prefieras y contarnos si quieres comprar, vender o preguntar por un inmueble.", link: { href: "/contacto", label: "Ir a contacto" } },
];

export function preguntasPorGrupo(content?: SiteContent | null): { key: GrupoPregunta; title: string; questions: Pregunta[] }[] {
  const base: Record<GrupoPregunta, Pregunta[]> = {
    vender: OWNER_QUESTIONS.map((item) => ({ id: item.copy, q: item.q, a: homeText(content, item.copy), link: item.link })),
    comprar: [...BUYER_QUESTIONS, ...BUYER_EXTRA],
    general: GENERAL_QUESTIONS,
  };
  return GRUPOS_PREGUNTAS.map((group) => ({
    ...group,
    questions: [
      ...base[group.key],
      ...(content?.preguntas ?? []).filter((item) => item.grupo === group.key).map((item) => ({ id: `extra-${item.id}`, q: item.pregunta, a: item.respuesta })),
    ],
  })).filter((group) => group.questions.length);
}
