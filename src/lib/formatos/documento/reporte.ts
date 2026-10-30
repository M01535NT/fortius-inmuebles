import { calcularPublicidadReporte, REPORTE_TABLES } from "../reporte";
import { dinero, fecha, filas, m, v, type Block, type Documento } from "./modelo";

/*
  11 · Reporte de comercialización al propietario, con el texto y el diseño de su
  plantilla (Metodología/11.Reporte_de_comercializacion_al_propietario.docx): banda de
  datos, secciones numeradas, tablas con encabezado azul y la página «Siguiente paso».
  Coincide con 11_ReportePropietario.docx del 26/10/2026. Captura sobre el documento (EXT-12,
  29/10/2026): cada bloque dice qué campos lo llenan («zona»); los totales los calcula el panel.
*/

type Data = Record<string, unknown>;
const f = (value: unknown) => fecha(value);
const cuenta = (estado: unknown, valor: unknown) => estado === "comprobado" && typeof valor === "number" ? String(valor) : "Pendiente";
const tabla = (d: Data, key: keyof typeof REPORTE_TABLES, empty = 2) => {
  const columns = REPORTE_TABLES[key].columns, rows = filas(d[key]);
  return (rows.length ? rows : Array.from({ length: empty }, (): Record<string, unknown> => ({}))).map(r => columns.map(c => typeof r[c.key] === "number" ? dinero(r[c.key]) : typeof r[c.key] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r[c.key] as string) ? fecha(r[c.key]) : v(r[c.key])));
};

