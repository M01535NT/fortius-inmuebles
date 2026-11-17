/*
  Nombres de los datos que cambiaron, en palabras del asesor (RP-104: nada de nombres internos en
  pantalla). El historial guarda las llaves del registro tal cual; aquí se traducen. Las marcas que
  cambian solas en cada guardado (fecha de actualización, bitácora interna) no se listan. Una llave
  sin nombre conocido se agrupa como «Otros datos» en vez de mostrarse cruda.
*/
const COMUNES: Record<string, string> = {
  titulo: "Título",
  nombre: "Nombre",
  telefono: "Teléfono",
  whatsapp: "WhatsApp",
  email: "Correo",
  estado: "Estado",
  tipo: "Tipo",
  notas: "Notas",
  descripcion: "Descripción",
  mensaje: "Mensaje",
  zona: "Zona",
  tipoPropiedad: "Tipo de inmueble",
  perfil: "Perfil de búsqueda",
  asesorId: "Asesor",
  clienteId: "Cliente",
  leadId: "Prospecto",
  propiedadSlug: "Inmueble",
  expedienteId: "Asunto",
  tramiteId: "Trámite",
  creadoEl: "Fecha de alta",
  convertidoEl: "Fecha en que pasó a cliente",
  convertidoPor: "Quién lo pasó a cliente",
  fecha: "Fecha",
  hora: "Hora",
  autor: "Autor",
};

const POR_SECCION: Record<string, Record<string, string>> = {
  propiedades: {
    codigo: "Código", conjunto: "Plaza o conjunto", operacion: "Operación", precio: "Precio",
    direccionAproximada: "Dirección aproximada", ficha: "Ficha técnica", informacionPublica: "Información pública",
    amenidades: "Amenidades", galeria: "Fotos", videoUrl: "Video", tour360Url: "Recorrido 360", documentos: "Documentos",
    creditoDisponible: "Acepta crédito", puntosDeInteres: "Lugares cercanos", beneficios: "Beneficios",
    caracteristicas: "Características", costos: "Costos", destacada: "Destacada", publicadaEl: "Fecha de publicación",
    demo: "Marca de ejemplo", publicada: "Publicada en el sitio", colaboracion: "En colaboración", llaves: "Llaves",
    preparacion: "Preparación", avisosCompradores: "Avisos a compradores", origen: "Origen", aliado: "Inmobiliaria aliada",
    tipo: "Tipo de inmueble", estado: "Estado del inmueble",
  },
  leads: {
    origen: "Formulario de origen", canal: "Canal", firstContactedAt: "Primera atención", reabiertoEl: "Fecha en que regresó",
    ofertas: "Ofertas", estado: "Estado del prospecto",
  },
  clientes: {
    tipo: "Tipo de cliente", curp: "CURP", rfc: "RFC", estadoCivil: "Estado civil", fechaNacimiento: "Fecha de nacimiento",
    domicilio: "Domicilio", identificacion: "Identificación", leadOriginal: "Datos del prospecto original",
  },
  tareas: {
    categoria: "Categoría", prioridad: "Prioridad", vence: "Vencimiento", pasos: "Pasos", motivoEspera: "Motivo de espera",
    nuevaNota: "Nota", completadoEl: "Fecha en que se terminó", completadoPor: "Quién la terminó", estado: "Estado de la tarea",
  },
  asesores: {
    cargo: "Cargo", iniciales: "Iniciales", perfilPublico: "Ficha pública", activo: "Cuenta activa",
  },
  notas: { texto: "Texto", aviso: "Aviso al equipo", autorId: "Autor" },
  eventos: { tipo: "Tipo de cita", fecha: "Fecha de la cita", hora: "Hora de la cita" },
  posts: {
    slug: "Dirección de la página", resumen: "Resumen", contenido: "Contenido", publicadoEl: "Fecha de publicación",
    categoria: "Categoría", formato: "Formato", destacado: "Destacada", ambito: "Ámbito", fuenteNombre: "Fuente",
    fuenteUrl: "Enlace de la fuente", estado: "Estado de la entrada",
  },
  archivos: { url: "Archivo", tipo: "Tipo de archivo", bucket: "Ubicación", path: "Ubicación", visibility: "Visibilidad", pasoClave: "Paso del trámite" },
  contenido: {
    homeTexts: "Textos del inicio", preguntas: "Preguntas frecuentes", testimonios: "Testimonios", heroTitulo: "Título de la portada",
    heroSubtitulo: "Subtítulo de la portada", manifiestoTitulo: "Título de «Por qué Fortius»", manifiestoTexto: "Texto de «Por qué Fortius»",
    seoTitle: "Título para buscadores", seoDescription: "Descripción para buscadores",
  },
  config: {
    nombreComercial: "Nombre comercial", horario: "Horario", facebook: "Facebook", instagram: "Instagram",
    videoInstitucionalUrl: "Video institucional", horasPrimeraAtencion: "Plazo de primera atención", topeIaMensualUsd: "Tope mensual de lectura de documentos",
    empresa: "Datos de la empresa", mensajes: "Mensajes listos",
  },
};

/** Marcas que cambian solas al guardar; no dicen nada al asesor. */
const OCULTOS = new Set(["actualizadoEl", "historial", "version", "id"]);
const OTROS = "Otros datos";

export function camposCambiados(collection: string, fields: readonly string[]): string[] {
  const propios = POR_SECCION[collection] ?? {};
  const out: string[] = [];
  for (const field of fields) {
    if (OCULTOS.has(field)) continue;
    const label = propios[field] ?? COMUNES[field] ?? OTROS;
    if (!out.includes(label)) out.push(label);
  }
  // «Otros datos» al final, después de lo que sí tiene nombre.
  return out.includes(OTROS) ? [...out.filter(label => label !== OTROS), OTROS] : out;
}
