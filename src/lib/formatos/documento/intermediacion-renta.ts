import { calcularIntermediacionRenta } from "../intermediacion-renta";
import { importePromesaLetra } from "../promesa";
import { BLANK, dinero, fecha, filas, v, type Block, type Documento } from "./modelo";

/*
  21 · Contrato de intermediación inmobiliaria para renta, con el texto que el titular aprobó el
  13/11/2026. Sigue la forma del 09: condiciones particulares en una tabla, declaraciones,
  cláusulas y firmas. Las opciones elegidas (honorarios por meses o porcentaje, renovación con o
  sin honorarios, uso, garantía) cambian el texto, y en el PDF y el Word solo sale lo elegido.
  Captura sobre el documento (EXT-12): cada renglón y las cláusulas con datos dicen qué campos las llenan.
*/

type Data = Record<string, unknown>;
const lines = (items: string[]) => items.length ? items.join("\n") : BLANK;
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value) : BLANK;
const days = (from: unknown, to: unknown) => typeof from === "string" && typeof to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)
  ? `${Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5) + 1} días naturales` : BLANK;
const CLIENTES = ["clientesContrato"];
const z = (label: string, ...keys: string[]) => ({ zona: { keys, label } });

const CLAUSULAS: [string, string][] = [
  ["PRIMERA. Encargo y límites.", "El CLIENTE encomienda al PRESTADOR promover el arrendamiento del inmueble identificado en las condiciones de renta autorizadas. El servicio no garantiza arrendatario, renta ni fecha de ocupación, ni el pago futuro de las rentas por el arrendatario. No comprende la administración del inmueble ni el cobro de rentas durante el arrendamiento, ni representación para celebrar contratos. El PRESTADOR no podrá aceptar solicitudes, firmar por el CLIENTE, recibir rentas, depósitos o garantías del arrendatario, ni disponer de fondos del CLIENTE, salvo los destinados expresamente a publicidad conforme a la cláusula tercera. Las rentas, el depósito y las garantías se entregan directamente al CLIENTE."],
  ["SEGUNDA. Servicios y colaboración.", "El PRESTADOR revisará la información recibida, preparará fotografías y publicidad veraz, difundirá el inmueble en sus medios y en modalidades gratuitas de portales cuando estén disponibles, y coordinará visitas autorizadas. A cada interesado le pedirá identificación, comprobante de ingresos y referencias, con su consentimiento y conforme al aviso de privacidad, y presentará al CLIENTE cada candidato con lo que haya recibido, dentro de dos días hábiles. Preparará el contrato de arrendamiento con las condiciones que el CLIENTE acepte, para que las partes lo revisen y firmen, y acompañará la entrega del inmueble con su inventario. Informará avances por escrito cada mes mientras promueva el inmueble. Podrá colaborar con otros asesores bajo su responsabilidad, pagando su participación con los honorarios pactados, sin cargo adicional al CLIENTE."],
  ["TERCERA. Condiciones, publicidad y gastos.", "Las condiciones de renta autorizadas permiten promover el inmueble, pero no obligan al CLIENTE a rentarlo. La elección del arrendatario y las condiciones finales requieren la aceptación escrita del CLIENTE. Se autoriza publicar imágenes del inmueble y su ubicación comercial, omitiendo datos, documentos y objetos privados; las visitas se concertarán previamente. Lonas, traslados, producción y difusión ordinarias están cubiertos por los honorarios o, si procede, por la pena de la cláusula novena; no se cobran además. La publicidad pagada en portales no está incluida: es opcional y a cargo del CLIENTE, previa autorización escrita de portal, periodo, importe máximo con impuestos y forma de pago. El PRESTADOR comprobará el uso de los fondos que reciba para ese fin y rendirá cuenta del saldo. Todo otro gasto extraordinario requiere autorización previa y escrita de concepto, importe máximo, proveedor y responsable de pago; sin ella no será exigible al CLIENTE."],
  ["TERCERA BIS. Revisión de candidatos.", "El PRESTADOR revisará que los documentos de cada candidato sean coherentes entre sí y le informará al CLIENTE lo que encuentre, pero no certifica su autenticidad ni garantiza la solvencia del arrendatario. La decisión de aceptarlo es del CLIENTE. Si el CLIENTE quiere una investigación especializada o una póliza de servicios jurídicos, la contratará por su cuenta o la autorizará por escrito como gasto extraordinario conforme a la cláusula tercera."],
  ["CUARTA. Honorarios y pago.", "Se pactan honorarios por resultado, calculados como se indica en las condiciones particulares sobre la renta pactada en el contrato de arrendamiento firmado, sin IVA de la renta. Solo se devengan cuando el CLIENTE y el arrendatario firmen el contrato de arrendamiento y el CLIENTE reciba la primera renta y el depósito. Se pagan dentro de los tres días hábiles siguientes, por transferencia a la cuenta del PRESTADOR comunicada por escrito, contra comprobante fiscal con IVA desglosado. No hay anticipo de honorarios ni honorarios por una solicitud rechazada o un arrendamiento que no se firme. Si el arrendamiento termina antes de su plazo por causa del arrendatario, los honorarios ya pagados no se devuelven, salvo que el arrendatario no llegue a ocupar el inmueble, en cuyo caso el PRESTADOR buscará un sustituto sin nuevos honorarios durante el resto de la vigencia."],
  ["QUINTA. Modalidad y prospectos.", "En EXCLUSIVA, el CLIENTE canalizará a los interesados y no contratará otro intermediario durante la vigencia. Un arrendamiento firmado dentro de ella genera los honorarios de la cláusula cuarta aunque el arrendatario llegue directamente o por conducto de otro intermediario, siempre que el PRESTADOR haya cumplido sus servicios y no sea una excepción identificada. En NO EXCLUSIVA, solo se generan por arrendatarios presentados y atendidos por el PRESTADOR, con intervención comprobable. Las excepciones de prospectos rigen en ambas modalidades y en la protección posterior. Al terminar la vigencia, los honorarios solo proceden si el arrendamiento se firma dentro del plazo de protección pactado con un prospecto presentado y atendido durante la vigencia, identificado en una lista con evidencia entregada al CLIENTE dentro de cinco días hábiles de concluir. Sin lista o fuera de plazo no hay protección; tampoco si la terminación deriva de incumplimiento del PRESTADOR o de la revocación de la cláusula séptima."],
  ["SEXTA. Documentos, condiciones y conflicto de interés.", "El CLIENTE facilitará documentos veraces y el acceso convenido, entregará el inmueble en condiciones de uso y comunicará cambios de titularidad, ocupación, gravámenes o facultades. Los impuestos, adeudos y gastos del inmueble se identificarán por concepto y responsable; no se presumen incluidos en los honorarios. Ante una contradicción relevante, el PRESTADOR informará y suspenderá la actuación afectada hasta aclararla; no anunciará como comprobado lo pendiente. El PRESTADOR actúa por cuenta del CLIENTE: no cobrará al arrendatario honorarios ni comisiones por esta operación sin consentimiento escrito del CLIENTE, y revelará antes de intervenir cualquier interés propio o vínculo con un candidato. El fallecimiento, la incapacidad o el cambio de representación suspenderán los actos que requieran facultades no acreditadas; cambiar a venta u otra operación exige nuevo acuerdo."],
  ["SÉPTIMA. Revocación inicial.", "El CLIENTE podrá revocar este contrato sin responsabilidad dentro de los cinco días hábiles siguientes a su firma, mediante aviso escrito al PRESTADOR. Este devolverá íntegramente cualquier cantidad recibida dentro de cinco días hábiles del aviso, sin retención de honorarios, gastos ni penalidad."],
  ["OCTAVA. Vigencia, terminación y liquidación.", "Las partes se obligan a mantener el encargo durante la vigencia pactada. Pasado el plazo de revocación inicial, la terminación anticipada por mera decisión de una parte requiere aviso escrito con diez días naturales; ese aviso no la libera de la pena de la cláusula novena. Ante incumplimiento sustancial se requerirá corrección en cinco días hábiles; si persiste, o no tiene remedio, la parte cumplida podrá rescindir mediante aviso motivado. Un impedimento no imputable a las partes que dure treinta días naturales permite concluir sin pena. El vencimiento sin arrendamiento no genera pena ni honorarios, salvo la protección de la cláusula quinta. En cinco días hábiles de concluir, el PRESTADOR retirará sus anuncios, pedirá el retiro a terceros, devolverá llaves y originales contra recibo, rendirá cuentas y devolverá los saldos a favor del CLIENTE, sin condicionarlo al pago de una cantidad discutida."],
  ["NOVENA. Pena por ruptura anticipada.", "Quien termine anticipadamente sin causa justificada, o provoque la rescisión por su incumplimiento sustancial conforme a la cláusula octava, pagará a la otra parte una pena recíproca equivalente al menor entre el importe máximo consignado en las condiciones particulares y los honorarios estimados sin IVA a la renta autorizada. Ese importe es el máximo total por este concepto y queda sujeto a las reducciones que correspondan por cumplimiento parcial. No procede por revocación inicial, vencimiento normal, arrendamiento firmado que concluya el encargo, acuerdo de terminación sin pena, incumplimiento de la otra parte, caso fortuito o fuerza mayor, ni por el mero rechazo de un candidato. La parte acreedora entregará hechos, fechas y liquidación, y el pago será dentro de diez días hábiles de recibirla, sin que el silencio implique aceptación. La pena sustituye los daños y perjuicios por esa misma ruptura e incluye gastos y trabajo de la operación: no se acumula con su reembolso ni con honorarios por la misma intermediación. Si después nacen honorarios conforme a las cláusulas cuarta y quinta, lo pagado por pena se abona a ellos y se devuelve cualquier exceso en cinco días hábiles."],
];

