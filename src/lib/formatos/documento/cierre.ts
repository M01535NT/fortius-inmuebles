import { formatoById } from "../catalog";
import { ENTREGA_TABLAS } from "../entrega";
import { importePromesaLetra } from "../promesa";
import { a, dinero, fecha, filas, m, v, type Block, type Documento } from "./modelo";

/*
  16 · Acta de entrega y recepción, 17 · Cierre del expediente y 18 · Recibo de pago de
  honorarios, con el texto y el diseño de sus plantillas: prosa con los datos en sus
  espacios, barras azules por sección y tablas de borde fino. Coinciden con sus plantillas del
  26/10/2026. Captura sobre el documento (EXT-12, 29/10/2026): cada párrafo y tabla dicen qué
  campos los llenan («zona»); el número de recibo lo asigna el sistema.
*/

type Data = Record<string, unknown>;
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : v(value);
const bar = (text: string): Block => ({ kind: "bar", text, raw: true });
const opcion = (id: string, key: string, value: unknown) => formatoById(id).fields.find(x => x.key === key)?.options?.find(o => o.value === value)?.label ?? v(value);

function tablaEntrega(d: Data, key: keyof typeof ENTREGA_TABLAS, estado: string, ninguno: string, base?: string[][]): Block {
  const columns = ENTREGA_TABLAS[key].columns;
  const rows = filas(d[key]);
  return { kind: "grid", zona: { keys: [key, estado], label: ENTREGA_TABLAS[key].label ?? "Tabla" }, widths: columns.map((_, i) => (i === columns.length - 1 && columns.length === 2 ? 2 : 1)), header: columns.map(c => c.label),
    rows: d[estado] === ninguno ? [[...columns.map((_, i) => (i === 0 ? "Ninguno" : ""))]] : rows.length ? rows.map(r => columns.map(c => typeof r[c.key] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r[c.key] as string) ? fecha(r[c.key]) : a(r[c.key]))) : base ?? [columns.map(() => ""), columns.map(() => "")] };
}

