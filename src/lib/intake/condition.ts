/*
  Condición del inmueble declarada en la llamada (CAP-05, COR-14). Es lo que el propietario
  contó, no un dictamen: con una condición, el abogado revisa antes del levantamiento (RP-96).
  Las opciones describen lo dicho. CAP-06 (DEC-39, 12/11/2026): la 02 repite la pregunta y agrega
  «Ocupado sin permiso» a la ocupación; lo que diga la 02 cuenta igual que lo de la llamada.
*/

export const PROBLEM_OPTIONS = {
  ninguno: "No mencionó ninguno",
  ocupado_sin_permiso: "Lo ocupa alguien sin permiso",
  herencia: "Herencia o copropiedad sin resolver",
  adeudos: "Adeudos de predial, agua o cuotas",
  juicio: "Juicio o conflicto legal",
  otro: "Otro problema",
} as const;
export type ProblemKey = keyof typeof PROBLEM_OPTIONS;

/** Texto corto del chip. */
const PROBLEM_CHIP: Record<Exclude<ProblemKey, "ninguno">, string> = {
  ocupado_sin_permiso: "Ocupado sin permiso",
  herencia: "Herencia sin resolver",
  adeudos: "Con adeudos",
  juicio: "Juicio o conflicto",
  otro: "Problema declarado",
};

export const CREDIT_OPTIONS = {
  no: "No",
  infonavit: "Infonavit",
  fovissste: "Fovissste",
  banco: "Banco",
  otro: "Otro",
  no_sabe: "No lo dijo",
} as const;

export type PropertyCondition = { text: string; detail?: string };

/** La condición declarada, o null si no mencionó ninguna. */
export function conditionOf(answers: Record<string, string | undefined> | null | undefined): PropertyCondition | null {
  const key = answers?.problema as ProblemKey | undefined;
  if (!key || key === "ninguno" || !(key in PROBLEM_CHIP)) return null;
  const detail = answers?.detalleAlertas?.trim();
  return { text: PROBLEM_CHIP[key as Exclude<ProblemKey, "ninguno">], ...(detail ? { detail } : {}) };
}

/** La condición de la llamada o, si no hay, la que se anotó en la entrevista 02 (CAP-06). */
export function conditionWith02(answers: Record<string, string | undefined> | null | undefined, entrevista02: Record<string, unknown> | null | undefined): PropertyCondition | null {
  const fromCall = conditionOf(answers);
  if (fromCall) return fromCall;
  const problema = typeof entrevista02?.problema === "string" && entrevista02.problema !== "ninguno" ? entrevista02.problema : entrevista02?.ocupacion === "sin_permiso" ? "ocupado_sin_permiso" : undefined;
  return conditionOf({ problema });
}

/** Título de la tarea que pide la revisión del abogado antes del levantamiento. */
export const LAWYER_TASK = "Revisión del abogado antes del levantamiento";
export const isLawyerTask = (title: string) => title.startsWith(LAWYER_TASK);

/** Una línea para las notas del asesor de la 02. */
export function conditionNote(answers: Record<string, string | undefined>) {
  const condition = conditionOf(answers);
  if (!condition) return "";
  const label = PROBLEM_OPTIONS[answers.problema as ProblemKey];
  return `Problema que mencionó: ${label.charAt(0).toLowerCase()}${label.slice(1)}.${condition.detail ? ` ${condition.detail}` : ""}`;
}
