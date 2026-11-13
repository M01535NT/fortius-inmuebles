/*
  «¿Cómo se hace esto?» (COR-26, 12/11/2026): el manual del panel para el asesor, dentro del panel.
  Cada sección corresponde a una pantalla de la guía (`tour.ts`, mismo `id`), así la guía de cada
  pantalla enlaza a su sección. Lenguaje del asesor, sin detalles técnicos. Si una pantalla cambia,
  se cambian aquí sus pasos.
*/
export type HelpTask = { q: string; steps: string[] };
export type HelpSection = { id: string; title: string; intro: string; tasks: HelpTask[]; director?: true };

export const HELP_SECTIONS: HelpSection[] = [
  { id: "hoy", title: "Hoy", intro: "Tu día en una pantalla: lo más urgente arriba, después tus citas y tareas de hoy y lo que vence esta semana.", tasks: [
    { q: "¿Por dónde empiezo el día?", steps: ["Abre «Lo siguiente»: es lo más urgente que espera algo de ti.", "Al terminarlo, vuelve a Hoy; la lista se reordena sola."] },
    { q: "¿Cómo marco una tarea como hecha?", steps: ["En «Hoy», marca la casilla de la tarea.", "Si necesitas cambiar su fecha, ábrela y elige otra."] },
    { q: "Me llegó un prospecto nuevo del sitio, ¿qué hago?", steps: ["Aparece en «Nuevos sin atender» con el tiempo que lleva esperando.", "Llámale o escríbele y pulsa «Ya hablé con esta persona»."] },
  ] },
  { id: "nueva", title: "Atender a alguien", intro: "Quien llama o escribe se registra en un minuto: qué quiere, quién es y cuál es el siguiente paso.", tasks: [
    { q: "¿Cómo registro una llamada?", steps: ["Pulsa «+ Nuevo» y elige «Atender a alguien».", "Elige qué quiere hacer: vender, ofrecer en renta, comprar, rentar o invertir.", "Escribe su nombre y teléfono; si ya existe, el panel te lo avisa.", "Anota el siguiente paso con su fecha."] },
    { q: "¿Cuándo se crea la operación?", steps: ["Para quien vende u ofrece en renta, al terminar la entrevista inicial (02).", "Quien compra o renta queda como interesado: le das seguimiento desde su ficha en Contactos."] },
  ] },
  { id: "operaciones", title: "Operaciones", intro: "Todas tus operaciones, con la etapa en la que van y lo que toca en cada una.", tasks: [
    { q: "¿Cómo encuentro una operación?", steps: ["Busca por nombre, folio o inmueble, o filtra por etapa.", "«Esperan algo de ti» son las que tienen un pendiente tuyo."] },
  ] },
  { id: "operacion", title: "Una operación", intro: "El panel azul dice en qué etapa va; a la derecha, lo que hay que hacer para pasar a la siguiente.", tasks: [
    { q: "¿Cómo lleno un documento?", steps: ["En «Documentos de la etapa», pulsa el formato.", "Se abre en su propia ventana: pulsa cada espacio del documento y escribe.", "Lo que ya se confirmó en el expediente aparece lleno."] },
    { q: "¿Cómo confirmo un requisito?", steps: ["En «Antes de seguir, confirma», pulsa «Confirmar».", "Elige con qué lo comprobaste y escribe qué encontraste.", "Si es algo que revisa el director (lo jurídico, el precio, los contratos o publicar), déjalo en «Lo tengo»: él lo marca revisado."] },
    { q: "Algo salió mal con un requisito, ¿cómo lo anoto?", steps: ["En «⋯» del requisito elige «Hay un problema».", "Escribe qué pasó y cómo se puede resolver.", "Cuando se resuelva, pulsa «Ya se resolvió»."] },
    { q: "¿Cómo paso a la siguiente etapa?", steps: ["Cuando todo esté confirmado, pulsa el botón de continuar.", "Si falta algo, el mismo botón dice qué es.", "Para avanzar debe haber una próxima tarea con fecha."] },
    { q: "¿Cómo registro la firma del contrato?", steps: ["Sube el contrato firmado a los documentos del cliente.", "En «Firma del contrato», registra la fecha y quién firmó.", "El director la revisa; desde entonces el inmueble está captado y se puede publicar."] },
    { q: "Un interesado hizo una oferta por escrito, ¿cómo la ligo?", steps: ["Llena la oferta (formato 14) en la operación del propietario.", "En «Visitas y ofertas del inmueble», elige de quién es la oferta.", "La misma oferta aparece en la ficha del interesado."] },
  ] },
  { id: "contactos", title: "Contactos", intro: "Prospectos, interesados y clientes en una sola lista, cada uno con su siguiente paso.", tasks: [
    { q: "¿Cómo registro que le llamé a alguien?", steps: ["Abre su ficha y pulsa «Registrar contacto».", "Elige Llamé, No contestó, Mandé WhatsApp o Visitó.", "Revisa el siguiente paso que te propone y guarda."] },
    { q: "No contesta, ¿qué hago?", steps: ["Registra cada intento con «No contestó».", "Al tercero seguido, el panel te propone reintentar en 30 días."] },
    { q: "¿Dónde veo cómo paga un interesado?", steps: ["En su ficha, la tarjeta «Cómo paga y ofertas» muestra la forma de pago, el crédito y sus ofertas.", "Lo anotas o lo cambias en su perfil."] },
  ] },
  { id: "inmuebles", title: "Inmuebles", intro: "El inventario de Fortius: cada inmueble con sus datos, fotos y si está publicado.", tasks: [
    { q: "¿Cómo doy de alta un inmueble?", steps: ["Pulsa «Agregar inmueble» y llena sus datos y fotos.", "Se guarda privado: el director lo publica cuando el contrato está firmado."] },
    { q: "¿Dónde anoto las llaves y la preparación?", steps: ["En «⋯» del inmueble, elige «Llaves y compradores».", "Registra dónde están las llaves, a quién se prestan y qué falta para promoverlo."] },
    { q: "¿Por qué no puedo cambiar un inmueble?", steps: ["Un inmueble lo cambia su asesor o el director.", "Si necesitas un cambio en uno que no es tuyo, pídeselo a su asesor."] },
  ] },
  { id: "agenda", title: "Agenda y tareas", intro: "Tu semana: citas con hora y tareas con fecha.", tasks: [
    { q: "¿Cómo agendo una visita?", steps: ["Pulsa «Agendar» y elige «Visita».", "Liga la visita a la persona y al inmueble: así la ven su ficha y la operación."] },
    { q: "¿Cómo creo una tarea?", steps: ["Pulsa «Nueva tarea», escribe qué hay que hacer y ponle fecha.", "Ligada a una operación, cuenta como su próximo paso."] },
  ] },
  { id: "herramientas", title: "Herramientas", intro: "Calculadoras y documentos para trabajo suelto, sin abrir una operación.", tasks: [
    { q: "¿Cómo uso una herramienta?", steps: ["En «Más», abre la herramienta.", "Guarda el trabajo para volver a él y descárgalo en PDF."] },
  ] },
  { id: "director", title: "Si eres el director", director: true, intro: "Lo que solo marca o decide el director.", tasks: [
    { q: "¿Cómo reviso lo que me deja un asesor?", steps: ["En la operación, los requisitos en «Lo tengo» dicen «falta que lo revise el director».", "Pulsa «Confirmar», revisa el respaldo y escribe qué encontraste."] },
    { q: "¿Cómo autorizo avanzar sin un requisito?", steps: ["En «⋯» del requisito, elige «Autorizar excepción» y escribe el motivo.", "Queda en el historial con la fecha y tu nombre.", "Lo que protege al cliente (titularidad, factibilidad, valor, revisión para cerrar, firma y pago) no admite excepción."] },
    { q: "Un asesor trae inmuebles con contrato firmado, ¿cómo los doy de alta?", steps: ["En «Atender a alguien», pulsa «Inventario heredado».", "Elige el inmueble, escribe el propietario y la fecha del contrato.", "La operación queda en verificación: registra la firma y revisa titularidad, factibilidad, valor y precio antes de publicar."] },
  ] },
];

/** La sección del manual de una pantalla de la guía. */
export const helpHref = (id: string) => `/admin/ayuda#${id}`;
export const hasHelp = (id: string) => HELP_SECTIONS.some(section => section.id === id);
