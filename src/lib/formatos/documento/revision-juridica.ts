import { formatoById } from "../catalog";
import { JURIDICA_TABLES } from "../juridica";
import { a, fecha, filas, junta, type Block, type Documento, type FormCell, type Marca } from "./modelo";

/*
  05 · Revisión jurídica y control de cierre, con el diseño y el orden de su plantilla
  (04_Metodologia/01_Captacion/05_RevisionJuridica.docx, 26/10/2026): formulario de
  identificación, tablas de control documental, tracto, cargas, controles especiales,
  hallazgos, conclusión, decisión por etapa y condiciones de cierre.
  Captura sobre el documento (EXT-12, 28/10/2026): el título va en el membrete; cada celda y
  cada tabla dicen qué campos las llenan («keys» y «zona») y las opciones impresas son casillas.
*/

type Data = Record<string, unknown>;
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const opciones = (key: string) => formatoById("05").fields.find(field => field.key === key)?.options ?? [];
const choice = (key: string, value: unknown) => opciones(key).find(o => o.value === value)?.label ?? a(value);
const c = (q: string, answer: string, w: number, keys: string[]): FormCell => ({ q, a: answer, w, keys });
/** Casillas de la plantilla («□ Venta  □ Renta  □ Otra»); la elegida lleva su X. */
const marcas = (q: string, key: string, d: Data, w: number): FormCell => ({ q, a: "", w, keys: [key], marks: [opciones(key).map((o): Marca => ({ text: o.label, check: o.value === d[key] }))] });

/** Tabla del panel con su encabezado: filas fijas con su concepto o filas capturadas. Pulsarla abre su editor. */
function tabla(key: keyof typeof JURIDICA_TABLES, d: Data, first?: string): Block {
  const config = JURIDICA_TABLES[key];
  const saved = filas(d[key]);
  const zona = { keys: [key], label: config.label };
  const cell = (row: Record<string, unknown>, column: (typeof config.columns)[number]) => column.options ? (column.options.find(o => o.value === row[column.key])?.label ?? a(row[column.key])) : f(row[column.key]);
  if (config.fixed) {
    const rows = config.fixed.map(item => { const row = saved.find(r => r.concepto === item.key) ?? {}; return [`${key === "documentos" ? `${item.key} · ` : ""}${item.label}`, ...config.columns.map(c => cell(row, c))]; });
    return { kind: "grid", zona, widths: [3, ...config.columns.map(c => (c.options ? 1.6 : 3.2))], header: [first ?? "Concepto", ...config.columns.map(c => c.label)], rows };
  }
  const rows = (saved.length ? saved : [{}, {}]).map(row => config.columns.map(c => cell(row, c)));
  return { kind: "grid", zona, widths: config.columns.map(c => (c.options || c.type === "date" ? 1.6 : 3)), header: config.columns.map(c => c.label), rows };
}

