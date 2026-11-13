import type { FormatoField } from "./catalog";

/*
  22 · Solicitud de arrendamiento y revisión del candidato. El titular aprobó el 13/11/2026 el texto
  que redactó el agente: la solicitud que llena y firma el interesado, la revisión que prepara
  Fortius y la decisión del propietario, en un solo documento. Cumple lo que promete el contrato 21
  (cláusulas segunda y tercera bis): presentar cada candidato con lo recibido, sin certificar
  documentos ni garantizar solvencia. No pide datos que puedan prestarse a discriminar ni consulta
  buró; no fija un ingreso mínimo: muestra la proporción y decide el propietario.
*/

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: string[][], required = true): FormatoField => ({ ...field(section, key, label, "choice", required), options: options.map(([value, label]) => ({ value, label })) });
const SI_NO = [["no", "No"], ["si", "Sí"]];
const s = ["01 / Solicitante", "02 / Lo que solicita", "03 / Ingresos", "04 / Referencias", "05 / Documentos y privacidad", "06 / Revisión de Fortius", "07 / Decisión del propietario"];
const TIPO_REFERENCIA = [["anterior", "Arrendador anterior"], ["personal", "Personal"], ["comercial", "Comercial"]];

export const DOCUMENTOS_SOLICITUD = [
  ["identificacion", "Identificación oficial"], ["domicilio", "Comprobante de domicilio"], ["ingresos", "Comprobantes de ingresos"],
  ["acta", "Acta constitutiva"], ["poder", "Poder del representante"], ["constanciaFiscal", "Constancia de situación fiscal"],
  ["garanteIdentificacion", "Identificación del garante"], ["garanteDomicilio", "Comprobante de domicilio del garante"], ["escrituraFiador", "Escritura del inmueble del fiador"],
] as const;

const referencia = (n: number, required: boolean): FormatoField[] => [
  choice(s[3], `ref${n}Tipo`, `Referencia ${n}: tipo`, TIPO_REFERENCIA, required), field(s[3], `ref${n}Nombre`, `Referencia ${n}: nombre`, "text", required),
  field(s[3], `ref${n}Telefono`, `Referencia ${n}: teléfono`, "text", required), field(s[3], `ref${n}Relacion`, `Referencia ${n}: relación`, "text", required),
];

