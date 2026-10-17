import { formatoById } from "../catalog";
import { JURIDICA_TABLES } from "../juridica";
import { a, fecha, filas, junta, type Block, type Documento } from "./modelo";

/*
  05 · Revisión jurídica y control de cierre, con el diseño y el orden de su plantilla
  (Metodología/05.Revision_juridica_y_control_de_cierre.docx): formulario de
  identificación, tablas de control documental, tracto, cargas, controles especiales,
  hallazgos, conclusión, decisión por etapa y condiciones de cierre.
*/

type Data = Record<string, unknown>;
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const choice = (key: string, value: unknown) => formatoById("05").fields.find(field => field.key === key)?.options?.find(o => o.value === value)?.label ?? a(value);

/** Tabla del panel con su encabezado: filas fijas con su concepto o filas capturadas. */
function tabla(key: keyof typeof JURIDICA_TABLES, d: Data, first?: string): Block {
  const config = JURIDICA_TABLES[key];
  const saved = filas(d[key]);
  const cell = (row: Record<string, unknown>, column: (typeof config.columns)[number]) => column.options ? (column.options.find(o => o.value === row[column.key])?.label ?? a(row[column.key])) : f(row[column.key]);
  if (config.fixed) {
    const rows = config.fixed.map(item => { const row = saved.find(r => r.concepto === item.key) ?? {}; return [`${key === "documentos" ? `${item.key} · ` : ""}${item.label}`, ...config.columns.map(c => cell(row, c))]; });
    return { kind: "grid", widths: [3, ...config.columns.map(c => (c.options ? 1.6 : 3.2))], header: [first ?? "Concepto", ...config.columns.map(c => c.label)], rows };
  }
  const rows = (saved.length ? saved : [{}, {}]).map(row => config.columns.map(c => cell(row, c)));
  return { kind: "grid", widths: config.columns.map(c => (c.options || c.type === "date" ? 1.6 : 3)), header: config.columns.map(c => c.label), rows };
}

