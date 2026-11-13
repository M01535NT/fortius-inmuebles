/*
  Guía de cada pantalla (titular, 02/11/2026): un botón «Ayuda» en la barra y la tecla «?»
  abren una guía que oscurece la pantalla, resalta un elemento y dice qué hacer ahí, paso por
  paso, con Siguiente, Omitir y cerrar. Nunca se abre sola: solo cuando se pide
  (DEC-47, 12/11/2026). Aquí viven los pasos; la capa que los muestra está en
  `src/components/admin/workspace/tour.tsx`. Cada paso apunta a un elemento marcado con
  `data-tour="<target>"`; si ese elemento no está en pantalla (lista vacía, celular), el paso se salta.
*/

export type TourStep = { target: string; title: string; text: string };
export type TourScreen = { id: string; title: string; match: (pathname: string) => boolean; steps: TourStep[] };

const UUID = /^\/admin\/operaciones\/[0-9a-f-]{36}(\/|$)/i;
const under = (pathname: string, ...prefixes: string[]) => prefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"));

const BAR: TourStep[] = [
  { target: "nav", title: "Las secciones", text: "Hoy, Operaciones, Contactos, Inmuebles y la agenda con tus tareas. «Más» abre las herramientas y, si eres administrador, Equipo, Sitio web y Reportes." },
  { target: "nuevo", title: "Registrar algo nuevo", text: "Quien llama o escribe, un inmueble, una tarea o una cita empiezan aquí: pulsa «+ Nuevo» y elige «Atender a alguien» o lo que vayas a registrar." },
  { target: "buscar", title: "Buscar", text: "Encuentra a una persona, un inmueble o un folio desde cualquier pantalla. También con Ctrl K." },
  { target: "ayuda", title: "Esta guía", text: "Vuelve a verla cuando quieras con este botón o con la tecla «?». Cada pantalla tiene la suya." },
];

