import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatoById, validateFormato, type FormatoField } from "./catalog";
import { calcularPresupuesto, importePartida, type Partida, type Pago } from "./presupuesto";
import { CARGOS_NETO, calcularNeto, type CargoNeto } from "./neto";
import { ENTREGA_TABLAS, type EntregaRow, type EntregaTabla } from "./entrega";
import { respuestaRequiereRatificacion } from "./oferta";
import { calcularExtras, PLAN_TABLES, type PlanRow, type PlanTable } from "./plan";
import { calcularPublicidadReporte, REPORTE_TABLES, type ReporteRow, type ReporteTable } from "./reporte";
import { ENTREVISTA_TABLES, mostrarCampoEntrevista, type EntrevistaTable, type EntrevistaRow } from "./entrevista";
import { mostrarCampoAviso } from "./aviso";
import { JURIDICA_TABLES, mostrarColumnaJuridica, type JuridicaRow } from "./juridica";

const ink = rgb(0.09, 0.12, 0.16);
const muted = rgb(0.38, 0.42, 0.45);
const accent = rgb(0.39, 0.09, 0.16);
const a4: [number, number] = [595.28, 841.89];
const margin = 45;

function displayValue(field: FormatoField, value: unknown): string {
  if (field.type === "money" && typeof value === "number") return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
  if (field.type === "choice") return field.options?.find((option) => option.value === value)?.label ?? "";
  if (field.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
  return String(value ?? "").trim();
}

export function receiptParagraphs(data: Record<string, unknown>): string[] {
  const value = (key: string) => String(data[key] ?? "").trim();
  const date = (key: string) => {
    const raw = value(key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${raw}T00:00:00Z`));
  };
  const money = (key: string) => typeof data[key] === "number"
    ? new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data[key] as number)
    : value(key);
  return [
    `Número de recibo: ${value("numeroRecibo")} · Lugar de emisión: ${value("lugarEmision")}`,
    `Con fecha de recepción ${date("fechaPago")}, recibí de ${value("pagador")} la cantidad de ${money("importeRecibido")} ${value("moneda")}, equivalente a ${value("importeLetra")}, por concepto de ${value("concepto")}.`,
    `Los honorarios corresponden a los servicios pactados en ${value("contratoFecha")}, relativos al inmueble ubicado en ${value("inmueble")}, expediente ${value("folio")}.`,
    `El beneficiario del pago es ${value("beneficiario")}. Quien suscribe recibe ${value("representacionBeneficiario")}, en carácter de ${value("caracter")}.`,
    `Medio de pago · ${value("medioPago")} · Referencia: ${value("referenciaPago")}. El importe indicado corresponde al pago efectivamente recibido. Su comprobante se identifica en ${value("soporteRecepcion")}.`,
    `Saldo de los honorarios · Este pago es ${value("pagoParcialTotal")}. El saldo pendiente del concepto indicado, después de aplicar este pago, es ${money("saldo")} ${value("monedaSaldo")}. Su importe se sustenta en ${value("soporteSaldo")}.`,
    "Si el saldo no está comprobado, indique por confirmar. Este recibo reconoce únicamente el pago señalado y no libera otros conceptos u obligaciones.",
    `Observaciones · ${value("observaciones")}. Referencia del CFDI, si se emitió: ${value("cfdiEstado")}. Este recibo no sustituye el CFDI ni el complemento de pagos que corresponda.`,
    `Quien recibe · ${value("receptor")}`,
  ];
}

export async function createFormatoPdf(id: string, data: Record<string, unknown>): Promise<Uint8Array> {
  const definition = formatoById(id);
  if (!definition.readyForEmission) throw new Error("Formato pendiente de cotejo con el original");
  const missing = validateFormato(id, data);
  if (missing.length) throw new Error(`Faltan datos obligatorios: ${missing.join(", ")}`);
  const pdf = await PDFDocument.create();
  const displayTitle = id === "01" ? "Aviso de privacidad" : id === "02" ? "Entrevista inicial" : id === "05" ? "Revisión jurídica y control de cierre" : id === "06" ? "Opinión jurídica del inmueble" : id === "08" ? "Estimación del neto" : id === "10" ? "Plan de comercialización" : id === "11" ? "Reporte de comercialización" : id === "12" ? "Perfil del comprador" : id === "13" ? "Visita y retroalimentación" : id === "14" ? "Propuesta de compra" : definition.title;
  pdf.setTitle(displayTitle);
  pdf.setAuthor("Fortius Inmuebles");
  pdf.setCreator("Panel Fortius · Formatos exclusivos");
  pdf.registerFontkit(fontkit);
  const [regular, bold, logo] = await Promise.all([
    pdf.embedFont(await readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")), { subset: true }),
    pdf.embedFont(await readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf")), { subset: true }),
    pdf.embedPng(await readFile(join(process.cwd(), "public/brand/fortius-logo.png"))),
  ]);
  const supported = new Set(regular.getCharacterSet());
  const clean = (value: string) => [...value.normalize("NFC")].map((character) => supported.has(character.codePointAt(0)!) ? character : " ").join("");
  let page: PDFPage = pdf.addPage(a4);
  let y = a4[1] - 115;
  const startPage = () => {
    page.drawImage(logo, { x: margin, y: a4[1] - 72, width: 138, height: 40 });
    page.drawLine({ start: { x: margin, y: a4[1] - 85 }, end: { x: a4[0] - margin, y: a4[1] - 85 }, color: accent, thickness: 1 });
    y = a4[1] - 115;
  };
  startPage();
  const ensure = (height: number) => { if (y - height < 72) { page = pdf.addPage(a4); startPage(); } };
  const wrap = (content: string, font: PDFFont, size: number, width = a4[0] - 2 * margin): string[] => {
    const result: string[] = [];
    for (const paragraph of content.split(/\r?\n/)) {
      let line = "";
      for (const word of clean(paragraph).split(/\s+/)) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > width) { result.push(line); line = ""; }
        if (font.widthOfTextAtSize(word, size) > width) {
          let piece = "";
          for (const character of word) {
            if (piece && font.widthOfTextAtSize(piece + character, size) > width) { result.push(piece); piece = ""; }
            piece += character;
          }
          line = piece;
        } else line = line ? `${line} ${word}` : word;
      }
      result.push(line);
    }
    return result;
  };
  const write = (content: string, size: number, font: PDFFont, color = ink, gap = 4) => {
    for (const line of wrap(content, font, size)) {
      ensure(size * 1.5);
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size * 1.5;
    }
    y -= gap;
  };
  write(displayTitle, 19, bold, accent, 10);
  write(`Expediente ${String(data.folio ?? "")} · Formato ${definition.id}`, 8.5, regular, muted, 14);
  const fieldLine = (field: FormatoField) => {
    const value = displayValue(field, data[field.key]);
    if (!value) return;
    ensure(42);
    write(field.label, 8, bold, muted, 2);
    write(value, 10, regular, ink, 8);
  };
  if (id === "18") {
    for (const paragraph of receiptParagraphs(data)) write(paragraph, 10, regular, ink, 12);
  } else if (id === "01") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const section = (title: string) => { ensure(80); write(title, 12, bold, accent, 9); };
    write("Propietarios · compradores · arrendatarios", 10, regular, muted, 15);
    write(`${val("responsable")}, que opera bajo el nombre comercial Fortius Inmuebles, es responsable del tratamiento de sus datos personales. Domicilio: ${val("domicilioResponsable")}. Atención de privacidad: ${val("contactoPrivacidad")}, ${val("correoPrivacidad")}. La marca comercial no sustituye la identidad del responsable.`, 10, regular, ink, 12);
    section("01 / A quién se dirige y cómo obtenemos los datos");
    write("Este aviso se dirige a quienes solicitan o reciben intermediación, valoración comercial o administración inmobiliaria, y a sus representantes, copropietarios y obligados solidarios. Los datos se obtienen en entrevistas, visitas, documentos, llamadas, correo y mensajería, así como de representantes autorizados, contrapartes y registros públicos consultados legítimamente.", 9, regular, ink, 12);
    section("02 / Qué información tratamos");
    write("Identificación y contacto: nombre, domicilio, teléfono, correo, firma e identificación; nacionalidad, fecha de nacimiento, CURP, RFC, estado civil o representación sólo si la etapa u obligación lo requiere.", 9, regular, ink, 7);
    write("Solicitud e inmueble: tipo de operación, preferencias, presupuesto, domicilio y características, titularidad, documentos registrales, fotografías, visitas, propuestas y contratos.", 9, regular, ink, 7);
    write("Patrimonio y finanzas: precio o renta, ingresos, solvencia, datos laborales, cuentas para pagos, depósitos, adeudos y documentación fiscal cuando sean necesarios.", 9, regular, ink, 7);
    write("No solicitamos datos sensibles ni biométricos en la atención ordinaria. Si excepcionalmente fueran necesarios, informaremos antes sus datos y finalidad, y recabaremos el consentimiento escrito que corresponda. No se pide todo el expediente en el primer contacto.", 9, regular, muted, 12);
    page = pdf.addPage(a4); startPage();
    write("Uso y comunicación de sus datos", 16, bold, accent, 12);
    section("03 / Finalidades necesarias");
    write("Atender solicitudes, conocer necesidades, responder consultas, presentar opciones y coordinar visitas; verificar identidad, representación, titularidad y documentos; analizar viabilidad y, en arrendamiento, solvencia aportada; preparar opiniones comerciales, propuestas, contratos, expedientes de formalización y actas de entrega; comunicar avances a las partes.", 9, regular, ink, 9);
    write("Si se contrata administración, gestionar cobros, depósitos, gastos y mantenimiento autorizados, incidencias y rendición de cuentas. También facturar, llevar registros contractuales, atender reclamaciones y cumplir obligaciones fiscales y de prevención de lavado de dinero que resulten aplicables.", 9, regular, ink, 9);
    write("Los datos financieros o patrimoniales requieren consentimiento expreso salvo excepción legal aplicable. Una consulta a sociedades de información crediticia exige su procedimiento y autorización específicos; este aviso no los sustituye.", 9, regular, muted, 12);
    section("04 / Publicidad y contacto opcionales");
    write("Sólo con autorización se enviarán novedades, oportunidades y promociones ajenas a la solicitud vigente por los canales autorizados. Negarse o solicitar la baja no condiciona el servicio. Una opción pendiente o sin marcar no autoriza este uso.", 9, regular, ink, 12);
    section("05 / Con quién podemos compartir información");
    write("A autoridades competentes se entregará sólo la información legalmente procedente. A la contraparte y notaría se comunicarán datos necesarios para evaluar, preparar o formalizar la operación; se prescindirá del consentimiento sólo cuando se acredite una excepción legal. La canalización a asesores externos o entidades financieras requiere autorización específica, salvo excepción acreditada.", 9, regular, ink, 9);
    write("Las transferencias se limitan a los datos y finalidades informados. Se comunicará el aviso al receptor. Los proveedores que traten datos por instrucciones del responsable deberán guardar seguridad y confidencialidad. Este aviso no autoriza vender bases de datos. Para otra transferencia internacional se informarán antes destinatario y finalidad y se recabará consentimiento cuando corresponda.", 9, regular, ink, 12);
    page = pdf.addPage(a4); startPage();
    write("Sus derechos y cómo ejercerlos", 16, bold, accent, 12);
    section("06 / Acceso, rectificación, cancelación y oposición");
    write(`Puede conocer sus datos y sus condiciones de uso, corregir información inexacta, pedir cancelación cuando proceda u oponerse al tratamiento por causa legítima. Presente su solicitud a ${val("correoPrivacidad")} o en ${val("domicilioResponsable")}, dirigida a ${val("contactoPrivacidad")}. No necesita contratar servicios ni usar un formato obligatorio.`, 9, regular, ink, 10);
    write("Indique nombre y medio de respuesta; acredite identidad y, en su caso, representación; describa el derecho solicitado y los datos involucrados, salvo que solicite acceso. Para rectificación señale la corrección y adjunte soporte. Evite documentos innecesarios.", 9, regular, ink, 9);
    write("La determinación se comunicará dentro de 20 días hábiles desde la recepción; si procede, se hará efectiva dentro de los 15 días hábiles siguientes. Ambos plazos pueden ampliarse una vez por periodo igual si las circunstancias lo justifican. El acceso se entregará tras acreditar identidad. El trámite es gratuito, salvo costos legalmente permitidos de reproducción o envío. Una limitación legal se explicará. Puede acudir a la Secretaría Anticorrupción y Buen Gobierno.", 9, regular, ink, 12);
    section("07 / Revocación y límite de uso");
    write(`Puede revocar consentimiento o pedir la baja de publicidad por ${val("correoPrivacidad")} o en el domicilio señalado. Identifique tratamiento o canal y medio de respuesta; para revocación acredite identidad. No tiene efectos retroactivos ni elimina obligaciones legales de conservación. Si afecta el servicio, se le explicará por qué.`, 9, regular, ink, 12);
    section("08 / Conservación, seguridad y cambios");
    write("Los datos se conservarán durante las finalidades informadas y los plazos legales o contractuales aplicables; después se bloquearán y suprimirán cuando proceda. El acceso se limita al personal y proveedores autorizados con medidas de seguridad acordes al riesgo. Las vulneraciones significativas se comunicarán conforme a la ley.", 9, regular, ink, 9);
    write(`Las actualizaciones pueden solicitarse a ${val("correoPrivacidad")} o consultarse en el domicilio del responsable. Los cambios sustanciales se informarán por el medio de contacto registrado y se pedirá nuevo consentimiento cuando corresponda.`, 9, regular, ink, 11);
    page = pdf.addPage(a4); startPage();
    write("Decisiones y recepción del aviso", 16, bold, accent, 13);
    write(`Titular: ${val("titular")} · Calidad: ${val("tipoTitular")} · Operación: ${val("operacion")} · Expediente: ${val("folio")} · Fecha: ${val("fechaEmision")}`, 9, regular, ink, 12);
    if (mostrarCampoAviso("documentoRepresentante", data)) write(`Representante: ${val("representante")} · Documento de facultades: ${val("documentoRepresentante")}`, 9, regular, ink, 11);
    section("A / Datos patrimoniales y financieros");
    write("Para evaluar y tramitar la operación y administrar servicios contratados, la decisión expresa es:", 9, regular, ink, 5);
    write(val("consentimientoPatrimonial"), 10, bold, accent, 12);
    write("Si se invoca una excepción legal al consentimiento, el responsable debe identificarla y documentarla; no se presume por recibir este aviso.", 8.5, regular, muted, 11);
    section("B / Publicidad y oportunidades adicionales");
    write(`Decisión: ${val("consentimientoPublicidad")}.`, 9, regular, ink, 5);
    if (data.consentimientoPublicidad === "si") write(`Canales: correo ${val("publicidadCorreo")}; teléfono ${val("publicidadTelefono")}; mensajería ${val("publicidadMensajeria")}.`, 9, regular, ink, 12);
    section("C / Transferencias que requieren decisión");
    write(`Asesor independiente: ${val("transferenciaAsesor")}${data.transferenciaAsesor === "si" ? ` · ${val("asesorDestinatario")} · País: ${val("asesorPais")}` : ""}.`, 9, regular, ink, 7);
    write(`Entidad de financiamiento: ${val("transferenciaFinanciera")}${data.transferenciaFinanciera === "si" ? ` · ${val("financieroDestinatario")} · País: ${val("financieroPais")}` : ""}.`, 9, regular, ink, 7);
    write(`Contraparte o notaría: ${val("transferenciaOperacion")}${data.transferenciaOperacion === "si" ? ` · ${val("operacionDestinatario")} · País: ${val("operacionPais")}` : ""}.`, 9, regular, ink, 13);
    section("D / Recepción del aviso");
    write("La firma acredita recepción y sólo las autorizaciones afirmativas marcadas. No implica renuncia a derechos ni autorización para consultar reportes de crédito.", 9, regular, ink, 12);
    write(`Estado de firma: ${val("acuseEstado")}${data.acuseEstado === "firmado_fuera" ? ` · Fecha: ${val("fechaAcuse")} · Referencia del acuse: ${val("referenciaAcuse")}` : "."}`, 9, regular, ink, 15);
    ensure(90); y -= 25;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 270, y }, thickness: 0.7, color: ink }); y -= 15;
    write(`${val("titular")} · Titular o representante`, 8.5, regular, muted, 8);
    write("Una selección capturada en el panel no acredita por sí sola consentimiento ni firma. Archive el acuse firmado para comprobarlos.", 8.5, regular, muted, 8);
  } else if (id === "02") {
    write("Información declarada por quien responde; las respuestas y documentos deberán revisarse en las etapas correspondientes.", 9, regular, muted, 13);
    let section = "";
    for (const field of definition.fields) {
      if (!mostrarCampoEntrevista(field.key, data)) continue;
      if (field.section && field.section !== section) {
        section = field.section;
        ensure(88);
        write(section, 13, bold, accent, 10);
      }
      if (field.type === "entrevistaRows") {
        const kind = field.key as EntrevistaTable;
        const entries = data[kind] as EntrevistaRow[];
        write(field.label, 9, bold, muted, 5);
        for (const [index, entry] of entries.entries()) {
          ensure(65);
          write(`${index + 1}. ${ENTREVISTA_TABLES[kind].columns.map((column) => `${column.label}: ${entry[column.key]}`).join(" · ")}`, 9, regular, ink, 8);
        }
      } else fieldLine(field);
    }
    write("Esta entrevista no autoriza publicación del inmueble, recepción de dinero, fijación de precio o comisión, ni exclusividad. Si existen varios titulares, debe documentarse la información y voluntad de cada uno. La revisión de títulos, gravámenes y aspectos fiscales queda pendiente de sus soportes.", 9, regular, muted, 14);
  } else if (id === "05") {
    write("Ficha de control documental y decisión por etapa. Los datos declarados, recibidos y verificados tienen alcances distintos.", 9, regular, muted, 12);
    let section = "";
    for (const field of definition.fields) {
      if (field.section && field.section !== section) {
        section = field.section;
        ensure(83);
        write(section, 13, bold, accent, 10);
        if (section === "03 / Control documental") write("Aplica: sí, no o por determinar. Estado: no recibido, recibido, insuficiente o verificado. Recibido no equivale a autenticidad, vigencia ni conformidad jurídica.", 9, regular, muted, 10);
        if (section === "07 / Controles especiales") write("Conforme, hallazgo, pendiente, no aplica o fuera de alcance. Todo NA/FA requiere motivo o evidencia.", 9, regular, muted, 10);
      }
      if (field.type !== "juridicaRows") { fieldLine(field); continue; }
      const config = JURIDICA_TABLES[field.key];
      const rows = data[field.key] as JuridicaRow[];
      write(config.label, 9, bold, muted, 7);
      if (rows.length === 0) { write(field.key === "cargas" ? "No se registraron cargas en esta ficha; esto no prueba su inexistencia." : "No se registraron filas; estado declarado en la conclusión o controles.", 9, regular, muted, 8); continue; }
      for (const [index, entry] of rows.entries()) {
        ensure(65);
        const fixed = config.fixed?.[index];
        write(fixed ? `${fixed.key} · ${fixed.label}` : `${index + 1}. ${entry.id ?? entry.persona ?? entry.acto ?? entry.carga ?? "Registro"}`, 9, bold, ink, 3);
        write(config.columns.filter((column) => mostrarColumnaJuridica(field.key, column.key, entry)).map((column) => {
          const value = entry[column.key] ?? "";
          const shown = column.options?.find((option) => option.value === value)?.label ?? value;
          return `${column.label}: ${shown}`;
        }).join(" · "), 8.5, regular, muted, 8);
      }
    }
    write("Esta ficha no determina automáticamente impuestos, exenciones, factibilidad de servicios, inexistencia de litigios ni facultades para disponer. Cada conclusión debe estar sustentada por el abogado responsable y actualizarse ante hechos nuevos.", 9, regular, muted, 15);
    ensure(85); y -= 20;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 270, y }, thickness: 0.7, color: ink }); y -= 15;
    write(`${String(data.abogado)} · Cédula ${String(data.cedula)} · ${displayValue(definition.fields.find((field) => field.key === "fechaRevision")!, data.fechaRevision)}`, 8.5, regular, muted, 8);
  } else if (id === "06") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const section = (title: string) => { ensure(78); write(title, 13, bold, accent, 9); };
    write(`${val("fechaEmision")} · Operación ${val("folio")}`, 9, regular, muted, 12);
    write(`${val("destinatario")}\nPresente`, 10, bold, ink, 12);
    write(`Emito esta opinión respecto de ${val("inmueble")}, para ${val("operacion")}. Sus conclusiones tienen el alcance y las limitaciones expresados en este documento.`, 10, regular, ink, 12);
    section("01 / Conclusión ejecutiva");
    write(val("conclusion"), 11, regular, ink, 12);
    write(`La conclusión se apoya en: ${val("sustento")}`, 9, regular, muted, 13);
    section("02 / Objeto y alcance del encargo");
    write(`Objeto. ${val("objeto")}`, 10, regular, ink, 9);
    write(`Alcance. ${val("alcance")}`, 10, regular, ink, 13);
    section("03 / Antecedentes y documentación");
    write(val("antecedentes"), 10, regular, ink, 10);
    write(`Documentos examinados. ${val("documentos")}`, 10, regular, ink, 13);
    page = pdf.addPage(a4); startPage();
    write("Análisis y recomendaciones", 16, bold, accent, 14);
    section("04 / Análisis jurídico");
    write("Titularidad y facultades para disponer", 10, bold, ink, 4);
    write(val("titularidad"), 10, regular, ink, 11);
    write("Situación registral e identidad del inmueble", 10, bold, ink, 4);
    write(val("registro"), 10, regular, ink, 11);
    write("Impedimentos y condiciones de la operación", 10, bold, ink, 4);
    write(val("impedimentos"), 10, regular, ink, 12);
    section("05 / Recomendaciones y próximos pasos");
    write(val("recomendaciones"), 10, regular, ink, 9);
    write(`Responsables y acciones pendientes. ${val("responsables")}`, 10, regular, ink, 12);
    section("06 / Límites y actualización de la opinión");
    write(val("limites"), 10, regular, ink, 9);
    write(`Actualización necesaria. ${val("actualizacion")}`, 10, regular, ink, 18);
    ensure(90);
    y -= 20;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 255, y }, thickness: 0.7, color: ink });
    y -= 15;
    write(`${val("abogado")} · Cédula profesional ${val("cedula")}`, 9, regular, muted, 5);
    write(`Fecha de emisión: ${val("fechaEmision")}`, 9, regular, muted, 8);
  } else if (id === "08") {
    const totals = calcularNeto(data);
    const cash = (amount: number) => `${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} MXN`;
    write("01 / Precio y diferencia", 13, bold, accent, 10);
    for (const field of definition.fields.slice(1, 10)) fieldLine(field);
    if (totals.diferenciaAbsoluta !== null) {
      write(`Diferencia acordado menos sugerido: ${cash(totals.diferenciaAbsoluta)} (${totals.diferenciaPorcentual?.toFixed(2)} % sobre el sugerido)`, 10, regular, ink, 7);
    }
    write(`Precio usado para el neto: ${cash(totals.precioBase)}. El acuerdo con el vendedor no acredita una venta cerrada.`, 10, regular, ink, 12);
    if (y < 260) { page = pdf.addPage(a4); startPage(); }
    write("02 / Erogaciones a cargo del propietario", 13, bold, accent, 10);
    for (const item of data.erogaciones as CargoNeto[]) {
      ensure(57);
      const label = CARGOS_NETO.find((fixed) => fixed.key === item.concepto)?.label ?? item.descripcion ?? "Otro cargo";
      write(label, 9, bold, ink, 2);
      write(`${item.estado} · ${item.estado === "No aplica" ? "0.00 MXN" : cash(item.importe ?? 0)} · ${item.justificacion}`, 9, regular, muted, 8);
    }
    write(`Total de erogaciones estimadas: ${cash(totals.erogaciones)}`, 10, bold, accent, 12);
    ensure(230);
    write("03 / Lo que se estima recibirá el propietario", 13, bold, accent, 10);
    write(`Respaldo fiscal: ${cash(data.precioRespaldoFiscal as number)} · Válido hasta: ${displayValue(definition.fields[12], data.respaldoFiscalValidoHasta)}`, 9, regular, ink, 5);
    write(`Cierre previsto: ${displayValue(definition.fields[13], data.cierrePrevisto)} · Cargos: revisados`, 9, regular, ink, 5);
    write(`Responsable de la estimación: ${String(data.responsableEstimacion)}`, 9, regular, ink, 8);
    write(`NETO ESTIMADO: ${cash(totals.netoEstimado)}`, 16, bold, accent, 12);
    if (totals.netoEstimado < 0) write("Las erogaciones superan el precio: revisar el faltante.", 10, bold, accent, 8);
    else write("Estimación revisada. Puede variar al concretarse la operación.", 10, regular, ink, 8);
    write("Estimación, no garantía de cobro. El precio, impuestos, adeudos y gastos pueden cambiar. Total conjunto antes de repartir entre copropietarios.", 9, regular, muted, 8);
    write("No equivale al saldo por cobrar en firma: los anticipos recibidos deben conciliarse por separado. Evita duplicar cargos.", 9, regular, muted, 8);
  } else if (id === "10") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const cash = (amount: number, currency = val("moneda")) => `${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;
    const section = (title: string) => { ensure(65); write(title, 13, bold, accent, 9); };
    const rows = (key: PlanTable) => data[key] as PlanRow[];
    const list = (key: PlanTable) => {
      const config = PLAN_TABLES[key];
      const fixed = config.fixed as readonly { key: string; label: string }[];
      for (const [index, row] of rows(key).entries()) {
        ensure(56);
        const title = fixed.find((item) => item.key === row.concepto)?.label ?? (key === "atributos" ? `Atributo ${index + 1}` : `Extra ${index + 1}`);
        write(title, 9, bold, ink, 2);
        write(config.columns.map((column) => {
          const value = row[column.key];
          const rendered = column.key === "fecha" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`))
            : String(value ?? "");
          return `${column.label}: ${rendered}`;
        }).join(" · "), 8.5, regular, muted, 7);
      }
    };
    write(`Estrategia y acciones propuestas para ${val("inmueble")}. Encargo: ${val("modalidadEncargo")}.`, 10, regular, muted, 12);
    write(`Expediente ${val("folio")} · ${val("operacion")} · ${val("fecha")} · Propietario: ${val("propietario")} · Asesor: ${val("asesor")} (${val("contactoAsesor")})`, 9, regular, ink, 13);
    section("01 / La estrategia propuesta");
    write(`Estrategia propuesta: ${val("estrategia")}. Objetivo del propietario: ${val("objetivo")}. El primer periodo de trabajo será ${val("periodo")}, con revisión el ${val("fechaRevision")}. Condiciones para lanzar: ${val("condicionesLanzamiento")}. El plazo es de trabajo y evaluación; no garantiza comprador, precio ni fecha de cierre.`, 10, regular, ink, 11);
    write(`Referencia de valor: ${cash(data.valorReferencia07 as number)} según ${val("referencia07")}. Precio de salida autorizado: ${cash(data.precioSalida as number)}. Base y alcance: ${val("baseFiscal")}. Soporte: ${val("autorizacionPrecio")}. Justificación de la diferencia: ${val("justificacionDiferencia")}. Próxima decisión de precio: ${val("decisionPrecio")}.`, 10, regular, ink, 11);
    write("Cada oferta y cualquier cambio de precio requieren aceptación expresa del propietario. El neto, si se solicitó, se presenta por separado en el formato 08.", 9, regular, muted, 12);
    section("02 / Qué vamos a comunicar");
    write(`Fortaleza comprobable: ${val("diferenciador")}. Objeción y respuesta sustentada: ${val("objecionRespuesta")}. Competencia relevante: ${val("competencia")}. Pendientes que limitan la campaña: ${val("pendientesCampana")}. La información declarada se identifica como tal; lo pendiente no se anuncia como comprobado.`, 10, regular, ink, 10);
    list("atributos");
    section("03 / A quién queremos llegar");
    write(`Público prioritario: ${val("publicoPrimario")}. Público secundario: ${val("publicoSecundario")}. Mensaje a probar: ${val("mensajePrueba")}. Evidencia para validar esta hipótesis: ${val("evidenciaValidacion")}. La selección se basa en compatibilidad con el inmueble y capacidad de realizar la operación; no promete créditos o rendimientos.`, 10, regular, ink, 12);
    page = pdf.addPage(a4); startPage();
    write("Campaña y presupuesto", 16, bold, accent, 11);
    write(`Lanzamiento previsto: ${val("fechaLanzamiento")}. Responsable de aprobar contenidos: ${val("aprobadorContenido")}. Sólo se activan acciones con alcance, fecha y autorización expresos.`, 10, regular, ink, 12);
    section("04 / Preparación y calendario");
    write(`Preparación del inmueble: ${val("preparacion")}. Retirar de las imágenes documentos y objetos personales. No ocultar daños o condiciones relevantes mediante edición de fotografías.`, 9, regular, ink, 9);
    list("hitos");
    section("Materiales de difusión");
    list("piezas");
    ensure(260);
    section("05 / Canales y piezas seleccionados");
    write(`Cada anuncio mostrará tipo de inmueble, ubicación autorizada, precio, moneda, atributos comprobables y contacto. Contacto público: ${val("contactoPublico")}. Ubicación publicable: ${val("ubicacionPublicable")}. Referidos y colaboración: ${val("colaboracion")}. No se difunden datos personales ni se crean interesados, urgencia o beneficios ficticios.`, 9, regular, ink, 10);
    list("canales");
    section("AIDA y lanzamiento de 21 días");
    write("Atención: anuncios aprobados y consultas por canal. Interés: ficha e información pertinente; respuestas y citas. Deseo: visitas y atención de objeciones con evidencia. Acción: oferta escrita y decisión documentada del propietario. Las etapas pueden repetirse o superponerse.", 9, regular, ink, 10);
    write(`Día 1: ${val("fechaLanzamiento")}. Cortes previstos: día 7, ${val("corte7")}; día 14, ${val("corte14")}; día 21, ${val("corte21")}. Se revisarán contactos únicos, visitas realizadas, ofertas y objeciones. La ventana inicial no garantiza mayor demanda, venta ni cierre. Las pausas y fechas reales se registrarán.`, 9, regular, ink, 10);
    write("Días 1 a 7: publicar piezas aprobadas, verificar anuncios, activar referidos autorizados y responder consultas. Decisión: corregir información, imágenes o contacto si hace falta.", 9, regular, ink, 7);
    write("Días 8 a 14: dar seguimiento, realizar visitas y recoger objeciones. Decisión: mejorar presentación, mensaje o atención según las respuestas obtenidas.", 9, regular, ink, 7);
    write("Días 15 a 21: retomar interesados, resolver dudas y facilitar ofertas escritas. Decisión: mantener el plan o proponer cambios sustentados de contenido, canales, acceso o precio.", 9, regular, ink, 9);
    write("En cada corte se acordarán la acción siguiente, responsable y fecha. Ningún corte activa descuentos o publicidad pagada por sí mismo; cualquier cambio requiere autorización.", 9, regular, muted, 10);
    section("06 / Publicidad pagada y extras opcionales");
    const extraTotals = calcularExtras(rows("extras"));
    write(`Estado: ${val("estadoPublicidad")}. Extras propuestos: ${cash(extraTotals.propuesto, "MXN")}. Extras autorizados: ${cash(extraTotals.autorizado, "MXN")}.`, 10, bold, accent, 9);
    if (rows("extras").length) list("extras");
    else write("No contratado; total autorizado de 0 MXN.", 9, regular, ink, 9);
    write(`Alcance para varias unidades: ${val("unidadesFases")}. La difusión gratuita se usa cuando está disponible. La publicidad pagada no está incluida: requiere autorización previa de canal, periodo, máximo con impuestos y forma de pago. Este presupuesto no modifica la comisión ni la pena del contrato 09.`, 9, regular, muted, 10);
    page = pdf.addPage(a4); startPage();
    write("Atención, seguimiento y decisiones", 16, bold, accent, 11);
    section("07 / Atención y visitas");
    write(`Atenderemos consultas por ${val("mediosAtencion")}. Tiempo de respuesta y horario: ${val("tiempoRespuesta")}. Confirmaremos necesidad, plazo y forma prevista de pago antes de las visitas en ${val("horariosVisita")}, con ${val("responsableAcceso")}. Después registraremos objeciones y acordaremos la siguiente acción con el interesado.`, 10, regular, ink, 10);
    write(`Formas de pago a evaluar: ${val("formasPago")}. Documentación restringida: ${val("documentosRestringidos")}. Custodio: ${val("custodioDocumentos")}. Se registran prospectos y visitas en los formatos 12 y 13; las ofertas por escrito, en el 14. El asesor no acepta ofertas ni recibe apartados por este plan.`, 9, regular, ink, 11);
    section("08 / Qué recibirá en cada reporte");
    write(`El reporte 11 se entregará por ${val("medioReporte")}, con la frecuencia pactada en el 09: ${val("frecuencia09")}. Próximo corte: ${val("proximoCorte")}. Destinatario: ${val("destinatarioReporte")}. Los registros permanecen en el 03. Se informarán resultados, objeciones y acciones ejecutadas.`, 10, regular, ink, 10);
    write(`Criterio de revisión: ${val("criterioRevision")}. En los cortes de los días 7, 14 y 21 se localizará dónde se detiene el avance AIDA. Con pocos datos se indicará la limitación. Los ajustes de precio se sustentan en el 07 y requieren autorización expresa.`, 9, regular, ink, 10);
    write("Indicadores: contar interesados únicos y distinguir consultas, visitas agendadas y realizadas; no duplicar revisiones de una oferta. Usar alcances o clics sólo si la plataforma los informa y sin sumar audiencias como personas únicas. Si no hubo visitas, no calcular ofertas por visita. En publicidad contratada, separar presupuesto, fondos, gasto comprobado y saldo.", 9, regular, muted, 10);
    section("09 / Decisiones para iniciar");
    list("decisiones");
    if (data.estadoAprobacion === "registrada") write(`Aceptación registrada por ${val("nombreAprobador")} el ${val("fechaAprobacion")}. Firma o acuse: ${val("acuseAprobacion")}. Sólo se consideran aceptados los alcances identificados expresamente.`, 10, regular, ink, 10);
    else write("Aceptación expresa pendiente. Las acciones propuestas no autorizan publicación, acceso, gasto ni difusión de datos hasta documentar su aprobación.", 10, bold, accent, 10);
    write(`Siguiente paso: ${val("siguienteAccion")}. Responsable: ${val("responsableSiguiente")}. Fecha: ${val("fechaSiguiente")}.`, 10, regular, ink, 10);
    write("Este plan no amplía facultades, honorarios, penalizaciones ni licencias del contrato de intermediación.", 9, regular, muted, 10);
  } else if (id === "11") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const money = (amount: number, currency = val("moneda")) => `${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;
    const section = (title: string) => { ensure(65); write(title, 13, bold, accent, 9); };
    const rows = (key: ReporteTable) => data[key] as ReporteRow[];
    const list = (key: ReporteTable) => {
      for (const [index, row] of rows(key).entries()) {
        ensure(52);
        write(`${REPORTE_TABLES[key].label} ${index + 1}`, 9, bold, ink, 2);
        write(REPORTE_TABLES[key].columns.map((column) => {
          const value = row[column.key];
          const rendered = key === "publicidad" && (column.key === "autorizado" || column.key === "ejercido") && typeof value === "number"
            ? money(value, val("monedaPublicidad"))
            : column.key === "fecha" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
              ? new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`))
              : String(value ?? "");
          return `${column.label}: ${rendered}`;
        }).join(" · "), 8.5, regular, muted, 7);
      }
    };
    const metric = (key: "contactos" | "visitas" | "ofertas") => data[`${key}Estado`] === "pendiente" ? "pendiente de registro" : String(data[key]);
    write(`Resultados del periodo ${val("periodoInicio")} al ${val("periodoFin")}. Reporte ${val("numeroReporte")} del expediente ${val("folio")}.`, 10, regular, muted, 11);
    write(`${val("inmueble")} · Propietario: ${val("propietario")} · Asesor: ${val("asesor")} (${val("contactoAsesor")}) · Emisión: ${val("fechaEmision")} · Estado: ${val("estadoReporte")}.`, 9, regular, ink, 12);
    section("01 / Situación al cierre");
    write(`${val("resumen")}. Cambios de precio o estado: ${val("cambios")}.`, 10, regular, ink, 10);
    write(`Precio vigente: ${money(data.precioVigente as number)}. Base: ${val("baseFiscal")}. Fecha y soporte: ${val("fechaPrecio")} · ${val("soportePrecio")}. Primera publicación: ${val("primeraPublicacion")}; ${val("diasActivos")} días activos. Pausas: ${val("pausasPeriodo")}. Operación: ${val("operacionEstado")}. Plan: ${val("versionPlan")}. Reporte previo: ${val("reportePrevio")}.`, 9, regular, ink, 12);
    section("02 / Respuesta de los interesados");
    write(`Contactos nuevos: ${metric("contactos")}. Visitas realizadas: ${metric("visitas")}. Ofertas nuevas: ${metric("ofertas")}.`, 11, bold, accent, 8);
    write("Contactos nuevos son personas distintas que contactaron por primera vez en el periodo. Cada cita realizada cuenta como visita, incluida una segunda visita. Las ofertas nuevas se cuentan por folio, separadas de sus revisiones. Pendiente indica registro insuficiente; cero, ausencia comprobada.", 9, regular, muted, 9);
    write(`Avance frente al periodo anterior: ${val("comparacion")}. El alcance de distintas plataformas puede incluir a las mismas personas y no equivale a compradores.`, 9, regular, ink, 10);
    list("canales");
    section("03 / Qué nos está diciendo el mercado");
    write(`Comentarios de interesados y frecuencia: ${val("comentarios")}. Interpretación y límites: ${val("interpretacion")}. Acción propuesta: ${val("respuestaPropuesta")}.`, 10, regular, ink, 11);
    page = pdf.addPage(a4); startPage();
    write("Acciones y decisiones", 16, bold, accent, 11);
    section("04 / Visitas y oportunidades en seguimiento");
    if (data.registroVisitas === "pendiente") write("El detalle de citas está pendiente de registro; no se sustituyen los datos faltantes por ceros.", 10, regular, ink, 9);
    else write(`Visitas agendadas: ${val("agendadas")}; realizadas de esas citas: ${val("realizadas")}; canceladas: ${val("canceladas")}; reprogramadas: ${val("reprogramadas")}; pendientes al corte: ${val("pendientes")}.`, 10, regular, ink, 9);
    write(`Ofertas actualizadas o retiradas: ${val("ofertasActualizadas")}. Las ofertas se comunican oportunamente conforme al contrato; este reporte no sustituye su entrega ni acredita aceptación.`, 9, regular, ink, 9);
    if (rows("oportunidades").length) list("oportunidades");
    else write("No hay oportunidades en seguimiento registradas al corte.", 9, regular, muted, 11);
    section("05 / Publicidad pagada");
    if (data.publicidadEstado === "no_contratada") write("No contratado. No se reportan costos internos como publicidad del propietario.", 10, regular, ink, 12);
    else {
      const totals = calcularPublicidadReporte(data);
      write(`Publicidad contratada en ${val("monedaPublicidad")}. Total autorizado: ${money(totals.autorizado, val("monedaPublicidad"))}; total ejercido: ${money(totals.ejercido, val("monedaPublicidad"))}.`, 10, bold, accent, 9);
      list("publicidad");
      write(`Fondos en poder de Fortius: saldo inicial ${money(data.saldoInicial as number, val("monedaPublicidad"))} + recibido ${money(data.fondosRecibidos as number, val("monedaPublicidad"))} − aplicado ${money(data.fondosAplicados as number, val("monedaPublicidad"))} − devuelto ${money(data.fondosDevueltos as number, val("monedaPublicidad"))} = saldo ${money(totals.saldoFondos, val("monedaPublicidad"))}.`, 9, regular, ink, 8);
      write(`Pagos directos al portal: ${money(totals.pagosDirectos, val("monedaPublicidad"))}; no se restan otra vez de los fondos en poder de Fortius. Soporte y destino del saldo: ${val("soporteSaldo")}.`, 9, regular, ink, 9);
      if (totals.ejercido > totals.autorizado) write("El gasto ejercido supera el importe autorizado; requiere revisión y explicación del soporte.", 9, bold, accent, 9);
      if (totals.saldoFondos < 0) write("El saldo calculado de fondos es negativo; conciliar ingresos, aplicaciones y devoluciones.", 9, bold, accent, 9);
      write("La publicidad pagada no está incluida en la comisión y requiere autorización previa. Los importes incluyen impuestos.", 9, regular, muted, 11);
    }
    section("06 / Acciones del siguiente periodo");
    list("acciones");
    section("07 / Decisiones que necesitamos de usted");
    write(`Decisión solicitada: ${val("decisionSolicitada")}. Motivo: ${val("motivoDecision")}. Alcance: ${val("alcanceDecision")}. Fecha límite: ${val("fechaLimiteDecision")}.`, 10, regular, ink, 9);
    write(data.estadoRespuestaPropietario === "recibida" ? `Respuesta recibida; constancia: ${val("constanciaRespuesta")}.` : "Respuesta pendiente. El silencio no aprueba cambios de precio, presupuesto ni condiciones.", 9, regular, ink, 12);
    ensure(150);
    write(`Próximo reporte: ${val("proximoReporte")} por ${val("medioProximoReporte")}. Elaboró: ${val("elaborador")}. Revisó: ${val("revisor")}. Documentos de respaldo: ${val("soportes")}.`, 9, regular, muted, 9);
    write(data.entregaInformeEstado === "entregado" ? `Informe entregado el ${val("fechaEntregaInforme")} por ${val("medioEntregaInforme")}. Acuse: ${val("acuseInforme")}.` : "Entrega del informe pendiente de registrar.", 9, regular, muted, 9);
  } else if (id === "19") {
    const totals = calcularPresupuesto(data);
    const currency = String(data.moneda);
    const cash = (value: number | null) => value === null ? "No hay partidas autorizadas" : `${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;
    write("Resumen", 13, bold, accent, 10);
    for (const field of definition.fields.slice(1, 7)) fieldLine(field);
    write(`Subtotal cotizado: ${cash(totals.subtotalCotizado)}`, 10, regular, ink, 6);
    write(`Importe autorizado: ${totals.autorizadoMenosPagado === null ? "No hay partidas autorizadas" : cash(totals.importeAutorizado)}`, 10, regular, ink, 6);
    write(`Estimación con reserva: ${cash(totals.estimacionConReserva)}`, 10, bold, accent, 8);
    write(`Total pagado: ${cash(totals.totalPagado)}`, 10, regular, ink, 6);
    write(`Autorizado menos pagado: ${cash(totals.autorizadoMenosPagado)}`, 10, regular, ink, 6);
    write(`Exceso sobre la estimación: ${cash(totals.excesoSobreEstimacion)}`, 10, regular, ink, 12);
    write("Los precios unitarios incluyen los impuestos y cargos cotizados. Este presupuesto no calcula tasas fiscales.", 9, regular, muted, 10);
    page = pdf.addPage(a4); startPage();
    write("Partidas del presupuesto", 15, bold, accent, 10);
    for (const item of data.partidas as Partida[]) {
      ensure(88);
      write(`${item.id} · ${item.area || "Sin área"} · ${item.concepto}`, 10, bold, ink, 3);
      if (item.estado === "Descartado") write("Descartado; no incluido en los importes.", 9, regular, muted, 10);
      else {
        const amount = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(importePartida(item));
        write(`${item.tipoCosto} · ${item.cantidad} ${item.unidad} × ${cash(item.precioUnitario)} = ${amount} ${currency} · ${item.estado}`, 9, regular, ink, 3);
        write(`Soporte: ${item.soporte}`, 9, regular, muted, 10);
      }
    }
    page = pdf.addPage(a4); startPage();
    write("Pagos registrados", 15, bold, accent, 10);
    if ((data.pagos as Pago[]).length === 0) write("No hubo pagos registrados al corte; confirmado en la captura.", 10, regular, ink, 12);
    for (const item of data.pagos as Pago[]) {
      ensure(75);
      write(`${item.fechaPago || "Sin fecha"} · ${item.partidaId || "Sin partida"} · ${item.proveedor || "Sin proveedor"}`, 10, bold, ink, 3);
      write(`${item.concepto || "Sin concepto"} · ${item.estado} · ${item.estado === "Pagado" ? cash(item.importe) : "No sumado"}`, 9, regular, ink, 3);
      write(`Medio: ${item.medio || "No indicado"} · Comprobante: ${item.comprobante || "No indicado"}`, 9, regular, muted, 10);
    }
    write("Sólo se suman importes efectivamente pagados y respaldados. Las partidas descartadas y los pagos anulados no integran los totales.", 9, regular, muted, 12);
  } else if (id === "12") {
    write("Una conversación para entender qué busca y cómo puede realizar la compra.", 10, regular, muted, 13);
    for (const field of definition.fields.slice(1, 8)) fieldLine(field);
    if (y < 230) { page = pdf.addPage(a4); startPage(); }
    write("01 / La búsqueda", 13, bold, accent, 10);
    for (const field of definition.fields.slice(8, 15)) fieldLine(field);
    if (y < 230) { page = pdf.addPage(a4); startPage(); }
    write("02 / El presupuesto y la forma de pago", 13, bold, accent, 10);
    write("Precisar lo posible, resolver pendientes y acordar la siguiente acción.", 9, regular, muted, 10);
    for (const field of definition.fields.slice(15, 31)) fieldLine(field);
    if (y < 230) { page = pdf.addPage(a4); startPage(); }
    write("03 / El plazo y el siguiente paso", 13, bold, accent, 10);
    for (const field of definition.fields.slice(31)) fieldLine(field);
    write("Los importes son declarados salvo soporte identificado. Una precalificación no garantiza el crédito. Poner a disposición el aviso de privacidad y registrar el seguimiento en el tablero.", 9, regular, muted, 12);
  } else if (id === "13") {
    write("Registrar la experiencia del interesado y acordar cómo continuar.", 10, regular, muted, 13);
    for (const field of definition.fields.slice(1, 11)) fieldLine(field);
    write("01 / Lo que comenta el interesado", 13, bold, accent, 10);
    if (data.estadoCita === "realizada") for (const field of definition.fields.slice(11, 15)) fieldLine(field);
    else write("No aplica: la cita no se realizó.", 10, regular, muted, 12);
    if (y < 190) { page = pdf.addPage(a4); startPage(); }
    write("02 / Su interés en continuar", 13, bold, accent, 10);
    if (data.estadoCita === "realizada") for (const field of definition.fields.slice(15, 17)) fieldLine(field);
    else write("No se recabó una decisión del interesado durante esta cita.", 10, regular, muted, 12);
    write("03 / Seguimiento del asesor", 13, bold, accent, 10);
    for (const field of definition.fields.slice(17)) fieldLine(field);
  } else if (id === "14") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const cash = (amount: unknown, currency: string) => `${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount as number)} ${currency}`;
    const signature = (name: string, role: string) => {
      ensure(88);
      y -= 30;
      page.drawLine({ start: { x: margin, y }, end: { x: margin + 240, y }, thickness: 0.7, color: ink });
      y -= 15;
      write(`${name} · ${role}`, 8, regular, muted, 10);
    };
    write(`${val("lugarPropuesta")}, ${val("fechaPropuesta")} · Folio ${val("folio")}`, 9, regular, muted, 10);
    write(`${val("propietario")}\nPresente`, 10, bold, ink, 10);
    write(`Soy ${val("comprador")}, ${val("representacionComprador")}. Le propongo adquirir ${val("derechoAdquirir")} sobre el inmueble ubicado en ${val("inmueble")}, identificado con ${val("folioInmueble")}.`, 10, regular, ink, 12);
    write("Precio propuesto", 13, bold, accent, 5);
    write(cash(data.precioPropuesto, val("moneda")), 18, bold, accent, 10);
    write(`Tratamiento de impuestos del precio: ${val("impuestosPrecio")}. Bienes y accesorios incluidos: ${val("bienesIncluidos")}; excluidos: ${val("bienesExcluidos")}.`, 10, regular, ink, 10);
    write("Pago y condiciones", 13, bold, accent, 8);
    write(`Propongo cubrir el precio con ${cash(data.recursosPropios, val("moneda"))} de recursos propios${data.credito === 0 ? ", sin crédito previsto" : ` y ${cash(data.credito, val("moneda"))} mediante ${val("institucionCredito")}; estado del crédito: ${val("estadoCredito")}`}. El calendario de pagos sería ${val("calendarioPagos")}.`, 10, regular, ink, 9);
    write(`La operación quedaría sujeta a estas condiciones: ${val("condiciones")}. Deberían resolverse a más tardar el ${val("fechaCondiciones")}. Propongo formalizar el ${val("fechaFormalizacion")} y recibir el inmueble el ${val("fechaEntrega")}. Gastos a mi cargo: ${val("gastosComprador")}; a cargo del propietario: ${val("gastosPropietario")}.`, 10, regular, ink, 10);
    write("Respuesta y alcance", 13, bold, accent, 7);
    write(`Agradeceré su respuesta hasta el ${val("fechaLimitePropuesta")}, a las ${val("horaLimitePropuesta")} (${val("zonaHoraria")}). Una respuesta posterior requerirá confirmar que mantengo esta propuesta; el silencio no expresa conformidad.`, 10, regular, ink, 8);
    write("Estas bases sirven sólo para negociar. No asumo aquí la obligación de comprar ni de celebrar un contrato futuro. Cualquier compromiso requerirá un instrumento independiente firmado por personas con facultades. Esta carta no pacta apartado, depósito, pena ni entrega de posesión.", 9, regular, muted, 9);
    write("Atentamente,", 10, regular, ink, 4);
    signature(val("comprador"), "Comprador o representante");
    if (data.estadoRespuesta === "registrada") {
      page = pdf.addPage(a4); startPage();
      write("Respuesta del propietario", 19, bold, accent, 10);
      write(`${val("lugarRespuesta")}, ${val("fechaRespuesta")} a las ${val("horaRespuesta")} · Propuesta folio ${val("folio")}`, 9, regular, muted, 13);
      write(`${val("comprador")}\nPresente`, 10, bold, ink, 13);
      write(`Recibí su propuesta de fecha ${val("fechaPropuesta")} respecto del inmueble ubicado en ${val("inmueble")}, identificado con ${val("folioInmueble")}. Respondo en mi carácter de ${val("caracterPropietario")}.`, 10, regular, ink, 15);
      write("Mi respuesta", 13, bold, accent, 8);
      const decision = data.decisionPropietario === "aceptar" ? "aceptar las bases para negociar" : data.decisionPropietario === "contraoferta" ? "proponer cambios" : "rechazar la propuesta";
      write(`He decidido ${decision}. El motivo es: ${val("motivoRespuesta")}.`, 10, regular, ink, 10);
      if (respuestaRequiereRatificacion(data)) write(`El comprador confirmó que mantiene vigente su propuesta según ${val("confirmacionVigencia")}.`, 9, regular, ink, 10);
      if (data.decisionPropietario === "contraoferta") write(`Mi contraoferta es de ${cash(data.precioContraoferta, val("monedaContraoferta"))}. Impuestos: ${val("impuestosContraoferta")}. Cambios precisos: ${val("cambiosContraoferta")}. Espero respuesta hasta el ${val("fechaLimiteContraoferta")} a las ${val("horaLimiteContraoferta")} (${val("zonaHoraria")}).`, 10, regular, ink, 13);
      write("Esta respuesta, aun si es favorable, conserva el alcance de negociación de la propuesta y no obliga por sí sola a vender ni a celebrar un contrato futuro. Cualquier compromiso requerirá el instrumento correspondiente.", 9, regular, muted, 15);
      write("Atentamente,", 10, regular, ink, 4);
      signature(val("propietario"), "Propietario o representante");
    }
  } else if (id === "16") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const section = (title: string) => { ensure(60); write(title, 13, bold, accent, 9); };
    const entries = (key: EntregaTabla, state: string) => {
      section(ENTREGA_TABLAS[key].label);
      const rows = data[key] as EntregaRow[] | undefined;
      if (!rows?.length) { write(state, 9, regular, ink, 10); return; }
      for (const row of rows) {
        ensure(45);
        write(ENTREGA_TABLAS[key].columns.map((column) => `${column.label}: ${row[column.key]}`).join(" · "), 9, regular, ink, 9);
      }
    };
    write(`En ${val("lugar")}, el ${val("fecha")} a las ${val("horaInicio")}, se documenta la entrega del inmueble ubicado en ${val("inmueble")}, expediente ${val("folio")}, conforme a ${val("contratoReferencia")}.`, 10, regular, ink, 10);
    write(`Quien entrega: ${val("quienEntrega")}, ${val("caracterEntrega")}. Identificación y representación: ${val("identificacionEntrega")}. Quien recibe: ${val("quienRecibe")}, ${val("caracterRecibe")}. Identificación y representación: ${val("identificacionRecibe")}. Comparecieron: ${val("presentes")}.`, 10, regular, ink, 12);
    section("01 / Resultado de la entrega");
    write(`Resultado: ${val("resultadoEntrega")}. ${data.resultadoEntrega === "no_realizada" ? `Motivo: ${val("motivoNoEntrega")}.` : `Se recibieron ${val("areasEntregadas")}; quedaron sin entregar ${val("areasSinEntregar")}. Recepción efectiva: ${val("recepcionFecha")} a las ${val("recepcionHora")}.`}`, 10, regular, ink, 8);
    write(`Ocupantes o bienes de terceros: ${val("ocupantesTerceros")}.`, 10, regular, ink, 10);
    section("02 / Estado del inmueble");
    write(`Áreas revisadas: ${val("areasRevisadas")}. Sin revisar: ${val("areasNoRevisadas")}.`, 10, regular, ink, 8);
    entries("diferencias", val("estadoDiferencias"));
    entries("accesos", val("estadoAccesos"));
    entries("documentos", val("estadoDocumentos"));
    entries("servicios", val("estadoServicios"));
    write("Una lectura no acredita saldo cero. Si no se pudo leer un medidor, se indica en la observación.", 9, regular, muted, 10);
    entries("pendientes", val("estadoPendientes"));
    ensure(230);
    section("07 / Reservas y firma");
    write(`Quien entrega manifiesta: ${val("manifestacionEntrega")}. Quien recibe reserva: ${val("reservasRecibe")}. Manifestaciones no comprobadas: ${val("manifestacionesNoComprobadas")}.`, 10, regular, ink, 10);
    write(`Fotografías o inventario complementario: ${val("anexos")}. El acto concluyó a las ${val("horaFinal")}. Ausencias de firma: ${val("ausenciasFirma")}.`, 10, regular, ink, 10);
    write("Esta acta acredita los hechos asentados dentro del alcance de cada firma; no acredita pago del precio, ausencia de adeudos ni funcionamiento no probado. No implica finiquito automático ni renuncia a derechos por defectos no examinados. Los pendientes continúan hasta comprobar su cumplimiento.", 9, regular, muted, 10);
    write("Quienes firman recibirán una copia completa.", 9, regular, muted, 10);
  } else if (id === "17") {
    write("Control interno para registrar el resultado de la operación, localizar su documentación y asignar el seguimiento que continúe. No es un finiquito ni acredita por sí solo el cumplimiento de obligaciones.", 10, regular, muted, 15);
    write("01 / Identificación", 13, bold, accent, 10);
    for (const field of definition.fields.slice(0, 3)) fieldLine(field);
    write("02 / Resultado", 13, bold, accent, 10);
    for (const field of definition.fields.slice(3, 8)) fieldLine(field);
    page = pdf.addPage(a4); startPage();
    write("03 / Comprobación del cierre", 13, bold, accent, 8);
    write("Anote comprobado, pendiente o no aplica; cite el archivo que permite verificarlo. No repita su contenido.", 9, regular, muted, 12);
    for (let index = 8; index < 18; index += 2) {
      ensure(55);
      const status = definition.fields[index];
      const reference = definition.fields[index + 1];
      write(status.label, 8, bold, muted, 1);
      write(`${displayValue(status, data[status.key])} · ${displayValue(reference, data[reference.key])}`, 9, regular, ink, 6);
    }
    write("04 / Seguimiento pendiente", 13, bold, accent, 8);
    for (const field of definition.fields.slice(18, 21)) fieldLine(field);
    write("Con pendientes y responsable asignado, use terminado con seguimiento; sin responsable, no procede cerrar. Si no hay pendientes, escriba ninguno.", 9, regular, muted, 12);
    ensure(190);
    write("05 / Archivo", 13, bold, accent, 8);
    for (const field of definition.fields.slice(21)) fieldLine(field);
    write("Archivar no significa borrar. Conserve los documentos conforme al criterio aplicable al expediente; cualquier depuración se decide por separado.", 9, regular, muted, 12);
  } else for (const field of definition.fields) {
      ensure(48);
      write(field.label.toUpperCase(), 8, bold, muted, 2);
      write(displayValue(field, data[field.key]), 11, regular, ink, 11);
      page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: a4[0] - margin, y: y + 5 }, thickness: 0.35, color: rgb(0.82, 0.84, 0.85) });
      y -= 10;
    }
  if (["09", "15", "16", "18"].includes(id)) {
    ensure(86);
    y -= 28;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 0.7, color: ink });
    if (id !== "18") page.drawLine({ start: { x: a4[0] - margin - 200, y }, end: { x: a4[0] - margin, y }, thickness: 0.7, color: ink });
    y -= 15;
    page.drawText(id === "18" ? "Firma de quien recibe" : id === "16" ? `Quien entrega: ${String(data.quienEntrega)}` : "Firma", { x: margin, y, size: 8, font: regular, color: muted });
    if (id !== "18") page.drawText(id === "16" ? `Quien recibe: ${String(data.quienRecibe)}` : "Firma", { x: a4[0] - margin - 200, y, size: 8, font: regular, color: muted });
  }
  for (const [index, item] of pdf.getPages().entries()) item.drawText(`${index + 1} / ${pdf.getPageCount()}`, { x: a4[0] - margin - 30, y: 35, size: 8, font: regular, color: muted });
  return pdf.save();
}

export async function prepareFormatoEmission(id: string, data: Record<string, unknown>) {
  const bytes = await createFormatoPdf(id, data);
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}