export function revisionJuridicaDocumento(d: Data): Documento {
  const inmueble: Block = { kind: "form", label: `INMUEBLE  ·  ${a(d.inmueble) || "____________________"}`, rows: [] };
  const grupo = (text: string): Block[] => [{ kind: "pagebreak" }, { kind: "title", text, bold: true, size: 24 }, inmueble];
  const hallazgos = filas(d.hallazgos);
  const blocks: Block[] = [
    { kind: "title", text: "Revisión jurídica y control de cierre", bold: true, size: 24 },
    { kind: "form", label: "01 Encargo e identificación", rows: [
      [{ q: "ID inmueble", a: a(d.idInmueble), w: 2 }, { q: "ID operación", a: a(d.folio), w: 2 }, { q: "Fecha de corte / versión", a: junta(f(d.fechaCorte), d.versionRevision), w: 2 }],
      [{ q: "Domicilio y unidad del inmueble", a: a(d.inmueble), w: 6 }],
      [{ q: "Municipio / clave catastral", a: junta(d.municipio, d.claveCatastral), w: 2 }, { q: "Folio real o antecedente registral", a: a(d.folioReal), w: 2 }, { q: "Parte solicitante / calidad", a: a(d.solicitante), w: 2 }],
      [{ q: "Operación y etapa a decidir", a: a(d.operacion), w: 3 }, { q: "Alcance de revisión", a: a(d.alcance), w: 3 }],
    ] },
    { kind: "form", label: "02 Personas, titularidad y facultades", rows: [] },
    { kind: "note", text: "Use el ID de persona del expediente. Incluya al titular registral, quien pretende disponer y, cuando aplique, cónyuge, copropietario, representante o sucesión." },
    tabla("personas", d),
    { kind: "form", rows: [
      [{ q: "Estado civil al adquirir / fecha de adquisición", a: a(d.estadoCivilAdquisicion), w: 3 }, { q: "Estado civil actual / cambios acreditados", a: a(d.estadoCivilActual), w: 3 }],
      [{ q: "Régimen patrimonial / capitulaciones / evidencia", a: a(d.regimen), w: 3 }, { q: "Consentimientos y firmas necesarios / fundamento", a: a(d.consentimientos), w: 3 }],
      [{ q: "Representación: acto autorizado, límites, vigencia, revocación y forma de comprobar facultades", a: a(d.representacion), w: 6 }],
    ] },
    { kind: "note", text: "No suponga facultades por parentesco, posesión, pago de servicios o firma de intermediación. En divorcio o fallecimiento, revise también liquidación, adjudicación y legitimación para el acto concreto." },

    ...grupo("Control documental"),
    { kind: "form", label: "03 Recepción y verificación", rows: [] },
    { kind: "note", text: "Aplica: sí · no (indique motivo) · por determinar. Estado: no recibido · recibido · insuficiente · verificado. Recibido no implica autenticidad, vigencia ni conformidad jurídica." },
    tabla("documentos", d, "Documento"),
    { kind: "note", text: "La lista es condicional: no solicite todo en cada operación. Distinga el recibo pagado del estado de adeudos o constancia correspondiente. Una boleta de agua no prueba por sí sola propiedad ni exención fiscal." },

    ...grupo("Título, tracto y situación registral"),
    { kind: "form", label: "04 Cadena de titularidad y descripción", rows: [] },
    tabla("tracto", d),
    { kind: "form", rows: [[{ q: "Conclusión del tracto: eslabones comprobados, faltantes o incompatibles / evidencia", a: a(d.conclusionTracto), w: 6 }]] },
    tabla("contraste", d),
    { kind: "form", label: "05 Gravámenes, restricciones y controversias", rows: [] },
    tabla("cargas", d),
    { kind: "form", rows: [[{ q: "Consultas registrales y judiciales: autoridad, criterios de búsqueda, alcance, fecha y resultado", a: a(d.consultas), w: 6 }]] },
    { kind: "note", text: "Revise hipotecas, embargos, avisos, servidumbres, usufructo, patrimonio de familia y otras restricciones que resulten aplicables. No equipare una búsqueda sin resultados a inexistencia de litigios." },
    { kind: "form", label: "06 Posesión y compromisos existentes", rows: [
      [{ q: "Quién ocupa / título de ocupación / plazo", a: a(d.ocupacion), w: 3 }, { q: "Contratos, promesas, opciones o exclusivas vigentes", a: a(d.compromisos), w: 3 }],
      [{ q: "Posesión: título de ocupación, desocupación exigible, preferencias, depósitos, bienes de terceros y conflictos", a: a(d.posesion), w: 6 }],
    ] },

    ...grupo("Revisiones según el caso"),
    { kind: "form", label: "07 Aplicabilidad y controles especiales", rows: [] },
    { kind: "note", text: "Conforme · hallazgo · pendiente · no aplica · fuera de alcance. Registre evidencia o motivo. Un punto fuera de alcance que afecte el cierre debe quedar como pendiente en la conclusión." },
    tabla("especiales", d, "Control"),
    { kind: "form", label: "08 Fiscal, adeudos y ruta de formalización", rows: [
      [{ q: "Predial: cuenta, periodo, saldo o aclaración / fuente y fecha", a: a(d.predial), w: 3 }, { q: "CESPT: cuenta, titular, saldo o aclaración / fuente y fecha", a: a(d.agua), w: 3 }],
      [{ q: "Otros adeudos: condominio, contribuciones o servicios / evidencia", a: a(d.otrosAdeudos), w: 3 }, { q: "Responsable de pago / acuerdo / comprobación pendiente", a: a(d.responsableAdeudos), w: 3 }],
      [{ q: "ISR y posible exención: residencia y enajenaciones previas declaradas, soporte y validación de notaría o contador", a: a(d.fiscal), w: 6 }],
      [{ q: "Crédito, avalúo y requisitos de banco o notaría", a: a(d.credito), w: 3 }, { q: "Impuestos y gastos: referencia al cálculo validado / fecha / responsable", a: a(d.gastos), w: 3 }],
    ] },
    { kind: "note", text: "No determine exención ni impuestos con esta ficha. Separe lo declarado de lo comprobado; documente criterio, vigencia y revisión profesional." },

    ...grupo("Hallazgos y conclusión jurídica"),
    { kind: "form", label: "09 Hallazgos y acciones para subsanar", rows: [] },
    { kind: "note", text: "Vincule cada hallazgo con evidencia, fundamento y etapa afectada. Recibir un documento no cierra automáticamente un hallazgo." },
    ...(d.hallazgosEstado && !hallazgos.length ? [{ kind: "form", rows: [[{ q: "Estado de hallazgos", a: choice("hallazgosEstado", d.hallazgosEstado), w: 6 }]] } as Block]
      : (hallazgos.length ? hallazgos : [{}]).map((h): Block => ({ kind: "form", rows: [
        [{ q: "ID hallazgo", a: a(h.id), w: 1.5 }, { q: "Tema y etapa afectada", a: a(h.tema), w: 3 }, { q: "Impacto / probabilidad razonados", a: a(h.impacto), w: 1.5 }],
        [{ q: "Hecho, contradicción o falta / evidencia y localizador / declarado frente a comprobado", a: a(h.hecho), w: 6 }],
        [{ q: "Fundamento vigente o criterio: autoridad, norma, artículo, fecha", a: a(h.fundamento), w: 6 }],
        [{ q: "Acción correctiva / condición para avanzar", a: a(h.accion), w: 3 }, { q: "Responsable / fecha límite / etapa que bloquea", a: junta(h.responsable, f(h.fecha)), w: 3 }],
        [{ q: "Evidencia de subsanación / revisor y fecha / estado abierto o cerrado / riesgo residual", a: junta(h.subsanacion, h.estado), w: 6 }],
      ] }))),
    { kind: "form", label: "10 Conclusión del abogado responsable", rows: [
      [{ q: "Resultado para la operación y etapa examinadas", a: choice("resultado", d.resultado), w: 6 }],
      [{ q: "Razones y evidencias determinantes / qué puede hacerse hoy / condiciones o actos que deben esperar", a: junta(d.conclusion, d.puedeHacerse), w: 6 }],
      [{ q: "Limitaciones de la revisión / riesgo que permanece", a: a(d.limitaciones), w: 3 }, { q: "Hecho o fecha que obliga a actualizar la revisión", a: a(d.actualizar), w: 3 }],
    ] },
    { kind: "note", text: "Factible: sin bloqueo material identificado para la etapa. Con condiciones: acciones expresas antes de avanzar. No factible temporalmente: bloqueo corregible. No recomendable: riesgo residual inaceptable. Indeterminada: evidencia esencial insuficiente." },

    ...grupo("Control de avance y cierre"),
    { kind: "form", label: "11 Decisión por etapa", rows: [] },
    { kind: "note", text: "Debe coincidir con la conclusión y los hallazgos. Una etapa posterior no se libera por haber autorizado una anterior." },
    tabla("etapas", d, "Etapa"),
    { kind: "form", label: "12 Cumplimiento de condiciones de cierre", rows: [] },
    tabla("cierre", d, "Condición"),
    { kind: "form", rows: [
      [{ q: "Cancelación o cambio de operación / motivo / versión relacionada", a: a(d.cambioOperacion), w: 3 }, { q: "Pendientes que continúan / responsable / próxima revisión", a: a(d.pendientes), w: 3 }],
      [{ q: "Abogado responsable · nombre completo", a: a(d.abogado), w: 2.6 }, { q: "Cédula profesional", a: a(d.cedula), w: 1.8 }, { q: "Fecha de revisión", a: f(d.fechaRevision), w: 1.6 }],
      [{ q: "Firma del abogado responsable", a: "", w: 3 }, { q: "Integró · nombre y fecha", a: a(d.integrador), w: 3 }],
    ] },
  ];
  return { title: "Revisión jurídica y control de cierre", subject: `Formato 05 · ${a(d.folio)}`, blocks };
}
