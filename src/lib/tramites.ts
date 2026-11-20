import { z } from "zod";

/*
  TRA-01 · Trámites con pasos. El primero: cancelación de hipoteca (decisiones del titular del
  14/11/2026): Fortius lo hace, el propietario paga los derechos (y el notario si lo hay), y es un
  trámite aparte de la venta. Pasos según fuentes oficiales consultadas el 14/11/2026:
  · Registro Público de BC, «Inscripción de Cancelación de Gravámenes» (Retys BC-DRPPC-014): pide
    los derechos pagados y la «Carta de cancelación»; la escritura solo si ese es el medio. $794
    (tarifa oct. 2026), 5 días hábiles, presencial (Tijuana: Xavier Villarrutia 1271, Zona Río).
  · «Certificado de Inscripción con o sin Gravámenes» (Retys BC-DRPPC-011): $516, 5 días hábiles,
    en línea o presencial.
  · Infonavit: carta de instrucción gratuita en Mi Cuenta Infonavit; para ir directo al Registro
    se pide antes la validación de documentos de Infonavit.
  · Fovissste: instrumento administrativo de cancelación (gob.mx FOVISSSTE-00-012-A), gratuito, 10
    días hábiles; pide el comprobante de pago de derechos de la cancelación.
  · Banco: carta de finiquito y escritura de cancelación ante notario (no hay vía oficial sin él).
  Las claves de los pasos son identificadores fijos (la base los revisa); el nombre cambia por acreedor.

  La base guarda los pendientes de cada paso al abrir el trámite. Desde la migración
  20261119100200_panel_19_agenda_y_tramites_con_persona un paso se cierra aunque falten pendientes o su documento:
  la base lo anota en el historial, con quién y cuándo, y el panel lo avisa. Este archivo solo define textos.
*/
export const ACREEDORES = { infonavit: "Infonavit", banco: "Banco", fovissste: "Fovissste" } as const;
export type Acreedor = keyof typeof ACREEDORES;
export const PASO_CLAVES = ["datos", "liquidado", "carta", "notario", "firma", "registro", "certificado", "entrega"] as const;
export type PasoClave = (typeof PASO_CLAVES)[number];
/** Pasos que piden su documento; si falta al cerrarlos, se avisa (DEC-61, ya no frena). */
export const PASOS_CON_DOCUMENTO: Partial<Record<PasoClave, string>> = { liquidado: "Estado de cuenta en cero", carta: "", certificado: "Certificado de inscripción sin gravámenes" };
export const TOTAL_PASOS = PASO_CLAVES.length;

const CARTA: Record<Acreedor, string> = { infonavit: "Carta de instrucción de cancelación", banco: "Carta de finiquito", fovissste: "Carta de finiquito" };
/** Solo el crédito bancario pasa por notario; Infonavit y Fovissste van directo al Registro. */
export const conNotario = (acreedor: Acreedor) => acreedor === "banco";
export function documentoDelPaso(acreedor: Acreedor, clave: PasoClave) {
  if (!(clave in PASOS_CON_DOCUMENTO)) return undefined;
  return clave === "carta" ? CARTA[acreedor] : PASOS_CON_DOCUMENTO[clave];
}

