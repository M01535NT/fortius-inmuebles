import { answerLabel, interviewFields, interviewIssues, isOwnerIntent, type IntakeIntent, type InterviewAnswers } from "@/lib/intake/interview";

/*
  Asistente de Nueva operación (encargo del panel guiado, sección 4; lienzo:
  NuevaEscritorio* y NuevaMovil*). Cuatro pasos: qué quiere hacer el cliente,
  quién es, la entrevista (una sección por pantalla, con «No sabe») y listo.
  Las preguntas y sus reglas siguen siendo las de interview.ts.
*/

export const WIZARD_STEPS = ["Qué quiere hacer", "Quién es", "Entrevista", "Listo"] as const;

export const INTENT_CHOICES: Array<{ id: IntakeIntent; title: string; description: string }> = [
  { id: "vender", title: "Vender su inmueble", description: "Casa, departamento, terreno o local que quiere vender." },
  { id: "arrendar", title: "Ofrecer su inmueble en renta", description: "Busca inquilino para su propiedad." },
  { id: "comprar", title: "Comprar", description: "Busca un inmueble para comprar." },
  { id: "rentar", title: "Rentar", description: "Busca dónde vivir o trabajar en renta." },
  { id: "invertir", title: "Invertir", description: "Quiere comprar para rentar o revender." },
];
export const intentTitle = (intent: IntakeIntent) => INTENT_CHOICES.find(choice => choice.id === intent)?.title ?? intent;

export type Screen = { title: string; sections: string[] };
/** Pantallas de la entrevista: cada una agrupa secciones afines de interview.ts. */
export function interviewScreens(intent: IntakeIntent): Screen[] {
  if (isOwnerIntent(intent)) return [
    { title: "El propietario", sections: ["Objetivo", "Situación personal"] },
    { title: "El inmueble", sections: ["Inmueble"] },
    { title: "Lo que quiere", sections: ["Importe declarado", "Acuerdos"] },
    { title: "Documentos y lo que sigue", sections: ["Documentos y condiciones", "Siguiente paso"] },
  ];
  return [
    { title: "Qué busca", sections: ["Objetivo", "Inmueble"] },
    { title: "Lo que necesita", sections: intent === "invertir" ? ["Necesidades", "Inversión"] : ["Necesidades"] },
    { title: intent === "invertir" ? "Capital y acuerdos" : "Presupuesto y acuerdos", sections: ["Importe declarado", "Acuerdos"] },
    { title: "Lo que sigue", sections: ["Siguiente paso"] },
  ];
}

/** Preguntas visibles con las respuestas actuales: importe, cónyuge y detalle solo cuando aplican. */
export function visibleFields(intent: IntakeIntent, answers: InterviewAnswers) {
  return interviewFields(intent).filter(f =>
    (!["importe", "moneda"].includes(f.key) || answers.presupuestoEstado === "conocido")
    && (f.key !== "detalleAlertas" || answers.alertas === "declaradas")
    && (!["conyuge", "regimen", "fechaMatrimonio", "lugarMatrimonio"].includes(f.key) || answers.estadoCivil === "casado"));
}
export function screenFields(intent: IntakeIntent, answers: InterviewAnswers, screen: Screen) {
  return visibleFields(intent, answers).filter(f => screen.sections.includes(f.section));
}
/** Lo que falta en una pantalla para seguir con la siguiente. */
export function screenIssues(intent: IntakeIntent, answers: InterviewAnswers, screen: Screen) {
  const keys = new Set(screenFields(intent, answers, screen).map(f => f.key));
  return interviewIssues(intent, answers).filter(issue => keys.has(issue.key));
}
/** La primera pantalla con algo pendiente: así una entrevista retomada abre donde se quedó. */
export function firstOpenScreen(intent: IntakeIntent, answers: InterviewAnswers) {
  const screens = interviewScreens(intent);
  const index = screens.findIndex(screen => screenIssues(intent, answers, screen).length > 0);
  return index < 0 ? screens.length - 1 : index;
}

export const DONT_KNOW = "No sabe";
type Field = ReturnType<typeof interviewFields>[number];
/**
  Valor de «No sabe» para una pregunta: la opción «por aclarar/por definir» si existe,
  el texto «No sabe» en preguntas abiertas, o nada donde la respuesta es obligatoria
  de verdad (fechas, importes, aviso de privacidad, siguiente paso y el tipo de
  inmueble del propietario, que se necesita para registrarlo).
*/
export function dontKnowValue(intent: IntakeIntent, field: Field): string | null {
  if (field.options) {
    if (field.key === "tipoInmueble" && isOwnerIntent(intent)) return null;
    return field.options.find(option => option === "por_aclarar" || option === "por_definir") ?? null;
  }
  if (field.type === "date" || field.type === "number" || field.section === "Siguiente paso") return null;
  return DONT_KNOW;
}
const LABELS: Record<string, string> = { por_aclarar: DONT_KNOW, por_definir: DONT_KNOW, conocido: "Ya tiene una cifra", "nave-industrial": "Nave industrial", presentado: "Ya se lo presenté", pendiente: "Todavía no" };
export function optionLabel(field: Field, value: string) {
  if (field.key === "privacidad") return LABELS[value];
  return LABELS[value] ?? answerLabel(value);
}
