import { formatoById } from "../catalog";
import { a, dinero, fecha, junta, type Block, type Documento } from "./modelo";

/*
  12 · Entrevista y perfil del comprador, y 13 · Registro de visita y retroalimentación,
  con el diseño de sus plantillas: título con subtítulo gris, celdas grises con la
  pregunta arriba y la respuesta debajo, barras azules por sección y opciones en casillas.
*/

type Data = Record<string, unknown>;
type Cell = { q: string; a: string; w: number };
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const money = (value: unknown, currency?: unknown) => typeof value === "number" ? dinero(value, currency) : "";
const c = (q: string, answer: string, w = 1): Cell => ({ q, a: answer, w });
const row = (...cells: Cell[]): Block => ({ kind: "form", filled: true, rows: [cells] });
const bar = (text: string): Block => ({ kind: "bar", text, raw: true });

function opciones(id: string, key: string, labels: Record<string, string> = {}) {
  const field = formatoById(id).fields.find(item => item.key === key);
  return (field?.options ?? []).map(o => ({ value: o.value, label: labels[o.value] ?? o.label }));
}

export function compradorDocumento(d: Data): Documento {
  const checks = (q: string, key: string, labels?: Record<string, string>): Block => ({ kind: "checks", q, options: opciones("12", key, labels), selected: d[key] });
  const blocks: Block[] = [
    { kind: "title", text: "Perfil del comprador" },
    { kind: "caption", text: "Una conversación para entender qué busca y cómo puede realizar la compra." },
    row(c("Fecha de entrevista", f(d.fechaEntrevista)), c("Asesor", a(d.asesor))),
    row(c("Nombre completo", a(d.comprador))),
    row(c("Teléfono", a(d.telefono)), c("Correo electrónico", a(d.correo))),
    row(c("Medio de contacto preferido", formatoById("12").fields.find(x => x.key === "medioContacto")?.options?.find(o => o.value === d.medioContacto)?.label ?? ""), c("¿Quién más participa en la decisión?", a(d.participantesDecision))),
    bar("01   La búsqueda"),
    checks("¿Qué tipo de inmueble busca?", "tipoInmueble"),
    checks("¿Qué uso le dará?", "usoInmueble"),
    row(c("Zonas donde busca", a(d.zonas))),
    row(c("¿Qué características son indispensables?", a(d.indispensables))),
    row(c("¿En qué puede ser flexible?", a(d.flexible)), c("¿Qué características descarta?", a(d.descarta))),
    checks("¿Cuál es el motivo de la compra?", "motivoCompra"),
    { kind: "pagebreak" },
    { kind: "title", text: "Presupuesto y próximos pasos" },
    { kind: "caption", text: "Precisar lo posible, resolver pendientes y acordar la siguiente acción." },
    bar("02   El presupuesto y la forma de pago"),
    row(c("Precio que le gustaría pagar", money(d.precioDeseado)), c("Precio máximo que puede pagar", money(d.precioMaximo)), c("Moneda de ambos precios", a(d.moneda))),
    checks("¿El precio máximo incluye gastos de compra?", "gastosIncluidos"),
    row(c("Dinero reservado para gastos de compra", money(d.reservaGastos)), c("Moneda de la reserva", a(d.monedaReserva))),
    checks("¿Cómo prevé pagar?", "formaPago"),
    row(c("Recursos propios disponibles · importe declarado", money(d.recursosPropios)), c("Moneda de los recursos propios", a(d.monedaRecursos))),
    row(c("Crédito que prevé solicitar · importe", money(d.creditoPrevisto)), c("Moneda del crédito", a(d.monedaCredito)), c("Institución de crédito", a(d.institucionCredito))),
    checks("¿En qué etapa está el crédito?", "etapaCredito"),
    row(c("Soporte de crédito revisado", a(d.soporteCredito)), c("Fecha del soporte", f(d.fechaSoporte)), c("Vigencia del soporte", f(d.vigenciaSoporte))),
    bar("03   El plazo y el siguiente paso"),
    row(c("¿Para cuándo quiere comprar?", a(d.plazoCompra)), c("¿Puede cambiar esa fecha?", opciones("12", "fechaFlexible").find(o => o.value === d.fechaFlexible)?.label ?? "")),
    row(c("¿De qué depende la compra? · venta previa, crédito u otra condición", a(d.dependencias))),
    row(c("Días disponibles para visitas", a(d.diasVisita)), c("Horario disponible para visitas", a(d.horarioVisita))),
    row(c("Siguiente acción", a(d.siguienteAccion)), c("Responsable", a(d.responsableSeguimiento)), c("Fecha acordada", f(d.fechaAcordada))),
    { kind: "note", text: "Los importes son declarados salvo soporte identificado. Una precalificación no garantiza el crédito. Poner a disposición el aviso de privacidad y registrar el seguimiento en el tablero." },
  ];
  return { title: "Perfil del comprador", subject: `Formato 12 · ${a(d.folio)}`, blocks };
}

export function visitaDocumento(d: Data): Documento {
  const checks = (q: string, key: string): Block => ({ kind: "checks", q, options: opciones("13", key), selected: d[key] });
  const blocks: Block[] = [
    { kind: "title", text: "Visita y retroalimentación" },
    { kind: "caption", text: "Registrar la experiencia del interesado y acordar cómo continuar." },
    row(c("Fecha de la cita", f(d.fechaCita)), c("Hora de la cita", a(d.horaCita)), c("Asesor", a(d.asesor))),
    row(c("Inmueble visitado · domicilio", a(d.inmueble), 1.4), c("Folio del inmueble", a(d.folioInmueble), 0.8), c("Unidad visitada · si aplica", a(d.unidad), 0.8)),
    row(c("Nombre del interesado", a(d.interesado)), c("Folio del interesado", a(d.folioInteresado)), c("Acompañantes", a(d.acompanantes))),
    checks("Estado de la cita · marcar uno", "estadoCita"),
    bar("01   Lo que comenta el interesado"),
    row(c("¿Qué le gustó del inmueble?", a(d.gusto)), c("¿Qué no le convenció?", a(d.noConvencio))),
    row(c("¿Qué dudas o información necesita resolver?", a(d.dudas))),
    checks("¿El inmueble cumple sus necesidades? · marcar uno", "cumpleNecesidades"),
    bar("02   Su interés en continuar"),
    checks("¿Qué quiere hacer después? · marcar uno", "pasoSiguiente"),
    row(c("Motivo de su decisión", a(d.motivoDecision))),
    bar("03   Seguimiento del asesor"),
    row(c("Observaciones del asesor · distinguir hechos de interpretación", a(d.observacionesAsesor))),
    row(c("Acción acordada", a(d.accionAcordada)), c("Responsable", a(d.responsableSeguimiento)), c("Fecha de seguimiento", f(d.fechaSeguimiento))),
    row(c("Pendientes por comprobar", junta(d.pendientesComprobar))),
  ];
  return { title: "Visita y retroalimentación", subject: `Formato 13 · ${a(d.folio)}`, blocks };
}