export function revisionJuridicaDocumento(d: Data): Documento {
  const inmueble: Block = { kind: "form", zona: { keys: ["inmueble"], label: "Domicilio y unidad" }, label: `INMUEBLE  ·  ${a(d.inmueble) || "____________________"}`, rows: [] };
  const grupo = (text: string): Block[] => [{ kind: "pagebreak" }, { kind: "title", text, bold: true, size: 24 }, inmueble];
  const hallazgos = filas(d.hallazgos);
  // Cada bloque de hallazgo abre la lista completa, como una tabla de filas variables.
  const zonaHallazgos = { keys: ["hallazgosEstado", "hallazgos"], label: "Hallazgos y subsanación" };
  const blocks: Block[] = [
    { kind: "form", label: "01 Encargo e identificación", rows: [
      // El ID de la operación lo asigna el sistema.
      [c("ID inmueble", a(d.idInmueble), 2, ["idInmueble"]), { q: "ID operación", a: a(d.folio), w: 2 }, c("Fecha de corte / versión", junta(f(d.fechaCorte), d.versionRevision), 2, ["fechaCorte", "versionRevision"])],
      [c("Domicilio y unidad del inmueble", a(d.inmueble), 6, ["inmueble"])],
      [c("Municipio / clave catastral", junta(d.municipio, d.claveCatastral), 2, ["municipio", "claveCatastral"]), c("Folio real o antecedente registral", a(d.folioReal), 2, ["folioReal"]), c("Parte solicitante / calidad", a(d.solicitante), 2, ["solicitante"])],
      [marcas("Operación y etapa a decidir", "operacion", d, 3), marcas("Alcance de revisión", "alcance", d, 3)],
    ] },
    { kind: "form", label: "02 Personas, titularidad y facultades", rows: [] },
    { kind: "note", text: "Use el ID de persona del expediente. Incluya al titular registral, quien pretende disponer y, cuando aplique, cónyuge, copropietario, representante o sucesión." },
    tabla("personas", d),
    { kind: "form", rows: [
      [c("Estado civil al adquirir / fecha de adquisición", a(d.estadoCivilAdquisicion), 3, ["estadoCivilAdquisicion"]), c("Estado civil actual / cambios acreditados", a(d.estadoCivilActual), 3, ["estadoCivilActual"])],
      [c("Régimen patrimonial / capitulaciones / evidencia", a(d.regimen), 3, ["regimen"]), c("Consentimientos y firmas necesarios / fundamento", a(d.consentimientos), 3, ["consentimientos"])],
      [c("Representación: acto autorizado, límites, vigencia, revocación y forma de comprobar facultades", a(d.representacion), 6, ["representacion"])],
    ] },
    { kind: "note", text: "No suponga facultades por parentesco, posesión, pago de servicios o firma de intermediación. En divorcio o fallecimiento, revise también liquidación, adjudicación y legitimación para el acto concreto." },

    ...grupo("Control documental"),
    { kind: "form", label: "03 Recepción y verificación", rows: [] },
    { kind: "note", text: "Aplica: sí · no (indique motivo) · por determinar. Estado: no recibido · recibido · insuficiente · verificado. Recibido no implica autenticidad, vigencia ni conformidad jurídica." },
    { kind: "note", text: "En referencia anote ID de evidencia, emisor, folio y fecha. En verificación: original o copia, integridad, fuente consultada, fecha, resultado y revisor. El detalle puede remitirse a una nota identificada del expediente." },
    tabla("documentos", d, "Documento"),
    { kind: "note", text: "La lista es condicional: no solicite todo en cada operación. Distinga el recibo pagado del estado de adeudos o constancia correspondiente. Una boleta de agua no prueba por sí sola propiedad ni exención fiscal." },

    ...grupo("Título, tracto y situación registral"),
    { kind: "form", label: "04 Cadena de titularidad y descripción", rows: [] },
    tabla("tracto", d),
    { kind: "form", rows: [[c("Conclusión del tracto: eslabones comprobados, faltantes o incompatibles / evidencia", a(d.conclusionTracto), 6, ["conclusionTracto"])]] },
    tabla("contraste", d),
    { kind: "form", label: "05 Gravámenes, restricciones y controversias", rows: [] },
    tabla("cargas", d),
    { kind: "form", rows: [[c("Consultas registrales y judiciales: autoridad, criterios de búsqueda, alcance, fecha y resultado", a(d.consultas), 6, ["consultas"])]] },
    { kind: "note", text: "Revise hipotecas, embargos, avisos, servidumbres, usufructo, patrimonio de familia y otras restricciones que resulten aplicables. No equipare una búsqueda sin resultados a inexistencia de litigios. Registrar fecha de corte y necesidad de actualización." },
    { kind: "form", label: "06 Posesión y compromisos existentes", rows: [
      [c("Quién ocupa / título de ocupación / plazo", a(d.ocupacion), 3, ["ocupacion"]), c("Contratos, promesas, opciones o exclusivas vigentes", a(d.compromisos), 3, ["compromisos"])],
      [c("Posesión: título de ocupación, desocupación exigible, preferencias, depósitos, bienes de terceros y conflictos", a(d.posesion), 6, ["posesion"])],
    ] },

    ...grupo("Revisiones según el caso"),
    { kind: "form", label: "07 Aplicabilidad y controles especiales", rows: [] },
    { kind: "note", text: "Conforme · hallazgo · pendiente · no aplica · fuera de alcance. Registre evidencia o motivo. Un punto fuera de alcance que afecte el cierre debe quedar como pendiente en la conclusión." },
    tabla("especiales", d, "Control"),
    { kind: "form", label: "08 Fiscal, adeudos y ruta de formalización", rows: [
      [c("Predial: cuenta, periodo, saldo o aclaración / fuente y fecha", a(d.predial), 3, ["predial"]), c("CESPT: cuenta, titular, saldo o aclaración / fuente y fecha", a(d.agua), 3, ["agua"])],
      [c("Otros adeudos: condominio, contribuciones o servicios / evidencia", a(d.otrosAdeudos), 3, ["otrosAdeudos"]), c("Responsable de pago / acuerdo / comprobación pendiente", a(d.responsableAdeudos), 3, ["responsableAdeudos"])],
      [c("ISR y posible exención: residencia y enajenaciones previas declaradas, soporte y validación de notaría o contador", a(d.fiscal), 6, ["fiscal"])],
      [c("Crédito, avalúo y requisitos de banco o notaría", a(d.credito), 3, ["credito"]), c("Impuestos y gastos: referencia al cálculo validado / fecha / responsable", a(d.gastos), 3, ["gastos"])],
    ] },
    { kind: "note", text: "No determine exención ni impuestos con esta ficha. Separe lo declarado de lo comprobado; documente criterio, vigencia y revisión profesional. Las obligaciones PLD y sus plazos se determinan para el sujeto y acto concretos, sin usar importes fijos en la plantilla." },

    ...grupo("Hallazgos y conclusión jurídica"),
    { kind: "form", label: "09 Hallazgos y acciones para subsanar", rows: [] },
    { kind: "note", text: "Asigne H01, H02… Vincule cada hallazgo con evidencia, fundamento y etapa afectada. Recibir un documento no cierra automáticamente un hallazgo." },
    ...(d.hallazgosEstado && !hallazgos.length ? [{ kind: "form", zona: zonaHallazgos, rows: [[{ q: "Estado de hallazgos", a: choice("hallazgosEstado", d.hallazgosEstado), w: 6 }]] } as Block]
      : (hallazgos.length ? hallazgos : [{}]).map((h): Block => ({ kind: "form", zona: zonaHallazgos, rows: [
        [{ q: "ID hallazgo", a: a(h.id), w: 1.5 }, { q: "Tema y etapa afectada", a: a(h.tema), w: 3 }, { q: "Impacto / probabilidad razonados", a: a(h.impacto), w: 1.5 }],
        [{ q: "Hecho, contradicción o falta / evidencia y localizador / declarado frente a comprobado", a: a(h.hecho), w: 6 }],
        [{ q: "Fundamento vigente o criterio: autoridad, norma, artículo, fecha / exigencia legal, trámite o práctica", a: a(h.fundamento), w: 6 }],
        [{ q: "Acción correctiva / condición para avanzar", a: a(h.accion), w: 3 }, { q: "Responsable / fecha límite / etapa que bloquea", a: junta(h.responsable, f(h.fecha)), w: 3 }],
        [{ q: "Evidencia de subsanación / revisor y fecha / estado abierto o cerrado / riesgo residual", a: junta(h.subsanacion, h.estado), w: 6 }],
      ] }))),
    { kind: "form", label: "10 Conclusión del abogado responsable", rows: [
      [marcas("Resultado para la operación y etapa examinadas", "resultado", d, 6)],
      [c("Razones y evidencias determinantes / qué puede hacerse hoy / condiciones o actos que deben esperar", junta(d.conclusion, d.puedeHacerse), 6, ["conclusion", "puedeHacerse"])],
      [c("Limitaciones de la revisión / riesgo que permanece", a(d.limitaciones), 3, ["limitaciones"]), c("Hecho o fecha que obliga a actualizar la revisión", a(d.actualizar), 3, ["actualizar"])],
    ] },
    { kind: "note", text: "Factible: sin bloqueo material identificado para la etapa. Con condiciones: acciones expresas antes de avanzar. No factible temporalmente: bloqueo corregible. No recomendable: riesgo residual inaceptable. Indeterminada: evidencia esencial insuficiente. No marque una conclusión sin sustento." },

    ...grupo("Control de avance y cierre"),
    { kind: "form", label: "11 Decisión por etapa", rows: [] },
    { kind: "note", text: "Debe coincidir con la conclusión y los hallazgos. Una etapa posterior no se libera por haber autorizado una anterior." },
    tabla("etapas", d, "Etapa"),
    { kind: "form", label: "12 Cumplimiento de condiciones de cierre", rows: [] },
    tabla("cierre", d, "Condición"),
    { kind: "form", rows: [
      [c("Cancelación o cambio de operación / motivo / versión relacionada", a(d.cambioOperacion), 3, ["cambioOperacion"]), c("Pendientes que continúan / responsable / próxima revisión", a(d.pendientes), 3, ["pendientes"])],
      [c("Abogado responsable · nombre completo", a(d.abogado), 2.6, ["abogado"]), c("Cédula profesional", a(d.cedula), 1.8, ["cedula"]), c("Fecha de revisión", f(d.fechaRevision), 1.6, ["fechaRevision"])],
      // La firma es a mano.
      [{ q: "Firma del abogado responsable", a: "", w: 3 }, c("Integró · nombre y fecha", a(d.integrador), 3, ["integrador"])],
    ] },
  ];
  return { title: "Revisión jurídica y control de cierre", subject: `Formato 05 · ${a(d.folio)}`, blocks };
}
