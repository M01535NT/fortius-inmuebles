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
  { id: "inventario", q: "¿Dónde consulto las propiedades?", a: "En el inventario: fotos, características y disponibilidad.", link: { href: "/inventario", label: "Explorar propiedades" } },
  { id: "visita", q: "¿Cómo solicito información o una visita?", a: "Desde la ficha del inmueble, con su botón de contacto." },
];

/* Preguntas base de la página completa; el equipo agrega más desde el panel. */
const BUYER_EXTRA: Pregunta[] = [
  { id: "documentos", q: "¿Qué documentos debo pedir antes de comprar?", a: "Escritura, libertad de gravamen, predial, agua y luz al corriente, e identificación de quien vende. Revísalos antes de apartar.", link: { href: "/comprar-propiedad#documentos", label: "Ver qué revisar" } },
  { id: "gastos", q: "¿Qué gastos se suman al precio de compra?", a: "ISAI, notaría, registro, avalúo y, con crédito, los gastos del banco. La notaría confirma los importes.", link: { href: "/herramientas/gastos-de-cierre", label: "Estimar gastos de cierre" } },
  { id: "credito", q: "¿Puedo comprar con crédito?", a: "Sí: bancario, Infonavit o Fovissste, sujeto a aprobación. La institución confirma las condiciones.", link: { href: "/herramientas/hipoteca", label: "Calcular mi mensualidad" } },
];

const GENERAL_QUESTIONS: Pregunta[] = [
  { id: "contacto", q: "¿Cómo puedo contactarlos?", a: "En la página de contacto, por el canal que prefieras.", link: { href: "/contacto", label: "Ir a contacto" } },
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