export const solicitudArrendamientoFields: FormatoField[] = [
  field(s[0], "folio", "Folio del expediente"), field(s[0], "inmueble", "Domicilio del inmueble", "long"), field(s[0], "fechaSolicitud", "Fecha de la solicitud", "date"),
  choice(s[0], "solicitanteTipo", "El solicitante es", [["fisica", "Persona física"], ["moral", "Empresa (persona moral)"]]),
  field(s[0], "solicitante", "Nombre o razón social del solicitante"), field(s[0], "rfc", "RFC del solicitante"),
  field(s[0], "identificacion", "Identificación del solicitante"), field(s[0], "nacionalidad", "Nacionalidad del solicitante"),
  field(s[0], "acta", "Acta constitutiva", "long"), field(s[0], "representante", "Representante de la empresa"), field(s[0], "poder", "Poder del representante", "long"),
  field(s[0], "domicilioActual", "Domicilio actual", "long"), field(s[0], "tiempoDomicilio", "Tiempo en el domicilio actual"),
  field(s[0], "telefono", "Teléfono del solicitante"), field(s[0], "correo", "Correo del solicitante"),

  choice(s[1], "uso", "Uso del inmueble", [["habitacion", "Casa habitación"], ["comercial", "Comercial u oficina"]]), field(s[1], "giro", "Giro o actividad", "long"),
  field(s[1], "ocupantes", "Personas que lo habitarán", "number"), choice(s[1], "mascotas", "¿Tendrá mascotas?", SI_NO), field(s[1], "mascotasDetalle", "Mascotas (cuántas y cuáles)"),
  field(s[1], "rentaOfrecida", "Renta mensual ofrecida en MXN", "money"), field(s[1], "fechaEntrada", "Fecha deseada de entrada", "date"), field(s[1], "plazoMeses", "Plazo deseado en meses", "number"),
  choice(s[1], "garantia", "Garantía que ofrece", [["fiador", "Fiador"], ["obligado", "Obligado solidario"], ["ninguna", "Solo el depósito"]]),
  field(s[1], "garante", "Nombre del fiador u obligado solidario"), field(s[1], "telefonoGarante", "Teléfono del garante"),
  choice(s[1], "fiadorConInmueble", "¿El fiador responde con un inmueble?", SI_NO), field(s[1], "inmuebleGarante", "Inmueble con que responde el fiador", "long"),

  choice(s[2], "actividad", "Actividad", [["empleado", "Empleado"], ["negocio", "Negocio propio o independiente"], ["pensionado", "Pensionado"], ["empresa", "Empresa"]]),
  field(s[2], "empleador", "Empresa donde trabaja"), field(s[2], "puesto", "Puesto"), field(s[2], "telefonoEmpleo", "Teléfono del empleo"),
  field(s[2], "actividadDetalle", "Actividad o giro del negocio"), field(s[2], "antiguedad", "Antigüedad en el empleo o actividad"),
  field(s[2], "ingresoMensual", "Ingreso mensual comprobable en MXN", "money"),

  ...referencia(1, true), ...referencia(2, true), ...referencia(3, false),

  field(s[4], "mesesComprobantes", "Meses de comprobantes de ingresos que se piden", "number"),
  { ...field(s[4], "documentosRecibidos", "Documentos recibidos", "multi", false), options: DOCUMENTOS_SOLICITUD.map(([value, label]) => ({ value, label })) },
  field(s[4], "medioAviso", "Medio donde se puso a disposición el aviso de privacidad"), field(s[4], "fechaAviso", "Fecha del aviso de privacidad", "date"),
  field(s[4], "lugar", "Municipio de firma en Baja California"),

  field(s[5], "fechaRecepcion", "Fecha en que se recibió la solicitud completa", "date", false), field(s[5], "fechaPresentacion", "Fecha en que se presentó al propietario", "date", false),
  choice(s[5], "coherencia", "¿Los datos coinciden entre la solicitud y los documentos?", SI_NO, false), field(s[5], "discrepancias", "Lo que no coincide", "long", false),
  field(s[5], "ref1Resultado", "Resultado de la referencia 1 (fecha y comentario, o «no contestó»)", "long", false),
  field(s[5], "ref2Resultado", "Resultado de la referencia 2", "long", false), field(s[5], "ref3Resultado", "Resultado de la referencia 3", "long", false),
  choice(s[5], "garantiaEstado", "Garantía", [["identificado", "Garante identificado y documentos recibidos"], ["pendiente", "Pendiente"], ["deposito", "Solo depósito"]], false),
  field(s[5], "observaciones", "Observaciones", "long", false), field(s[5], "asesor", "Asesor que preparó la revisión", "text", false),

  choice(s[6], "decision", "Decisión del propietario", [["acepta", "Acepta al candidato"], ["condiciones", "Acepta con condiciones"], ["rechaza", "No lo acepta"]], false),
  field(s[6], "condiciones", "Condiciones del propietario", "long", false), field(s[6], "propietario", "Nombre del propietario", "text", false), field(s[6], "fechaDecision", "Fecha de la decisión", "date", false),
];

/** Documentos que se piden según lo elegido (sección 5 de la solicitud). */
export function documentosAplicables(d: Record<string, unknown>): string[] {
  const garante = d.garantia === "fiador" || d.garantia === "obligado";
  return DOCUMENTOS_SOLICITUD.map(([value]) => value).filter(value => {
    if (["acta", "poder", "constanciaFiscal"].includes(value)) return d.solicitanteTipo === "moral";
    if (["garanteIdentificacion", "garanteDomicilio"].includes(value)) return garante;
    if (value === "escrituraFiador") return d.garantia === "fiador" && d.fiadorConInmueble === "si";
    return true;
  });
}