type PasoDef = { clave: PasoClave; nombre: string; ayuda: string; pendientes: string[] };
export function pasosDe(acreedor: Acreedor): PasoDef[] {
  const datos: PasoDef = { clave: "datos", nombre: "Datos del crédito", ayuda: "Reúne el número de crédito, la escritura con la hipoteca inscrita (folio real) y la identificación del propietario.", pendientes: ["Número de crédito", "Escritura con folio real", "Identificación del propietario"] };
  const liquidado: PasoDef = { clave: "liquidado", nombre: "Crédito liquidado", ayuda: "Confirma con el estado de cuenta del acreedor que el saldo está en cero.", pendientes: ["Saldo en cero confirmado", "Fecha del último pago"] };
  const registro = (quien: string): PasoDef => ({ clave: "registro", nombre: "Registro Público", ayuda: `${quien} en el Registro Público de Tijuana (Xavier Villarrutia 1271, Zona Río), con los derechos pagados. El Registro tiene 5 días hábiles para resolver.`, pendientes: ["Ingreso al Registro", "Boleta de inscripción recibida"] });
  const certificado: PasoDef = { clave: "certificado", nombre: "Certificado de gravámenes", ayuda: "Pide el «Certificado de inscripción con o sin gravámenes» (en línea o en el Registro, 5 días hábiles): prueba que la hipoteca ya no existe.", pendientes: ["Certificado solicitado"] };
  const entrega: PasoDef = { clave: "entrega", nombre: "Entrega", ayuda: "Entrega al propietario la boleta de inscripción, el certificado y sus documentos originales.", pendientes: ["Entregado al propietario"] };
  if (acreedor === "infonavit") return [datos, liquidado,
    { clave: "carta", nombre: "Carta de instrucción", ayuda: "Se genera sin costo en Mi Cuenta Infonavit («Mi crédito») o en un centro de servicio, solo con el crédito liquidado. Elige la opción de ir directo al Registro Público.", pendientes: ["Carta generada para el Registro Público", "Carta revisada: nombre, crédito y folio coinciden"] },
    { clave: "notario", nombre: "Validación de Infonavit", ayuda: "Para ir directo al Registro, Infonavit valida antes los documentos. Pide la validación y guarda el comprobante.", pendientes: ["Validación solicitada", "Validación aprobada"] },
    { clave: "firma", nombre: "Pago de derechos", ayuda: "Paga en la caja recaudadora del Registro los derechos de cancelación de gravamen ($794 con un gravamen, tarifa de octubre de 2026). Lo cubre el propietario.", pendientes: ["Derechos pagados", "Recibo guardado"] },
    registro("Ingresa la carta de instrucción validada"), certificado, entrega];
  if (acreedor === "fovissste") return [datos, liquidado,
    { clave: "carta", nombre: "Carta de finiquito", ayuda: "La emite el Departamento de Vivienda o la Subdirección de Finanzas del Fovissste al liquidar.", pendientes: ["Carta solicitada al Fovissste", "Carta revisada: nombre, crédito y folio coinciden"] },
    { clave: "notario", nombre: "Pago de derechos", ayuda: "El Fovissste pide el comprobante de pago de derechos de la cancelación antes de emitir el instrumento. Se paga en la caja recaudadora del Registro ($794 con un gravamen, tarifa de octubre de 2026).", pendientes: ["Derechos pagados", "Comprobante guardado"] },
    { clave: "firma", nombre: "Instrumento de cancelación", ayuda: "Con cita en el portal del Fovissste se pide el instrumento administrativo de cancelación: gratuito, 10 días hábiles. Lleva identificación, carta de finiquito, escritura inscrita y el comprobante de pago.", pendientes: ["Cita en el Fovissste", "Instrumento recibido"] },
    registro("Ingresa el instrumento de cancelación del Fovissste"), certificado, entrega];
  return [datos, liquidado,
    { clave: "carta", nombre: "Carta de finiquito", ayuda: "La entrega el banco al liquidar. Pide la carta de finiquito y la instrucción para el notario.", pendientes: ["Solicitud hecha al banco", "Carta revisada: nombre, crédito y folio coinciden"] },
    { clave: "notario", nombre: "Notario y presupuesto", ayuda: "Elige la notaría, pide el presupuesto de la escritura de cancelación y que el propietario lo apruebe.", pendientes: ["Notaría elegida", "Presupuesto recibido", "Aprobado por el propietario"] },
    { clave: "firma", nombre: "Firma ante notario", ayuda: "El apoderado del banco firma la escritura de cancelación ante el notario.", pendientes: ["Fecha de firma acordada", "Escritura firmada"] },
    registro("El notario ingresa la escritura de cancelación"), certificado, entrega];
}

