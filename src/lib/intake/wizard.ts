import { answerLabel, interviewFields, interviewIssues, isOwnerIntent, type IntakeIntent, type InterviewAnswers } from "@/lib/intake/interview";

/*
  Asistente de Nueva operación (encargo del panel guiado, sección 4; lienzo:
  NuevaEscritorio* y NuevaMovil*). Cuatro pasos: qué quiere hacer el cliente,
  quién es, la entrevista (una sección por pantalla, con «No sabe») y listo.
  Las preguntas y sus reglas siguen siendo las de interview.ts.
*/

export const WIZARD_STEPS = ["Qué quiere hacer", "Quién es", "Entrevista", "Listo"] as const;
/** Pasos del asistente: con el propietario, el paso 3 es la ficha rápida del prospecto (la entrevista inicial va en su etapa). */
export function wizardSteps(intent?: IntakeIntent | null): readonly string[] {
  return intent && isOwnerIntent(intent) ? ["Qué quiere hacer", "Quién es", "Datos del prospecto", "Listo"] : WIZARD_STEPS;
}

export const INTENT_CHOICES: Array<{ id: IntakeIntent; title: string; description: string }> = [
  { id: "vender", title: "Vender su inmueble", description: "Casa, departamento, terreno o local que quiere vender." },
  { id: "arrendar", title: "Ofrecer su inmueble en renta", description: "Busca inquilino para su propiedad." },
  { id: "comprar", title: "Comprar", description: "Busca un inmueble para comprar." },
  { id: "rentar", title: "Rentar", description: "Busca dónde vivir o trabajar en renta." },
  { id: "invertir", title: "Invertir", description: "Quiere comprar para rentar o revender." },
];
export const intentTitle = (intent: IntakeIntent) => INTENT_CHOICES.find(choice => choice.id === intent)?.title ?? intent;

export type Screen = { title: string; sections: string[]; keys?: string[] };
export const PROSPECT_SCREEN = "Datos del prospecto";
/*
  Prospecto del propietario (decisión del titular, 16/10/2026): por llamada o mensaje
  basta con saber quién es, qué quiere, dónde está el inmueble y cuándo nos vemos.
  Lo demás (situación personal, documentos, ocupación) se pregunta en la entrevista
  inicial (formato 02), en su propia etapa.
*/
const PROSPECT_KEYS = ["ubicacion", "zona", "tipoInmueble", "objetivo", "plazo", "presupuestoEstado", "importe", "moneda", "condiciones", "privacidad", "siguienteAccion", "siguienteFecha"];
const PROSPECT_LABELS: Record<string, { label: string; hint?: string }> = {
  ubicacion: { label: "Domicilio del inmueble", hint: "Calle, número y colonia, como lo dio. Se confirma en la entrevista inicial." },
  zona: { label: "Municipio y colonia o fraccionamiento" },
  objetivo: { label: "¿Qué quiere hacer y por qué?" },
  plazo: { label: "¿Para cuándo lo necesita?" },
  presupuestoEstado: { label: "¿Mencionó un precio?" },
  importe: { label: "Precio que mencionó" },
  condiciones: { label: "Notas del primer contacto", hint: "Lo que contó, fotos que mandó, quién lo recomendó…" },
  privacidad: { label: "Aviso de privacidad", hint: "Compártele el enlace del aviso antes de guardar sus datos. El formato 01 se le entrega en la entrevista inicial." },
  siguienteAccion: { label: "Lo que sigue" },
  siguienteFecha: { label: "¿Cuándo es la entrevista inicial?" },
};
/** Respuestas que el prospecto deja «por aclarar»: se preguntan en la entrevista inicial (02). */
const PROSPECT_DEFAULTS: Record<string, string> = {
  relacion: "por_aclarar", ocupacion: "por_aclarar", alertas: "por_aclarar",
  documentos: "Se solicitan en la entrevista inicial (formato 02).", siguienteAccion: "Entrevista inicial en persona",
};
/** Completa con «por aclarar» lo que el prospecto no pregunta; nunca sustituye una respuesta. */
export function withProspectDefaults(intent: IntakeIntent, answers: InterviewAnswers): InterviewAnswers {
  if (!isOwnerIntent(intent)) return answers;
  const filled = { ...answers };
  for (const [key, value] of Object.entries(PROSPECT_DEFAULTS)) if (!filled[key]?.trim()) filled[key] = value;
  return filled;
}
/** Pantallas de la entrevista: cada una agrupa secciones afines de interview.ts. */
export function interviewScreens(intent: IntakeIntent): Screen[] {
  if (isOwnerIntent(intent)) return [{ title: PROSPECT_SCREEN, sections: [], keys: PROSPECT_KEYS }];
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
  const visible = visibleFields(intent, answers);
  if (!screen.keys) return visible.filter(f => screen.sections.includes(f.section));
  return screen.keys.flatMap(key => { const f = visible.find(v => v.key === key); return f ? [{ ...f, ...PROSPECT_LABELS[key] }] : []; });
}
/** Lo que falta en una pantalla para seguir con la siguiente. El domicilio es obligatorio en el prospecto. */
export function screenIssues(intent: IntakeIntent, answers: InterviewAnswers, screen: Screen) {
  const keys = new Set(screenFields(intent, answers, screen).map(f => f.key));
  const labels = new Map(interviewFields(intent).map(f => [f.key, f.label]));
  const issues = interviewIssues(intent, answers).filter(issue => keys.has(issue.key))
    .map(issue => screen.keys && PROSPECT_LABELS[issue.key] && issue.message === labels.get(issue.key) ? { ...issue, message: PROSPECT_LABELS[issue.key].label } : issue);
  if (screen.keys?.includes("ubicacion") && !answers.ubicacion?.trim()) issues.unshift({ key: "ubicacion", message: "Domicilio del inmueble" });
  return issues;
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
