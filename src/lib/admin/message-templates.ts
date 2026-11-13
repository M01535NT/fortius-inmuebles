import { formatPrecio } from "@/data/propiedades";
import type { AdminProperty } from "@/lib/domain/records";

/*
  Mensajes listos (RP-22; textos base aprobados por el titular el 12/11/2026, en
  docs/erp-crm/plantillas-de-mensaje-borrador.md). Se llenan con los datos de la persona y del
  inmueble; lo que va entre corchetes lo completa el asesor antes de enviar. Solo se ofrece un
  inmueble publicado y disponible (RP-91); si el precio es «a consulta», la frase del precio se
  quita. Abrir WhatsApp no registra nada: el envío queda en el historial cuando el asesor confirma.
  El director puede cambiar cada texto en Configuración (CRM-02); se guarda solo lo que cambió y,
  si no hay cambio, se usa el aprobado.
*/

export const TEMPLATE_IDS = [
  "primera-inmueble", "primera-busqueda", "opcion", "confirmar-vio", "proponer-visita", "confirmar-visita",
  "despues-visita", "no-contesto", "reintento", "ya-no-busca", "ya-vendido", "cambiar-visita", "documentos",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];
/** Textos propios guardados en Configuración: solo los que el director cambió. */
export type TemplateOverrides = Partial<Record<TemplateId, string>>;
export const TEMPLATE_MAX = 1500;

/** Qué necesita el texto para poder usarse. */
type Needs = "ofrecible" | "inmueble" | "cerrado";
type Template = { id: TemplateId; name: string; text: string; needs?: Needs };

/*
  {campo} se llena solo. ⟨…⟩ es un tramo opcional: se quita entero si algún campo de adentro no
  tiene dato. [algo] lo escribe el asesor.
*/
export const MESSAGE_TEMPLATES: Template[] = [
  { id: "primera-inmueble", name: "Primera respuesta", needs: "inmueble", text: "Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Recibimos tu mensaje sobre {inmueble}. ¿Te llamo hoy para resolver tus dudas o prefieres que platiquemos por aquí?⟨\n\nFotos y detalles: {liga_ficha}⟩" },
  { id: "primera-busqueda", name: "Primera respuesta: qué busca", text: "Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Gracias por escribirnos. Para mandarte opciones que sí te sirvan, ¿me dices en qué zona buscas, cuántas recámaras necesitas y cuánto tienes pensado pagar?" },
  { id: "opcion", name: "Enviarle una opción", needs: "ofrecible", text: "{nombre}, te comparto {inmueble}, en {zona}⟨, con precio de {precio}⟩. Pensé en ti porque [lo que busca]. Aquí están las fotos y los detalles: {liga_ficha}\n\nSi te interesa, lo podemos ver esta semana." },
  { id: "confirmar-vio", name: "Confirmar que vio la opción", needs: "inmueble", text: "Hola, {nombre}. ¿Alcanzaste a ver la información de {inmueble}? Si algo no te convenció, dime qué le faltó y te busco otra opción." },
  { id: "proponer-visita", name: "Proponer una visita", needs: "ofrecible", text: "{nombre}, ¿te gustaría conocer {inmueble}? Puedo [horarios]. Tú me dices cuál te acomoda." },
  { id: "confirmar-visita", name: "Confirmar la visita", needs: "inmueble", text: "Hola, {nombre}. Te confirmo la visita a {inmueble} el {dia} a las {hora}. Nos vemos en [punto de encuentro]. Si se te complica, avísame y la cambiamos." },
  { id: "despues-visita", name: "Después de la visita", needs: "inmueble", text: "Hola, {nombre}. Gracias por venir a ver {inmueble}. ¿Qué te pareció? Saber qué te gustó y qué no me ayuda a buscarte mejor." },
  { id: "no-contesto", name: "No contestó la llamada", text: "Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Te marqué hace un rato sobre [motivo]. ¿A qué hora te puedo llamar?" },
  { id: "reintento", name: "Volver a buscarlo", text: "Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Hace unas semanas platicamos sobre [lo que busca]. ¿Sigues buscando? Si es así, te mando lo que tenemos disponible hoy." },
  { id: "ya-no-busca", name: "Cuando ya no busca", text: "Gracias por avisarme, {nombre}. Si más adelante vuelves a buscar, con gusto te ayudamos." },
  { id: "ya-vendido", name: "Ya se vendió o se rentó", needs: "cerrado", text: "Hola, {nombre}. Te aviso que {inmueble} ya se {vendio_o_rento}. Sé que te había gustado. Tengo otras opciones en {zona} parecidas a lo que buscas; ¿te las mando?" },
  { id: "cambiar-visita", name: "Cambiar o cancelar una visita", needs: "inmueble", text: "Hola, {nombre}. Te escribo por la visita a {inmueble} del {dia} a las {hora}. Se me presentó un cambio y no vamos a poder verla a esa hora. ¿Te acomoda [nuevo horario]? Si no, dime cuándo puedes y lo ajustamos." },
  { id: "documentos", name: "Pedirle sus documentos", needs: "inmueble", text: "{nombre}, qué buena noticia que quieras apartar {inmueble}. Para avanzar necesito estos documentos:\n\n[lista de documentos]\n\nMe los puedes mandar por aquí en foto o PDF, o traerlos cuando nos veamos. Si tienes duda con alguno, pregúntame." },
];

