import { DOCUMENTOS_SOLICITUD, documentosAplicables, rentaSobreIngreso } from "../solicitud-arrendamiento";
import { BLANK, dinero, fecha, v, type Block, type Documento } from "./modelo";

/*
  22 · Solicitud de arrendamiento y revisión del candidato, con el texto que el titular aprobó el
  13/11/2026: la solicitud del interesado, la revisión de Fortius y la decisión del propietario.
  Solo sale lo que aplica según lo elegido. Captura sobre el documento (EXT-12): cada renglón y cada
  párrafo con datos dicen qué campos los llenan.
*/

type Data = Record<string, unknown>;
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(value) : BLANK;
const opcion = (value: unknown, options: Record<string, string>) => typeof value === "string" && options[value] ? options[value] : BLANK;
const TIPO_REF: Record<string, string> = { anterior: "Arrendador anterior", personal: "Personal", comercial: "Comercial" };
const NOMBRE_DOC = Object.fromEntries(DOCUMENTOS_SOLICITUD) as Record<string, string>;
const lista = (items: string[]) => items.length ? items.join(", ") : "ninguno";

export function solicitudArrendamientoDocumento(d: Data): Documento {
  const moral = d.solicitanteTipo === "moral", comercial = d.uso === "comercial";
  const garante = d.garantia === "fiador" || d.garantia === "obligado";
  const fiadorInmueble = d.garantia === "fiador" && d.fiadorConInmueble === "si";
  const aplicables = documentosAplicables(d);
  const recibidos = Array.isArray(d.documentosRecibidos) ? d.documentosRecibidos.map(String) : [];
  const proporcion = rentaSobreIngreso(d);
  const refs = [1, 2, 3].filter(n => n < 3 || [d.ref3Nombre, d.ref3Telefono].some(x => typeof x === "string" && x.trim()));
  const refKeys = refs.flatMap(n => [`ref${n}Tipo`, `ref${n}Nombre`, `ref${n}Telefono`, `ref${n}Relacion`]);

  const solicitante: Array<[string, string, string[]]> = [
    ["Solicitante", `${moral ? "Empresa" : d.solicitanteTipo === "fisica" ? "Persona física" : BLANK} · ${v(d.solicitante)} · RFC: ${v(d.rfc)}`, ["solicitanteTipo", "solicitante", "rfc"]],
    moral ? ["Constitución y representante", `${v(d.acta)} · Representante: ${v(d.representante)} · Poder: ${v(d.poder)}`, ["acta", "representante", "poder"]]
      : ["Identificación", `${v(d.identificacion)} · Nacionalidad: ${v(d.nacionalidad)}`, ["identificacion", "nacionalidad"]],
    ["Domicilio actual", `${v(d.domicilioActual)} · Tiempo en él: ${v(d.tiempoDomicilio)}`, ["domicilioActual", "tiempoDomicilio"]],
    ["Contacto", `${v(d.telefono)} · ${v(d.correo)}`, ["telefono", "correo"]],
  ];
  const solicita: Array<[string, string, string[]]> = [
    ["Uso", comercial ? `Comercial u oficina, giro: ${v(d.giro)}` : d.uso === "habitacion" ? "Casa habitación" : BLANK, ["uso", "giro"]],
    ...(!comercial ? [["Personas que lo habitarán", num(d.ocupantes), ["ocupantes"]] as [string, string, string[]]] : []),
    ["Mascotas", d.mascotas === "si" ? `Sí: ${v(d.mascotasDetalle)}` : d.mascotas === "no" ? "No" : BLANK, ["mascotas", "mascotasDetalle"]],
    ["Renta mensual ofrecida", `${dinero(d.rentaOfrecida)} MXN`, ["rentaOfrecida"]],
    ["Fecha deseada de entrada y plazo", `${fecha(d.fechaEntrada)} · ${num(d.plazoMeses)} ${d.plazoMeses === 1 ? "mes" : "meses"}`, ["fechaEntrada", "plazoMeses"]],
    ["Garantía que ofrece", opcion(d.garantia, { fiador: "Fiador", obligado: "Obligado solidario", ninguna: "Solo el depósito" }), ["garantia"]],
    ...(garante ? [["Garante", `${v(d.garante)} · ${v(d.telefonoGarante)}${fiadorInmueble ? ` · Inmueble con que responde: ${v(d.inmuebleGarante)}` : ""}`, ["garante", "telefonoGarante", "fiadorConInmueble", "inmuebleGarante"]] as [string, string, string[]]] : []),
  ];
  const ingresos: Array<[string, string, string[]]> = [
    ["Actividad", opcion(d.actividad, { empleado: "Empleado", negocio: "Negocio propio o independiente", pensionado: "Pensionado", empresa: "Empresa" }), ["actividad"]],
    ...(d.actividad === "empleado" ? [["Empleo", `${v(d.empleador)} · Puesto: ${v(d.puesto)} · Antigüedad: ${v(d.antiguedad)} · Teléfono: ${v(d.telefonoEmpleo)}`, ["empleador", "puesto", "antiguedad", "telefonoEmpleo"]] as [string, string, string[]]] : []),
    ...(d.actividad === "negocio" || d.actividad === "empresa" ? [["Actividad o giro", `${v(d.actividadDetalle)} · Antigüedad: ${v(d.antiguedad)}`, ["actividadDetalle", "antiguedad"]] as [string, string, string[]]] : []),
    ["Ingreso mensual comprobable", `${dinero(d.ingresoMensual)} MXN`, ["ingresoMensual"]],
  ];
  const tabla = (rows: Array<[string, string, string[]]>): Block => ({ kind: "fields", widths: [2832, 7392], rows: rows.map(([a, b]) => [a, b]), keys: rows.map(([, , k]) => k) });

  const documentos = `Identificación oficial · Comprobante de domicilio · Comprobantes de ingresos de los últimos ${num(d.mesesComprobantes)} meses${moral ? " · Acta constitutiva, poder del representante y constancia de situación fiscal" : ""}${garante ? " · Identificación y comprobante de domicilio del garante" : ""}${fiadorInmueble ? " · Escritura del inmueble del fiador" : ""}.`;

  const revision: Array<[string, string, string[]]> = [
    ["Solicitud completa", `Recibida el ${fecha(d.fechaRecepcion)} · Presentada al propietario el ${fecha(d.fechaPresentacion)}`, ["fechaRecepcion", "fechaPresentacion"]],
    ["Documentos", `Recibidos: ${lista(aplicables.filter(x => recibidos.includes(x)).map(x => NOMBRE_DOC[x]))}. Faltan: ${lista(aplicables.filter(x => !recibidos.includes(x)).map(x => NOMBRE_DOC[x]))}.`, ["documentosRecibidos"]],
    ["Coherencia", d.coherencia === "si" ? "Nombre, domicilio e ingresos coinciden entre la solicitud y los documentos." : d.coherencia === "no" ? `No coinciden: ${v(d.discrepancias)}` : BLANK, ["coherencia", "discrepancias"]],
    ["Renta frente a ingreso", proporcion === null ? BLANK : `La renta ofrecida es el ${num(proporcion)} % del ingreso mensual comprobable.`, ["rentaOfrecida", "ingresoMensual"]],
    ...refs.map(n => [`Referencia ${n}`, `${v(d[`ref${n}Nombre`])}: ${v(d[`ref${n}Resultado`])}`, [`ref${n}Resultado`]] as [string, string, string[]]),
    ["Garantía", opcion(d.garantiaEstado, { identificado: "Garante identificado y documentos recibidos", pendiente: "Pendiente", deposito: "Solo depósito" }), ["garantiaEstado"]],
    ["Observaciones", v(d.observaciones), ["observaciones"]],
  ];

  const blocks: Block[] = [
    { kind: "center", text: "Solicitud de arrendamiento" },
    { kind: "p", zona: { keys: ["folio", "inmueble", "fechaSolicitud"], label: "Inmueble y fecha" }, text: `Folio: ${v(d.folio)} · Inmueble: ${v(d.inmueble)} · Fecha de la solicitud: ${fecha(d.fechaSolicitud)}` },
    { kind: "label", text: "1. Solicitante" }, tabla(solicitante),
    { kind: "label", text: "2. Lo que solicita" }, tabla(solicita),
    { kind: "label", text: "3. Ingresos" }, tabla(ingresos),
    { kind: "label", text: "4. Referencias" },
    { kind: "table", widths: [2400, 3024, 2400, 2400], header: ["Tipo", "Nombre", "Teléfono", "Relación"], rows: refs.map(n => [opcion(d[`ref${n}Tipo`], TIPO_REF), v(d[`ref${n}Nombre`]), v(d[`ref${n}Telefono`]), v(d[`ref${n}Relacion`])]), zona: { keys: refKeys, label: "Referencias" } },
    { kind: "label", text: "5. Documentos que entrega" },
    { kind: "p", zona: { keys: ["mesesComprobantes"], label: "Documentos que entrega" }, text: documentos },
    { kind: "label", text: "6. Declaraciones y consentimiento" },
    { kind: "p", text: "El solicitante declara que los datos y documentos que entrega son verdaderos y que puede comprobarlos. Entiende que esta solicitud no lo obliga a rentar ni obliga al propietario a aceptarla, que no reserva el inmueble y que el arrendamiento solo existe cuando ambas partes firman el contrato. Fortius Inmuebles no le cobra por presentar esta solicitud." },
    { kind: "p", zona: { keys: ["medioAviso", "fechaAviso"], label: "Aviso de privacidad" }, text: `Conoce el aviso de privacidad que se le puso a disposición en ${v(d.medioAviso)} el ${fecha(d.fechaAviso)}. Consiente expresamente que Fortius Inmuebles trate sus datos de identificación, contacto, ingresos y patrimonio para evaluar esta solicitud; que llame a las referencias que dio; y que entregue esta solicitud con sus documentos al propietario del inmueble para que decida. Si la solicitud no prospera, sus documentos se le devuelven o se eliminan cuando lo pida, salvo los que deban conservarse por ley.` },
    { kind: "p", zona: { keys: ["lugar", "fechaSolicitud"], label: "Lugar y fecha de firma" }, text: `Firma en ${v(d.lugar)}, Baja California, el ${fecha(d.fechaSolicitud)}.` },
    { kind: "signatures", line: true, zona: { keys: ["solicitante", "garante"], label: "Firmas" }, parties: [
      { role: "SOLICITANTE", name: moral ? `${v(d.solicitante)}, por conducto de ${v(d.representante)}` : v(d.solicitante) },
      ...(garante ? [{ role: "GARANTE", name: `${v(d.garante)}, que conoce la solicitud y acepta que se revisen sus datos` }] : []),
    ] },
    { kind: "pagebreak" },
    { kind: "center", text: "Revisión del candidato" },
    tabla(revision),
    { kind: "p", text: "Fortius Inmuebles revisó que los documentos sean coherentes entre sí y con la solicitud. No certifica su autenticidad ni garantiza la solvencia del candidato o el pago futuro de la renta. La decisión de aceptarlo es del propietario. Una investigación especializada o una póliza de servicios jurídicos se contrata solo si el propietario la autoriza por escrito." },
    { kind: "p", zona: { keys: ["asesor", "fechaPresentacion"], label: "Quién preparó la revisión" }, text: `Preparó: ${v(d.asesor)} · ${fecha(d.fechaPresentacion)}` },
    { kind: "center", text: "Decisión del propietario" },
    { kind: "p", zona: { keys: ["decision", "condiciones"], label: "Decisión del propietario" }, text: d.decision === "acepta" ? "Acepta al candidato." : d.decision === "condiciones" ? `Acepta al candidato con estas condiciones: ${v(d.condiciones)}` : d.decision === "rechaza" ? "No acepta al candidato." : `Acepta al candidato · Acepta con estas condiciones: ${BLANK} · No lo acepta` },
    { kind: "p", text: "Si acepta, las condiciones pasan al contrato de arrendamiento. Rechazar a un candidato no genera pena ni honorarios conforme al contrato de intermediación para renta." },
    { kind: "signatures", line: true, zona: { keys: ["propietario", "fechaDecision"], label: "Firma del propietario" }, parties: [{ role: "PROPIETARIO", name: `${v(d.propietario)} · ${fecha(d.fechaDecision)}` }] },
  ];
  return { title: "Solicitud de arrendamiento", subject: `Formato 22 · ${v(d.folio)}`, estilo: "contrato", blocks };
}