/** Campos que solo aplican según lo elegido. */
export function mostrarCampoSolicitud(key: string, d: Record<string, unknown>): boolean {
  if (["identificacion", "nacionalidad"].includes(key)) return d.solicitanteTipo !== "moral";
  if (["acta", "representante", "poder"].includes(key)) return d.solicitanteTipo === "moral";
  if (key === "giro") return d.uso === "comercial";
  if (key === "ocupantes") return d.uso !== "comercial";
  if (key === "mascotasDetalle") return d.mascotas === "si";
  if (["garante", "telefonoGarante"].includes(key)) return d.garantia === "fiador" || d.garantia === "obligado";
  if (key === "fiadorConInmueble") return d.garantia === "fiador";
  if (key === "inmuebleGarante") return d.garantia === "fiador" && d.fiadorConInmueble === "si";
  if (["empleador", "puesto", "telefonoEmpleo"].includes(key)) return d.actividad === "empleado";
  if (key === "actividadDetalle") return d.actividad === "negocio" || d.actividad === "empresa";
  if (key === "discrepancias") return d.coherencia === "no";
  if (key === "condiciones") return d.decision === "condiciones";
  return true;
}

/** Qué parte del ingreso mensual comprobable es la renta ofrecida, en porcentaje con un decimal. */
export function rentaSobreIngreso(d: Record<string, unknown>): number | null {
  const renta = d.rentaOfrecida, ingreso = d.ingresoMensual;
  if (typeof renta !== "number" || typeof ingreso !== "number" || !Number.isFinite(renta) || !Number.isFinite(ingreso) || ingreso <= 0 || renta < 0) return null;
  return Math.round(renta / ingreso * 1000) / 10;
}

const vacio = (value: unknown) => value === undefined || value === null || value === "";
const fechaValida = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

/** Reglas de congruencia; un dato vacío lo reporta el catálogo como faltante, aquí solo se revisa lo capturado. */
export function validarSolicitud(d: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const [key, label] of [["ocupantes", "Personas que lo habitarán"], ["plazoMeses", "Plazo deseado"], ["mesesComprobantes", "Meses de comprobantes"]] as const)
    if (!vacio(d[key]) && (!Number.isSafeInteger(d[key]) || (d[key] as number) < 1)) errors.push(`${label} en número entero mayor que cero`);
  if (d.rentaOfrecida === 0) errors.push("Renta ofrecida mayor que cero");
  if (d.ingresoMensual === 0) errors.push("Ingreso mensual mayor que cero");
  if (typeof d.correo === "string" && d.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo.trim())) errors.push("Correo del solicitante");
  if (fechaValida(d.fechaAviso) && fechaValida(d.fechaSolicitud) && d.fechaAviso > d.fechaSolicitud) errors.push("El aviso de privacidad no puede ser posterior a la solicitud");
  if (fechaValida(d.fechaRecepcion) && fechaValida(d.fechaSolicitud) && d.fechaRecepcion < d.fechaSolicitud) errors.push("La recepción no puede ser anterior a la solicitud");
  if (fechaValida(d.fechaPresentacion) && fechaValida(d.fechaRecepcion) && d.fechaPresentacion < d.fechaRecepcion) errors.push("La presentación no puede ser anterior a la recepción");
  if (fechaValida(d.fechaDecision) && fechaValida(d.fechaPresentacion) && d.fechaDecision < d.fechaPresentacion) errors.push("La decisión no puede ser anterior a la presentación");
  if (Array.isArray(d.documentosRecibidos) && d.documentosRecibidos.some(doc => !documentosAplicables(d).includes(String(doc)))) errors.push("Documentos recibidos que no aplican a esta solicitud");
  return errors;
}