export function entregaDocumento(d: Data): Documento {
  const resultado = d.resultadoEntrega === "no_realizada" ? `${opcion("16", "resultadoEntrega", d.resultadoEntrega).toLowerCase()} (${m(d.motivoNoEntrega)})` : opcion("16", "resultadoEntrega", d.resultadoEntrega).toLowerCase();
  const blocks: Block[] = [
    { kind: "title", text: "Acta de entrega y recepción del inmueble" },
    { kind: "p", zona: { keys: ["lugar", "fecha", "horaInicio", "inmueble", "contratoReferencia"], label: "Datos de este párrafo" }, text: `En ${v(d.lugar)}, el ${f(d.fecha)}, a las ${v(d.horaInicio)}, se documenta la entrega del inmueble ubicado en ${v(d.inmueble)}, expediente ${v(d.folio)}, conforme a ${v(d.contratoReferencia)}.` },
    { kind: "p", zona: { keys: ["quienEntrega", "caracterEntrega", "quienRecibe", "caracterRecibe", "identificacionEntrega", "identificacionRecibe", "presentes"], label: "Datos de este párrafo" }, text: `Quien entrega: ${v(d.quienEntrega)}${d.caracterEntrega ? `, ${a(d.caracterEntrega)}` : ""}. Quien recibe: ${v(d.quienRecibe)}${d.caracterRecibe ? `, ${a(d.caracterRecibe)}` : ""}. Identificación y, en su caso, documento que acredita la representación: ${v([a(d.identificacionEntrega), a(d.identificacionRecibe)].filter(Boolean).join("; "))}. Comparecieron efectivamente ${v(d.presentes)}.` },
    bar("01  Resultado de la entrega"),
    { kind: "p", zona: { keys: ["resultadoEntrega", "motivoNoEntrega", "areasEntregadas", "areasSinEntregar", "recepcionFecha", "recepcionHora", "ocupantesTerceros"], label: "Datos de este párrafo" }, text: `El resultado fue ${resultado}. Se recibieron ${m(d.areasEntregadas)}; quedaron sin entregar ${m(d.areasSinEntregar)}. La recepción efectiva ocurrió el ${f(d.recepcionFecha)} a las ${v(d.recepcionHora)}. La situación de ocupantes o bienes de terceros fue ${m(d.ocupantesTerceros)}.` },
    bar("02  Estado del inmueble"),
    { kind: "p", zona: { keys: ["areasRevisadas", "areasNoRevisadas"], label: "Datos de este párrafo" }, text: `Se revisó ${m(d.areasRevisadas)}. Quedó sin revisar ${m(d.areasNoRevisadas)}. Registre únicamente daños, faltantes o diferencias relevantes; si no se detectaron, indíquelo dentro del alcance revisado.` },
    d.estadoDiferencias === "sin_diferencias" ? { kind: "grid", zona: { keys: ["diferencias", "estadoDiferencias"], label: "Estado del inmueble" }, widths: [1, 2], header: ["Área o elemento", "Observación o diferencia"], rows: [["—", "Sin diferencias dentro del alcance revisado"]] } : tablaEntrega(d, "diferencias", "estadoDiferencias", "__"),
    bar("03  Llaves y accesos"),
    { kind: "p", text: "Anote qué acceso corresponde, cuántas piezas se recibieron y, cuando se prueben, el resultado." },
    tablaEntrega(d, "accesos", "estadoAccesos", "ninguno"),
    bar("04  Documentos entregados"),
    { kind: "p", text: "Sólo documentos adicionales entregados en este acto. Si no hay, escriba ninguno." },
    tablaEntrega(d, "documentos", "estadoDocumentos", "ninguno"),
    bar("05  Servicios"),
    { kind: "p", text: "Complete sólo si aplica. Identifique el medidor cuando haya varios y anote la unidad de lectura. Una lectura no acredita saldo cero; si no se pudo leer, indíquelo." },
    d.estadoServicios === "no_aplica" ? { kind: "grid", zona: { keys: ["servicios", "estadoServicios"], label: "Servicios" }, widths: [1, 1, 1], header: ["Servicio", "Lectura y unidad", "Observación"], rows: [["No aplica", "", ""]] } : tablaEntrega(d, "servicios", "estadoServicios", "__", [["Agua", "", ""], ["Electricidad", "", ""]]),
    bar("06  Pendientes"),
    { kind: "p", text: "Registre la acción acordada, quién la realizará y para cuándo. Un plazo no acordado debe quedar como por acordar." },
    tablaEntrega(d, "pendientes", "estadoPendientes", "ninguno"),
    bar("07  Reservas y firma"),
    { kind: "p", zona: { keys: ["manifestacionEntrega", "reservasRecibe", "manifestacionesNoComprobadas", "anexos"], label: "Datos de este párrafo" }, text: `Quien entrega manifiesta ${m(d.manifestacionEntrega)}. Quien recibe manifiesta ${m(d.reservasRecibe)}. Manifestaciones no comprobadas: ${m(d.manifestacionesNoComprobadas)}. Fotografías o inventario complementario: ${m(d.anexos)}.` },
    { kind: "p", text: "Esta acta acredita los hechos asentados dentro del alcance de cada firma; no acredita pago del precio, ausencia de adeudos ni funcionamiento no probado. No implica finiquito automático ni renuncia a derechos por defectos no examinados. Los pendientes continúan hasta comprobar su cumplimiento." },
    { kind: "p", zona: { keys: ["horaFinal", "ausenciasFirma"], label: "Datos de este párrafo" }, text: `El acto concluyó a las ${v(d.horaFinal)}. Quienes firman recibirán una copia completa. Ausencias de firma y motivo conocido: ${m(d.ausenciasFirma)}.` },
    { kind: "signatures", zona: { keys: ["quienEntrega", "quienRecibe"], label: "Firmas" }, line: true, parties: [{ role: "QUIEN ENTREGA", name: v(d.quienEntrega) }, { role: "QUIEN RECIBE", name: v(d.quienRecibe) }] },
  ];
  return { title: "Acta de entrega y recepción del inmueble", subject: `Formato 16 · ${a(d.folio)}`, blocks };
}

/** Puntos de control del 17: su estado y la referencia que permite verificarlo. */
const CONTROLES = [["tableroEstado", "tableroReferencia"], ["juridicaEstado", "juridicaReferencia"], ["entregaEstado", "entregaReferencia"], ["publicacionesEstado", "publicacionesReferencia"], ["accesosEstado", "accesosReferencia"]];