export const TOUR_SCREENS: TourScreen[] = [
  { id: "hoy", title: "Hoy", match: pathname => pathname === "/admin", steps: [
    { target: "hoy-siguiente", title: "Lo siguiente", text: "Lo más urgente de tu día, en grande. Debajo, todo lo demás que espera algo de ti, de lo más urgente a lo menos; la pastilla dice de qué se trata." },
    { target: "css:[aria-labelledby=\"hoy-hoy\"]", title: "Hoy", text: "Tus citas y tus tareas de hoy en una sola lista. Marca la casilla cuando termines una tarea." },
    { target: "css:[aria-labelledby=\"hoy-semana\"]", title: "Esta semana", text: "Lo que vence en los próximos siete días, para verlo antes de que sea urgente." },
    ...BAR,
  ] },
  { id: "operaciones", title: "Operaciones", match: pathname => pathname === "/admin/operaciones", steps: [
    { target: "css:[aria-labelledby=\"grupo-esperan\"]", title: "Esperan algo de ti", text: "Las operaciones con un pendiente tuyo. Cada fila dice en qué etapa va y qué toca; pulsa una para abrirla." },
    { target: "op-filtros", title: "Por etapa", text: "Filtra las operaciones por la etapa en la que van. «Todas» las muestra juntas." },
    { target: "op-vista", title: "Lista o tablero", text: "La lista ordena por urgencia; el tablero muestra las etapas como columnas." },
    { target: "nuevo", title: "Abrir una operación", text: "Pulsa «+ Nuevo» y elige «Atender a alguien». En un minuto queda registrada la llamada y agendada la entrevista." },
  ] },
  { id: "operacion", title: "Una operación", match: pathname => UUID.test(pathname), steps: [
    { target: "css:[aria-label=\"Avance de la operación\"]", title: "La etapa", text: "Aquí ves en qué etapa va la operación y qué sigue. «Ver etapas» muestra las diez del proceso." },
    { target: "operacion-documentos", title: "Documentos de la etapa", text: "Cada etapa tiene su formato. Pulsa uno para llenarlo sobre el documento, tal como saldrá en PDF." },
    { target: "operacion-confirma", title: "Antes de seguir, confirma", text: "Lo que debe estar revisado para pasar de etapa. Cuando lo tengas, pulsa «Confirmar» y di qué encontraste." },
    { target: "operacion-continuar", title: "Continuar", text: "Cuando todo está listo, este botón pasa la operación a la siguiente etapa. Si falta algo, aquí dice qué." },
    { target: "operacion-pestanas", title: "Lo demás de la operación", text: "Los documentos y la actividad (tareas e historial) de esta misma operación. Los datos de la operación están en «Más opciones», arriba del panel azul." },
  ] },
  { id: "nueva", title: "Nueva operación", match: pathname => pathname === "/admin/operaciones/nueva", steps: [
    { target: "nueva-opciones", title: "¿Qué quiere hacer?", text: "Elige si vende, ofrece en renta, busca comprar, busca rentar o invierte. Se puede cambiar después." },
    { target: "nueva-alta", title: "Alta rápida", text: "Si ya tienes todos los datos de un cliente registrado, abre la operación sin entrevista desde aquí." },
  ] },
  { id: "contactos", title: "Contactos", match: pathname => under(pathname, "/admin/contactos", "/admin/leads", "/admin/clientes"), steps: [
    { target: "contactos-agregar", title: "Agregar contacto", text: "Abre «Atender a alguien»: con lo que la persona busca, queda como prospecto o como operación. En la vista Clientes agrega a un cliente directo." },
    { target: "contactos-filtros", title: "Quién es quién", text: "Nuevos, en seguimiento, clientes con contrato firmado o descartados." },
    { target: "contactos-lista", title: "Las personas", text: "Pulsa una para ver su ficha, llamarle o escribirle por WhatsApp. «Sigue» dice el próximo paso con ella." },
  ] },
  { id: "inmuebles", title: "Inmuebles", match: pathname => under(pathname, "/admin/propiedades"), steps: [
    { target: "inmuebles-agregar", title: "Agregar inmueble", text: "Da de alta un inmueble con sus datos y fotos. Se guarda privado; se publica desde su operación cuando el contrato está firmado." },
    { target: "inmuebles-lista", title: "El inventario", text: "Cada tarjeta dice si está publicado y qué le falta. Pulsa una para editarla o ver su seguimiento." },
  ] },
  { id: "agenda", title: "Agenda y tareas", match: pathname => under(pathname, "/admin/agenda", "/admin/tareas"), steps: [
    { target: "agenda-semana", title: "Tu semana", text: "Citas con hora y tareas que vencen. Pulsa un día para ver su detalle." },
    { target: "agenda-agendar", title: "Agendar", text: "Una visita, una llamada o una firma, ligada a la persona, el inmueble o la operación." },
  ] },
  { id: "herramientas", title: "Más", match: pathname => under(pathname, "/admin/herramientas"), steps: [
    { target: "herramientas-grupos", title: "Trabajo suelto", text: "Calculadoras y documentos que no necesitan una operación: abre una, guarda el trabajo y descárgalo en PDF." },
    ...BAR.slice(0, 2),
  ] },
];

/** La guía de la pantalla actual, o null si esa pantalla no tiene una. */
export function tourFor(pathname: string): TourScreen | null {
  return TOUR_SCREENS.find(screen => screen.match(pathname)) ?? null;
}

export const TOUR_STORAGE_KEY = "fortius.guia.vista.v1";
export function readSeen(storage: Pick<Storage, "getItem"> | null | undefined): string[] {
  try {
    const raw = storage?.getItem(TOUR_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}
export function markSeen(storage: Pick<Storage, "getItem" | "setItem"> | null | undefined, id: string) {
  try {
    const seen = readSeen(storage);
    if (!seen.includes(id)) storage?.setItem(TOUR_STORAGE_KEY, JSON.stringify([...seen, id]));
  } catch { /* sin almacenamiento local (ventana privada): la guía solo se abre a mano */ }
}
