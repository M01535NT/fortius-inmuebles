import { z } from "zod";
export const INTENTS = {
  vender: {
    label: "Vender un inmueble",
    role: "Propietario vendedor",
    description: "Captar una propiedad para venta",
    operation: "venta",
    route: "captacion",
  },
  arrendar: {
    label: "Ofrecer en arrendamiento",
    role: "Propietario arrendador",
    description: "Captar una propiedad para renta",
    operation: "renta",
    route: "captacion",
  },
  comprar: {
    label: "Comprar un inmueble",
    role: "Comprador",
    description: "Encontrar una propiedad para comprar",
    operation: "venta",
    route: "compra",
  },
  rentar: {
    label: "Buscar una renta",
    role: "Arrendatario",
    description: "Encontrar una propiedad para arrendar",
    operation: "renta",
    route: "compra",
  },
  invertir: {
    label: "Invertir en inmuebles",
    role: "Inversionista",
    description: "Definir estrategia y criterios de inversión",
    operation: "venta",
    route: "compra",
  },
} as const;
export type IntakeIntent = keyof typeof INTENTS;
export const intentSchema = z.enum([
  "vender",
  "arrendar",
  "comprar",
  "rentar",
  "invertir",
]);
type Field = {
  key: string;
  label: string;
  section: string;
  type?: "textarea" | "date" | "number";
  options?: readonly string[];
  required?: boolean;
  hint?: string;
};
const common: Field[] = [
  {
    key: "fecha",
    label: "Fecha de la entrevista",
    section: "Objetivo",
    type: "date",
    required: true,
  },
  {
    key: "objetivo",
    label: "¿Qué quiere lograr?",
    section: "Objetivo",
    type: "textarea",
    required: true,
  },
  {
    key: "plazo",
    label: "¿En qué plazo quiere realizar la operación?",
    section: "Objetivo",
    required: true,
  },
  {
    key: "zona",
    label: "Municipio y zonas de interés",
    section: "Inmueble",
    required: true,
  },
  {
    key: "tipoInmueble",
    label: "Tipo de inmueble",
    section: "Inmueble",
    options: [
      "casa",
      "departamento",
      "terreno",
      "local",
      "oficina",
      "nave-industrial",
      "por_definir",
    ],
    required: true,
  },
];
const owner: Field[] = [
  {
    key: "relacion",
    label: "¿Qué relación declara tener con el inmueble?",
    section: "Inmueble",
    options: [
      "propietario",
      "copropietario",
      "representante",
      "heredero",
      "otro",
      "por_aclarar",
    ],
    required: true,
  },
  {
    key: "ubicacion",
    label: "Ubicación aproximada del inmueble",
    section: "Inmueble",
    hint: "Puedes completar la dirección después; evita datos sensibles innecesarios.",
  },
  {
    key: "ocupacion",
    label: "¿Quién ocupa el inmueble?",
    section: "Inmueble",
    options: ["desocupado", "propietario", "inquilino", "otro", "por_aclarar"],
    required: true,
  },
  {
    key: "documentos",
    label: "¿Qué documentos dice tener disponibles?",
    section: "Documentos y condiciones",
    type: "textarea",
    required: true,
    hint: "Anota lo declarado o escribe «Por aclarar». Se comprobarán después.",
  },
  {
    key: "alertas",
    label: "¿Se declararon adeudos, conflictos o condiciones especiales?",
    section: "Documentos y condiciones",
    options: ["ninguna_declarada", "declaradas", "por_aclarar"],
    required: true,
  },
  {
    key: "detalleAlertas",
    label: "Detalle de las condiciones o dudas",
    section: "Documentos y condiciones",
    type: "textarea",
  },
  {
    key: "acceso",
    label: "¿Cómo se puede visitar el inmueble?",
    section: "Documentos y condiciones",
    type: "textarea",
  },
];
const seeker: Field[] = [
  {
    key: "uso",
    label: "¿Para qué necesita el inmueble?",
    section: "Necesidades",
    required: true,
  },
  {
    key: "necesidades",
    label: "Características indispensables y preferencias",
    section: "Necesidades",
    type: "textarea",
    required: true,
  },
];
const investment: Field[] = [
  {
    key: "estrategia",
    label: "Estrategia de inversión",
    section: "Inversión",
    options: ["renta", "reventa", "mixta", "por_definir"],
    required: true,
  },
  {
    key: "horizonte",
    label: "Horizonte de la inversión",
    section: "Inversión",
    required: true,
  },
  {
    key: "criterios",
    label: "Criterios, riesgos que acepta y condiciones que evitaría",
    section: "Inversión",
    type: "textarea",
  },
];
const end: Field[] = [
  {
    key: "condiciones",
    label: "Condiciones importantes y participantes",
    section: "Acuerdos",
    type: "textarea",
  },
  {
    key: "privacidad",
    label: "Aviso de privacidad",
    section: "Acuerdos",
    options: ["presentado", "pendiente"],
    required: true,
    hint: "Selecciona «Presentado» solo si se puso a disposición. Esto no registra consentimiento.",
  },
  {
    key: "siguienteAccion",
    label: "Próxima acción acordada",
    section: "Siguiente paso",
    required: true,
  },
  {
    key: "siguienteFecha",
    label: "Fecha de la próxima acción",
    section: "Siguiente paso",
    type: "date",
    required: true,
  },
];
export function interviewFields(intent: IntakeIntent): Field[] {
  const isOwner = intent === "vender" || intent === "arrendar";
  const label = isOwner
    ? intent === "arrendar"
      ? "Renta mensual esperada"
      : "Precio esperado"
    : intent === "rentar"
      ? "Presupuesto mensual declarado"
      : intent === "invertir"
        ? "Capital declarado"
        : "Presupuesto declarado";
  return [
    ...common,
    ...(isOwner ? owner : seeker),
    {
      key: "presupuestoEstado",
      label: label,
      section: "Importe declarado",
      options: ["conocido", "por_definir"],
      required: true,
    },
    {
      key: "importe",
      label: "Importe",
      section: "Importe declarado",
      type: "number",
    },
    {
      key: "moneda",
      label: "Moneda",
      section: "Importe declarado",
      options: ["MXN", "USD"],
    },
    ...(["comprar", "invertir"].includes(intent)
      ? [
          {
            key: "financiamiento",
            label: "Forma de pago declarada",
            section: "Importe declarado",
            options: ["recursos_propios", "credito", "mixto", "por_definir"],
            required: true,
          },
        ]
      : []),
    ...(intent === "invertir" ? investment : []),
    ...end,
  ];
}
export const ANSWER_KEYS = [
  ...new Set(
    Object.keys(INTENTS).flatMap((i) =>
      interviewFields(i as IntakeIntent).map((f) => f.key),
    ),
  ),
];
export const answersSchema = z
  .record(z.string(), z.string().trim().max(2000))
  .refine(
    (a) => Object.keys(a).every((k) => ANSWER_KEYS.includes(k)),
    "Pregunta desconocida",
  );