/** Los datos que se llenan solos, con el nombre que ve el director al editar. */
export const TEMPLATE_FIELDS: Array<{ key: string; label: string }> = [
  { key: "nombre", label: "Nombre" }, { key: "asesor", label: "Asesor" }, { key: "inmueble", label: "Inmueble" },
  { key: "zona", label: "Zona" }, { key: "precio", label: "Precio" }, { key: "liga_ficha", label: "Liga a la ficha" },
  { key: "dia", label: "Día de la visita" }, { key: "hora", label: "Hora de la visita" }, { key: "vendio_o_rento", label: "vendió o rentó" },
];
const FIELD_KEYS = new Set(TEMPLATE_FIELDS.map(f => f.key));

/** Lo que impide guardar un texto: vacío, muy largo, un dato que no existe o un ⟨ ⟩ sin cerrar. */
export function templateProblems(text: string): string[] {
  const problems: string[] = [];
  if (!text.trim()) problems.push("El mensaje no puede quedar vacío.");
  if (text.length > TEMPLATE_MAX) problems.push(`El mensaje pasa de ${TEMPLATE_MAX} caracteres.`);
  const unknown = [...new Set([...text.matchAll(/\{([^{}]*)\}/g)].map(m => m[1]).filter(key => !FIELD_KEYS.has(key)))];
  if (unknown.length) problems.push(`No existe el dato ${unknown.map(k => `{${k}}`).join(", ")}. Usa los botones de abajo para agregar datos.`);
  let depth = 0;
  for (const ch of text) { if (ch === "⟨") depth++; if (ch === "⟩" && --depth < 0) break; if (depth > 1) break; }
  if (depth !== 0) problems.push("Cada ⟨ necesita su ⟩, sin uno dentro de otro.");
  return problems;
}

/** El texto vigente: el propio si es válido; si no, el aprobado. */
export function templateText(id: TemplateId, overrides?: TemplateOverrides | null) {
  const own = overrides?.[id];
  return own && templateProblems(own).length === 0 ? own : MESSAGE_TEMPLATES.find(t => t.id === id)!.text;
}

/** Deja solo los textos que cambiaron respecto del aprobado. */
export function changedTemplates(texts: Partial<Record<TemplateId, string>>): TemplateOverrides {
  const out: TemplateOverrides = {};
  for (const t of MESSAGE_TEMPLATES) {
    const own = texts[t.id]?.replace(/\r/g, "");
    if (own !== undefined && own !== t.text) out[t.id] = own;
  }
  return out;
}