const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
const reference = id.or(z.literal("")).optional();
/** La persona del Directorio (panel nuevo): el uuid de su ficha, o vacío. */
const persona = z.uuid().or(z.literal("")).optional();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const texto = (max: number) => z.string().trim().max(max);
const pendienteSchema = z.object({ id, texto: texto(300).min(1), hecho: z.boolean() }).strict();
const pasoSchema = z.object({ clave: z.enum(PASO_CLAVES), pendientes: z.array(pendienteSchema).max(20), cerradoEl: z.string().max(40).optional(), cerradoPor: z.string().max(80).optional() }).strict();
const notaSchema = z.object({ id, tipo: z.enum(["nota", "evento"]), texto: texto(5000).min(1), fijada: z.boolean().optional(), autor: z.string().max(80).optional(), fecha: z.string().max(40).optional() }).strict();
const pagoSchema = z.object({ id, concepto: texto(160).min(1), monto: z.number().finite().nonnegative().max(1e10).optional(), estado: z.enum(["pendiente", "pagado"]) }).strict();
const esperaSchema = z.object({ quien: texto(120).min(1), desde: fecha, volver: fecha }).strict().nullable().optional();
const avanceSchema = z.object({ fecha: z.string().max(40).optional(), medio: z.enum(["whatsapp", "correo", "pdf"]) }).strict().nullable().optional();
export const tramiteSchema = z.object({
  id, tipo: z.literal("cancelacion_hipoteca"), acreedor: z.enum(Object.keys(ACREEDORES) as [Acreedor, ...Acreedor[]]),
  // El propietario: el cliente del panel provisional o la persona del Directorio (al menos uno).
  titulo: texto(160).min(1), clienteId: id.or(z.literal("")), personaId: persona, asesorId: id, propiedadSlug: reference, expedienteId: z.uuid().or(z.literal("")).optional(),
  estado: z.enum(["en_curso", "terminado", "cancelado"]), pasoActual: z.number().int().min(0).max(TOTAL_PASOS),
  pasos: z.array(pasoSchema).length(TOTAL_PASOS),
  espera: esperaSchema,
  credito: z.object({ numero: texto(60).optional(), folioReal: texto(60).optional(), notaria: texto(160).optional() }).strict().optional(),
  pagos: z.array(pagoSchema).max(30).default([]),
  notas: z.array(notaSchema).max(1000).default([]),
  ultimoAvance: avanceSchema,
  // Ligado a una venta, frena la firma hasta cerrar el Registro Público; el director puede decidir firmar sin ella.
  firmaSinCancelacion: z.object({ motivo: texto(1000).min(10), autorizadoPor: z.string().max(80).optional(), autorizadoEl: z.string().max(40).optional() }).strict().nullable().optional(),
  creadoEl: z.string().max(40).optional(), actualizadoEl: z.string().max(40).optional(),
}).strict().refine(t => t.pasos.every((p, i) => p.clave === PASO_CLAVES[i]), { message: "Pasos fuera de orden", path: ["pasos"] })
  .refine(t => (t.estado === "terminado") === (t.pasoActual === TOTAL_PASOS), { message: "Solo termina al cerrar el último paso", path: ["estado"] })
  .refine(t => t.clienteId !== "" || !!t.personaId, { message: "Elige al propietario", path: ["personaId"] });
export type Tramite = z.infer<typeof tramiteSchema>;

/*
  Trámites que no son la hipoteca (boceto «Trámites», 15/11/2026): servicios, avalúo, regularización, Catastro,
  Registro Público y el trámite libre. Dos formas: «ruta» (pasos en orden, como la hipoteca, con su nombre
  guardado porque las guías aún están por confirmar con la fuente oficial) o «partes» (cambio de nombre de
  servicios y trámite libre: cada parte se marca solicitada y lista). La base los acepta desde la migración
  20261119100200_panel_19_agenda_y_tramites_con_persona; antes de aplicarla, guardarlos responde «Trámite inválido».
*/
export const TIPOS_GUIA = ["servicios", "avaluo", "regularizacion", "catastro", "registro", "libre"] as const;
export type TipoGuia = (typeof TIPOS_GUIA)[number];
export const MAX_PASOS_GUIA = 12;
const pasoGuiaSchema = z.object({ clave: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/), nombre: texto(120).min(1), pendientes: z.array(pendienteSchema).max(20), cerradoEl: z.string().max(40).optional(), cerradoPor: z.string().max(80).optional() }).strict();
const parteSchema = z.object({ id, nombre: texto(120).min(1), institucion: texto(120).optional(), estado: z.enum(["pendiente", "solicitado", "listo"]), llevar: z.array(texto(160).min(1)).max(20).default([]) }).strict();
export const tramiteGuiaSchema = z.object({
  id, tipo: z.enum(TIPOS_GUIA), titulo: texto(160).min(1), clienteId: reference, personaId: persona, asesorId: id, propiedadSlug: reference,
  expedienteId: z.uuid().or(z.literal("")).optional(), estado: z.enum(["en_curso", "terminado", "cancelado"]),
  pasoActual: z.number().int().min(0).max(MAX_PASOS_GUIA), pasos: z.array(pasoGuiaSchema).max(MAX_PASOS_GUIA),
  partes: z.array(parteSchema).max(30).default([]), espera: esperaSchema,
  pagos: z.array(pagoSchema).max(30).default([]), notas: z.array(notaSchema).max(1000).default([]), ultimoAvance: avanceSchema,
  creadoEl: z.string().max(40).optional(), actualizadoEl: z.string().max(40).optional(),
}).strict().refine(t => t.pasoActual <= t.pasos.length, { message: "Paso fuera de la guía", path: ["pasoActual"] })
  .refine(t => !t.pasos.length || !t.partes.length, { message: "Un trámite lleva pasos o partes, no las dos", path: ["partes"] })
  .refine(t => !t.pasos.length || (t.estado === "terminado") === (t.pasoActual === t.pasos.length), { message: "Solo termina al cerrar el último paso", path: ["estado"] });
