import { calendarioPagos, formaContrato, saldoCompraventa, sumarMeses } from "../compraventa-plazos";
import { importePromesaLetra } from "../promesa";
import { BLANK, dinero, fecha, sinAccesorios, v, type Block, type Documento } from "./modelo";

/*
  24 · Compraventa a plazos con reserva de dominio (DOC-14), con el texto que el titular aprobó el
  13/11/2026. Cada opción elegida al capturar cambia el texto y en el PDF solo sale lo elegido.
  Anexo 1: el calendario que calcula el sistema. Anexo 2: el acta de entrega, que se llena a mano el
  día de la entrega. Captura sobre el documento (EXT-12).
*/

type Data = Record<string, unknown>;
const CORTO = "__________";
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value) : CORTO;
const z = (label: string, ...keys: string[]) => ({ zona: { keys, label } });

export function compraventaPlazosDocumento(d: Data): Documento {
  const moneda = d.moneda === "USD" ? "USD" : "MXN";
  const letra = (value: unknown) => { try { return typeof value === "number" ? importePromesaLetra(value, moneda) : BLANK; } catch { return BLANK; } };
  const importe = (value: unknown) => `${dinero(value)} (${letra(value)})`;
  const condominio = d.condominio === "si";
  const conIntereses = d.intereses === "si";
  const forma = formaContrato(d);
  const privado = forma === "privado";
  const conyuge = d.vendedorTipo !== "moral" && d.consentimientoConyuge === "si";
  const fortius = d.intervieneFortius === "si";
  const saldo = saldoCompraventa(d);
  const pagos = calendarioPagos(d);
  const cuota = pagos?.[0]?.importe, ultima = pagos?.[pagos.length - 1]?.importe;
  const dia = typeof d.fechaPrimeraMensualidad === "string" && /^\d{4}-\d{2}-(\d{2})$/.test(d.fechaPrimeraMensualidad) ? String(Number(d.fechaPrimeraMensualidad.slice(8))) : CORTO;
  const firmanteV = d.vendedorTipo === "moral" ? `${v(d.vendedor)}, por conducto de ${v(d.vendedorRepresentante)}` : v(d.vendedor);
  const firmanteC = d.compradorTipo === "moral" ? `${v(d.comprador)}, por conducto de ${v(d.compradorRepresentante)}` : v(d.comprador);

  const persona = (quien: "vendedor" | "comprador", accion: string): string => {
    const p = (k: string) => d[`${quien}${k}`];
    return d[`${quien}Tipo`] === "moral"
      ? `Que es una sociedad constituida conforme a las leyes mexicanas, como consta en ${v(p("Acta"))}, con Registro Federal de Contribuyentes ${v(p("Rfc"))}, y que su representante, ${v(p("Representante"))}, cuenta con facultades suficientes para ${accion}, según ${v(p("Poder"))}, las cuales no le han sido revocadas ni limitadas.`
      : `Que es una persona física, mayor de edad, con capacidad legal para obligarse, de nacionalidad ${v(p("Nacionalidad"))}, que se identifica con ${v(p("Identificacion"))}, cuyo Registro Federal de Contribuyentes es ${v(p("Rfc"))} y cuyo estado civil es ${v(p("EstadoCivil"))}.`;
  };
  const personaKeys = (quien: string) => [`${quien}Tipo`, quien, `${quien}Nacionalidad`, `${quien}Identificacion`, `${quien}Rfc`, `${quien}EstadoCivil`, `${quien}Acta`, `${quien}Representante`, `${quien}Poder`];

  const entregaTexto = d.entrega === "enganche" ? "al recibir el enganche completo" : d.entrega === "fecha" ? `el ${fecha(d.fechaEntrega)}` : d.entrega === "firma" ? "a la firma de este contrato" : BLANK;
  const gastos = d.gastos === "mitad" ? "a ambas partes por mitad" : d.gastos === "comprador" ? "al Comprador" : BLANK;

  const blocks: Block[] = [
    { kind: "center", text: "Contrato de compraventa a plazos con reserva de dominio" },
    { kind: "p", ...z("Partes del contrato", "vendedor", "comprador", "vendedorTipo", "consentimientoConyuge", "conyugeVendedor"), text: `Contrato de compraventa a plazos con reserva de dominio que celebran, por una parte, ${v(d.vendedor)}, a quien en lo sucesivo se denominará «el Vendedor», y por la otra ${v(d.comprador)}, a quien en lo sucesivo se denominará «el Comprador»${conyuge ? `, con la comparecencia de ${v(d.conyugeVendedor)}, cónyuge del Vendedor, quien otorga su consentimiento para esta venta` : ""}, al tenor de las siguientes declaraciones y cláusulas.` },

    { kind: "center", text: "Declaraciones" },
    { kind: "label", text: "I. Declara el Vendedor:" },
    { kind: "p", indent: true, ...z("Datos del vendedor", ...personaKeys("vendedor"), "consentimientoConyuge"), text: `a) ${persona("vendedor", "enajenar el inmueble")}` },
    { kind: "p", indent: true, ...z("Título de propiedad", "tituloPropiedad", "datosRegistrales"), text: `b) Que es propietario del inmueble descrito en la cláusula Primera, como consta en ${v(d.tituloPropiedad)}, inscrito en el Registro Público de la Propiedad y de Comercio con los datos ${v(d.datosRegistrales)}.` },
    { kind: "p", indent: true, ...z("Gravámenes", "gravamen", "certificadoGravamen", "gravamenDescripcion", "acreedorGravamen"), text: d.gravamen === "cancelar"
      ? `c) Que sobre el inmueble existe ${v(d.gravamenDescripcion)} a favor de ${v(d.acreedorGravamen)}, que el Vendedor se obliga a cancelar a su costa antes de otorgar la transmisión de la propiedad prevista en la cláusula Sexta, y que no existe otro gravamen, embargo ni limitación de dominio.`
      : `c) Que el inmueble está libre de gravámenes, embargos y limitaciones de dominio, como consta en el certificado de libertad de gravamen ${v(d.certificadoGravamen)}.` },
    { kind: "p", indent: true, ...z("Condominio", "condominio"), text: `d) Que el inmueble se encuentra al corriente en el pago del impuesto predial${condominio ? ", de las cuotas del condominio" : ""} y de los servicios con que cuenta, a la fecha de firma.` },
    { kind: "p", indent: true, text: "e) Que no existe litigio, arrendamiento ni otra venta o promesa vigente que impida entregar la posesión y, en su momento, transmitir la propiedad." },
    { kind: "p", indent: true, ...z("Domicilio del vendedor", "vendedorDomicilio", "vendedorCorreo"), text: `f) Que su domicilio para recibir notificaciones es ${v(d.vendedorDomicilio)} y su correo electrónico ${v(d.vendedorCorreo)}.` },

    { kind: "label", text: "II. Declara el Comprador:" },
    { kind: "p", indent: true, ...z("Datos del comprador", ...personaKeys("comprador")), text: `a) ${persona("comprador", "celebrar este contrato")}` },
    { kind: "p", indent: true, text: "b) Que conoce el inmueble, lo ha visitado y lo adquiere en el estado en que se encuentra, que se hará constar en el acta de entrega del Anexo 2." },
    { kind: "p", indent: true, ...z("Origen de los recursos", "porCuentaDeOtro", "beneficiario"), text: `c) Que los recursos con que pagará el precio tienen origen lícito y que ${d.porCuentaDeOtro === "si" ? `actúa por cuenta de ${v(d.beneficiario)}, quien es el beneficiario de esta compra` : "actúa por cuenta propia"}.` },
    { kind: "p", indent: true, ...z("Domicilio del comprador", "compradorDomicilio", "compradorCorreo"), text: `d) Que su domicilio para recibir notificaciones es ${v(d.compradorDomicilio)} y su correo electrónico ${v(d.compradorCorreo)}.` },

    { kind: "label", text: "III. Declaran las partes:" },
    { kind: "p", indent: true, ...z("Intervención de Fortius", "intervieneFortius"), text: `a) Que se reconocen la personalidad con que comparecen y que celebran este contrato sin error, dolo, violencia ni otro vicio del consentimiento.` },
    ...(fortius ? [{ kind: "p" as const, indent: true, ...z("Intervención de Fortius", "intervieneFortius"), text: "b) Que la operación fue promovida por Fortius Inmuebles como intermediario del Vendedor, que Fortius no es parte de este contrato, no recibe ni custodia pagos del precio y no responde por las obligaciones de las partes. Su remuneración se rige por el contrato de intermediación que celebró con el Vendedor." }] : []),

    { kind: "center", text: "Cláusulas" },
    { kind: "clause", lead: "PRIMERA. Objeto.", ...z("Inmueble", "inmueble", "superficieTerreno", "superficieConstruccion", "claveCatastral", "accesorios"), text: `El Vendedor vende al Comprador, y este compra, el inmueble ubicado en ${v(d.inmueble)}, con superficie de terreno de ${num(d.superficieTerreno)} m² y de construcción de ${num(d.superficieConstruccion)} m², identificado con la clave catastral ${v(d.claveCatastral)}, con las medidas y colindancias que constan en su título de propiedad${sinAccesorios(d.accesorios) ? "" : `, que incluye ${v(d.accesorios)}`}. La propiedad queda reservada al Vendedor en los términos de la cláusula Quinta.` },
    { kind: "clause", lead: "SEGUNDA. Precio.", ...z("Precio y mensualidades", "moneda", "precio", "enganche", "enganchePagado", "fechaEnganche", "numeroMensualidades", "fechaPrimeraMensualidad", "intereses", "tasaAnual"), text: [
      `El precio total es de ${importe(d.precio)}, que el Comprador pagará así:`,
      `a) Un enganche de ${importe(d.enganche)}, que ${d.enganchePagado === "despues" ? `el Comprador pagará a más tardar el ${fecha(d.fechaEnganche)}` : "el Vendedor declara recibir a la firma de este contrato, sirviendo este documento como el recibo más amplio que en derecho proceda"}.`,
      `b) El saldo de ${importe(saldo ?? undefined)}, en ${num(d.numeroMensualidades)} mensualidades que vencen el día ${dia} de cada mes, a partir del ${fecha(d.fechaPrimeraMensualidad)}, conforme al calendario del Anexo 1.`,
      conIntereses
        ? `El saldo causa un interés ordinario fijo de ${num(d.tasaAnual)} por ciento anual sobre saldos insolutos. Cada mensualidad es de ${dinero(cuota)} e incluye capital e interés, como se desglosa en el Anexo 1.`
        : `El saldo no causa intereses ordinarios; cada mensualidad es de ${dinero(cuota)}.`,
      ...(pagos && pagos.length > 1 && ultima !== cuota ? [`La última mensualidad es de ${dinero(ultima)}, como consta en el Anexo 1.`] : []),
    ].join("\n") },
    { kind: "clause", lead: "TERCERA. Forma y lugar de pago.", ...z("Cuenta del vendedor", "banco", "cuentaVendedor"), text: `Los pagos se harán mediante transferencia electrónica o depósito a la cuenta ${v(d.cuentaVendedor)} del banco ${v(d.banco)}, a nombre del Vendedor, o mediante cheque nominativo a su favor. No se aceptan pagos en efectivo. El comprobante de la transferencia o del depósito acredita el pago. Si el día de pago es inhábil, el pago se hará el día hábil siguiente sin recargo.\nEl Comprador puede adelantar pagos en cualquier momento sin penalización. Lo adelantado se aplica a las últimas mensualidades${conIntereses ? " y reduce los intereses que correspondan a ese capital" : ""}.` },
    { kind: "clause", lead: "CUARTA. Mora.", ...z("Pago tardío", "moratorio", "tasaMoratoria"), text: `${d.moratorio === "si"
      ? `Si el Comprador no paga una mensualidad en su fecha, pagará sobre el importe vencido un interés moratorio de ${num(d.tasaMoratoria)} por ciento mensual, desde el día siguiente al vencimiento y hasta el día del pago.`
      : "El retraso en el pago no causa interés moratorio, sin perjuicio de lo previsto en la cláusula Novena."}\nTodo pago se aplica primero a los intereses moratorios, después a los ordinarios y al final al capital.` },
    { kind: "clause", lead: "QUINTA. Reserva de dominio.", text: "El Vendedor se reserva la propiedad del inmueble hasta que el Comprador pague la totalidad del precio y de los intereses que se hayan causado. Mientras la reserva subsista, el Comprador no adquiere la propiedad, aunque tenga la posesión. Pagado el precio total, el Vendedor transmitirá la propiedad en los términos de la cláusula Sexta." },
    { kind: "clause", lead: "SEXTA. Formalización e inscripción.", ...z("Escritura o documento privado", "formalizacion", "notario", "fechaEscritura", "diasRatificacion", "diasCancelacion"), text: `${privado
      ? `Este contrato se otorga en documento privado ante dos testigos, y las partes ratificarán sus firmas ante notario dentro de los ${num(d.diasRatificacion)} días naturales siguientes a la firma, para su inscripción en el Registro Público de la Propiedad y de Comercio. Pagado el precio total, el Vendedor otorgará, dentro de los ${num(d.diasCancelacion)} días naturales siguientes al último pago, el documento en que conste la cancelación de la reserva y la transmisión de la propiedad.`
      : `Las partes otorgarán este contrato, con la reserva de dominio, en escritura pública ante el notario ${v(d.notario)}, a más tardar el ${fecha(d.fechaEscritura)}, para su inscripción en el Registro Público de la Propiedad y de Comercio. Al pagarse el precio total, el Vendedor otorgará ante el mismo notario, o ante el que el Comprador elija, la cancelación de la reserva dentro de los ${num(d.diasCancelacion)} días naturales siguientes al último pago.`}\nSi el Vendedor no comparece a otorgar la cancelación de la reserva en el plazo pactado, el Comprador podrá exigirla judicialmente, además de la pena prevista en la cláusula Décima.` },
    { kind: "clause", lead: "SÉPTIMA. Posesión y entrega.", ...z("Entrega de la posesión", "entrega", "fechaEntrega"), text: `El Vendedor entregará al Comprador la posesión del inmueble ${entregaTexto}, con las llaves, los accesos y los servicios al corriente. La entrega se hará constar en el acta del Anexo 2, firmada por ambas partes, con el estado del inmueble y las lecturas de los medidores.` },
    { kind: "clause", lead: "OCTAVA. Obligaciones durante la reserva.", ...z("Seguro", "seguro", "sumaAsegurada"), text: [
      "Desde la entrega de la posesión y mientras subsista la reserva:",
      `a) El Comprador pagará el impuesto predial, los servicios${condominio ? ", las cuotas del condominio" : ""} y el mantenimiento ordinario del inmueble, y entregará al Vendedor copia de los comprobantes cuando este la pida.`,
      "b) El Comprador conservará el inmueble en buen estado y responderá de su deterioro, salvo el que resulte del uso normal o del paso del tiempo.",
      "c) El Comprador no podrá vender, prometer en venta, gravar, ceder sus derechos de este contrato ni dar en arrendamiento o comodato el inmueble sin autorización previa y por escrito del Vendedor.",
      "d) El Comprador no hará obras que modifiquen la estructura del inmueble sin autorización previa y por escrito del Vendedor. Las mejoras se rigen por la cláusula Novena.",
      "e) El Vendedor no podrá vender, prometer en venta ni gravar el inmueble, ni ceder los derechos de cobro de este contrato sin aviso previo y por escrito al Comprador, y respetará en todo caso los términos de este contrato.",
      ...(d.seguro === "si" ? [`f) El Comprador contratará y mantendrá vigente un seguro de daños del inmueble por al menos ${dinero(d.sumaAsegurada)}, con el Vendedor como beneficiario preferente mientras subsista la reserva, y entregará la póliza al Vendedor.`] : []),
    ].join("\n") },
    { kind: "clause", lead: "NOVENA. Falta de pago y rescisión.", ...z("Rescisión por falta de pago", "mensualidadesRescindir", "diasGracia", "diasDesocupacion", "rentaCompensatoria", "penaRescision", "diasDevolucion"), text: [
      `Si el Comprador deja de pagar ${num(d.mensualidadesRescindir)} mensualidades, consecutivas o no, el Vendedor le dará aviso por escrito en el domicilio o correo de la declaración II. Si el Comprador no se pone al corriente dentro de los ${num(d.diasGracia)} días naturales siguientes al aviso, el Vendedor podrá elegir entre exigir el pago de lo vencido o rescindir este contrato.`,
      "Si el Vendedor rescinde:",
      `a) El Comprador devolverá la posesión del inmueble dentro de los ${num(d.diasDesocupacion)} días naturales siguientes a la rescisión, en el estado en que lo recibió, salvo el desgaste por el uso normal, con los servicios, el predial${condominio ? " y las cuotas" : ""} al corriente.`,
      `b) El Vendedor devolverá al Comprador lo que este pagó a cuenta del precio, menos: una renta por el uso del inmueble de ${dinero(d.rentaCompensatoria)} por cada mes o fracción que el Comprador lo haya poseído; el costo de reparar los daños que excedan el desgaste normal, con presupuesto o factura; los adeudos de predial, servicios${condominio ? " y cuotas" : ""} que haya dejado el Comprador; y una pena convencional de ${num(d.penaRescision)} por ciento del precio total. Lo que resulte se devolverá dentro de los ${num(d.diasDevolucion)} días naturales siguientes a la desocupación, por transferencia a la cuenta que indique el Comprador.`,
      "c) Las mejoras necesarias hechas por el Comprador se le reembolsarán con su comprobante. Las mejoras útiles autorizadas por escrito por el Vendedor se le reembolsarán al valor de su comprobante o, si el Vendedor lo prefiere, el Comprador podrá retirarlas sin dañar el inmueble. Las demás quedan en beneficio del inmueble sin reembolso.",
      `d) ${conIntereses ? "Los intereses ordinarios pagados no se devuelven. " : ""}La suma de la renta por uso y la pena no podrá exceder de lo que el Comprador haya pagado a cuenta del precio.`,
    ].join("\n") },
    { kind: "clause", lead: "DÉCIMA. Incumplimiento del Vendedor.", ...z("Pena al vendedor", "penaVendedor", "diasDevolucion"), text: `Si el Vendedor no entrega la posesión en la fecha pactada, grava o enajena el inmueble en contra de este contrato o no otorga la cancelación de la reserva en el plazo de la cláusula Sexta, el Comprador podrá exigir el cumplimiento o rescindir este contrato. En ambos casos el Vendedor pagará una pena convencional de ${num(d.penaVendedor)} por ciento del precio total. Si el Comprador rescinde, el Vendedor le devolverá todo lo pagado a cuenta del precio, más la pena, dentro de los ${num(d.diasDevolucion)} días naturales siguientes, y el Comprador devolverá la posesión al recibir el pago.` },
    { kind: "clause", lead: "DÉCIMA PRIMERA. Gastos e impuestos.", ...z("Gastos e impuestos", "gastos"), text: `El impuesto sobre la renta que cause la venta corresponde al Vendedor. El impuesto sobre adquisición de inmuebles, los derechos de registro y los honorarios y gastos notariales ${privado ? "de la ratificación, de la cancelación de la reserva y de la transmisión de la propiedad" : "de la escritura y de la cancelación de la reserva"} corresponden ${gastos}. El avalúo que se requiera corre a cargo de quien lo solicite.` },
    { kind: "clause", lead: "DÉCIMA SEGUNDA. Notificaciones.", text: "Los avisos de este contrato se harán por escrito en los domicilios o correos de las declaraciones. Un cambio de domicilio o correo surte efecto desde que se avisa por escrito a la otra parte." },
    { kind: "clause", lead: "DÉCIMA TERCERA. Derechos que la ley protege.", text: "Ninguna cláusula de este contrato se entenderá como renuncia a los derechos que la ley no permite renunciar. Si una cláusula resulta inválida, las demás conservan su validez." },
    { kind: "clause", lead: "DÉCIMA CUARTA. Jurisdicción.", ...z("Tribunales", "municipioJurisdiccion"), text: `Para la interpretación y cumplimiento de este contrato, las partes se someten a las leyes del Estado de Baja California y a los tribunales competentes de ${v(d.municipioJurisdiccion)}, Baja California, y renuncian al fuero que pudiera corresponderles por razón de su domicilio presente o futuro.` },

    { kind: "center", text: "Firmas" },
    { kind: "p", ...z("Lugar y fecha de firma", "municipioFirma", "fechaFirma"), text: `Leído este contrato y enteradas las partes de su contenido y alcance, lo firman en ${v(d.municipioFirma)}, Baja California, el ${fecha(d.fechaFirma)}.` },
    { kind: "signatures", line: true, ...z("Firmas", "vendedor", "comprador", "vendedorRepresentante", "compradorRepresentante", "conyugeVendedor"), parties: [
      { role: "EL VENDEDOR", name: firmanteV },
      { role: "EL COMPRADOR", name: firmanteC },
      ...(conyuge ? [{ role: "CÓNYUGE DEL VENDEDOR", name: v(d.conyugeVendedor) }] : []),
    ] },
    ...(privado ? [{ kind: "signatures" as const, line: true, ...z("Testigos", "testigo1", "testigo2"), parties: [{ role: "TESTIGO", name: v(d.testigo1) }, { role: "TESTIGO", name: v(d.testigo2) }] }] : []),

    { kind: "pagebreak", hoja: true },
    { kind: "center", text: "Anexo 1. Calendario de pagos" },
    { kind: "table", widths: conIntereses ? [750, 2750, 1750, 1600, 1650, 1724] : [1200, 3000, 3000, 3024], ...z("Calendario de pagos", "precio", "enganche", "numeroMensualidades", "fechaPrimeraMensualidad", "intereses", "tasaAnual"),
      header: conIntereses ? ["Pago", "Vence", "Importe", "Interés", "Capital", "Saldo"] : ["Pago", "Vence", "Importe", "Saldo"],
      rows: pagos
        ? [...pagos.map(p => conIntereses ? [String(p.numero), fecha(p.fecha), dinero(p.importe), dinero(p.interes), dinero(p.capital), dinero(p.saldo)] : [String(p.numero), fecha(p.fecha), dinero(p.importe), dinero(p.saldo)]),
          conIntereses ? ["Total", "", dinero(suma(pagos.map(p => p.importe))), dinero(suma(pagos.map(p => p.interes))), dinero(suma(pagos.map(p => p.capital))), ""] : ["Total", "", dinero(suma(pagos.map(p => p.importe))), ""]]
        : Array.from({ length: 3 }, (_, i) => conIntereses ? [String(i + 1), filaFecha(d, i), CORTO, CORTO, CORTO, CORTO] : [String(i + 1), filaFecha(d, i), CORTO, CORTO]) },
    { kind: "p", text: `Importes en ${moneda === "USD" ? "dólares de los Estados Unidos de América" : "pesos mexicanos"}. El enganche no forma parte de este calendario.` },

    { kind: "pagebreak", hoja: true },
    { kind: "center", text: "Anexo 2. Acta de entrega de la posesión" },
    { kind: "p", text: `Inmueble: ${v(d.inmueble).replace(/\.$/, "")}.\nFecha y hora de entrega: ${BLANK}\nPersonas presentes: ${BLANK}` },
    { kind: "grid", widths: [2.6, 2, 5.6], header: ["Espacio o elemento", "Estado", "Observaciones"], minRow: 22, rows: Array.from({ length: 8 }, () => ["", "", ""]) },
    { kind: "grid", widths: [2.6, 3.8, 3.8], header: ["Servicio", "Medidor o contrato", "Lectura"], labels: true, minRow: 22, rows: [["Luz", "", ""], ["Agua", "", ""], ["Gas", "", ""]] },
    { kind: "p", text: `Llaves, controles y accesos entregados: ${BLANK}\nLo que se entrega con el inmueble: ${BLANK}\nFotografías tomadas: ${CORTO}, que se conservan en ${BLANK}.` },
    { kind: "p", text: "El Comprador recibe la posesión del inmueble en el estado descrito, para los efectos de la cláusula Séptima del contrato." },
    { kind: "signatures", line: true, parties: [{ role: "EL VENDEDOR", name: firmanteV }, { role: "EL COMPRADOR", name: firmanteC }] },
  ];
  return { title: "Compraventa a plazos con reserva de dominio", subject: `Formato 24 · ${v(d.folio)}`, estilo: "contrato", blocks };
}

const suma = (values: number[]) => Math.round(values.reduce((acc, value) => acc + Math.round(value * 100), 0)) / 100;
const filaFecha = (d: Data, i: number) => typeof d.fechaPrimeraMensualidad === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.fechaPrimeraMensualidad) ? fecha(sumarMeses(d.fechaPrimeraMensualidad, i)) : CORTO;
