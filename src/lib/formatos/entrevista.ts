import type { FormatoField } from "./catalog";

const yesNo = [{ value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "no_sabe", label: "No sabe" }] as const;
export const ENTREVISTA_TABLES = {
  documentosPrometidos: { columns: [{ key: "documento", label: "Documento" }, { key: "responsable", label: "Responsable de entregarlo" }, { key: "fecha", label: "Fecha acordada" }] },
  contradicciones: { columns: [{ key: "dato", label: "Dato o pregunta" }, { key: "declarado", label: "Lo declarado" }, { key: "mostrado", label: "Soporte mostrado o ninguno" }, { key: "pendiente", label: "Qué falta aclarar" }] },
} as const;
export type EntrevistaTable = keyof typeof ENTREVISTA_TABLES;
export type EntrevistaRow = Record<string, string | undefined>;
const options = (values: readonly [string, string][]) => values.map(([value, label]) => ({ value, label }));
const base = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const select = (section: string, key: string, label: string, values: readonly { value: string; label: string }[], required = true): FormatoField => ({ section, key, label, type: "choice", options: values, required });
const row = (section: string, values: readonly [string, string, FormatoField["type"]?, boolean?][]) => values.map(([key, label, type, required]) => base(section, key, label, type ?? "text", required ?? true));