export function reporteDocumento(d: Data): Documento {
  const contratada = d.publicidadEstado === "contratada";
  let publicidad: ReturnType<typeof calcularPublicidadReporte> | null = null;
  try { publicidad = contratada ? calcularPublicidadReporte(d) : null; } catch { /* sin datos suficientes */ }
  const money = (value: unknown) => typeof value === "number" ? dinero(value, d.monedaPublicidad) : v(value);
  const acciones = filas(d.acciones);
  const blocks: Block[] = [
    { kind: "title", text: "Reporte de comercialización" },
    { kind: "caption", text: "Resultados del periodo y decisiones para avanzar." },
    { kind: "band", widths: [3816, 3816, 2592], keys: [["inmueble", "propietario", "numeroReporte"], ["periodoInicio", "periodoFin", "asesor", "contactoAsesor", "fechaEmision", "estadoReporte"]], rows: [
      [{ label: "Inmueble / unidad", value: v(d.inmueble) }, { label: "Propietario", value: v(d.propietario) }, { label: "Folio / reporte", value: `${v(d.folio)} · ${v(d.numeroReporte)}` }],
      [{ label: "Periodo informado", value: `${f(d.periodoInicio)} al ${f(d.periodoFin)}` }, { label: "Asesor / contacto", value: `${v(d.asesor)}${d.contactoAsesor ? ` · ${String(d.contactoAsesor)}` : ""}` }, { label: "Emisión / estado", value: `${f(d.fechaEmision)} · ${v(d.estadoReporte)}` }],
    ] },
    { kind: "h1", text: "01  Situación al cierre" },
    { kind: "p", zona: { keys: ["resumen"], label: "Situación al cierre" }, text: v(d.resumen) },
    { kind: "table", zona: { keys: ["precioVigente", "moneda", "baseFiscal", "fechaPrecio", "soportePrecio", "primeraPublicacion", "diasActivos", "pausasPeriodo", "operacionEstado", "versionPlan", "reportePrevio"], label: "Precio, tiempo en mercado y referencias" }, widths: [3408, 3408, 3408], header: ["Precio vigente / moneda", "Tiempo en mercado", "Operación y referencias"], rows: [[
      `${typeof d.precioVigente === "number" ? dinero(d.precioVigente, d.moneda) : v(d.precioVigente)}\n${v(d.baseFiscal)}\n${f(d.fechaPrecio)} · ${v(d.soportePrecio)}`,
      `Desde ${f(d.primeraPublicacion)}\n${typeof d.diasActivos === "number" ? d.diasActivos : v(d.diasActivos)} días activos\n${v(d.pausasPeriodo)}`,
      `Operación: ${v(d.operacionEstado)}\nPlan: ${v(d.versionPlan)}\nReporte previo: ${v(d.reportePrevio)}`,
    ]] },
    { kind: "p", zona: { keys: ["cambios"], label: "Cambios de precio o de estado" }, text: `Cambios de precio o de estado durante el periodo: ${m(d.cambios)}.` },
    { kind: "h1", text: "02  Respuesta de los interesados" },
    { kind: "table", zona: { keys: ["contactosEstado", "contactos", "visitasEstado", "visitas", "ofertasEstado", "ofertas"], label: "Respuesta de los interesados" }, widths: [3408, 3408, 3408], header: ["Contactos nuevos¹", "Visitas realizadas²", "Ofertas recibidas³"], rows: [[cuenta(d.contactosEstado, d.contactos), cuenta(d.visitasEstado, d.visitas), cuenta(d.ofertasEstado, d.ofertas)]] },
    { kind: "note", text: "¹ Personas distintas que contactaron por primera vez en el periodo. ² Citas efectuadas; una segunda visita cuenta como otra cita. ³ Ofertas nuevas por folio; las revisiones de una oferta se cuentan aparte. Sin registro suficiente se informa «pendiente»; cero significa ausencia comprobada." },
    { kind: "table", zona: { keys: ["canales"], label: "Canales y actividades" }, widths: [3408, 3408, 3408], header: ["Canal / actividad", "Ejecutado frente al plan", "Resultado / soporte"], rows: tabla(d, "canales", 3) },
    { kind: "p", zona: { keys: ["comparacion"], label: "Avance respecto al periodo anterior" }, text: `Avance respecto al periodo anterior: ${m(d.comparacion)}. El alcance de distintas plataformas puede incluir a las mismas personas; no equivale a compradores.` },
    { kind: "h1", text: "03  Qué nos está diciendo el mercado" },
    { kind: "p", zona: { keys: ["comentarios", "interpretacion", "respuestaPropuesta"], label: "Qué nos está diciendo el mercado" }, text: `Comentarios de los interesados: ${m(d.comentarios)}. Nuestra lectura: ${m(d.interpretacion)}. Acción propuesta: ${m(d.respuestaPropuesta)}.` },

    { kind: "pagebreak" },
    { kind: "caption", text: "11 / ACCIONES Y DECISIONES" },
    { kind: "title", text: "Siguiente paso" },
    { kind: "h1", text: "04  Visitas y oportunidades en seguimiento" },
    { kind: "p", zona: { keys: ["registroVisitas", "agendadas", "realizadas", "canceladas", "reprogramadas", "pendientes"], label: "Visitas del periodo" }, text: d.registroVisitas === "comprobado"
      ? `Visitas agendadas en el periodo: ${v(d.agendadas)}; realizadas de esas citas: ${v(d.realizadas)}; canceladas: ${v(d.canceladas)}; reprogramadas: ${v(d.reprogramadas)}; pendientes al corte: ${v(d.pendientes)}.`
      : "Visitas agendadas, realizadas, canceladas, reprogramadas y pendientes al corte: pendiente de registro detallado." },
    { kind: "table", zona: { keys: ["oportunidades"], label: "Oportunidades en seguimiento" }, widths: [3408, 3408, 3408], header: ["Referencia anónima", "Situación al corte", "Siguiente acción / responsable / fecha"], rows: tabla(d, "oportunidades") },
    { kind: "p", zona: { keys: ["ofertasActualizadas"], label: "Ofertas actualizadas o retiradas" }, text: `Ofertas actualizadas o retiradas: ${m(d.ofertasActualizadas)}. Las ofertas se comunican oportunamente conforme al contrato; este reporte no sustituye su entrega ni acredita aceptación.` },
    { kind: "h1", text: "05  Publicidad pagada · sólo si se contrata" },
    { kind: "table", zona: { keys: ["publicidadEstado", "monedaPublicidad", "publicidad"], label: "Publicidad pagada" }, widths: [3200, 2000, 2000, 3024], header: ["Portal / periodo", "Autorizado¹", "Ejercido¹", "Soporte / pago"], rows: contratada
      ? [...filas(d.publicidad).map(r => [v(r.portal), money(r.autorizado), money(r.ejercido), v(r.soporte)]), [`TOTAL · ${v(d.monedaPublicidad)}`, publicidad ? money(publicidad.autorizado) : "", publicidad ? money(publicidad.ejercido) : "", ""]]
      : [["No contratado", "0", "0", "—"]] },
    { kind: "note", zona: { keys: ["publicidadEstado", "saldoInicial", "fondosRecibidos", "fondosAplicados", "fondosDevueltos", "pagosDirectos", "soporteSaldo"], label: "Fondos de publicidad" }, text: contratada
      ? `¹ No incluida en la comisión; a cargo del propietario, previa autorización. Importes con impuestos. Fondos en poder de Fortius: saldo inicial ${money(d.saldoInicial)} + recibido ${money(d.fondosRecibidos)} − aplicado ${money(d.fondosAplicados)} − devuelto ${money(d.fondosDevueltos)} = saldo ${publicidad ? money(publicidad.saldoFondos) : v("")}. Pagos directos al portal: ${money(d.pagosDirectos)}; no se restan otra vez de estos fondos. Soporte y destino del saldo: ${v(d.soporteSaldo)}.`
      : "¹ No incluida en la comisión; a cargo del propietario, previa autorización. Sin contratación: «No contratado»; no se reportan costos internos." },
    { kind: "h1", text: "06  Acciones del siguiente periodo" },
    { kind: "table", zona: { keys: ["acciones"], label: "Acciones del siguiente periodo" }, widths: [3816, 3408, 3000], header: ["Acción / motivo", "Responsable / fecha", "Dependencia o autorización"], rows: (acciones.length ? acciones : [{}, {}]).map(r => [v(r.accion), `${v(r.responsable)} · ${f(r.fecha)}`, v(r.dependencia)]) },
    { kind: "h1", text: "07  Decisiones que necesitamos de usted" },
    { kind: "p", zona: { keys: ["decisionSolicitada", "motivoDecision", "alcanceDecision", "fechaLimiteDecision", "estadoRespuestaPropietario", "constanciaRespuesta"], label: "Decisiones que necesitamos de usted" }, text: `${v(d.decisionSolicitada)}${d.motivoDecision ? ` Motivo: ${m(d.motivoDecision)}.` : ""}${d.alcanceDecision ? ` Alcance: ${m(d.alcanceDecision)}.` : ""}${d.fechaLimiteDecision ? ` Fecha límite: ${f(d.fechaLimiteDecision)}.` : ""} Estado y constancia de respuesta: ${d.estadoRespuestaPropietario === "recibida" ? `recibida · ${v(d.constanciaRespuesta)}` : "pendiente"}. Los cambios de precio, presupuesto y condiciones requieren autorización expresa; el silencio no los aprueba.` },
    { kind: "band", widths: [5112, 5112], keys: [["proximoReporte", "medioProximoReporte", "elaborador", "revisor"], ["soportes", "entregaInformeEstado", "fechaEntregaInforme", "medioEntregaInforme", "acuseInforme"]], rows: [
      [{ label: "Próximo reporte", value: `${f(d.proximoReporte)} · ${v(d.medioProximoReporte)}` }, { label: "Elaboró / revisó", value: `${v(d.elaborador)} / ${v(d.revisor)}` }],
      [{ label: "Documentos de respaldo", value: v(d.soportes) }, { label: "Entrega del informe", value: d.entregaInformeEstado === "entregado" ? `${f(d.fechaEntregaInforme)} · ${v(d.medioEntregaInforme)} · ${v(d.acuseInforme)}` : "Pendiente" }],
    ] },
  ];
  return { title: "Reporte de comercialización", subject: `Formato 11 · ${v(d.folio)}`, blocks };
}
