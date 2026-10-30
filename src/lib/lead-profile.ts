import { z } from "zod";

export const LEAD_PROFILE_OPTIONS = {
  operacion: { comprar: "Comprar", rentar: "Rentar para uso propio", vender: "Vender", arrendar: "Ofrecer en arrendamiento", invertir: "Evaluar una inversión" },
  uso: { residencial: "Residencial", comercial: "Comercial", industrial: "Industrial", mixto: "Mixto", otro: "Otro" },
  moneda: { MXN: "MXN", USD: "USD" },
  formaPago: { contado: "Contado", credito: "Crédito", mixto: "Mixto" },
  tipoCredito: { bancario: "Bancario", infonavit: "Infonavit", fovissste: "Fovissste", cofinanciamiento: "Cofinanciamiento", otro: "Otro" },
  estadoCredito: { "por-consultar": "Por consultar", "en-tramite": "En trámite", preautorizado: "Preautorizado", autorizado: "Autorizado" },
  origenIngresos: { mexico: "México", "estados-unidos": "Estados Unidos", ambos: "Ambos países", otro: "Otro" },
} as const;

function optionKeys<T extends Record<string, string>>(options: T) {
  return Object.keys(options) as [keyof T & string, ...(keyof T & string)[]];
}

const budget = z.number().finite().nonnegative().max(1e13);
const area = z.number().finite().nonnegative().max(1e9);
const count = z.number().int().nonnegative().max(1000);
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Fecha inválida");

// Staff-owned qualification; absent answers stay absent and future fields survive edits.
export const leadProfileSchema = z.object({
  operacion: z.enum(optionKeys(LEAD_PROFILE_OPTIONS.operacion)).optional(),
  uso: z.enum(optionKeys(LEAD_PROFILE_OPTIONS.uso)).optional(),
  presupuestoMin: budget.optional(),
  presupuestoMax: budget.optional(),
  presupuestoDeclarado: budget.optional(),
  capitalDeclarado: budget.optional(),
  moneda: z.enum(optionKeys(LEAD_PROFILE_OPTIONS.moneda)).optional(),
  superficieMin: area.optional(),
  superficieMax: area.optional(),
  superficieTerreno: area.optional(),
  superficieConstruccion: area.optional(),
  recamaras: count.optional(),
  estacionamientos: count.optional(),
  recamarasInmueble: count.optional(),
  estacionamientosInmueble: count.optional(),
  requisitos: z.string().max(20000).optional(),
  caracteristicas: z.string().max(20000).optional(),
  precioObjetivo: budget.optional(),
  formaPago: z.enum(optionKeys(LEAD_PROFILE_OPTIONS.formaPago)).optional(),
  tipoCredito: z.enum(optionKeys(LEAD_PROFILE_OPTIONS.tipoCredito)).optional(),
  estadoCredito: z.enum(optionKeys(LEAD_PROFILE_OPTIONS.estadoCredito)).optional(),
  origenIngresos: z.enum(optionKeys(LEAD_PROFILE_OPTIONS.origenIngresos)).optional(),
  plazo: z.string().max(500).optional(),
  estrategiaInversion: z.enum(["renta","reventa","mixta","por_definir"]).optional(),
  horizonteInversion: z.string().max(2000).optional(),
  criteriosInversion: z.string().max(2000).optional(),
  proximoContacto: calendarDate.optional(),
  proximaAccion: z.string().max(160).optional(),
  avisoPrivacidad: calendarDate.optional(),
}).passthrough().superRefine((profile, context) => {
  if ((profile.presupuestoMin !== undefined || profile.presupuestoMax !== undefined || profile.presupuestoDeclarado !== undefined || profile.capitalDeclarado !== undefined || profile.precioObjetivo !== undefined) && profile.moneda === undefined) {
    context.addIssue({ code: "custom", path: ["moneda"], message: "Selecciona la moneda del monto" });
  }
  if (profile.presupuestoMin !== undefined && profile.presupuestoMax !== undefined && profile.presupuestoMin > profile.presupuestoMax) {
    context.addIssue({ code: "custom", path: ["presupuestoMax"], message: "El presupuesto máximo no puede ser menor que el mínimo" });
  }
  if (profile.superficieMin !== undefined && profile.superficieMax !== undefined && profile.superficieMin > profile.superficieMax) {
    context.addIssue({ code: "custom", path: ["superficieMax"], message: "La superficie máxima no puede ser menor que la mínima" });
  }
});

export type LeadProfile = z.infer<typeof leadProfileSchema>;