export function cierreDocumento(d: Data): Documento {
  const control = (estado: string, ref: string) => [opcion("17", estado, d[estado]), a(d[ref])].filter(x => x && x !== "____________________").join(" · ");
  const blocks: Block[] = [
    { kind: "title", text: "Cierre del expediente" },
    { kind: "p", text: "Control interno para registrar el resultado de la operación, localizar su documentación y asignar el seguimiento que continúe. No es un finiquito ni acredita por sí solo el cumplimiento de obligaciones." },
    bar("01  Identificación"),
    { kind: "grid", zona: { keys: ["fechaRegistro"], label: "Datos de esta tabla" }, widths: [1, 1], header: ["Folio del expediente", "Fecha de registro"], rows: [[a(d.folio), typeof d.fechaRegistro === "string" ? fecha(d.fechaRegistro) : ""]] },
    { kind: "grid", zona: { keys: ["inmueble"], label: "Datos de esta tabla" }, widths: [1], header: ["Inmueble"], rows: [[a(d.inmueble)]] },
    bar("02  Resultado"),
    { kind: "p", zona: { keys: ["resultadoOperacion", "soporteResultado", "motivoCambio", "expedienteRelacionado"], label: "Datos de este párrafo" }, text: `La operación terminó como ${opcion("17", "resultadoOperacion", d.resultadoOperacion).toLowerCase()}, con soporte en ${v(d.soporteResultado)}. Motivo de cancelación o cambio, si aplica: ${m(d.motivoCambio)}. Expediente relacionado, si existe: ${v(d.expedienteRelacionado)}.` },
    { kind: "p", zona: { keys: ["estadoExpediente"], label: "Datos de este párrafo" }, text: `Estado del expediente: ${opcion("17", "estadoExpediente", d.estadoExpediente).toLowerCase()}. Si falta información esencial o no hay responsable para lo pendiente, no procede cerrar.` },
    bar("03  Comprobación del cierre"),
    { kind: "p", text: "Anote comprobado, pendiente o no aplica; cite el archivo que permite verificarlo. No repita su contenido." },
    { kind: "grid", widths: [1, 1], header: ["Punto de control", "Estado y referencia"], keys: CONTROLES.map(([estado, ref]) => [undefined, [estado, ref]]), rows: [
      ["Resultado actualizado en el tablero 03", control("tableroEstado", "tableroReferencia")],
      ["Situación jurídica actualizada en el 05", control("juridicaEstado", "juridicaReferencia")],
      ["Entrega documentada en el 16, si aplica", control("entregaEstado", "entregaReferencia")],
      ["Publicaciones actualizadas al resultado", control("publicacionesEstado", "publicacionesReferencia")],
      ["Accesos bajo custodia devueltos, si aplica", control("accesosEstado", "accesosReferencia")],
    ] },
    bar("04  Seguimiento pendiente"),
    { kind: "grid", zona: { keys: ["accionesPendientes", "responsablePendientes", "proximaRevision"], label: "Datos de esta tabla" }, widths: [2, 1, 1], header: ["Acción pendiente", "Responsable", "Próxima revisión"], rows: [[a(d.accionesPendientes), a(d.responsablePendientes), typeof d.proximaRevision === "string" ? fecha(d.proximaRevision) : ""]] },
    { kind: "p", text: "Con pendientes y responsable asignado, use terminado con seguimiento; sin responsable, no procede cerrar. Si no hay pendientes, escriba ninguno." },
    bar("05  Archivo"),
    { kind: "p", zona: { keys: ["ubicacionExpediente", "custodiaOriginales", "responsableRegistro"], label: "Datos de este párrafo" }, text: `Ubicación del expediente completo: ${v(d.ubicacionExpediente)}. Documentos originales bajo custodia y su destino: ${m(d.custodiaOriginales)}. Responsable del registro: ${v(d.responsableRegistro)}.` },
    { kind: "p", text: "Archivar no significa borrar. Conserve los documentos conforme al criterio aplicable al expediente; cualquier depuración se decide por separado." },
  ];
  return { title: "Cierre de la operación", subject: `Formato 17 · ${a(d.folio)}`, blocks };
}

