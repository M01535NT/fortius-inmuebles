import { entrevistaFields } from "../entrevista";
import { a, dinero, fecha, filas, junta, type Block, type Documento } from "./modelo";

/*
  02 · Entrevista inicial, con las preguntas y el orden de la plantilla
  (Metodología/02.Entrevista_inicial.docx). Cada celda muestra lo que se capturó en el
  panel; si no hay respuesta, queda el espacio para escribirla a mano.
*/

type Data = Record<string, unknown>;
type Cell = { q: string; a: string; w: number };
const label = (key: string, value: unknown) => entrevistaFields.find(f => f.key === key)?.options?.find(o => o.value === value)?.label ?? a(value);
const c = (q: string, answer: string, w: number): Cell => ({ q, a: answer, w });
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const money = (value: unknown, currency: unknown) => typeof value === "number" ? dinero(value, currency) : "";

export function entrevistaDocumento(d: Data): Documento {
  const aviso = d.avisoPrivacidad === "si" ? junta("Sí", f(d.fechaAviso), d.medioAviso) : d.avisoPrivacidad === "pendiente" ? "No · pendiente" : "";
  const documentos = d.documentosEstado === "ninguno" ? "Ninguno acordado" : filas(d.documentosPrometidos).map(r => junta(r.documento, r.responsable, f(r.fecha))).join("\n");
  const pendientes = d.contradiccionesEstado === "ninguno" ? "No se identificaron en la entrevista" : filas(d.contradicciones).map(r => junta(r.dato, r.declarado ? `Declaró: ${a(r.declarado)}` : "", r.mostrado ? `Soporte: ${a(r.mostrado)}` : "", r.pendiente ? `Falta: ${a(r.pendiente)}` : "")).join("\n");
  const blocks: Block[] = [
    { kind: "title", text: "Entrevista inicial", bold: true },
    { kind: "form", rows: [
      [c("Fecha y hora", junta(f(d.fechaEntrevista), d.horaEntrevista), 3), c("Asesor que entrevista", a(d.asesor), 3)],
      [c("Folio", a(d.folio), 1.6), c("Domicilio", a(d.inmueble), 3), c("Operación", a(d.operacion), 1.4)],
      [c("¿Cómo llegó con nosotros?", a(d.origenContacto), 4.4), c("Aviso de privacidad puesto a disposición", aviso, 1.6)],
    ] },
    { kind: "form", label: "01 / Identidad y contacto", rows: [
      [c("¿Quién responde la entrevista? Nombre completo", a(d.entrevistado), 3), c("¿Qué relación tiene con el inmueble?", label("relacion", d.relacion), 3)],
      [c("¿Quién es el propietario o titular? Nombre / razón social", a(d.propietario), 4.4), c("Tipo de titular", label("tipoPropietario", d.tipoPropietario), 1.6)],
      [c("¿Cuál es su teléfono de contacto?", a(d.telefono), 2.5), c("¿Cuál es su correo electrónico?", a(d.correo), 3.5)],
      [c("Nacimiento del propietario (fecha)", f(d.fechaNacimiento), 2), c("Nacionalidad del propietario", a(d.nacionalidad), 2.4), c("Ocupación / actividad", a(d.ocupacionEntrevistado), 1.6)],
      [c("CURP del propietario (persona física)", a(d.curp), 3), c("RFC del propietario / razón social", a(d.rfc), 3)],
      [c("¿Cuál es el domicilio actual del propietario? Calle, número, colonia, ciudad, estado y C. P.", a(d.domicilioEntrevistado), 6)],
      [c("¿Vive actualmente en el inmueble que desea vender?", junta(label("viveInmueble", d.viveInmueble), d.viveDesde ? `Desde ${a(d.viveDesde)}` : "", d.viveHasta ? `Hasta ${a(d.viveHasta)}` : ""), 3), c("¿En qué país reside y dónde es residente fiscal?", a(d.residenciaFiscal), 3)],
      [c("¿Cómo y a qué hora prefiere que le contactemos?", junta(d.medioContacto, d.horarioContacto, d.otroContacto ? `Otra persona: ${a(d.otroContacto)}` : ""), 6)],
    ] },
    { kind: "form", label: "02 / Situación familiar y personas que deben intervenir", rows: [
      [c("¿Cuál es su estado civil actual?", label("estadoCivilActual", d.estadoCivilActual), 3), c("¿Cuál era su estado civil cuando adquirió el inmueble?", label("estadoCivilAdquisicion", d.estadoCivilAdquisicion), 3)],
      [c("Si estaba casado al adquirir, ¿bajo qué régimen?", label("regimenAdquisicion", d.regimenAdquisicion), 3), c("Cónyuge de entonces / fecha y lugar del matrimonio", junta(d.conyuge, f(d.fechaMatrimonio), d.lugarMatrimonio), 3)],
      [c("¿Cambió de régimen o se divorció después?", junta(label("cambioEstadoCivil", d.cambioEstadoCivil), d.documentoRegimen), 3), c("¿Se liquidaron o adjudicaron los bienes?", label("liquidacion", d.liquidacion), 3)],
      [c("¿Qué otras personas deben participar o están en desacuerdo con la venta?", a(d.otrosParticipantes), 6)],
    ] },
    { kind: "title", text: "Antecedentes del inmueble", bold: true },
    { kind: "form", label: "03 / Ubicación, adquisición y facultades para vender", rows: [
      [c("¿Qué tipo de inmueble quiere vender?", label("tipoInmueble", d.tipoInmueble), 6)],
      [c("¿Dónde se encuentra? Domicilio, municipio, unidad o referencia para identificarlo", a(d.inmueble), 6)],
      [c("¿Cómo lo adquirió?", label("adquisicion", d.adquisicion), 4), c("¿En qué fecha lo adquirió?", f(d.fechaAdquisicion), 2)],
      [c("¿Qué documento acredita la adquisición y a nombre de quién está?", junta(d.tipoTitulo, d.titularTitulo), 3), c("¿Está inscrito? ¿Tiene copia y datos de notaría?", junta(d.tituloInscrito ? `Inscrito: ${label("tituloInscrito", d.tituloInscrito)}` : "", d.copiaTitulo ? `Copia: ${label("copiaTitulo", d.copiaTitulo)}` : "", d.referenciaNotarial), 3)],
      [c("¿Hay otros propietarios? ¿Qué parte vende?", junta(d.otrosTitulares, d.parteVendida), 3), c("Si actúa por otra persona, ¿con qué facultades?", junta(d.representacion ? `Representante: ${label("representacion", d.representacion)}` : "", d.facultadesRepresentante), 3)],
    ] },
    { kind: "form", label: "04 / Ocupación, compromisos y problemas conocidos", rows: [
      [c("¿Quién ocupa actualmente el inmueble?", label("ocupacion", d.ocupacion), 3), c("¿Hay contrato o acuerdo de ocupación?", junta(label("acuerdoOcupacion", d.acuerdoOcupacion), d.fechaFinOcupacion ? `Vence ${f(d.fechaFinOcupacion)}` : ""), 3)],
      [c("¿Tiene hipoteca, crédito o alguna garantía pendiente?", junta(label("gravamen", d.gravamen), d.acreedor, money(d.saldoGravamen, d.monedaGravamen), d.fechaEstadoCuenta ? `Estado de cuenta: ${f(d.fechaEstadoCuenta)}` : ""), 6)],
      [c("¿Conoce adeudos, juicios, embargos, sucesión pendiente o algún reclamo sobre el inmueble?", junta(label("problemas", d.problemas), d.otrosProblemas, money(d.importeProblemas, "MXN"), d.responsableProblemas ? `Resuelve: ${a(d.responsableProblemas)}` : ""), 6)],
      [c("¿Ya prometió vender, recibió anticipo, firmó una opción o tiene compromiso con otra inmobiliaria?", junta(label("promesaPrevia", d.promesaPrevia), d.compromisoPrevio), 6)],
    ] },
    { kind: "form", label: "05 / Antecedentes fiscales · sólo para revisión posterior", rows: [
      [c("¿El inmueble es o fue su casa habitación?", junta(label("casaHabitacion", d.casaHabitacion), d.periodoHabitacion), 3), c("¿Tiene comprobantes de ese domicilio? ¿A nombre de quién?", a(d.domicilioSoportes), 3)],
      [c("¿Vendió algún inmueble en los últimos tres años?", junta(label("exencionTresAnios", d.exencionTresAnios), d.ventasPrevias), 3), c("¿En alguna venta de casa habitación obtuvo exención de ISR?", junta(label("exencionPrevia", d.exencionPrevia), d.fechaExencion), 3)],
      [c("¿Tiene comprobantes de adquisición y gastos relacionados?", a(d.documentosDeducciones), 3), c("¿Tiene contador o notaría que ya haya revisado los impuestos?", junta(label("revisionFiscal", d.revisionFiscal), d.profesionalFiscal, d.conclusionFiscal), 3)],
    ] },
    { kind: "note", text: "La exención no depende sólo de vivir aquí ni de que sea la primera venta: debe revisarse, entre otros requisitos, si hubo otra venta de casa habitación con exención en los tres años anteriores a la venta futura. Actualizar al cierre. Este formulario no determina ISR ni acredita la exención. Referencias: LISR 93, XIX, a); RLISR 155." },
    { kind: "title", text: "Motivos y condiciones de venta", bold: true },
    { kind: "form", label: "06 / Objetivo, expectativa y margen de negociación", rows: [
      [c("¿Por qué quiere vender y qué necesita lograr con la venta?", junta(d.motivoVenta, d.objetivo), 6)],
      [c("¿En qué fecha quisiera vender? ¿Hay una fecha límite?", f(d.fechaDeseada), 3), c("¿Qué ocurriría si no vende en ese plazo?", a(d.fechaLimite), 3)],
      [c("¿Qué precio le gustaría obtener?", junta(money(d.precioDeseado, d.monedaPrecio), d.basePrecio ? label("basePrecio", d.basePrecio) : ""), 3), c("¿Cómo determinó ese precio?", a(d.fuentePrecio), 3)],
      [c("¿Cuál es el mínimo que consideraría? Uso interno", junta(money(d.precioMinimo, d.monedaMinimo), d.baseMinimo ? label("baseMinimo", d.baseMinimo) : ""), 3), c("¿Cuánto necesita recibir libre de deudas y gastos?", d.netoEstado === "declarado" ? money(d.netoNecesario, d.monedaNeto) : label("netoEstado", d.netoEstado), 3)],
      [c("¿Qué condiciones de pago aceptaría evaluar?", a(d.formasPago), 6)],
      [c("¿Qué condiciones no negociaría? ¿Qué bienes incluiría o excluiría de la venta?", junta(d.noNegociables, d.bienesIncluidos ? `Incluye: ${a(d.bienesIncluidos)}` : "", d.bienesExcluidos ? `Excluye: ${a(d.bienesExcluidos)}` : ""), 6)],
      [c("¿Cuándo podría entregar desocupado?", junta(f(d.fechaEntrega), d.condicionesEntrega, d.dependeMudanza ? `Depende de otra mudanza: ${label("dependeMudanza", d.dependeMudanza)}` : ""), 3), c("¿Aceptaría revisar el precio según evidencia de mercado?", junta(label("revisionPrecio", d.revisionPrecio), d.condicionRevisionPrecio), 3)],
    ] },
    { kind: "form", label: "07 / Experiencia de venta y colaboración", rows: [
      [c("¿Desde cuándo lo ofrece y en qué medios o inmobiliarias?", junta(d.tiempoOferta, d.mediosPrevios), 3), c("¿Qué ofertas recibió y por qué no se concretaron?", a(d.ofertasPrevias), 3)],
      [c("¿Aceptaría un encargo de intermediación con condiciones por acordar?", junta(label("intermediacion", d.intermediacion), d.exclusividad ? `Exclusividad: ${label("exclusividad", d.exclusividad)}` : ""), 3), c("¿Qué espera del asesor? ¿Qué le preocupa del proceso?", a(d.expectativas), 3)],
      [c("¿Quién puede mostrar el inmueble y qué horarios o restricciones existen?", junta(d.acceso, d.horariosVisita, d.restriccionesVisita), 6)],
    ] },
    { kind: "form", label: "08 / Acuerdos de la entrevista · llena el asesor", rows: [
      [c("¿Qué documentos puede aportar y cuándo? Solicitar sólo los pertinentes", documentos, 6)],
      [c("¿Qué información falta o se contradice? ¿Qué debe comprobarse antes de avanzar?", pendientes, 6)],
      [c("Siguiente paso acordado", junta(label("siguientePaso", d.siguientePaso), d.motivoSiguiente), 3), c("Responsable y fecha de seguimiento", junta(d.responsableSeguimiento, f(d.fechaSeguimiento)), 3)],
    ] },
    { kind: "note", text: "La entrevista no autoriza publicación, recepción de dinero ni fija precio, comisión o exclusiva. Si hay varios titulares, completar sus datos en una hoja adicional vinculada al mismo folio. La documentación se revisa en la etapa siguiente." },
  ];
  return { title: "Entrevista inicial", subject: `Formato 02 · ${a(d.folio)}`, blocks };
}
