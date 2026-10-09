import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { decisionesRepresentante } from "./aviso";

const navy = rgb(6 / 255, 31 / 255, 63 / 255);
const green = rgb(239 / 255, 244 / 255, 239 / 255);
const cream = rgb(1, 240 / 255, 209 / 255);
const white = rgb(1, 1, 1);
const left = 50.5;
const width = 511;
const pageSize: [number, number] = [612, 792];

/** Reconstructs the supplied Letter template. Personal data are always supplied by the draft. */
export async function createAvisoPdf(data: Record<string, unknown>, options: { publicTemplate?: boolean } = {}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle("Aviso de privacidad");
  pdf.setAuthor("Fortius Inmuebles");
  pdf.setCreator("Panel Fortius");
  pdf.setSubject(`Expediente ${String(data.folio ?? "")}`);
  const [regularBytes, boldBytes, monoBytes, logoBytes] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")),
    readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf")),
    readFile(join(process.cwd(), "public/fonts/IBMPlexMono-Medium.ttf")),
    readFile(join(process.cwd(), "public/brand/fortius-logo.png")),
  ]);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const mono = await pdf.embedFont(monoBytes, { subset: true });
  const logo = await pdf.embedPng(logoBytes);
  let page: PDFPage;
  let top = 87;
  const characters = new Set(regular.getCharacterSet());
  const clean = (text: unknown) => Array.from(String(text ?? "").trim()).filter(c => c === "\n" || characters.has(c.codePointAt(0)!)).join("");
  const value = (key: string) => clean(data[key]);
  function newPage() {
    page = pdf.addPage(pageSize);
    page.drawImage(logo, { x: 64.85, y: 712.5, width: 188.65, height: 47.95 });
    page.drawText("01 / PRIVACIDAD", { x: 484.35, y: 733.45, font: mono, size: 8, color: rgb(89 / 255, 99 / 255, 91 / 255) });
    top = 87;
  }
  function line(text: string, at: number, size = 10.5, font = regular, x = left, color = navy) {
    page.drawText(text, { x, y: 792 - at - size * 0.79, size, font, color });
  }
  function wrap(text: string, size = 10.5, font = regular, available = width): string[] {
    const lines: string[] = [];
    for (const paragraph of clean(text).split("\n")) {
      let current = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (font.widthOfTextAtSize(word, size) > available) {
          if (current) { lines.push(current); current = ""; }
          for (const char of word) {
            if (font.widthOfTextAtSize(current + char, size) > available) { lines.push(current); current = ""; }
            current += char;
          }
        } else if (current && font.widthOfTextAtSize(`${current} ${word}`, size) > available) {
          lines.push(current); current = word;
        } else current = current ? `${current} ${word}` : word;
      }
      lines.push(current);
    }
    return lines;
  }
  function ensure(height: number) {
    if (top + height > 730) newPage();
  }
  function wrapped(text: string, size: number, font: PDFFont, available: number) {
    return text.split("\n").flatMap(part => {
      const lines = wrap(part, size, font, available);
      return lines.map((text, index) => ({ text, last: index === lines.length - 1 }));
    });
  }
  function drawWrapped(text: string, last: boolean, at: number, size: number, font: PDFFont, x: number, available: number, justify: boolean) {
    const words = text.split(" ");
    if (justify && !last && words.length > 1) {
      const spaces = (available - words.reduce((sum, word) => sum + font.widthOfTextAtSize(word, size), 0)) / (words.length - 1);
      let position = x;
      for (const word of words) { line(word, at, size, font, position); position += font.widthOfTextAtSize(word, size) + spaces; }
    } else line(text, at, size, font, x);
  }
  function paragraph(text: string, options: { size?: number; font?: PDFFont; x?: number; width?: number; leading?: number; gap?: number; justify?: boolean; keep?: boolean } = {}) {
    const { size = 10.5, font = regular, x = left, width: available = width, leading = 12.1, gap = 5, justify = true, keep = false } = options;
    const lines = wrapped(text, size, font, available);
    if (keep) ensure(lines.length * leading + gap);
    lines.forEach(({ text, last }) => {
      ensure(leading);
      drawWrapped(text, last, top, size, font, x, available, justify);
      top += leading;
    });
    top += gap;
  }
  function centered(text: string, at: number, size: number, font = bold) {
    text = text.replace(/^([0-9]{2}|[A-D]) \/ /, "$1  /  ");
    line(text, at, size, font, (612 - font.widthOfTextAtSize(text, size)) / 2);
  }
  function title(first: string, second?: string) {
    centered(first, top, 20);
    if (second) { top += 23.05; centered(second, top, 20); }
    top += 32.37;
  }
  function section(text: string) {
    ensure(60);
    top += 5.165;
    centered(text, top, 12);
    top += 19.635;
  }
  function box(label: string, content: string[], fill: typeof green) {
    const rows = content.flatMap(text => wrap(text, 10.5, regular, width - 15));
    const totalHeight = 26.2 + rows.length * 11.75;
    if (totalHeight <= 630) ensure(totalHeight + 5);
    for (let offset = 0; offset < rows.length;) {
      ensure(50);
      const start = top - 7.455;
      const count = Math.min(rows.length - offset, Math.floor((730 - start - 26.2) / 11.75));
      const height = 26.2 + count * 11.75;
      page.drawRectangle({ x: 50.4, y: 792 - start - height, width: 511.15, height, color: fill });
      centered(label, start + 8.35, 10);
      rows.slice(offset, offset + count).forEach((text, index) => line(text, start + 19.555 + index * 11.75, 10.5, regular, 58));
      top = start + height + 4.955;
      offset += count;
      if (offset < rows.length) newPage();
    }
  }
  type TableRow = { cells: [string, string]; height: number; decisions?: Record<string, unknown>; decisionKey?: string };
  function table(headers: [string, string], column: number, rows: TableRow[]) {
    const start = top - 0.855;
    const cols = [left, left + column];
    const widths = [column, width - column];
    const paint = (at: number, height: number, fill: typeof green) => {
      page.drawRectangle({ x: 50.4, y: 792 - at - height, width: column - 0.05, height, color: fill });
      page.drawRectangle({ x: 50.4 + column, y: 792 - at - height, width: width - column + 0.15, height, color: fill });
    };
    const header = () => {
      paint(top, 26.95, navy);
      headers.forEach((text, i) => line(text, top + 6.295, 9.5, bold, cols[i] + 5.5, white));
      top += 27;
    };
    top = start;
    ensure(65); header();
    for (const [index, row] of rows.entries()) {
      const lines = row.cells.map((text, i) => wrapped(text, 9.5, regular, widths[i] - 11));
      const padding = row.decisions ? 10.15 : 13.1;
      const leading = row.decisions ? 10.65 : 10.95;
      const count = Math.max(...lines.map(cell => cell.length));
      const totalHeight = Math.max(row.height, count * leading + padding);
      if (totalHeight <= 616 && top + totalHeight > 730) { newPage(); header(); }
      for (let offset = 0; offset < count;) {
        if (top + row.height > 730) { newPage(); header(); }
        const amount = Math.min(count - offset, Math.floor((730 - top - padding) / leading));
        const height = Math.max(row.height, amount * leading + padding);
        const at = top;
        paint(at, height - 0.05, index % 2 === 0 ? green : white);
        lines.forEach((cell, i) => {
          if (row.decisions && i === 1) return;
          cell.slice(offset, offset + amount).forEach(({ text, last }, n) => drawWrapped(text, last, at + 6.345 + n * leading, 9.5, regular, cols[i] + 5.5, widths[i] - 11, i === 1 || column > 300));
        });
        if (row.decisions && offset === 0) {
          top = at + 6.345;
          checkboxes([["Sí", "si"], ["No", "no"]], row.decisions[row.decisionKey!], cols[1] + 5.5, 9.5, 5.96);
          top = at + 17.295;
          checkboxes([["No aplica", "no_aplica"]], row.decisions[row.decisionKey!], cols[1] + 5.5, 9.5);
        }
        top = at + height;
        offset += amount;
        if (offset < count) { newPage(); header(); }
      }
    }
    top += 4.805;
  }
  function checkboxes(options: [string, string][], selected: unknown, x = left, size = 10.5, gap = 11) {
    let position = x;
    for (const [label, key] of options) {
      const y = 792 - top - size * 0.79;
      // Outline dimensions reproduce the unmarked box glyph used in the reference.
      page.drawRectangle({ x: position + size * 239 / 2048, y: y + size * 55 / 2048, width: size * 1359 / 2048, height: size * 1383 / 2048, borderColor: navy, borderWidth: size * 110 / 2048 });
      if (selected === key) {
        page.drawLine({ start: { x: position + 2.2, y: y + 2.6 }, end: { x: position + 3.6, y: y + 1.2 }, thickness: 0.9, color: navy });
        page.drawLine({ start: { x: position + 3.6, y: y + 1.2 }, end: { x: position + size * 0.65, y: y + size * 0.65 - 1 }, thickness: 0.9, color: navy });
      }
      line(label, top, size, regular, position + size * 1.104);
      position += size * 1.104 + regular.widthOfTextAtSize(label, size) + gap;
    }
  }

  newPage();
  line("Aviso de", 98.07, 32, bold, 241.75);
  line("privacidad", 132.87, 32, bold, 227.8);
  line("Propietarios · compradores · arrendatarios", 171.755, 10.5, regular, left, rgb(89 / 255, 99 / 255, 91 / 255));
  top = 195.455;
  box("RESPONSABLE Y CONTACTO", [
    `Responsable: ${value("responsable")}`,
    `Domicilio: ${value("domicilioResponsable")}`,
    `Atención de privacidad: ${value("contactoPrivacidad")} · ${value("correoPrivacidad")}`,
    ...(options.publicTemplate ? ["Sitio web: https://fortiusinmuebles.com"] : []),
  ], cream);
  top -= 1.055;
  if (!options.publicTemplate) paragraph(value("representante") ? `Para ${value("representante")}, ${value("calidadRepresentante") || "representante"} de ${value("titular")}` : `Para ${value("titular")}`, { size: 10, leading: 11.55, gap: 4.855, justify: false });
  paragraph("La persona identificada arriba, que opera bajo el nombre comercial Fortius Inmuebles, es responsable del tratamiento de sus datos. Este aviso explica qué información utiliza, para qué la necesita y cómo puede usted decidir sobre ella. La marca comercial no sustituye la identidad del responsable.");
  section("01 / A quién se dirige y cómo obtenemos los datos");
  paragraph("Se dirige a quienes solicitan o reciben servicios de intermediación, valoración comercial o administración inmobiliaria, y a sus representantes, copropietarios y obligados solidarios. Recibimos información en entrevistas, visitas, documentos, llamadas, correo y mensajería; también de representantes autorizados, contrapartes de una operación y registros públicos consultados legítimamente. La información de terceros no autoriza usos ajenos a este aviso.");
  section("02 / Qué información tratamos");
  table(["Categoría", "Datos y momento de solicitud"], 104.4, [
    { cells: ["Identificación y contacto", "Nombre, domicilio, teléfono, correo, firma y datos de identificación oficial. Nacionalidad, fecha de nacimiento, CURP, RFC, estado civil y representación, sólo si la etapa o la obligación aplicable los requiere."], height: 46 },
    { cells: ["Solicitud e inmueble", "Tipo de operación, preferencias, presupuesto, domicilio y características del inmueble; titularidad, documentos registrales, fotografías del inmueble, visitas, propuestas y contratos relacionados."], height: 45.9 },
    { cells: ["Patrimonio y finanzas", "Precio o renta, ingresos y comprobantes de solvencia, datos laborales, cuentas para pagos, depósitos, adeudos y documentación fiscal, cuando sean necesarios para evaluar o ejecutar la operación."], height: 46 },
  ]);
  paragraph("No se solicitan datos sensibles ni biométricos para la atención ordinaria. No envíe información de salud, creencias, origen étnico o vida sexual. Si un supuesto excepcional exigiera tratar datos sensibles, se informarán previamente los datos, la finalidad y el consentimiento escrito que corresponda. No se pide todo el expediente en el primer contacto.");

  newPage(); title("Uso y comunicación", "de sus datos"); top -= 5.165;
  section("03 / Finalidades necesarias");
  paragraph("Los datos se utilizarán según el servicio solicitado y la etapa de la operación:", { justify: false });
  for (const text of [
    "Atender su solicitud, identificar sus necesidades, responder consultas, presentar opciones pertinentes y coordinar visitas.",
    "Verificar identidad, representación, titularidad y documentos del inmueble; analizar la viabilidad de la operación y, en arrendamiento, la solvencia aportada por el solicitante.",
    "Preparar opiniones comerciales, propuestas, contratos, expedientes de formalización y actas de entrega; comunicar a las partes los avances de su operación.",
    "Si contrata administración: gestionar cobros, depósitos, gastos y mantenimiento autorizados, atender incidencias y rendir cuentas.",
    "Facturar, llevar registros de la relación contractual, atender reclamaciones y cumplir las obligaciones fiscales y de prevención de lavado de dinero que efectivamente resulten aplicables.",
  ]) paragraph(`• ${text}`);
  paragraph("Los datos financieros o patrimoniales requieren consentimiento expreso, salvo una excepción legal aplicable. La sección de decisiones permite documentarlo. Una consulta a sociedades de información crediticia, si se solicitara, requiere su procedimiento y autorización específicos; este aviso no los sustituye.");
  section("04 / Publicidad y contacto comercial opcionales");
  paragraph("Sólo con su autorización le enviaremos novedades, nuevas oportunidades y promociones ajenas a su solicitud vigente, por correo, teléfono o mensajería. Puede negarse desde el inicio o pedir la baja en el correo de privacidad. Su decisión no condiciona la atención del servicio solicitado. Una opción sin marcar no se considera autorización para estas finalidades.");
  section("05 / Con quién podemos compartir información");
  table(["Destinatario", "Finalidad y regla aplicable"], 144, [
    { cells: ["Autoridades competentes", "Cumplir requerimientos y obligaciones previstos en disposiciones aplicables. Se entregará únicamente la información legalmente procedente."], height: 35 },
    { cells: ["Contraparte y notaría de la operación", "Evaluar la propuesta y preparar, formalizar o ejecutar la operación solicitada. Sólo se prescindirá del consentimiento cuando se actualice una excepción legal; de lo contrario se solicitará antes del envío."], height: 46 },
    { cells: ["Asesores inmobiliarios externos o entidades de financiamiento", "Canalizar su solicitud a un asesor independiente o gestionar una opción de crédito que usted elija. Requiere la autorización específica de la sección de decisiones, salvo excepción legal acreditada."], height: 45.9 },
  ]);
  paragraph("Las transferencias se limitarán a los datos necesarios y a la finalidad informada. Se comunicará al receptor el aviso y las obligaciones correspondientes. No se autoriza con este documento la venta de bases de datos. Los proveedores que procesen información por instrucciones del responsable deberán estar sujetos a deberes de seguridad y confidencialidad. Si se prevé una transferencia internacional no descrita aquí, se informará previamente su destinatario y finalidad, y se recabará el consentimiento cuando proceda.");

  newPage(); title("Sus derechos", "y cómo ejercerlos"); top -= 5.165;
  section("06 / Acceso, rectificación, cancelación y oposición");
  paragraph("Puede conocer los datos que conservamos y sus condiciones de uso; corregir información inexacta o incompleta; pedir su cancelación cuando proceda, u oponerse al tratamiento por causa legítima. Estos derechos pueden ejercerse por separado.");
  top += 6.6;
  box("PRESENTE SU SOLICITUD", [`Envíela a ${value("correoPrivacidad")} o entréguela en el domicilio del responsable. Diríjala a ${value("contactoPrivacidad")}. No necesita contratar nuestros servicios ni utilizar un formato obligatorio.`], green);
  paragraph("Indique su nombre y un medio para recibir respuesta; acredite su identidad y, en su caso, la representación; describa el derecho o la solicitud y los datos involucrados, excepto que solicite acceso. Agregue elementos que ayuden a localizarlos. Para rectificación, precise la corrección y adjunte su soporte. Evite remitir documentos que no sean necesarios para acreditar o resolver su petición.");
  paragraph("Comunicaremos la determinación en un máximo de 20 días hábiles desde la recepción de la solicitud. Si procede, se hará efectiva dentro de los 15 días hábiles siguientes a la respuesta. Cada plazo puede ampliarse una sola vez por un periodo igual, cuando las circunstancias lo justifiquen; se le comunicará la ampliación y su motivo.");
  paragraph("La respuesta se enviará por el medio indicado. Previa acreditación de identidad, el acceso podrá atenderse mediante documentos electrónicos o copias simples. El trámite es gratuito; sólo podrán cobrarse los conceptos permitidos por la ley. Si existe una causa legal que limite la solicitud, se explicará la decisión y su alcance. Puede acudir a la Secretaría Anticorrupción y Buen Gobierno mediante el procedimiento de protección de derechos previsto en la ley.");
  section("07 / Revocación del consentimiento y limitación de uso");
  paragraph("Puede revocar su consentimiento o solicitar que dejemos de enviarle publicidad mediante el mismo correo o domicilio. Identifique el tratamiento o canal que desea suspender y su medio de respuesta. Para revocación se acreditará la identidad; se atenderá con los requisitos y plazos del procedimiento anterior. La revocación no tiene efectos retroactivos ni elimina obligaciones legales de conservación. Si impide continuar una parte del servicio, se le explicará cuál y por qué. La baja de publicidad se registrará para evitar nuevos envíos por esa finalidad.");
  section("08 / Conservación, seguridad y cambios al aviso");
  paragraph("Los datos se conservarán durante el tiempo necesario para las finalidades informadas y los plazos legales o contractuales aplicables. Al concluir, se bloquearán y suprimirán cuando corresponda. El acceso debe limitarse al personal y proveedores autorizados, con medidas administrativas, técnicas y físicas acordes con el riesgo. Las vulneraciones que afecten significativamente sus derechos se comunicarán conforme a la ley.");
  paragraph(`Las actualizaciones podrán solicitarse en ${value("correoPrivacidad")} o consultarse ${options.publicTemplate ? "en https://fortiusinmuebles.com/privacidad y " : ""}en el domicilio del responsable. Se informarán los cambios sustanciales por el medio de contacto registrado y se solicitará un nuevo consentimiento cuando corresponda.`);

  function decisions(own: boolean) {
    const choices = own ? decisionesRepresentante(data) : data;
    const person = own ? value("representante") : value("titular");
    newPage();
    // A long name wraps instead of shrinking or being clipped.
    const titles = wrap(options.publicTemplate ? "Sus decisiones" : `Decisiones de ${person}`, 20, bold);
    if (!own && value("representante")) top += 1;
    for (const text of titles) { ensure(23.05); centered(text, top, 20); top += 23.05; }
    top += 5.095;
    paragraph(`Titular: ${options.publicTemplate ? "________________________________________" : person}${own ? ", por su propio derecho" : ""}`, { size: 9.5, leading: 10.95, gap: 0, justify: false });
    if (!own && value("representante")) paragraph(`Representante: ${value("representante")}`, { size: 9.5, leading: 10.95, gap: 0, justify: false });
    paragraph(`Operación: ${options.publicTemplate ? "________________________________________" : value("operacion")}`, { size: 9.5, leading: 10.95, gap: 0, justify: false });
    const signedDate = choices.acuseEstado === "firmado_fuera" ? clean(choices.fechaAcuse) : "";
    paragraph(`Fecha de recepción y decisiones: ${signedDate || "__________________"}`, { size: 9.5, leading: 10.95, gap: 5, justify: false });
    paragraph(options.publicTemplate ? "Esta hoja corresponde a los datos del titular que la complete. Si firma un representante, deberá acreditar sus facultades." : own ? `Esta hoja se refiere únicamente a los datos personales propios de ${person}. Sus decisiones no sustituyen las de ${value("titular")}.` : value("representante") ? `Esta hoja corresponde a los datos de ${person}. ${/a$/i.test(value("calidadRepresentante")) ? "La representante" : "El representante"} sólo podrá decidir dentro de las facultades que acredite.` : `Esta hoja corresponde a los datos de ${person}.`, { size: 9.5, leading: 10.85, gap: 5.06, justify: false });
    section("A / Tratamiento de datos patrimoniales o financieros");
    paragraph("Para evaluar y tramitar mi operación y, en su caso, administrar los servicios contratados, consiento expresamente el tratamiento de los datos patrimoniales y financieros descritos en el aviso. Si existe una excepción legal al consentimiento, el responsable deberá identificarla y documentarla; no se presume por firmar la recepción.");
    ensure(12.1);
    checkboxes([["Sí consiento", "si"], ["No consiento", "no"], ["No aplica en esta etapa", "no_aplica"]], choices.consentimientoPatrimonial);
    top += 17.1;
    section("B / Publicidad y oportunidades adicionales");
    paragraph("Acepto recibir novedades y promociones no relacionadas con mi solicitud vigente:", { justify: false });
    ensure(24.2);
    checkboxes([["Sí autorizo", "si"], ["No autorizo", "no"]], choices.consentimientoPublicidad);
    top += 12.1;
    line("Canales autorizados:", top);
    let x = left + regular.widthOfTextAtSize("Canales autorizados:   ", 10.5);
    for (const [label, key] of [["Correo", "publicidadCorreo"], ["Teléfono", "publicidadTelefono"], ["Mensajería", "publicidadMensajeria"]]) {
      checkboxes([[label, "si"]], choices.consentimientoPublicidad === "si" ? choices[key] : undefined, x);
      x += 10.5 * 1.104 + regular.widthOfTextAtSize(label, 10.5) + 6.6;
    }
    top += 17.1;
    section("C / Transferencias que requieren mi autorización");
    paragraph("Autorizo únicamente las transferencias seleccionadas, para los fines indicados. El destinatario y el país deben quedar identificados antes del envío.");
    const recipient = (key: string, target: string, country: string) => `Destinatario / país: ${choices[key] === "si" ? `${clean(choices[target])} / ${clean(choices[country])}` : "______________________________"}`;
    table(["Transferencia", "Decisión"], 399.6, [
      { cells: [`Asesor inmobiliario independiente, para atender mi búsqueda o comercialización.\n${recipient("transferenciaAsesor", "asesorDestinatario", "asesorPais")}`, ""], height: 35, decisions: choices, decisionKey: "transferenciaAsesor" },
      { cells: [`Entidad de financiamiento, para evaluar una opción de crédito que solicité.\n${recipient("transferenciaFinanciera", "financieroDestinatario", "financieroPais")}`, ""], height: 35, decisions: choices, decisionKey: "transferenciaFinanciera" },
      { cells: [`Contraparte o notaría, para evaluar o formalizar mi operación, cuando se requiera consentimiento.\n${recipient("transferenciaOperacion", "operacionDestinatario", "operacionPais")}`, ""], height: 43, decisions: choices, decisionKey: "transferenciaOperacion" },
    ]);
    ensure(80);
    top += 7.265;
    centered("D / Recepción del aviso", top, 12); top += 19.635;
    paragraph("Se puso a mi disposición este aviso de privacidad. La firma acredita su recepción y, exclusivamente, las autorizaciones afirmativas que marqué. No implica renuncia a mis derechos ni autorización para obtener un reporte de crédito.");
    const signer = options.publicTemplate ? "Nombre del titular o representante: __________________________" : own ? `${person}, por su propio derecho` : value("representante") ? `${value("representante")}, en representación de ${person}` : `${person}, por su propio derecho`;
    paragraph(`${signer}\nFirma: _________________________________________________________`, { size: 10, leading: 11.55, justify: false, keep: true });
    if (!options.publicTemplate && (own || !value("representante"))) paragraph("Carácter en esta hoja: titular de sus propios datos personales.", { size: 9.5, leading: 10.95, justify: false });
    else if (!options.publicTemplate) paragraph(`Documento de representación referido: ${value("documentoRepresentante").replace(/[.\s]+$/, "")}. Facultades y vigencia sujetas al cotejo del testimonio íntegro.`, { size: 9, leading: 10.35, justify: false, keep: true });
  }
  decisions(false);
  if (value("representante")) decisions(true);
  for (const [index, item] of pdf.getPages().entries()) {
    item.drawText(`${index + 1} / ${pdf.getPageCount()}`, { x: 63.65, y: 25.3, size: 10.5, font: regular, color: navy });
  }
  return pdf.save();
}