export type TramiteGuia = z.infer<typeof tramiteGuiaSchema>;
export type ParteTramite = TramiteGuia["partes"][number];
/** Lo que valida el servidor en la colección «tramites»: la hipoteca (TRA-01) o una de las demás guías. */
export const tramiteCualquieraSchema = z.union([tramiteSchema, tramiteGuiaSchema]);
export type CualquierTramite = Tramite | TramiteGuia;
export const esHipoteca = (t: { tipo: string }): t is Tramite => t.tipo === "cancelacion_hipoteca";
export type TramiteNota = Tramite["notas"][number];

/** Trámite nuevo con los pendientes de cada paso según el acreedor. */
export function nuevoTramite(input: { id: string; acreedor: Acreedor; titulo: string; clienteId?: string; personaId?: string; asesorId: string; propiedadSlug?: string; expedienteId?: string; pagos?: string[] }): Tramite {
  return {
    id: input.id, tipo: "cancelacion_hipoteca", acreedor: input.acreedor, titulo: input.titulo.trim(),
    clienteId: input.clienteId || "", ...(input.personaId ? { personaId: input.personaId } : {}),
    asesorId: input.asesorId, propiedadSlug: input.propiedadSlug || "", expedienteId: input.expedienteId || "",
    estado: "en_curso", pasoActual: 0, espera: null, credito: {}, ultimoAvance: null, notas: [],
    pasos: pasosDe(input.acreedor).map(p => ({ clave: p.clave, pendientes: p.pendientes.map((texto, i) => ({ id: `${p.clave}-${i + 1}`, texto, hecho: false })) })),
    // Montos de referencia del Registro de BC (Retys, octubre de 2026); la escritura solo con banco.
    pagos: input.pagos
      ? input.pagos.map((concepto, i) => ({ id: `pago-${i + 1}`, concepto, estado: "pendiente" as const }))
      : [...(conNotario(input.acreedor) ? [{ concepto: "Escritura de cancelación" }] : []), { concepto: "Derechos de cancelación en el Registro", monto: 794 }, { concepto: "Certificado de gravámenes", monto: 516 }]
        .map((p, i) => ({ id: `pago-${i + 1}`, ...p, estado: "pendiente" as const })),
  };
}

/** Lo que falta en el paso actual (vacío = se cierra sin aviso). */
export function faltanParaCerrar(t: Pick<Tramite, "acreedor" | "pasoActual" | "pasos">, documentos: readonly { pasoClave?: string }[]): string[] {
  const paso = t.pasos[t.pasoActual];
  if (!paso) return [];
  const faltan = paso.pendientes.filter(p => !p.hecho).map(p => p.texto);
  const doc = documentoDelPaso(t.acreedor, paso.clave);
  if (doc && !documentos.some(d => d.pasoClave === paso.clave)) faltan.push(`Subir: ${doc}`);
  return faltan;
}

function necesitaDelPropietario(t: Tramite, paso?: string) {
  if (t.pasoActual >= TOTAL_PASOS) return "• Nada por ahora.";
  if (paso === "Notario y presupuesto") return "• Aprobar el presupuesto del notario.";
  if (paso === "Pago de derechos") return "• Cubrir los derechos del Registro ($794).";
  return "• Nada por ahora.";
}

/** Texto del avance para el propietario: sin notas internas. */
export function textoDelAvance(t: Tramite, partes: { listo: boolean; sigue: boolean; necesita: boolean; pagos: boolean }, propietario: string, firma: string) {
  const pasos = pasosDe(t.acreedor);
  const actual = pasos[Math.min(t.pasoActual, TOTAL_PASOS - 1)];
  const lineas = [`Hola, ${propietario}. Le comparto cómo va la cancelación de la hipoteca de ${t.titulo}.`];
  if (t.pasoActual >= TOTAL_PASOS) lineas.push("El trámite quedó terminado: la hipoteca está cancelada.");
  else lineas.push(`Vamos en el paso ${t.pasoActual + 1} de ${TOTAL_PASOS}: ${actual.nombre}${t.espera ? `, esperando respuesta de ${t.espera.quien}` : ""}.`);
  if (partes.listo && t.pasoActual > 0) lineas.push("", "Ya está listo:", ...pasos.slice(0, t.pasoActual).map(p => `• ${p.nombre}`));
  if (partes.sigue && t.pasoActual < TOTAL_PASOS - 1) lineas.push("", "Lo que sigue:", `• ${pasos[t.pasoActual + 1].nombre}`);
  if (partes.necesita) lineas.push("", "Lo que necesitamos de usted:", necesitaDelPropietario(t, actual?.nombre));
  if (partes.pagos && t.pagos.length) lineas.push("", "Pagos:", ...t.pagos.map(p => `• ${p.concepto}: ${p.estado === "pagado" ? "pagado" : "pendiente"}${p.monto !== undefined ? ` ($${p.monto.toLocaleString("es-MX")})` : ""}`));
  lineas.push("", firma);
  return lineas.join("\n");
}