export function reciboDocumento(d: Data): Documento {
  const importe = typeof d.importeRecibido === "number" ? dinero(d.importeRecibido) : v(d.importeRecibido);
  const saldo = typeof d.saldo === "number" ? dinero(d.saldo) : v(d.saldo);
  // El importe en letra se escribe solo a partir del importe y su moneda, si no se capturó.
  let letra = a(d.importeLetra);
  try { if (!letra && typeof d.importeRecibido === "number") letra = importePromesaLetra(d.importeRecibido, a(d.moneda) || "MXN"); } catch { /* importe o moneda fuera de rango */ }
  const blocks: Block[] = [
    { kind: "title", text: "Recibo de pago de honorarios" },
    { kind: "grid", zona: { keys: ["numeroRecibo", "lugarEmision"], label: "Número de recibo y lugar de emisión" }, widths: [1, 1], header: ["Número de recibo", "Lugar de emisión"], rows: [[a(d.numeroRecibo), a(d.lugarEmision)]] },
    { kind: "p", zona: { keys: ["fechaPago", "pagador", "importeRecibido", "moneda", "importeLetra", "concepto"], label: "Pago recibido" }, text: `Con fecha de recepción ${f(d.fechaPago)}, recibí de ${v(d.pagador)} la cantidad de ${importe} ${v(d.moneda)}, equivalente a ${v(letra)}, por concepto de ${m(d.concepto)}.` },
    { kind: "p", zona: { keys: ["contratoFecha", "inmueble"], label: "Datos de este párrafo" }, text: `Los honorarios corresponden a los servicios pactados en ${v(d.contratoFecha)}, relativos al inmueble ubicado en ${v(d.inmueble)}, expediente ${v(d.folio)}.` },
    { kind: "p", zona: { keys: ["beneficiario", "representacionBeneficiario", "caracter"], label: "Datos de este párrafo" }, text: `El beneficiario del pago es ${v(d.beneficiario)}. Quien suscribe recibe ${m(d.representacionBeneficiario)}, en carácter de ${m(d.caracter)}.` },
    bar("Medio de pago"),
    { kind: "grid", zona: { keys: ["medioPago", "referenciaPago"], label: "Datos de esta tabla" }, widths: [1, 1], header: ["Medio utilizado", "Referencia del pago"], rows: [[a(d.medioPago), a(d.referenciaPago)]] },
    { kind: "p", zona: { keys: ["soporteRecepcion"], label: "Datos de este párrafo" }, text: `El importe indicado corresponde al pago efectivamente recibido. Su comprobante se identifica en ${v(d.soporteRecepcion)}.` },
    bar("Saldo de los honorarios"),
    { kind: "p", zona: { keys: ["pagoParcialTotal", "saldo", "monedaSaldo", "soporteSaldo"], label: "Datos de este párrafo" }, text: `Este pago es ${m(d.pagoParcialTotal)}. El saldo pendiente del concepto indicado, después de aplicar este pago, es ${saldo} ${v(d.monedaSaldo)}. Su importe se sustenta en ${v(d.soporteSaldo)}.` },
    { kind: "p", text: "Si el saldo no está comprobado, indique por confirmar. Este recibo reconoce únicamente el pago señalado y no libera otros conceptos u obligaciones." },
    bar("Observaciones"),
    { kind: "grid", zona: { keys: ["observaciones"], label: "Datos de esta tabla" }, widths: [1], header: ["Aclaración específica del pago"], rows: [[a(d.observaciones)]] },
    { kind: "p", zona: { keys: ["cfdiEstado"], label: "Datos de este párrafo" }, text: `Referencia del CFDI, si se emitió: ${v(d.cfdiEstado)}. Este recibo no sustituye el CFDI ni el complemento de pagos que corresponda.` },
    bar("Quien recibe"),
    { kind: "signatures", zona: { keys: ["receptor"], label: "Firmas" }, line: true, parties: [{ role: "Firma", name: v(d.receptor) }] },
  ];
  return { title: "Recibo de pago de honorarios", subject: `Formato 18 · ${a(d.folio)}`, blocks };
}