export const entrevistaFields: FormatoField[] = [
  ...row("Datos de la entrevista", [
    ["folio", "Folio del expediente"], ["fechaEntrevista", "Fecha de entrevista", "date"], ["horaEntrevista", "Hora de entrevista", "time"],
    ["operacion", "Operación prevista"], ["asesor", "Asesor responsable"], ["origenContacto", "Origen del contacto"],
  ]),
  select("Datos de la entrevista", "avisoPrivacidad", "Estado del aviso de privacidad", options([["si", "Puesto a disposición"], ["pendiente", "Pendiente"]])),
  ...row("Datos de la entrevista", [["fechaAviso", "Fecha del aviso", "date", false], ["medioAviso", "Medio del aviso", "text", false]]),
  ...row("01 / Identidad y contacto", [
    ["entrevistado", "Nombre de quien responde"], ["propietario", "Nombre del propietario o razón social"],
    ["telefono", "Teléfono"], ["correo", "Correo electrónico"], ["fechaNacimiento", "Fecha de nacimiento", "date", false],
    ["nacionalidad", "Nacionalidad", "text", false], ["ocupacionEntrevistado", "Ocupación", "text", false],
    ["curp", "CURP", "text", false], ["rfc", "RFC", "text", false], ["domicilioEntrevistado", "Domicilio de contacto"],
    ["residenciaFiscal", "País de residencia fiscal"], ["medioContacto", "Medio preferido de contacto"], ["horarioContacto", "Horario preferido de contacto"],
    ["otroContacto", "Otra persona de contacto", "text", false], ["viveDesde", "Desde cuándo vive en el inmueble", "text", false],
    ["viveHasta", "Hasta cuándo vivió en el inmueble", "text", false],
  ]),
  select("01 / Identidad y contacto", "relacion", "Relación con el inmueble", options([["propietario", "Propietario"], ["copropietario", "Copropietario"], ["representante", "Representante"], ["heredero", "Heredero"], ["otro", "Otra"]])),
  select("01 / Identidad y contacto", "tipoPropietario", "Tipo de propietario", options([["fisica", "Persona física"], ["moral", "Persona moral"]])),
  select("01 / Identidad y contacto", "viveInmueble", "¿Vive en el inmueble?", yesNo),
  ...row("02 / Situación familiar", [["conyuge", "Nombre del cónyuge", "text", false], ["fechaMatrimonio", "Fecha del matrimonio", "date", false], ["lugarMatrimonio", "Lugar del matrimonio", "text", false], ["documentoRegimen", "Documento de régimen o liquidación", "text", false], ["otrosParticipantes", "Otras personas que deben participar o no están de acuerdo", "long", false]]),
  select("02 / Situación familiar", "estadoCivilActual", "Estado civil actual", options([["soltero", "Soltero"], ["casado", "Casado"], ["divorciado", "Divorciado"], ["viudo", "Viudo"], ["otro", "Otro"]])),
  select("02 / Situación familiar", "estadoCivilAdquisicion", "Estado civil al adquirir", options([["soltero", "Soltero"], ["casado", "Casado"], ["divorciado", "Divorciado"], ["viudo", "Viudo"], ["otro", "Otro"]])),
  select("02 / Situación familiar", "regimenAdquisicion", "Régimen al adquirir", options([["sociedad_conyugal", "Sociedad conyugal"], ["separacion", "Separación de bienes"], ["no_aplica", "No aplica"], ["no_sabe", "No sabe"]])),
  select("02 / Situación familiar", "cambioEstadoCivil", "¿Cambió el estado civil o régimen?", yesNo),
  select("02 / Situación familiar", "liquidacion", "Liquidación o adjudicación documentada", options([["si", "Sí"], ["no", "No"], ["pendiente", "Pendiente"], ["no_aplica", "No aplica"]])),
  ...row("03 / Inmueble, adquisición y facultades", [
    ["inmueble", "Domicilio del inmueble"], ["fechaAdquisicion", "Fecha de adquisición", "date"],
    ["tipoTitulo", "Tipo de título o documento de adquisición"], ["titularTitulo", "Titular que consta en el título"],
    ["referenciaNotarial", "Referencia notarial", "text", false], ["otrosTitulares", "Otros titulares y participación", "long", false],
    ["parteVendida", "Parte o derecho que se propone vender"], ["facultadesRepresentante", "Documento y facultades del representante", "long", false],
  ]),
  select("03 / Inmueble, adquisición y facultades", "tipoInmueble", "Tipo de inmueble", options([["casa", "Casa"], ["departamento", "Departamento"], ["terreno", "Terreno"], ["local", "Local"], ["plaza", "Plaza o conjunto"], ["nave", "Nave o bodega"], ["otro", "Otro"]])),
  select("03 / Inmueble, adquisición y facultades", "adquisicion", "Forma de adquisición", options([["compraventa", "Compraventa"], ["herencia", "Herencia"], ["donacion", "Donación"], ["adjudicacion", "Adjudicación"], ["cesion", "Cesión"], ["otro", "Otra"]])),
  select("03 / Inmueble, adquisición y facultades", "tituloInscrito", "¿Título inscrito?", yesNo),
  select("03 / Inmueble, adquisición y facultades", "copiaTitulo", "¿Cuenta con copia del título?", yesNo),
  select("03 / Inmueble, adquisición y facultades", "representacion", "¿Actúa mediante representante?", yesNo),
  ...row("04 / Ocupación y problemas declarados", [
    ["fechaFinOcupacion", "Vencimiento del acuerdo de ocupación", "date", false],
    ["acreedor", "Acreedor del gravamen", "text", false], ["saldoGravamen", "Saldo declarado del gravamen", "money", false],
    ["monedaGravamen", "Moneda del saldo", "text", false], ["fechaEstadoCuenta", "Fecha del estado de cuenta", "date", false],
    ["otrosProblemas", "Adeudos, litigios, embargos, sucesión o reclamaciones", "long", false],
    ["importeProblemas", "Importe declarado de los problemas", "money", false], ["responsableProblemas", "Responsable de resolver problemas", "text", false],
    ["compromisoPrevio", "Persona, documento, importe y vigencia de compromiso previo", "long", false],
  ]),
  select("04 / Ocupación y problemas declarados", "ocupacion", "Ocupación actual", options([["propietario", "Propietario"], ["familia", "Familia"], ["inquilino", "Inquilino"], ["desocupado", "Desocupado"], ["otro", "Otra"]])),
  select("04 / Ocupación y problemas declarados", "acuerdoOcupacion", "¿Hay acuerdo de ocupación?", yesNo),
  select("04 / Ocupación y problemas declarados", "gravamen", "Situación de gravamen o crédito", options([["no", "Ninguno declarado"], ["banco", "Banco"], ["infonavit", "Infonavit"], ["fovissste", "Fovissste"], ["otro", "Otro"], ["no_sabe", "No sabe"]])),
  select("04 / Ocupación y problemas declarados", "problemas", "¿Hay problemas o reclamaciones?", yesNo),
  select("04 / Ocupación y problemas declarados", "promesaPrevia", "¿Existe promesa, anticipo, opción u otra agencia?", yesNo),
  ...row("05 / Antecedentes fiscales declarados", [
    ["periodoHabitacion", "Periodo de uso como casa habitación", "text", false], ["domicilioSoportes", "Comprobantes de domicilio y fechas", "long", false],
    ["ventasPrevias", "Fechas y tipos de ventas previas", "long", false], ["fechaExencion", "Fecha y notario de exención previa", "text", false],
    ["documentosDeducciones", "Escritura, pagos y CFDI disponibles", "long", false],
    ["profesionalFiscal", "Contador o notario consultado", "text", false], ["conclusionFiscal", "Conclusión y soporte de la revisión", "long", false],
  ]),
  select("05 / Antecedentes fiscales declarados", "casaHabitacion", "¿Es o fue casa habitación?", yesNo),
  select("05 / Antecedentes fiscales declarados", "exencionTresAnios", "¿Enajenó otro inmueble en los últimos tres años?", options([["si", "Sí"], ["no", "No"], ["no_recuerda", "No recuerda"]])),
  select("05 / Antecedentes fiscales declarados", "exencionPrevia", "¿Aplicó exención de ISR por casa habitación?", yesNo),
  select("05 / Antecedentes fiscales declarados", "revisionFiscal", "¿Hubo revisión de contador o notario?", options([["si", "Sí"], ["no", "No"], ["pendiente", "Pendiente"]])),
  ...row("06 / Motivo, precio y condiciones", [
    ["motivoVenta", "Motivo de la operación", "long"], ["objetivo", "Objetivo del propietario", "long"],
    ["fechaDeseada", "Fecha deseada de venta", "date"], ["fechaLimite", "Fecha límite y consecuencia", "long"],
    ["precioDeseado", "Precio deseado", "money"], ["monedaPrecio", "Moneda del precio"], ["fuentePrecio", "Fuente del precio deseado"],
    ["precioMinimo", "Precio mínimo interno", "money", false], ["monedaMinimo", "Moneda del mínimo", "text", false],
    ["netoNecesario", "Neto necesario", "money", false], ["monedaNeto", "Moneda del neto", "text", false],
    ["formasPago", "Formas de pago aceptables y condiciones", "long"], ["noNegociables", "Condiciones no negociables", "long"],
    ["bienesIncluidos", "Bienes incluidos", "long"], ["bienesExcluidos", "Bienes excluidos", "long"],
    ["fechaEntrega", "Fecha prevista de entrega", "date"], ["condicionesEntrega", "Condiciones de entrega", "long"],
    ["condicionRevisionPrecio", "Condición para revisar el precio", "text", false],
  ]),
  select("06 / Motivo, precio y condiciones", "basePrecio", "Base del precio deseado", options([["total", "Total de venta"], ["neto", "Neto para el propietario"]])),
  select("06 / Motivo, precio y condiciones", "baseMinimo", "Base del mínimo interno", options([["total", "Total de venta"], ["neto", "Neto para el propietario"], ["por_definir", "Por definir"]])),
  select("06 / Motivo, precio y condiciones", "netoEstado", "¿Neto necesario o requiere estimación?", options([["declarado", "Neto declarado"], ["estimacion", "Solicita estimación"], ["por_definir", "Por definir"]])),
  select("06 / Motivo, precio y condiciones", "dependeMudanza", "¿Entrega depende de otra mudanza?", yesNo),
  select("06 / Motivo, precio y condiciones", "revisionPrecio", "¿Acepta revisar precio con evidencia?", options([["si", "Sí"], ["no", "No"], ["depende", "Depende"]])),
  ...row("07 / Experiencia y expectativas", [
    ["tiempoOferta", "Desde cuándo ofrece el inmueble"], ["mediosPrevios", "Medios y agencias usados", "long"],
    ["ofertasPrevias", "Ofertas previas y por qué no prosperaron", "long"], ["expectativas", "Expectativas y preocupaciones", "long"],
    ["acceso", "Quién puede mostrar y dar acceso"], ["horariosVisita", "Horarios de visita"], ["restriccionesVisita", "Restricciones de visita", "long"],
  ]),
  select("07 / Experiencia y expectativas", "intermediacion", "¿Aceptaría intermediación?", options([["si", "Sí"], ["no", "No"], ["terminos", "Quiere conocer términos"]])),
  select("07 / Experiencia y expectativas", "exclusividad", "¿Consideraría exclusividad?", options([["si", "Sí"], ["no", "No"], ["por_definir", "Por definir"]])),
  ...row("08 / Acuerdos y seguimiento", [
    ["motivoSiguiente", "Motivo del siguiente paso", "long"], ["responsableSeguimiento", "Responsable del seguimiento"],
    ["fechaSeguimiento", "Fecha de seguimiento", "date"],
  ]),
  select("08 / Acuerdos y seguimiento", "documentosEstado", "Estado de documentos por entregar", options([["registrados", "Hay documentos acordados"], ["ninguno", "Ninguno acordado"]])),
  base("08 / Acuerdos y seguimiento", "documentosPrometidos", "Documentos por entregar", "entrevistaRows", false),
  select("08 / Acuerdos y seguimiento", "contradiccionesEstado", "Estado de contradicciones o datos faltantes", options([["registradas", "Hay puntos por aclarar"], ["ninguno", "No se identificaron en la entrevista"]])),
  base("08 / Acuerdos y seguimiento", "contradicciones", "Contradicciones y datos faltantes", "entrevistaRows", false),
  select("08 / Acuerdos y seguimiento", "siguientePaso", "Siguiente paso", options([["visita", "Visita inicial"], ["documentos", "Solicitar documentos"], ["juridico_fiscal", "Revisión jurídica y fiscal"], ["evaluacion", "Evaluar operación"], ["pausa", "Pausar"], ["referir", "Referir"]])),
];

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
export function mostrarCampoEntrevista(key: string, data: Record<string, unknown>): boolean {
  if (["fechaAviso", "medioAviso"].includes(key)) return data.avisoPrivacidad === "si";
  if (["viveDesde", "viveHasta"].includes(key)) return data.viveInmueble === "si" || data.viveInmueble === "no";
  if (["conyuge", "fechaMatrimonio", "lugarMatrimonio"].includes(key)) return data.estadoCivilActual === "casado" || data.estadoCivilAdquisicion === "casado";
  if (key === "documentoRegimen") return data.cambioEstadoCivil === "si" || data.liquidacion === "si";
  if (key === "facultadesRepresentante") return data.representacion === "si" || data.relacion === "representante";
  if (key === "fechaFinOcupacion") return data.acuerdoOcupacion === "si";
  if (["acreedor", "saldoGravamen", "monedaGravamen", "fechaEstadoCuenta"].includes(key)) return !["no", "no_sabe", ""].includes(String(data.gravamen ?? ""));
  if (["otrosProblemas", "importeProblemas", "responsableProblemas"].includes(key)) return data.problemas === "si";
  if (key === "compromisoPrevio") return data.promesaPrevia === "si";
  if (["periodoHabitacion", "domicilioSoportes"].includes(key)) return data.casaHabitacion === "si";
  if (key === "ventasPrevias") return data.exencionTresAnios === "si";
  if (key === "fechaExencion") return data.exencionPrevia === "si";
  if (["profesionalFiscal", "conclusionFiscal"].includes(key)) return data.revisionFiscal === "si";
  if (["netoNecesario", "monedaNeto"].includes(key)) return data.netoEstado === "declarado";
  if (key === "condicionRevisionPrecio") return data.revisionPrecio === "depende";
  if (key === "documentosPrometidos") return data.documentosEstado === "registrados";
  if (key === "contradicciones") return data.contradiccionesEstado === "registradas";
  return true;
}
export function validarEntrevista(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const requireWhen = (condition: boolean, key: string) => {
    if (condition && !hasText(data[key]) && !(typeof data[key] === "number" && Number.isFinite(data[key]) && data[key] >= 0)) errors.push(entrevistaFields.find((field) => field.key === key)!.label);
  };
  requireWhen(data.avisoPrivacidad === "si", "fechaAviso");
  requireWhen(data.avisoPrivacidad === "si", "medioAviso");
  requireWhen(data.estadoCivilActual === "casado" || data.estadoCivilAdquisicion === "casado", "conyuge");
  requireWhen(data.estadoCivilAdquisicion === "casado", "fechaMatrimonio");
  requireWhen(data.estadoCivilAdquisicion === "casado", "lugarMatrimonio");
  requireWhen(data.cambioEstadoCivil === "si" || data.liquidacion === "si", "documentoRegimen");
  requireWhen(data.representacion === "si" || data.relacion === "representante", "facultadesRepresentante");
  requireWhen(data.acuerdoOcupacion === "si", "fechaFinOcupacion");
  requireWhen(mostrarCampoEntrevista("acreedor", data), "acreedor");
  requireWhen(mostrarCampoEntrevista("saldoGravamen", data), "saldoGravamen");
  requireWhen(mostrarCampoEntrevista("monedaGravamen", data), "monedaGravamen");
  requireWhen(data.problemas === "si", "otrosProblemas");
  requireWhen(data.promesaPrevia === "si", "compromisoPrevio");
  requireWhen(data.casaHabitacion === "si", "periodoHabitacion");
  requireWhen(data.exencionTresAnios === "si", "ventasPrevias");
  requireWhen(data.exencionPrevia === "si", "fechaExencion");
  requireWhen(data.revisionFiscal === "si", "profesionalFiscal");
  requireWhen(data.revisionFiscal === "si", "conclusionFiscal");
  requireWhen(data.netoEstado === "declarado", "netoNecesario");
  requireWhen(data.netoEstado === "declarado", "monedaNeto");
  requireWhen(data.revisionPrecio === "depende", "condicionRevisionPrecio");
  for (const [key, state] of [["documentosPrometidos", "registrados"], ["contradicciones", "registradas"]] as const) {
    const rows = data[key];
    if (data[key === "documentosPrometidos" ? "documentosEstado" : "contradiccionesEstado"] !== state) continue;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 30) { errors.push(entrevistaFields.find((field) => field.key === key)!.label); continue; }
    for (const entry of rows) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || ENTREVISTA_TABLES[key].columns.some((column) => !hasText((entry as Record<string, unknown>)[column.key]))) errors.push(entrevistaFields.find((field) => field.key === key)!.label);
      if (key === "documentosPrometidos" && entry && typeof entry === "object" && !Array.isArray(entry)) {
        const value = (entry as Record<string, unknown>).fecha;
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) errors.push("Fecha acordada para documento");
      }
    }
  }
  if (typeof data.precioDeseado === "number" && data.precioDeseado <= 0) errors.push("Precio deseado");
  if (typeof data.precioMinimo === "number" && typeof data.precioDeseado === "number" && data.baseMinimo === data.basePrecio && data.monedaMinimo === data.monedaPrecio && data.precioMinimo > data.precioDeseado) errors.push("Precio mínimo interno");
  return [...new Set(errors)];
}
