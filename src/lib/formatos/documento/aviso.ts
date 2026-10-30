import { claveRepresentante, decisionesRepresentante } from "../aviso";
import { BLANK, a, fecha, type Block, type Documento, type FormCell } from "./modelo";

/*
  01 · Aviso de privacidad del expediente, con el texto cotejado contra la plantilla vigente
  (04_Metodologia/01_Captacion/01_AvisoPrivacidad.docx, 26/10/2026): cuerpo en Times, recuadro
  de contacto, tablas y hojas de decisiones. Se captura sobre el documento y el PDF sale de
  este mismo modelo (EXT-12, 28/10/2026). El aviso público del sitio lo sigue generando
  aviso-pdf.ts; si cambia el texto de las secciones 01 a 08, debe cambiar en ambos.
*/

type Data = Record<string, unknown>;
const SI_NO = [{ value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "no_aplica", label: "No aplica" }];
const RAYA = "______________________________";
const canales = [["Correo", "publicidadCorreo"], ["Teléfono", "publicidadTelefono"], ["Mensajería", "publicidadMensajeria"]] as const;

/*
  Hojas de decisiones con el texto de la plantilla del 26/10/2026 (01_AvisoPrivacidad.docx): la del
  titular y, si hay representante, la de sus propios datos. Cada parte dice qué campos la llenan
  («zona») para la captura sobre el documento; las casillas se dibujan, no se escriben.
*/
function decisiones(d: Data, own: boolean): Block[] {
  const choices = own ? decisionesRepresentante(d) : d;
  const k = (key: string) => own ? claveRepresentante(key) : key;
  const titular = a(d.titular), representante = a(d.representante);
  const signed = choices.acuseEstado === "firmado_fuera" ? fecha(a(choices.fechaAcuse)) : "";
  const destino = (key: string, target: string, country: string) => `Destinatario / país: ${choices[key] === "si" ? `${a(choices[target])} / ${a(choices[country])}` : RAYA}`;
  const transferencia = (texto: string, key: string, target: string, country: string): FormCell[] => [
    { q: texto, a: destino(key, target, country), w: 7, keys: [k(key), k(target), k(country)] },
    { q: "Decisión", a: "", w: 3, keys: [k(key), k(target), k(country)], marks: [SI_NO.map(o => ({ text: o.label, check: o.value === choices[key] }))] },
  ];
  const recepcion = { keys: [k("acuseEstado"), k("fechaAcuse"), k("referenciaAcuse")], label: "Fecha de recepción y firma" };
  return [
    { kind: "pagebreak", force: true, hoja: true },
    { kind: "title", text: own ? "Decisiones del representante sobre sus propios datos" : "Decisiones del titular de los datos", bold: true, size: 18 },
    // Los datos cortos van en pareja por renglón, para que la hoja completa quepa en una página.
    { kind: "p", zona: recepcion, text: (own
      ? [`Titular de los datos personales: ${representante || BLANK}`, `Operación: ${a(d.operacion) || BLANK} · Expediente: ${a(d.folio) || BLANK}`, `Fecha de recepción y decisiones: ${signed || BLANK}`]
      : [`Titular: ${titular || BLANK} · Representante, si aplica: ${representante || "no aplica"}`, `Operación: ${a(d.operacion) || BLANK} · Expediente: ${a(d.folio) || BLANK}`, `Fecha de recepción y decisiones: ${signed || BLANK}`]).join("\n") },
    { kind: "p", text: own ? "Complete esta hoja cuando también se traten datos personales propios del representante. Sus decisiones sobre esos datos no sustituyen las del titular representado." : "Esta hoja corresponde a los datos del titular identificado arriba. Quien lo represente sólo podrá decidir dentro de las facultades que acredite." },
    { kind: "h2", text: "A  /  Tratamiento de datos patrimoniales o financieros" },
    { kind: "p", text: "Para evaluar y tramitar mi operación y, en su caso, administrar los servicios contratados, consiento expresamente el tratamiento de los datos patrimoniales y financieros descritos en el aviso. Si existe una excepción legal al consentimiento, el responsable deberá identificarla y documentarla; no se presume por firmar la recepción." },
    { kind: "checks", zona: { keys: [k("consentimientoPatrimonial")], label: "Datos patrimoniales y financieros" }, q: "", options: [{ value: "si", label: "Sí consiento" }, { value: "no", label: "No consiento" }, { value: "no_aplica", label: "No aplica en esta etapa" }], selected: choices.consentimientoPatrimonial },
    { kind: "h2", text: "B  /  Publicidad y oportunidades adicionales" },
    { kind: "checks", zona: { keys: [k("consentimientoPublicidad"), ...canales.map(([, key]) => k(key))], label: "Publicidad y oportunidades adicionales" }, q: "Acepto recibir novedades y promociones no relacionadas con mi solicitud vigente:", options: [{ value: "si", label: "Sí autorizo" }, { value: "no", label: "No autorizo" }], selected: choices.consentimientoPublicidad },
    { kind: "checks", zona: { keys: [k("consentimientoPublicidad"), ...canales.map(([, key]) => k(key))], label: "Canales autorizados" }, q: "Canales autorizados:", options: canales.map(([label, key]) => ({ value: key, label })), selected: choices.consentimientoPublicidad === "si" ? canales.filter(([, key]) => choices[key] === "si").map(([, key]) => key) : [] },
    { kind: "h2", text: "C  /  Transferencias que requieren mi autorización" },
    { kind: "p", text: "Autorizo únicamente las transferencias seleccionadas, para los fines indicados. El destinatario y el país deben quedar identificados antes del envío." },
    { kind: "form", rows: [
      transferencia("Asesor inmobiliario independiente, para atender mi búsqueda o comercialización.", "transferenciaAsesor", "asesorDestinatario", "asesorPais"),
      transferencia("Entidad de financiamiento, para evaluar una opción de crédito que solicité.", "transferenciaFinanciera", "financieroDestinatario", "financieroPais"),
      transferencia("Contraparte o notaría, para evaluar o formalizar mi operación, cuando se requiera consentimiento.", "transferenciaOperacion", "operacionDestinatario", "operacionPais"),
    ] },
    { kind: "h2", text: "D  /  Recepción del aviso" },
    { kind: "p", text: "Se puso a mi disposición este aviso de privacidad. La firma acredita su recepción y, exclusivamente, las autorizaciones afirmativas que marqué. No implica renuncia a mis derechos ni autorización para obtener un reporte de crédito." },
    ...(own ? [
      { kind: "p", zona: recepcion, text: `Nombre del representante, por su propio derecho: ${representante || BLANK}\nFirma: ${RAYA}` },
      { kind: "note", text: "Carácter en esta hoja: titular de sus propios datos personales." },
    ] satisfies Block[] : [
      // Firma el titular por su propio derecho o, si lo hay, su representante con el carácter que acredite.
      { kind: "p", zona: { keys: ["representante", "calidadRepresentante", ...recepcion.keys], label: "Quién firma" }, text: `Nombre del titular o representante: ${representante || titular || BLANK} · Carácter en que firma: ${representante ? a(d.calidadRepresentante) || BLANK : titular ? "por su propio derecho" : BLANK}\nFirma: ${RAYA}` },
      { kind: "p", zona: { keys: ["documentoRepresentante", "instrumentoRepresentante", "facultadesRepresentante"], label: "Documento de representación" }, text: `Documento que acredita la representación, si aplica: ${a(d.documentoRepresentante).replace(/[.\s]+$/, "") || BLANK}. Datos del instrumento, fecha y fedatario: ${a(d.instrumentoRepresentante).replace(/[.\s]+$/, "") || BLANK}. Facultades y vigencia comprobadas mediante: ${a(d.facultadesRepresentante).replace(/[.\s]+$/, "") || BLANK}.` },
    ] satisfies Block[]),
  ];
}

