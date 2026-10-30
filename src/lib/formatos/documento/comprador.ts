import { formatoById } from "../catalog";
import { a, dinero, fecha, junta, type Block, type Documento } from "./modelo";

/*
  12 · Entrevista y perfil del comprador, y 13 · Registro de visita y retroalimentación,
  con el diseño de sus plantillas: título con subtítulo gris, celdas grises con la
  pregunta arriba y la respuesta debajo, barras azules por sección y opciones en casillas.
*/

type Data = Record<string, unknown>;
type Cell = { q: string; a: string; w: number; keys?: string[] };
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const money = (value: unknown, currency?: unknown) => typeof value === "number" ? dinero(value, currency) : "";
const c = (q: string, answer: string, w = 1, keys?: string[]): Cell => ({ q, a: answer, w, ...(keys ? { keys } : {}) });
const row = (...cells: Cell[]): Block => ({ kind: "form", filled: true, rows: [cells] });
const bar = (text: string): Block => ({ kind: "bar", text, raw: true });

function opciones(id: string, key: string, labels: Record<string, string> = {}) {
  const field = formatoById(id).fields.find(item => item.key === key);
  return (field?.options ?? []).map(o => ({ value: o.value, label: labels[o.value] ?? o.label }));
}

export function compradorDocumento(d: Data): Documento {
  const checks = (q: string, key: string, labels?: Record<string, string>): Block => ({ kind: "checks", zona: { keys: [key], label: q }, q, options: opciones("12", key, labels), selected: d[key] });
  const blocks: Block[] = [
    { kind: "title", text: "Perfil del comprador" },
    { kind: "caption", text: "Una conversación para entender qué busca y cómo puede realizar la compra." },
    row(c("Fecha de entrevista", f(d.fechaEntrevista), 1, ["fechaEntrevista"]), c("Asesor", a(d.asesor), 1, ["asesor"])),
    row(c("Nombre completo", a(d.comprador), 1, ["comprador"])),
    row(c("Teléfono", a(d.telefono), 1, ["telefono"]), c("Correo electrónico", a(d.correo), 1, ["correo"])),
    row(c("Medio de contacto preferido", formatoById("12").fields.find(x => x.key === "medioContacto")?.options?.find(o => o.value === d.medioContacto)?.label ?? "", 1, ["medioContacto"]), c("¿Quién más participa en la decisión?", a(d.participantesDecision), 1, ["participantesDecision"])),
    bar("01   La búsqueda"),
    checks("¿Qué tipo de inmueble busca?", "tipoInmueble"),
    checks("¿Qué uso le dará?", "usoInmueble"),
    row(c("Zonas donde busca", a(d.zonas), 1, ["zonas"])),
    row(c("¿Qué características son indispensables?", a(d.indispensables), 1, ["indispensables"])),
    row(c("¿En qué puede ser flexible?", a(d.flexible), 1, ["flexible"]), c("¿Qué características descarta?", a(d.descarta), 1, ["descarta"])),
    checks("¿Cuál es el motivo de la compra?", "motivoCompra"),
    { kind: "pagebreak" },
    { kind: "title", text: "Presupuesto y próximos pasos" },
    { kind: "caption", text: "Precisar lo posible, resolver pendientes y acordar la siguiente acción." },
    bar("02   El presupuesto y la forma de pago"),
    row(c("Precio que le gustaría pagar", money(d.precioDeseado), 1, ["precioDeseado"]), c("Precio máximo que puede pagar", money(d.precioMaximo), 1, ["precioMaximo"]), c("Moneda de ambos precios", a(d.moneda), 1, ["moneda"])),
    checks("¿El precio máximo incluye gastos de compra?", "gastosIncluidos"),
    row(c("Dinero reservado para gastos de compra", money(d.reservaGastos), 1, ["reservaGastos"]), c("Moneda de la reserva", a(d.monedaReserva), 1, ["monedaReserva"])),
    checks("¿Cómo prevé pagar?", "formaPago"),
    row(c("Recursos propios disponibles · importe declarado", money(d.recursosPropios), 1, ["recursosPropios"]), c("Moneda de los recursos propios", a(d.monedaRecursos), 1, ["monedaRecursos"])),
    row(c("Crédito que prevé solicitar · importe", money(d.creditoPrevisto), 1, ["creditoPrevisto"]), c("Moneda del crédito", a(d.monedaCredito), 1, ["monedaCredito"]), c("Institución de crédito", a(d.institucionCredito), 1, ["institucionCredito"])),
    checks("¿En qué etapa está el crédito?", "etapaCredito"),
    row(c("Soporte de crédito revisado", a(d.soporteCredito), 1, ["soporteCredito"]), c("Fecha del soporte", f(d.fechaSoporte), 1, ["fechaSoporte"]), c("Vigencia del soporte", f(d.vigenciaSoporte), 1, ["vigenciaSoporte"])),
    bar("03   El plazo y el siguiente paso"),
    row(c("¿Para cuándo quiere comprar?", a(d.plazoCompra), 1, ["plazoCompra"]), c("¿Puede cambiar esa fecha?", opciones("12", "fechaFlexible").find(o => o.value === d.fechaFlexible)?.label ?? "", 1, ["fechaFlexible"])),
    row(c("¿De qué depende la compra? · venta previa, crédito u otra condición", a(d.dependencias), 1, ["dependencias"])),
    row(c("Días disponibles para visitas", a(d.diasVisita), 1, ["diasVisita"]), c("Horario disponible para visitas", a(d.horarioVisita), 1, ["horarioVisita"])),
    row(c("Siguiente acción", a(d.siguienteAccion), 1, ["siguienteAccion"]), c("Responsable", a(d.responsableSeguimiento), 1, ["responsableSeguimiento"]), c("Fecha acordada", f(d.fechaAcordada), 1, ["fechaAcordada"])),
    { kind: "note", text: "Los importes son declarados salvo soporte identificado. Una precalificación no garantiza el crédito. Poner a disposición el aviso de privacidad y registrar el seguimiento en el tablero." },
  ];
  return { title: "Perfil del comprador", subject: `Formato 12 · ${a(d.folio)}`, blocks };
}