export type MessageContext = {
  nombre: string;
  asesor?: string;
  zona?: string;
  property?: Pick<AdminProperty, "slug" | "titulo" | "zona" | "precio" | "estado" | "publicada"> | null;
  /** La próxima visita con ese inmueble: «jueves 14 de noviembre» y «11:00». */
  visit?: { dia: string; hora?: string } | null;
  /** Origen del sitio para la liga de la ficha, p. ej. https://fortiusinmuebles.com */
  origin?: string;
};

export type FilledMessage = { id: TemplateId; name: string; text: string } & ({ available: true } | { available: false; reason: string });

const offerable = (p: MessageContext["property"]) => !!p && p.estado === "disponible" && p.publicada === true;
const closed = (p: MessageContext["property"]) => !!p && (p.estado === "vendida" || p.estado === "rentada");

function fields(ctx: MessageContext): Record<string, string | undefined> {
  const p = ctx.property ?? undefined;
  const show = offerable(p);
  return {
    nombre: ctx.nombre.trim().split(/\s+/)[0] || undefined,
    asesor: ctx.asesor?.trim() || undefined,
    inmueble: p?.titulo,
    zona: p?.zona?.trim() || ctx.zona?.trim() || undefined,
    // Precio y liga solo de un inmueble que se puede ofrecer (RP-91); «a consulta» no lleva precio.
    precio: show && p!.precio.modalidad === "publico" ? formatPrecio(p!.precio) : undefined,
    liga_ficha: show && ctx.origin ? `${ctx.origin.replace(/\/$/, "")}/inventario/${p!.slug}` : undefined,
    vendio_o_rento: p?.estado === "vendida" ? "vendió" : p?.estado === "rentada" ? "rentó" : undefined,
    dia: ctx.visit?.dia,
    hora: ctx.visit?.hora,
  };
}

/** Sustituye los campos; un tramo opcional sin dato se quita y un campo obligatorio sin dato queda entre corchetes. */
export function fillTemplate(text: string, values: Record<string, string | undefined>) {
  const optional = text.replace(/⟨([^⟩]*)⟩/g, (_, inner: string) => {
    const keys = [...inner.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    return keys.every(key => values[key]) ? inner : "";
  });
  return optional.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `[${key.replace(/_/g, " ")}]`);
}

const NEED_REASON: Record<Needs, string> = {
  ofrecible: "Necesita un inmueble publicado y disponible.",
  inmueble: "Necesita el inmueble que le interesa.",
  cerrado: "Solo cuando su inmueble ya se vendió o se rentó.",
};

/** Todos los mensajes, llenos, con los que no aplican marcados y su motivo. */
export function messagesFor(ctx: MessageContext, overrides?: TemplateOverrides | null): FilledMessage[] {
  const values = fields(ctx);
  return MESSAGE_TEMPLATES.map(template => {
    const text = fillTemplate(templateText(template.id, overrides), values);
    const ok = template.needs === "ofrecible" ? offerable(ctx.property) : template.needs === "inmueble" ? !!ctx.property : template.needs === "cerrado" ? closed(ctx.property) : true;
    return ok ? { id: template.id, name: template.name, text, available: true as const } : { id: template.id, name: template.name, text, available: false as const, reason: NEED_REASON[template.needs!] };
  });
}

/** Lo que el asesor todavía debe escribir: los tramos entre corchetes. */
export function blanks(text: string) {
  return [...text.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
}

/** El mensaje que conviene según el momento de la persona; el asesor puede elegir otro. */
export function suggestedTemplate(state: { unattended: boolean; hasProperty: boolean; lastContact?: string; retry?: boolean; visited?: boolean; propertyClosed?: boolean }): TemplateId {
  if (state.propertyClosed) return "ya-vendido";
  if (state.unattended) return state.hasProperty ? "primera-inmueble" : "primera-busqueda";
  if (state.retry) return "reintento";
  if (state.lastContact === "no_contesto") return "no-contesto";
  if (state.visited) return "despues-visita";
  if (state.lastContact === "whatsapp") return "confirmar-vio";
  return state.hasProperty ? "opcion" : "primera-busqueda";
}