export function avisoDocumento(d: Data): Documento {
  const correo = a(d.correoPrivacidad) || BLANK, contacto = a(d.contactoPrivacidad) || BLANK;
  const blocks: Block[] = [
    { kind: "title", text: "Aviso de\nprivacidad", bold: true, size: 32 },
    { kind: "caption", text: "Propietarios · compradores · arrendatarios" },
    { kind: "band", zona: { keys: ["responsable", "domicilioResponsable", "contactoPrivacidad", "correoPrivacidad"], label: "Responsable y contacto" }, widths: [1], rows: [[{ label: "Responsable y contacto", value: [`Responsable: ${a(d.responsable) || BLANK}`, `Domicilio: ${a(d.domicilioResponsable) || BLANK}`, `Atención de privacidad: ${contacto} · ${correo}`].join("\n") }]] },
    // La fecha de emisión y la calidad del titular no se imprimen; se capturan con el titular.
    { kind: "p", zona: { keys: ["titular", "tipoTitular", "representante", "calidadRepresentante", "operacion", "fechaEmision"], label: "Titular y operación" }, text: [`Titular: ${a(d.titular) || BLANK}`, `Representante, si aplica: ${a(d.representante) ? `${a(d.representante)}, ${a(d.calidadRepresentante) || "representante"}` : "no aplica"}`, `Operación e inmueble: ${a(d.operacion) || BLANK}`, `Folio del expediente: ${a(d.folio) || BLANK}`].join("\n") },
    { kind: "p", text: "La persona identificada arriba, que opera bajo el nombre comercial Fortius Inmuebles, es responsable del tratamiento de sus datos. Este aviso explica qué información utiliza, para qué la necesita y cómo puede usted decidir sobre ella. La marca comercial no sustituye la identidad del responsable." },
    { kind: "h2", text: "01  /  A quién se dirige y cómo obtenemos los datos" },
    { kind: "p", text: "Se dirige a quienes solicitan o reciben servicios de intermediación, valoración comercial o administración inmobiliaria, y a sus representantes, copropietarios y obligados solidarios. Recibimos información en entrevistas, visitas, documentos, llamadas, correo y mensajería; también de representantes autorizados, contrapartes de una operación y registros públicos consultados legítimamente. La información de terceros no autoriza usos ajenos a este aviso." },
    { kind: "h2", text: "02  /  Qué información tratamos" },
    { kind: "table", widths: [2, 8], header: ["Categoría", "Datos y momento de solicitud"], rows: [
      ["Identificación y contacto", "Nombre, domicilio, teléfono, correo, firma y datos de identificación oficial. Nacionalidad, fecha de nacimiento, CURP, RFC, estado civil y representación, sólo si la etapa o la obligación aplicable los requiere."],
      ["Solicitud e inmueble", "Tipo de operación, preferencias, presupuesto, domicilio y características del inmueble; titularidad, documentos registrales, fotografías del inmueble, visitas, propuestas y contratos relacionados."],
      ["Patrimonio y finanzas", "Precio o renta, ingresos y comprobantes de solvencia, datos laborales, cuentas para pagos, depósitos, adeudos y documentación fiscal, cuando sean necesarios para evaluar o ejecutar la operación."],
    ] },
    { kind: "p", text: "No se solicitan datos sensibles ni biométricos para la atención ordinaria. No envíe información de salud, creencias, origen étnico o vida sexual. Si un supuesto excepcional exigiera tratar datos sensibles, se informarán previamente los datos, la finalidad y el consentimiento escrito que corresponda. No se pide todo el expediente en el primer contacto." },

    { kind: "title", text: "Uso y comunicación\nde sus datos", bold: true, size: 20 },
    { kind: "h2", text: "03  /  Finalidades necesarias" },
    { kind: "p", text: "Los datos se utilizarán según el servicio solicitado y la etapa de la operación:" },
    ...[
      "Atender su solicitud, identificar sus necesidades, responder consultas, presentar opciones pertinentes y coordinar visitas.",
      "Verificar identidad, representación, titularidad y documentos del inmueble; analizar la viabilidad de la operación y, en arrendamiento, la solvencia aportada por el solicitante.",
      "Preparar opiniones comerciales, propuestas, contratos, expedientes de formalización y actas de entrega; comunicar a las partes los avances de su operación.",
      "Si contrata administración: gestionar cobros, depósitos, gastos y mantenimiento autorizados, atender incidencias y rendir cuentas.",
      "Facturar, llevar registros de la relación contractual, atender reclamaciones y cumplir las obligaciones fiscales y de prevención de lavado de dinero que efectivamente resulten aplicables.",
    ].map((text): Block => ({ kind: "p", text: `• ${text}` })),
    { kind: "p", text: "Los datos financieros o patrimoniales requieren consentimiento expreso, salvo una excepción legal aplicable. La sección de decisiones permite documentarlo. Una consulta a sociedades de información crediticia, si se solicitara, requiere su procedimiento y autorización específicos; este aviso no los sustituye." },
    { kind: "h2", text: "04  /  Publicidad y contacto comercial opcionales" },
    { kind: "p", text: "Sólo con su autorización le enviaremos novedades, nuevas oportunidades y promociones ajenas a su solicitud vigente, por correo, teléfono o mensajería. Puede negarse desde el inicio o pedir la baja en el correo de privacidad. Su decisión no condiciona la atención del servicio solicitado. Una opción sin marcar no se considera autorización para estas finalidades." },
    { kind: "h2", text: "05  /  Con quién podemos compartir información" },
    { kind: "table", widths: [3, 7], header: ["Destinatario", "Finalidad y regla aplicable"], rows: [
      ["Autoridades competentes", "Cumplir requerimientos y obligaciones previstos en disposiciones aplicables. Se entregará únicamente la información legalmente procedente."],
      ["Contraparte y notaría de la operación", "Evaluar la propuesta y preparar, formalizar o ejecutar la operación solicitada. Sólo se prescindirá del consentimiento cuando se actualice una excepción legal; de lo contrario se solicitará antes del envío."],
      ["Asesores inmobiliarios externos o entidades de financiamiento", "Canalizar su solicitud a un asesor independiente o gestionar una opción de crédito que usted elija. Requiere la autorización específica de la sección de decisiones, salvo excepción legal acreditada."],
    ] },
    { kind: "p", text: "Las transferencias se limitarán a los datos necesarios y a la finalidad informada. Se comunicará al receptor el aviso y las obligaciones correspondientes. No se autoriza con este documento la venta de bases de datos. Los proveedores que procesen información por instrucciones del responsable deberán estar sujetos a deberes de seguridad y confidencialidad. Si se prevé una transferencia internacional no descrita aquí, se informará previamente su destinatario y finalidad, y se recabará el consentimiento cuando proceda." },

    { kind: "title", text: "Sus derechos\ny cómo ejercerlos", bold: true, size: 20 },
    { kind: "h2", text: "06  /  Acceso, rectificación, cancelación y oposición" },
    { kind: "p", text: "Puede conocer los datos que conservamos y sus condiciones de uso; corregir información inexacta o incompleta; pedir su cancelación cuando proceda, u oponerse al tratamiento por causa legítima. Estos derechos pueden ejercerse por separado." },
    { kind: "band", widths: [1], rows: [[{ label: "Presente su solicitud", value: `Envíela a ${correo} o entréguela en el domicilio del responsable. Diríjala a ${contacto}. No necesita contratar nuestros servicios ni utilizar un formato obligatorio.` }]] },
    { kind: "p", text: "Indique su nombre y un medio para recibir respuesta; acredite su identidad y, en su caso, la representación; describa el derecho o la solicitud y los datos involucrados, excepto que solicite acceso. Agregue elementos que ayuden a localizarlos. Para rectificación, precise la corrección y adjunte su soporte. Evite remitir documentos que no sean necesarios para acreditar o resolver su petición." },
    { kind: "p", text: "Comunicaremos la determinación en un máximo de 20 días hábiles desde la recepción de la solicitud. Si procede, se hará efectiva dentro de los 15 días hábiles siguientes a la respuesta. Cada plazo puede ampliarse una sola vez por un periodo igual, cuando las circunstancias lo justifiquen; se le comunicará la ampliación y su motivo." },
    { kind: "p", text: "La respuesta se enviará por el medio indicado. Previa acreditación de identidad, el acceso podrá atenderse mediante documentos electrónicos o copias simples. El trámite es gratuito; sólo podrán cobrarse los conceptos permitidos por la ley. Si existe una causa legal que limite la solicitud, se explicará la decisión y su alcance. Puede acudir a la Secretaría Anticorrupción y Buen Gobierno mediante el procedimiento de protección de derechos previsto en la ley." },
    { kind: "h2", text: "07  /  Revocación del consentimiento y limitación de uso" },
    { kind: "p", text: "Puede revocar su consentimiento o solicitar que dejemos de enviarle publicidad mediante el mismo correo o domicilio. Identifique el tratamiento o canal que desea suspender y su medio de respuesta. Para revocación se acreditará la identidad; se atenderá con los requisitos y plazos del procedimiento anterior. La revocación no tiene efectos retroactivos ni elimina obligaciones legales de conservación. Si impide continuar una parte del servicio, se le explicará cuál y por qué. La baja de publicidad se registrará para evitar nuevos envíos por esa finalidad." },
    { kind: "h2", text: "08  /  Conservación, seguridad y cambios al aviso" },
    { kind: "p", text: "Los datos se conservarán durante el tiempo necesario para las finalidades informadas y los plazos legales o contractuales aplicables. Al concluir, se bloquearán y suprimirán cuando corresponda. El acceso debe limitarse al personal y proveedores autorizados, con medidas administrativas, técnicas y físicas acordes con el riesgo. Las vulneraciones que afecten significativamente sus derechos se comunicarán conforme a la ley." },
    { kind: "p", text: `Las actualizaciones podrán solicitarse en ${correo} o consultarse en el domicilio del responsable. Se informarán los cambios sustanciales por el medio de contacto registrado y se solicitará un nuevo consentimiento cuando corresponda.` },
    ...decisiones(d, false),
    ...(a(d.representante) ? decisiones(d, true) : []),
  ];
  return { title: "Aviso de privacidad", subject: `Expediente ${a(d.folio)}`, estilo: "aviso", blocks };
}