export function visitaDocumento(d: Data): Documento {
  const checks = (q: string, key: string): Block => ({ kind: "checks", zona: { keys: [key], label: q }, q, options: opciones("13", key), selected: d[key] });
  const blocks: Block[] = [
    { kind: "title", text: "Visita y retroalimentación" },
    { kind: "caption", text: "Registrar la experiencia del interesado y acordar cómo continuar." },
    row(c("Fecha de la cita", f(d.fechaCita), 1, ["fechaCita"]), c("Hora de la cita", a(d.horaCita), 1, ["horaCita"]), c("Asesor", a(d.asesor), 1, ["asesor"])),
    row(c("Inmueble visitado · domicilio", a(d.inmueble), 1.4, ["inmueble"]), c("Folio del inmueble", a(d.folioInmueble), 0.8, ["folioInmueble"]), c("Unidad visitada · si aplica", a(d.unidad), 0.8, ["unidad"])),
    row(c("Nombre del interesado", a(d.interesado), 1, ["interesado"]), c("Folio del interesado", a(d.folioInteresado), 1, ["folioInteresado"]), c("Acompañantes", a(d.acompanantes), 1, ["acompanantes"])),
    checks("Estado de la cita · marcar uno", "estadoCita"),
    bar("01   Lo que comenta el interesado"),
    row(c("¿Qué le gustó del inmueble?", a(d.gusto), 1, ["gusto"]), c("¿Qué no le convenció?", a(d.noConvencio), 1, ["noConvencio"])),
    row(c("¿Qué dudas o información necesita resolver?", a(d.dudas), 1, ["dudas"])),
    checks("¿El inmueble cumple sus necesidades? · marcar uno", "cumpleNecesidades"),
    bar("02   Su interés en continuar"),
    checks("¿Qué quiere hacer después? · marcar uno", "pasoSiguiente"),
    row(c("Motivo de su decisión", a(d.motivoDecision), 1, ["motivoDecision"])),
    bar("03   Seguimiento del asesor"),
    row(c("Observaciones del asesor · distinguir hechos de interpretación", a(d.observacionesAsesor), 1, ["observacionesAsesor"])),
    row(c("Acción acordada", a(d.accionAcordada), 1, ["accionAcordada"]), c("Responsable", a(d.responsableSeguimiento), 1, ["responsableSeguimiento"]), c("Fecha de seguimiento", f(d.fechaSeguimiento), 1, ["fechaSeguimiento"])),
    row(c("Pendientes por comprobar", junta(d.pendientesComprobar), 1, ["pendientesComprobar"])),
  ];
  return { title: "Visita y retroalimentación", subject: `Formato 13 · ${a(d.folio)}`, blocks };
}