export function intermediacionRentaDocumento(d: Data): Documento {
  const clientes = filas(d.clientesContrato);
  const calc = calcularIntermediacionRenta(d);
  const representante = d.comparecePrestador === "representante";
  const comercial = d.uso === "comercial";
  let pena = BLANK;
  try { if (typeof d.penaMaxima === "number") pena = importePromesaLetra(d.penaMaxima, "MXN"); } catch { /* importe fuera de rango: queda la línea */ }
  const aviso = [d.medioAvisoPrivacidad, d.fechaAvisoPrivacidad ? fecha(d.fechaAvisoPrivacidad) : ""].filter(x => typeof x === "string" && x.trim()).join(", ");
  const uso = comercial ? `comercial u oficina, giro: ${v(d.giro)}` : d.uso === "habitacion" ? "casa habitación" : BLANK;
  const garantia = d.garantia === "fiador" ? "fiador" : d.garantia === "obligado" ? "obligado solidario" : d.garantia === "ninguna" ? "solo depósito" : BLANK;
  const siNo = (value: unknown) => value === "si" ? "sí" : value === "no" ? "no" : BLANK;
  const honorarios = d.honorariosModo === "porcentaje"
    ? `${num(d.porcentajeHonorarios)} % de la renta total del plazo forzoso del arrendamiento`
    : d.honorariosModo === "meses" ? `${num(d.mesesHonorarios)} ${d.mesesHonorarios === 1 ? "mes" : "meses"} de la renta pactada en el contrato de arrendamiento` : BLANK;
  const renovacion = d.renovacion === "con" ? `${num(d.porcentajeRenovacion)} % de una renta mensual vigente por cada renovación que el PRESTADOR gestione.` : d.renovacion === "sin" ? "No genera honorarios." : BLANK;

  const clauses: Block[] = CLAUSULAS.map(([lead, text]) => ({ kind: "clause", lead, text }));
  const blocks: Block[] = [
    { kind: "p", ...z("Partes del contrato", ...CLIENTES, "prestador"), text: `CONTRATO DE PRESTACIÓN DE SERVICIOS DE INTERMEDIACIÓN INMOBILIARIA PARA RENTA que celebran ${clientes.length ? clientes.map(c => v(c.nombre)).join(" y ") : BLANK}, por propio derecho o mediante la representación indicada en las condiciones particulares, en adelante el CLIENTE, y ${v(d.prestador)}, en adelante el PRESTADOR, por propio derecho o mediante la representación indicada en las condiciones particulares. Ambas partes acuerdan lo siguiente:` },
    { kind: "center", text: "Condiciones particulares" },
    { kind: "fields", widths: [2232, 7992], keys: [
      CLIENTES, CLIENTES, CLIENTES,
      ["prestador", "rfcPrestador"],
      ["comparecePrestador", "representantePrestador", "calidadRepresentante", "facultadesPrestador"],
      ["domicilioPrestador", "telefonoPrestador", "correoPrestador"],
      ["idInmueble", "inmueble", "claveCatastral"],
      ["tipoInmueble", "superficie", "accesorios", "derecho"],
      ["ocupacion", "condominioReglamento", "restricciones"],
      ["uso", "giro", "rentaAutorizada", "causaIva", "mesesDeposito", "garantia", "plazoMinimo", "mascotas"],
      ["modalidad", "inicio", "fin"],
      ["honorariosModo", "mesesHonorarios", "porcentajeHonorarios", "ivaHonorariosTasa"],
      ["renovacion", "porcentajeRenovacion"],
      ["penaMaxima"],
      ["proteccionDias", "excepcionesEstado", "excepcionesProspectos", "anexosEstado", "anexosContrato"],
    ], rows: [
      ["CLIENTE", lines(clientes.map(c => `${v(c.nombre)} · RFC: ${v(c.rfc)}`))],
      ["Representación", lines(clientes.map(c => `Representante, si aplica: ${v(c.representante)}${c.calidadRepresentante ? ` (${String(c.calidadRepresentante)})` : ""} · Documento y facultades: ${v(c.facultades)}`))],
      ["Domicilio y contacto", lines(clientes.map(c => `${v(c.domicilio)} · ${v(c.correo)}${c.telefono ? ` · ${String(c.telefono)}` : ""}`))],
      ["PRESTADOR", `${v(d.prestador)} · RFC: ${v(d.rfcPrestador)} · Marca: Fortius Inmuebles`],
      ["Representación", representante ? `${v(d.representantePrestador)} · ${v(d.calidadRepresentante)} · ${v(d.facultadesPrestador)}` : "Por propio derecho"],
      ["Domicilio y contacto", `${v(d.domicilioPrestador)} · ${v(d.telefonoPrestador)} / ${v(d.correoPrestador)}`],
      ["Inmueble / folio interno", `${v(d.idInmueble)} / Domicilio completo: ${v(d.inmueble)} · Clave catastral: ${v(d.claveCatastral)}`],
      ["Identidad y derecho", `${v(d.tipoInmueble)}; ${v(d.superficie)}; lo que se renta con el inmueble: ${v(d.accesorios)} / Carácter del CLIENTE y documento: ${v(d.derecho)}`],
      ["Situación informada", `Ocupación actual: ${v(d.ocupacion)}; condominio y reglamento: ${v(d.condominioReglamento)}; restricciones o adeudos informados: ${v(d.restricciones)}.`],
      ["Condiciones de renta autorizadas", `Uso: ${uso} · Renta mensual: ${dinero(d.rentaAutorizada)} MXN${d.causaIva === "si" ? ", más IVA" : ""} · Depósito: ${num(d.mesesDeposito)} ${d.mesesDeposito === 1 ? "mes" : "meses"} · Garantía que se pedirá: ${garantia} · Plazo mínimo: ${num(d.plazoMinimo)} ${d.plazoMinimo === 1 ? "mes" : "meses"} · Mascotas: ${siNo(d.mascotas)}`],
      ["Modalidad y vigencia", `${d.modalidad === "exclusiva" ? "Exclusiva" : d.modalidad === "no_exclusiva" ? "No exclusiva" : BLANK} · Plazo: ${days(d.inicio, d.fin)} · Del ${fecha(d.inicio)} al ${fecha(d.fin)}, sin renovación automática.`],
      ["Honorarios", `${honorarios}. IVA: ${typeof d.ivaHonorariosTasa === "number" ? `${num(d.ivaHonorariosTasa)} %` : BLANK}. Total estimado a la renta autorizada: ${calc.total === null ? BLANK : dinero(calc.total, "MXN")}.`],
      ["Renovación con el mismo arrendatario", renovacion],
      ["Pena máxima", `Moneda: MXN · Importe máximo: ${dinero(d.penaMaxima)} (${pena}). Naturaleza: compensación convencional por ruptura del encargo; no es gasto comprobado ni anticipo. Reducción, reciprocidad y límites: cláusula novena.`],
      ["Prospectos / anexos", `Protección posterior: ${typeof d.proteccionDias === "number" ? (d.proteccionDias === 0 ? "No se pacta" : `${d.proteccionDias} días naturales`) : BLANK}. Excepciones previas: ${d.excepcionesEstado === "ninguna" ? "Ninguna" : lines(filas(d.excepcionesProspectos).map(r => `${v(r.persona)} (${v(r.referencia)})`))}. Anexos incorporados: ${d.anexosEstado === "ninguno" ? "Ninguno" : lines(filas(d.anexosContrato).map(r => `${v(r.documento)}, ${fecha(r.fecha)}, versión ${v(r.version)}`))}.`],
    ] },
    { kind: "center", text: "Declaraciones" },
    { kind: "p", text: "El CLIENTE comprende a todas las personas identificadas que contratan; cada una declara la titularidad o las facultades descritas para dar el inmueble en arrendamiento, informa su situación y entregará los documentos que las sustenten. El PRESTADOR declara contar con las facultades y autorizaciones consignadas, que deberá acreditar. Ambas partes reconocen como integrantes de este contrato las condiciones particulares y los anexos expresamente identificados; ninguna declaración sustituye la comprobación documental." },
    { kind: "center", text: "Cláusulas" },
    ...clauses,
    { kind: "clause", lead: "DÉCIMA. Datos, avisos y atención.", ...z("Aviso de privacidad", "medioAvisoPrivacidad", "fechaAvisoPrivacidad"), text: `Los datos personales se tratarán conforme al aviso de privacidad puesto a disposición del CLIENTE en ${aviso || BLANK}, y los de los candidatos conforme al aviso que se les entregue. Solo se compartirán los necesarios para el servicio y en los supuestos autorizados o legalmente permitidos. Los avisos y quejas se enviarán a los domicilios o correos consignados; la recepción se acreditará con acuse, respuesta o constancia de entrega. Un mensaje no se tendrá por aceptado por el solo silencio. El PRESTADOR acusará recibo de quejas en dos días hábiles y responderá en cinco días hábiles, sin impedir acudir a la autoridad competente.` },
    { kind: "clause", lead: "DÉCIMA PRIMERA. Integridad y controversias.", ...z("Tribunales", "ciudad"), text: `Las modificaciones requieren acuerdo escrito de ambas partes, con fecha y referencia a este contrato. Las controversias se atenderán conforme a las leyes del Estado de Baja California y ante los tribunales competentes de ${v(d.ciudad)}, Baja California, sin renuncia a derechos irrenunciables. Cada parte recibe un ejemplar íntegro firmado, incluidos los anexos identificados.` },
    { kind: "center", text: "Firmas" },
    { kind: "p", ...z("Lugar y fecha de firma", "lugar", "fecha"), text: `Leído este contrato, las partes lo firman en ${v(d.lugar)}, Baja California, el ${fecha(d.fecha)}.` },
    { kind: "signatures", line: true, ...z("Firmas", ...CLIENTES, "firmantePrestador", "calidadFirmaPrestador"), parties: [
      { role: "CLIENTE", name: clientes.length ? clientes.map(c => `${v(c.firmante ?? c.nombre)}${c.calidadFirma ? `, ${String(c.calidadFirma)}` : ""}`).join("\n") : BLANK },
      { role: "PRESTADOR", name: `${v(d.firmantePrestador ?? d.prestador)}${d.calidadFirmaPrestador ? `, ${String(d.calidadFirmaPrestador)}` : ""}` },
    ] },
  ];
  return { title: "Contrato de intermediación inmobiliaria para renta", subject: `Formato 21 · ${v(d.folio)}`, estilo: "contrato", blocks };
}