export type InterviewAnswers = z.infer<typeof answersSchema>;
export const OPTION_LABELS: Record<string, string> = {
  por_definir: "Por definir",
  por_aclarar: "Por aclarar",
  ninguna_declarada: "Ninguna declarada",
  declaradas: "Sí, se declararon",
  presentado: "Presentado",
  pendiente: "Pendiente",
  recursos_propios: "Recursos propios",
  credito: "Crédito",
  mixto: "Recursos y crédito",
  nave_industrial: "Nave industrial",
};
export function answerLabel(value: string) {
  const label =
    OPTION_LABELS[value] ?? value.replaceAll("_", " ").replaceAll("-", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}
export function interviewIssues(
  intent: IntakeIntent,
  answers: InterviewAnswers,
) {
  const issues: Array<{ key: string; message: string }> = [];
  for (const f of interviewFields(intent)) {
    const v = answers[f.key]?.trim() ?? "";
    if (f.required && !v) issues.push({ key: f.key, message: f.label });
    else if (v && f.options && !f.options.includes(v))
      issues.push({ key: f.key, message: "Revisa: " + f.label });
    else if (v && f.type === "date" && !z.iso.date().safeParse(v).success)
      issues.push({ key: f.key, message: "Fecha inválida: " + f.label });
  }
  if (answers.presupuestoEstado === "conocido") {
    if (
      !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(answers.importe ?? "") ||
      Number(answers.importe) <= 0 ||
      Number(answers.importe) > 1e13
    )
      issues.push({ key: "importe", message: "Captura un importe positivo." });
    if (!["MXN", "USD"].includes(answers.moneda ?? ""))
      issues.push({ key: "moneda", message: "Elige la moneda." });
  }
  if (answers.alertas === "declaradas" && !answers.detalleAlertas?.trim())
    issues.push({
      key: "detalleAlertas",
      message: "Describe las condiciones declaradas.",
    });
  if (answers.privacidad !== "presentado")
    issues.push({
      key: "privacidad",
      message: "Pon el aviso de privacidad a disposición antes de continuar.",
    });
  return issues;
}
export const startIntakeSchema = z
  .object({
    id: z.uuid(),
    intencion: intentSchema,
    expedienteId: z.uuid().optional(),
    contacto: z.discriminatedUnion("tipo", [
      z
        .object({
          tipo: z.literal("nuevo"),
          nombre: z.string().trim().min(1).max(160),
          telefono: z
            .string()
            .trim()
            .max(40)
            .refine((v) => v.replace(/\D/g, "").length >= 7),
          email: z.email().max(254).or(z.literal("")),
          asesorId: z.string().min(1).max(160),
          telefonoCompartido: z.boolean().default(false),
        })
        .strict(),
      z
        .object({
          tipo: z.enum(["lead", "cliente"]),
          id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/),
        })
        .strict(),
    ]),
  })
  .strict();
export const saveIntakeSchema = z
  .object({
    version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    respuestas: answersSchema,
    completar: z.boolean().default(false),
  })
  .strict();
export type OperationalInterview = {
  id: string;
  intencion: IntakeIntent;
  asesor_id: string;
  lead_id: string | null;
  cliente_id: string | null;
  expediente_id: string | null;
  anterior_id: string | null;
  contacto: { nombre: string; telefono: string; email?: string };
  respuestas: InterviewAnswers;
  estado: "borrador" | "completada" | "cancelada";
  version: number;
  completed_at: string | null;
  updated_at: string;
};
