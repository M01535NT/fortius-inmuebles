import { importePromesaLetra } from "../promesa";
import { BLANK, dinero, fecha, v, type Block, type Documento } from "./modelo";

/*
  20 · Contrato de arrendamiento (DOC-14), con el texto que el titular aprobó el 13/11/2026.
  Un solo contrato para casa habitación o para uso comercial u oficina: cada opción elegida al
  capturar cambia el texto, y en el PDF y el Word solo sale lo elegido. Captura sobre el documento
  (EXT-12): cada declaración y cada cláusula dicen qué campos las llenan.
*/

type Data = Record<string, unknown>;
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value) : BLANK;
const letra = (value: unknown) => { try { return typeof value === "number" ? importePromesaLetra(value, "MXN") : BLANK; } catch { return BLANK; } };
const importe = (value: unknown) => `${dinero(value)} (${letra(value)})`;
const meses = (value: unknown) => `${num(value)} ${value === 1 ? "mes" : "meses"}`;
const z = (label: string, ...keys: string[]) => ({ zona: { keys, label } });

export function arrendamientoDocumento(d: Data): Documento {
  const comercial = d.uso === "comercial";
  const garante = d.garantia === "fiador" ? "Fiador" : d.garantia === "obligado" ? "Obligado Solidario" : "";
  const condominio = d.condominio === "si";
  const firmanteDor = d.arrendadorTipo === "moral" ? `${v(d.arrendador)}, por conducto de ${v(d.arrendadorRepresentante)}` : v(d.arrendador);
  const firmanteTario = d.arrendatarioTipo === "moral" ? `${v(d.arrendatario)}, por conducto de ${v(d.arrendatarioRepresentante)}` : v(d.arrendatario);
  const PARTES = ["arrendador", "arrendatario", "garantia", "garante"];

  const persona = (quien: "arrendador" | "arrendatario"): string => {
    const p = (k: string) => d[`${quien}${k}`];
    return d[`${quien}Tipo`] === "moral"
      ? `Que es una sociedad constituida conforme a las leyes mexicanas, como consta en ${v(p("Acta"))}, con Registro Federal de Contribuyentes ${v(p("Rfc"))}, y que su representante, ${v(p("Representante"))}, cuenta con facultades suficientes para celebrar este contrato, según ${v(p("Poder"))}, las cuales no le han sido revocadas ni limitadas.`
      : `Que es una persona física, mayor de edad, con capacidad legal para obligarse, de nacionalidad ${v(p("Nacionalidad"))}, que se identifica con ${v(p("Identificacion"))} y cuyo Registro Federal de Contribuyentes es ${v(p("Rfc"))}.`;
  };
  const personaKeys = (quien: string) => [`${quien}Tipo`, quien, `${quien}Nacionalidad`, `${quien}Identificacion`, `${quien}Rfc`, `${quien}Acta`, `${quien}Representante`, `${quien}Poder`];

  const blocks: Block[] = [
    { kind: "center", text: "Contrato de arrendamiento" },
    { kind: "p", ...z("Partes del contrato", ...PARTES), text: `Contrato de arrendamiento que celebran, por una parte, ${v(d.arrendador)}, a quien en lo sucesivo se denominará «el Arrendador», y por la otra ${v(d.arrendatario)}, a quien en lo sucesivo se denominará «el Arrendatario»${garante ? `, con la comparecencia de ${v(d.garante)}, a quien en lo sucesivo se denominará «el ${garante}»` : ""}, al tenor de las siguientes declaraciones y cláusulas.` },

    { kind: "center", text: "Declaraciones" },
    { kind: "label", text: "I. Declara el Arrendador:" },
    { kind: "p", indent: true, ...z("Datos del arrendador", ...personaKeys("arrendador")), text: `a) ${persona("arrendador")}` },
    { kind: "p", indent: true, ...z("Propiedad o facultades", "arrendadorCaracter", "tituloPropiedad", "datosRegistrales", "caracterFacultado", "documentoFacultades", "propietarioNombre"), text: d.arrendadorCaracter === "facultado"
      ? `b) Que está facultado para dar en arrendamiento el inmueble descrito en la cláusula Primera en su carácter de ${d.caracterFacultado === "usufructuario" ? "usufructuario" : d.caracterFacultado === "administrador" ? "administrador" : d.caracterFacultado === "apoderado" ? "apoderado" : BLANK}, según ${v(d.documentoFacultades)}, y que el propietario es ${v(d.propietarioNombre)}.`
      : `b) Que es propietario del inmueble descrito en la cláusula Primera, como consta en ${v(d.tituloPropiedad)}, inscrito en el Registro Público de la Propiedad y de Comercio con los datos ${v(d.datosRegistrales)}.` },
    { kind: "p", indent: true, ...z("Condominio", "condominio"), text: `c) Que el inmueble se encuentra al corriente en el pago del impuesto predial${condominio ? ", de las cuotas de mantenimiento del condominio" : ""} y de los servicios con que cuenta, a la fecha de firma.` },
    { kind: "p", indent: true, text: "d) Que el inmueble no tiene vicios ocultos que conozca y que impidan el uso pactado, y que no existe litigio, embargo ni otro arrendamiento vigente que impida entregarlo." },
    { kind: "p", indent: true, ...z("Domicilio del arrendador", "arrendadorDomicilio", "arrendadorCorreo"), text: `e) Que su domicilio para recibir notificaciones es ${v(d.arrendadorDomicilio)} y su correo electrónico ${v(d.arrendadorCorreo)}.` },

    { kind: "label", text: "II. Declara el Arrendatario:" },
    { kind: "p", indent: true, ...z("Datos del arrendatario", ...personaKeys("arrendatario")), text: `a) ${persona("arrendatario")}` },
    { kind: "p", indent: true, text: "b) Que conoce el inmueble, lo ha visitado y lo recibe en el estado que se describe en el inventario del Anexo 2." },
    { kind: "p", indent: true, ...z("Origen de los recursos", "porCuentaDeOtro", "beneficiario"), text: `c) Que los recursos con que pagará la renta y demás cantidades de este contrato tienen origen lícito, y que ${d.porCuentaDeOtro === "si" ? `actúa por cuenta de ${v(d.beneficiario)}, quien es el beneficiario de este arrendamiento` : "actúa por cuenta propia"}.` },
    ...(comercial ? [{ kind: "p" as const, indent: true, ...z("Giro", "uso", "giro"), text: `d) Que destinará el inmueble a ${v(d.giro)}, que conoce el uso de suelo del inmueble y que tramitará por su cuenta las licencias y permisos que su actividad requiera.` }] : []),
    { kind: "p", indent: true, ...z("Domicilio del arrendatario", "arrendatarioDomicilio", "arrendatarioCorreo"), text: `${comercial ? "e" : "d"}) Que su domicilio para recibir notificaciones, mientras no tome posesión del inmueble, es ${v(d.arrendatarioDomicilio)} y su correo electrónico ${v(d.arrendatarioCorreo)}.` },

    ...(garante ? [
      { kind: "label" as const, text: `III. Declara el ${garante}:` },
      { kind: "p" as const, indent: true, ...z(`Datos del ${garante.toLowerCase()}`, "garante", "garanteIdentificacion", "garanteDomicilio"), text: `a) Que es una persona mayor de edad, con capacidad legal para obligarse, que se identifica con ${v(d.garanteIdentificacion)} y cuyo domicilio es ${v(d.garanteDomicilio)}.` },
      ...(d.garantia === "fiador" && d.fiadorConInmueble === "si" ? [{ kind: "p" as const, indent: true, ...z("Inmueble del fiador", "fiadorConInmueble", "garanteInmueble", "garanteTitulo"), text: `b) Que es propietario del inmueble ubicado en ${v(d.garanteInmueble)}, como consta en ${v(d.garanteTitulo)}, libre de gravámenes a la fecha de firma, y que no lo enajenará ni gravará mientras subsistan las obligaciones que garantiza sin aviso previo y por escrito al Arrendador.` }] : []),
      { kind: "p" as const, indent: true, text: `${d.garantia === "fiador" && d.fiadorConInmueble === "si" ? "c" : "b"}) Que conoce este contrato y acepta garantizar las obligaciones del Arrendatario en los términos de la cláusula Décima.` },
    ] : []),
    { kind: "label", text: `${garante ? "IV" : "III"}. Declaran las partes` },
    { kind: "p", indent: true, text: "Que se reconocen la personalidad con que comparecen y que celebran este contrato sin error, dolo, violencia ni otro vicio del consentimiento." },

    { kind: "center", text: "Cláusulas" },
    { kind: "clause", lead: "PRIMERA. Objeto.", ...z("Inmueble", "inmueble", "superficieTerreno", "superficieConstruccion", "claveCatastral", "accesorios"), text: `El Arrendador concede al Arrendatario el uso y goce temporal del inmueble ubicado en ${v(d.inmueble)}, con superficie de terreno de ${num(d.superficieTerreno)} m² y de construcción de ${num(d.superficieConstruccion)} m², identificado con la clave catastral ${v(d.claveCatastral)}, que incluye ${v(d.accesorios)}, descritos en el Anexo 2. El Arrendatario se obliga a pagar la renta y a cumplir las demás obligaciones de este contrato.` },
    { kind: "clause", lead: "SEGUNDA. Destino.", ...z("Uso del inmueble", "uso", "ocupantesMaximo", "giro"), text: `${comercial ? `El inmueble se destinará exclusivamente a ${v(d.giro)}.` : `El inmueble se destinará exclusivamente a casa habitación del Arrendatario y de las personas que habitan con él, que no serán más de ${num(d.ocupantesMaximo)}.`} El Arrendatario no podrá cambiar el destino sin autorización previa y por escrito del Arrendador. Usar el inmueble para un fin distinto, o para cualquier actividad ilícita, es causa de rescisión.` },
    { kind: "clause", lead: "TERCERA. Plazo.", ...z("Plazo", "plazo", "fechaInicio", "fechaTermino", "diasAvisoRenovacion"), text: `El arrendamiento tendrá una duración de ${v(d.plazo)} forzosa para ambas partes, del ${fecha(d.fechaInicio)} al ${fecha(d.fechaTermino)}. Al vencer, el Arrendatario entregará el inmueble en los términos de la cláusula Decimoséptima, salvo que antes de esa fecha las partes firmen la renovación. Si alguna de las partes no desea renovar, lo avisará por escrito a la otra con al menos ${num(d.diasAvisoRenovacion)} días naturales de anticipación al vencimiento.` },
    { kind: "clause", lead: "CUARTA. Renta.", ...z("Renta", "rentaMensual", "causaIva", "diaPago", "primeraProporcional", "retencion"), text: [
      `El Arrendatario pagará una renta mensual de ${importe(d.rentaMensual)}${d.causaIva === "si" ? ", más el impuesto al valor agregado correspondiente," : ""} por mes adelantado, a más tardar el día ${num(d.diaPago)} de cada mes, mediante transferencia a la cuenta que se indica en el Anexo 3 o a la que el Arrendador designe después por escrito. El comprobante de transferencia sirve como recibo; el Arrendador entregará además el comprobante fiscal cuando la ley se lo exija.`,
      `La renta se paga completa aunque el Arrendatario no ocupe el inmueble todo el mes. La primera renta se paga a la firma de este contrato.${d.primeraProporcional === "si" ? " La primera renta corresponde a los días que faltan del mes de inicio, a razón de la renta diaria." : ""}`,
      ...(d.retencion === "si" ? ["Cuando la ley obligue al Arrendatario a retener impuestos sobre la renta, entregará al Arrendador el comprobante de cada retención dentro del mes siguiente al pago."] : []),
    ].join("\n") },
    { kind: "clause", lead: "QUINTA. Actualización de la renta.", ...z("Actualización", "actualizacion", "periodoActualizacion", "fechaPrimeraActualizacion", "porcentajeActualizacion"), text: `Si el arrendamiento se renueva o su plazo excede de un año, la renta se actualizará cada ${v(d.periodoActualizacion)} a partir del ${fecha(d.fechaPrimeraActualizacion)}, ${d.actualizacion === "porcentaje" ? `en un ${num(d.porcentajeActualizacion)} % sobre la renta vigente.` : "en la misma proporción en que haya variado el Índice Nacional de Precios al Consumidor publicado por el INEGI durante los doce meses anteriores."}` },
    { kind: "clause", lead: "SEXTA. Pago tardío.", ...z("Interés moratorio", "interesMoratorio"), text: `Si la renta no se paga en la fecha pactada, el Arrendatario pagará un interés moratorio de ${num(d.interesMoratorio)} % mensual sobre el monto vencido, calculado por día de retraso, desde el día siguiente al vencimiento hasta el pago. Cobrar intereses no implica que el Arrendador acepte el retraso ni renuncie a rescindir el contrato. Los pagos se aplican primero a intereses y después a la renta más antigua.` },
    { kind: "clause", lead: "SÉPTIMA. Depósito en garantía.", ...z("Depósito", "deposito", "depositoMeses", "diasDevolucionDeposito"), text: `A la firma, el Arrendatario entrega al Arrendador ${importe(d.deposito)}, equivalente a ${meses(d.depositoMeses)} de renta, como depósito para garantizar el cumplimiento de sus obligaciones. El depósito no genera intereses y no puede aplicarse al pago de rentas, salvo acuerdo por escrito.\nDentro de los ${num(d.diasDevolucionDeposito)} días naturales siguientes a la entrega del inmueble, el Arrendador devolverá el depósito, descontando únicamente las rentas, servicios y cuotas pendientes y el costo de reparar los daños que excedan el desgaste por el uso normal, con los comprobantes de cada descuento. Si el depósito no alcanza, el Arrendatario pagará la diferencia dentro de los diez días naturales siguientes a que se le entreguen esos comprobantes.` },
    { kind: "clause", lead: "OCTAVA. Servicios y cuotas.", ...z("Servicios", "serviciosArrendatario", "serviciosArrendador", "condominio"), text: [
      `El Arrendatario pagará puntualmente, desde la fecha de entrega y hasta la devolución del inmueble, el consumo de ${v(d.serviciosArrendatario)}, según el Anexo 3. El Arrendador pagará el impuesto predial y ${v(d.serviciosArrendador)}.`,
      ...(condominio ? ["El Arrendatario pagará la cuota ordinaria de mantenimiento del condominio y el Arrendador las cuotas extraordinarias."] : []),
      "El Arrendatario no podrá cancelar ni cambiar de titular los contratos de servicios sin autorización por escrito del Arrendador. Al devolver el inmueble entregará los últimos recibos pagados.",
    ].join("\n") },
    { kind: "clause", lead: "NOVENA. Conservación y reparaciones.", ...z("Reparaciones", "diasReparacion", "montoReparacionMenor"), text: [
      `a) El Arrendador se encarga, a su costa, de las reparaciones necesarias para que el inmueble sirva al uso pactado: estructura, techos e impermeabilización, instalaciones ocultas de agua, drenaje, electricidad y gas, y los vicios o defectos que el inmueble ya tenía. El Arrendatario le avisará por escrito en cuanto advierta la necesidad, y el Arrendador la atenderá dentro de los ${num(d.diasReparacion)} días naturales siguientes, o de inmediato si hay riesgo para las personas o el inmueble.`,
      `b) El Arrendatario se encarga, a su costa, del mantenimiento menor y de las reparaciones que causen el uso diario, él mismo, sus acompañantes, visitantes o mascotas: focos, llaves, chapas, vidrios, filtros, destapes y limpieza de instalaciones, y en general las reparaciones de hasta ${dinero(d.montoReparacionMenor)} por evento.`,
      "c) Si el Arrendador no atiende a tiempo una reparación que le corresponde y que impide el uso del inmueble, el Arrendatario podrá hacerla, con aviso previo por escrito, y descontar su costo comprobado de la renta siguiente.",
      "d) El Arrendatario no hará obras, cambios ni adecuaciones sin autorización previa y por escrito del Arrendador.",
      ...(comercial ? ["Las adecuaciones autorizadas se harán con los permisos que correspondan y a costa del Arrendatario. Al terminar el contrato quedarán en beneficio del inmueble sin costo para el Arrendador, salvo que este pida retirarlas; en ese caso el Arrendatario las retirará y dejará el inmueble como lo recibió."] : []),
    ].join("\n") },
    { kind: "clause", lead: "DÉCIMA. Garantía.", ...z("Garantía", "garantia", "garante"), text: d.garantia === "fiador"
      ? "El Fiador se obliga a pagar al Arrendador lo que el Arrendatario deje de pagar por rentas, intereses, servicios, cuotas, daños y gastos de este contrato, hasta que el inmueble se devuelva y se liquiden esas cantidades, aunque el contrato se prorrogue o renueve. Esta fianza subsiste mientras el Arrendatario ocupe el inmueble."
      : d.garantia === "obligado"
        ? "El Obligado Solidario se obliga, junto con el Arrendatario, a cumplir todas las obligaciones de pago de este contrato, de modo que el Arrendador puede exigirle el pago total a cualquiera de los dos, hasta que el inmueble se devuelva y se liquiden esas cantidades, aunque el contrato se prorrogue o renueve."
        : d.garantia === "ninguna" ? "Las partes acuerdan que el depósito de la cláusula Séptima es la única garantía de este contrato." : `Garantía: ${BLANK}` },
    { kind: "clause", lead: "DECIMOPRIMERA. Prohibiciones.", ...z("Mascotas", "mascotas", "mascotasMaximo"), text: [
      "Sin autorización previa y por escrito del Arrendador, el Arrendatario no podrá:",
      "a) subarrendar todo o parte del inmueble, ceder sus derechos de este contrato ni permitir que otra persona lo ocupe;",
      `b) guardar sustancias peligrosas, inflamables o prohibidas, salvo las de uso doméstico normal${comercial ? " o las propias del giro autorizado con sus permisos" : ""};`,
      `c) realizar actos que molesten a los vecinos${condominio ? " o contravengan el reglamento del condominio del Anexo 4" : ""};`,
      d.mascotas === "si" ? `d) tener más de ${num(d.mascotasMaximo)} mascota(s); el Arrendatario responde de los daños y molestias que causen.` : "d) tener mascotas en el inmueble.",
    ].join("\n") },
    { kind: "clause", lead: "DECIMOSEGUNDA. Visitas e inspección.", text: `El Arrendador o quien este designe por escrito podrá visitar el inmueble para revisar su estado, hacer reparaciones o mostrarlo a posibles compradores o arrendatarios durante los últimos ${num(d.diasAvisoRenovacion)} días del contrato, con aviso al Arrendatario de al menos veinticuatro horas, en día y hora hábiles y en su presencia o la de quien designe. En una emergencia podrá entrar sin ese aviso, informando de inmediato al Arrendatario.` },
    { kind: "clause", lead: "DECIMOTERCERA. Seguros.", ...z("Seguros", "seguroRc", "sumaAsegurada", "seguroInmueble"), text: [
      ...(d.seguroRc === "si" ? [`El Arrendatario contratará y mantendrá vigente, durante todo el arrendamiento, un seguro de responsabilidad civil por ${dinero(d.sumaAsegurada)} que cubra los daños que su actividad cause al inmueble y a terceros, y entregará copia de la póliza al Arrendador a la firma y en cada renovación.`] : []),
      ...(d.seguroInmueble === "si" ? ["El Arrendador mantendrá asegurado el inmueble contra incendio y fenómenos naturales. Este seguro no cubre los bienes del Arrendatario."] : []),
      ...(d.seguroRc !== "si" && d.seguroInmueble !== "si" ? ["Las partes no pactan seguros a cargo de alguna de ellas. Cada una puede asegurar por su cuenta sus propios bienes."] : []),
    ].join("\n") },
    { kind: "clause", lead: "DECIMOCUARTA. Venta del inmueble.", text: "Si el Arrendador vende el inmueble mientras este contrato esté vigente, lo avisará por escrito al Arrendatario, y el arrendamiento continuará en sus términos con el nuevo propietario hasta su vencimiento." },
    { kind: "clause", lead: "DECIMOQUINTA. Terminación anticipada.", ...z("Salida anticipada", "terminacion", "diasAvisoTerminacion", "mesesMinimos", "mesesPena"), text: `${d.terminacion === "plazo_minimo"
      ? `Después de los primeros ${num(d.mesesMinimos)} meses, el Arrendatario podrá terminar este contrato con aviso por escrito al Arrendador de al menos ${num(d.diasAvisoTerminacion)} días naturales, pagando las rentas hasta la fecha de entrega. Antes de ese plazo, la terminación causa una pena equivalente a ${meses(d.mesesPena)} de renta.`
      : `El Arrendatario podrá terminar este contrato antes del vencimiento con aviso por escrito al Arrendador de al menos ${num(d.diasAvisoTerminacion)} días naturales, pagando las rentas hasta la fecha de entrega y una pena equivalente a ${meses(d.mesesPena)} de renta.`} En ambos casos, el inmueble se entrega conforme a la cláusula Decimoséptima.` },
    { kind: "clause", lead: "DECIMOSEXTA. Rescisión.", ...z("Rescisión", "rentasRescision"), text: [
      "El Arrendador podrá rescindir este contrato, sin necesidad de declaración judicial previa más allá de la que la ley exija, si el Arrendatario:",
      `a) deja de pagar ${num(d.rentasRescision)} rentas, completas o parciales;`,
      "b) destina el inmueble a un uso distinto del pactado o a una actividad ilícita;",
      "c) subarrienda, cede o permite que otra persona ocupe el inmueble sin autorización;",
      "d) hace obras o cambios sin autorización, o causa daños graves al inmueble;",
      `e) deja de pagar los servicios o cuotas a su cargo y provoca su suspensión o adeudos${garante ? ";" : "."}`,
      ...(garante ? ["f) no sustituye al garante dentro de los treinta días naturales siguientes a que este muera, se vuelva insolvente o enajene el inmueble que lo respaldaba."] : []),
      "El Arrendatario podrá rescindir este contrato si el Arrendador no hace, en el plazo de la cláusula Novena, las reparaciones que impiden usar el inmueble, o si le impide el uso pactado.",
      "La parte que incumpla pagará a la otra los daños y perjuicios que cause, además de lo que deba conforme a este contrato.",
    ].join("\n") },
    { kind: "clause", lead: "DECIMOSÉPTIMA. Devolución del inmueble.", ...z("Devolución", "porcentajeRetencion"), text: `Al terminar el contrato por cualquier causa, el Arrendatario devolverá el inmueble desocupado, limpio, con sus llaves y accesorios, y en el estado del inventario del Anexo 2, salvo el desgaste por el uso normal. Las partes firmarán un acta de entrega con fotografías.\nPor cada día que el Arrendatario retenga el inmueble después de la fecha de entrega, pagará al Arrendador una cantidad igual a la renta diaria más un ${num(d.porcentajeRetencion)} %, sin que ese pago signifique renovación del contrato.` },
    { kind: "clause", lead: "DECIMOCTAVA. Datos personales.", text: "Cada parte tratará los datos personales de la otra únicamente para celebrar, cumplir y, en su caso, hacer valer este contrato, conforme a su aviso de privacidad." },
    { kind: "clause", lead: "DECIMONOVENA. Notificaciones.", text: "Los avisos de este contrato se harán por escrito en los domicilios o correos de las declaraciones. Un cambio de domicilio o correo surte efecto desde que se avisa por escrito a la otra parte. Mientras el Arrendatario ocupe el inmueble, también puede notificársele ahí." },
    { kind: "clause", lead: "VIGÉSIMA. Acuerdo completo.", text: "Este contrato y sus anexos contienen todo lo acordado por las partes sobre el arrendamiento. Cualquier cambio debe constar por escrito y firmado por ambas. Nada de lo pactado limita los derechos que la ley conceda al Arrendatario sin posibilidad de renuncia. Si alguna cláusula resulta inválida, las demás conservan su efecto." },
    { kind: "clause", lead: "VIGESIMOPRIMERA. Ley y tribunales.", ...z("Tribunales", "ciudadJurisdiccion"), text: `Este contrato se rige por las leyes del Estado de Baja California. Para su interpretación y cumplimiento, las partes se someten a los tribunales competentes de ${v(d.ciudadJurisdiccion)}, Baja California, y renuncian a cualquier otro fuero que pudiera corresponderles por su domicilio presente o futuro.` },

    { kind: "center", text: "Firmas" },
    { kind: "p", ...z("Lugar y fecha de firma", "ciudadFirma", "fechaFirma", "numeroTantos"), text: `Leído este contrato y enteradas las partes de su contenido y alcance, lo firman en ${v(d.ciudadFirma)}, Baja California, el ${fecha(d.fechaFirma)}, en ${num(d.numeroTantos)} tantos, uno para cada parte.` },
    { kind: "signatures", line: true, ...z("Firmas", ...PARTES, "arrendadorRepresentante", "arrendatarioRepresentante"), parties: [
      { role: "EL ARRENDADOR", name: firmanteDor },
      { role: "EL ARRENDATARIO", name: firmanteTario },
      ...(garante ? [{ role: `EL ${garante.toUpperCase()}`, name: v(d.garante) }] : []),
    ] },

    { kind: "center", text: "Anexos" },
    { kind: "p", text: [
      "1. Identificación del inmueble y documentos que acreditan la propiedad o las facultades del Arrendador.",
      "2. Inventario y estado del inmueble, con fotografías, firmado por ambas partes.",
      "3. Servicios, cuentas y forma de pago de la renta.",
      ...(condominio ? ["4. Reglamento del condominio."] : []),
      `${condominio ? 5 : 4}. Identificaciones de las partes${garante ? " y del garante" : ""}.`,
    ].join("\n") },
  ];
  return { title: "Contrato de arrendamiento", subject: `Formato 20 · ${v(d.folio)}`, estilo: "contrato", blocks };
}
