/*
  Zonas de operación: contenido editorial para el hub /zonas y las páginas
  SEO locales /zonas/[zona]. Guardrail: descripciones cualitativas de
  conocimiento público; nada de cifras de plusvalía, precios promedio ni
  estadísticas sin fuente. El campo `nombre` debe coincidir con el campo
  `zona` de src/data/propiedades.ts para cruzar inventario.
*/

export type Municipio = "Tijuana" | "Playas de Rosarito" | "Tecate" | "Ensenada";

export type Zona = {
  slug: string;
  nombre: string;
  municipio: Municipio;
  /** Una línea para la card del hub. */
  resumen: string;
  /** Dos párrafos editoriales para la página de detalle. */
  descripcion: string[];
  /** Qué tipo de operación se mueve en la zona. */
  perfil: string[];
  faq: { q: string; a: string }[];
  /** Query para el embed de Google Maps. */
  mapQuery: string;
};

export const zonas: Zona[] = [
  {
    slug: "zona-rio",
    nombre: "Zona Río",
    municipio: "Tijuana",
    resumen: "El corredor financiero y corporativo de la ciudad, a minutos de la garita.",
    descripcion: [
      "Zona Río concentra torres corporativas, consulados, hospitales, centros comerciales y una oferta creciente de vivienda vertical. Su ubicación entre el centro y la línea fronteriza la vuelve base natural para quien vive con dinámica binacional.",
      "En esta zona lo que más pesa al comprar o rentar es la torre y el piso: amenidades, administración y estacionamiento marcan diferencias grandes entre edificios que parecen similares desde afuera.",
    ],
    perfil: ["Departamentos en torre", "Oficinas y consultorios", "Locales comerciales"],
    faq: [
      {
        q: "¿Es buena zona para rentar un departamento?",
        a: "Es de las zonas con más demanda de renta en Tijuana por su cercanía a la garita, hospitales y oficinas. La respuesta correcta depende de la torre y del contrato: revisamos administración, reglamento y condiciones antes de recomendar.",
      },
      {
        q: "¿Qué revisan antes de publicar una propiedad en Zona Río?",
        a: "Además del expediente legal, el régimen de condominio, cuotas de mantenimiento y estado de la administración. En vivienda vertical, esos documentos definen la operación.",
      },
    ],
    mapQuery: "Zona Rio, Tijuana, Baja California, México",
  },
  {
    slug: "otay",
    nombre: "Otay",
    municipio: "Tijuana",
    resumen: "Corredor industrial y universitario junto al cruce fronterizo de carga.",
    descripcion: [
      "Otay combina parques industriales consolidados, el aeropuerto, universidades y colonias habitacionales en crecimiento. El cruce fronterizo de carga y el puente CBX la vuelven estratégica para manufactura y logística.",
      "En lo industrial, el detalle técnico manda: uso de suelo, altura libre, capacidad eléctrica y accesos para tráiler cambian el valor de una nave más que los metros cuadrados.",
    ],
    perfil: ["Naves industriales", "Terrenos de uso mixto", "Vivienda para trabajadores y estudiantes"],
    faq: [
      {
        q: "¿Qué documentos pesan más en una operación industrial en Otay?",
        a: "Uso de suelo verificado, situación del régimen de propiedad, capacidad eléctrica instalada y cualquier gravamen. Nuestra revisión documental confirma esos puntos antes de negociar.",
      },
      {
        q: "¿Atienden también vivienda en Otay?",
        a: "Sí. La demanda habitacional de la zona crece con la universidad y la industria; aplicamos el mismo método de precio con comparables y expediente revisado.",
      },
    ],
    mapQuery: "Otay, Tijuana, Baja California, México",
  },
  {
    slug: "playas-de-tijuana",
    nombre: "Playas de Tijuana",
    municipio: "Tijuana",
    resumen: "Vivienda frente al mar y vida de barrio junto al malecón.",
    descripcion: [
      "Playas de Tijuana es la zona residencial costera de la ciudad: malecón, escuelas, comercio de barrio y acceso directo a la carretera escénica hacia Rosarito y Ensenada. Atrae tanto a familias locales como a compradores binacionales.",
      "La cercanía al mar exige revisar lo que otros pasan por alto: estado de la construcción frente al salitre, escrituración en fraccionamientos antiguos y, en algunos casos, régimen de zona federal.",
    ],
    perfil: ["Casas residenciales", "Departamentos con vista", "Terrenos en secciones consolidadas"],
    faq: [
      {
        q: "¿Qué hay que revisar al comprar cerca del mar?",
        a: "Además del expediente normal: condición estructural por la brisa marina, delimitación respecto a zona federal marítima cuando aplica y servicios. Todo entra en nuestro análisis de factibilidad.",
      },
      {
        q: "¿Puedo vender mi casa de Playas si vivo en Estados Unidos?",
        a: "Sí. Gran parte de nuestro proceso está diseñado para propietarios a distancia: seguimiento por escrito, ofertas documentadas y coordinación de firma con notario.",
      },
    ],
    mapQuery: "Playas de Tijuana, Baja California, México",
  },
  {
    slug: "la-mesa",
    nombre: "La Mesa",
    municipio: "Tijuana",
    resumen: "El centro geográfico de Tijuana: comercio, servicios y vivienda consolidada.",
    descripcion: [
      "La Mesa es una de las zonas más consolidadas de la ciudad: vivienda de distintas décadas, comercio sobre bulevares principales y conexión rápida hacia el resto de Tijuana.",
      "Aquí conviven casas con décadas de historia y desarrollos recientes, así que el rango de precios es amplio. El comparable correcto es el de la calle y la condición del inmueble, no el promedio de la zona.",
    ],
    perfil: ["Casas familiares", "Locales sobre bulevar", "Inversión en remodelación"],
    faq: [
      {
        q: "¿Cómo definen precio en una zona tan variada?",
        a: "Con comparables vendidos del micro-sector y ajustes por condición, superficie y estacionamiento. En zonas heterogéneas el análisis por calle evita salir caro o regalar la propiedad.",
      },
      {
        q: "¿Vale la pena remodelar antes de vender?",
        a: "Depende del retorno esperado por mejora. En la evaluación te decimos qué reparaciones sí mueven el precio y cuáles no se recuperan en la venta.",
      },
    ],
    mapQuery: "La Mesa, Tijuana, Baja California, México",
  },
  {
    slug: "santa-fe",
    nombre: "Santa Fe",
    municipio: "Tijuana",
    resumen: "Fraccionamientos en crecimiento al sur-poniente, con fuerte demanda de primera vivienda.",
    descripcion: [
      "Santa Fe y sus alrededores concentran buena parte de la vivienda nueva y seminueva de Tijuana: fraccionamientos con casas en serie, comercio en expansión y demanda constante de familias jóvenes.",
      "Al haber muchas casas similares, la diferencia se hace con preparación: una propiedad con expediente listo, buena presentación y precio con comparables se distingue de decenas de anuncios iguales.",
    ],
    perfil: ["Casas en fraccionamiento", "Primera vivienda con crédito", "Renta familiar"],
    faq: [
      {
        q: "Mi casa es igual a muchas de la zona, ¿cómo compito?",
        a: "Precio defendible, fotografía profesional, ficha completa y expediente sin pendientes. Cuando hay mucha oferta similar, la preparación es la ventaja.",
      },
      {
        q: "¿Aceptan operaciones con crédito Infonavit o bancario?",
        a: "Sí. Buena parte de las operaciones en la zona se cierran con crédito; coordinamos el proceso con la institución y el notario e incluimos los tiempos en el plan.",
      },
    ],
    mapQuery: "Santa Fe, Tijuana, Baja California, México",
  },
  {
    slug: "el-florido",
    nombre: "El Florido",
    municipio: "Tijuana",
    resumen: "El oriente que crece: vivienda económica, industria y proyectos nuevos.",
    descripcion: [
      "El corredor de El Florido, en el oriente de Tijuana, combina fraccionamientos de vivienda económica y media con parques industriales activos y reserva territorial en desarrollo.",
      "Es una zona donde el orden documental pesa doble: hay propiedad en distintos regímenes y etapas de regularización, y confirmar la situación legal temprano evita cierres caídos.",
    ],
    perfil: ["Vivienda económica y media", "Naves y terrenos industriales", "Reserva territorial"],
    faq: [
      {
        q: "¿Qué riesgo documental es común en el oriente de la ciudad?",
        a: "Propiedades sin escrituración terminada o con trámites de regularización pendientes. El análisis de factibilidad lo detecta antes de publicar, con la ruta para subsanarlo.",
      },
      {
        q: "¿Trabajan terrenos en esta zona?",
        a: "Sí, con revisión de uso de suelo, medidas contra escritura y situación de servicios antes de definir precio de salida.",
      },
    ],
    mapQuery: "El Florido, Tijuana, Baja California, México",
  },
  {
    slug: "chapultepec",
    nombre: "Chapultepec",
    municipio: "Tijuana",
    resumen: "Una de las colonias residenciales más establecidas de la ciudad.",
    descripcion: [
      "Chapultepec y sus secciones son referencia de vivienda residencial consolidada en Tijuana: lotes amplios, arquitectura de autor y cercanía al corredor Agua Caliente.",
      "En este segmento el comprador espera discreción y datos: operaciones bien documentadas, visitas filtradas y negociación con criterio, no anuncios masivos.",
    ],
    perfil: ["Residencias amplias", "Remodelaciones de alto valor", "Compradores patrimoniales"],
    faq: [
      {
        q: "¿Cómo manejan la discreción en propiedades de alto valor?",
        a: "Promoción dirigida en lugar de difusión masiva, filtro de prospectos con verificación previa y visitas coordinadas. La estrategia se define contigo en el plan de comercialización.",
      },
      {
        q: "¿Cómo se fija el precio cuando hay pocos comparables?",
        a: "Se amplía el análisis a segmentos equivalentes y se ajusta por lote, construcción y estado. Documentamos el razonamiento para defender el precio en la negociación.",
      },
    ],
    mapQuery: "Colonia Chapultepec, Tijuana, Baja California, México",
  },
  {
    slug: "cacho",
    nombre: "Cacho",
    municipio: "Tijuana",
    resumen: "Barrio central con carácter propio, entre lo residencial y lo gastronómico.",
    descripcion: [
      "La colonia Cacho mezcla casas tradicionales, edificios de departamentos y una escena comercial y gastronómica que la mantiene en demanda constante, a minutos de Zona Río y el centro.",
      "Su inventario es variado y con historia, así que valuar bien implica revisar condición real, remodelaciones y el potencial de cada inmueble, no solo su superficie.",
    ],
    perfil: ["Casas con carácter", "Departamentos céntricos", "Locales de barrio"],
    faq: [
      {
        q: "¿Una casa antigua se puede vender bien?",
        a: "Sí, si el expediente está limpio y el precio refleja la condición real. Parte de nuestra evaluación es decirte qué conviene reparar y qué valorará el comprador tal como está.",
      },
      {
        q: "¿Es zona para invertir en renta?",
        a: "La demanda de renta es constante por ubicación y servicios. Evaluamos cada caso con números concretos de la propiedad, no con promedios generales.",
      },
    ],
    mapQuery: "Colonia Cacho, Tijuana, Baja California, México",
  },
  {
    slug: "rosarito",
    nombre: "Rosarito",
    municipio: "Playas de Rosarito",
    resumen: "Costa turística y residencial, con fuerte mercado binacional.",
    descripcion: [
      "Playas de Rosarito vive del mar: condominios frente a la playa, casas de descanso y una demanda importante de compradores extranjeros y de fin de semana.",
      "Las operaciones con extranjeros suelen involucrar fideicomiso en zona restringida, y los condominios exigen revisar régimen y administración. Son pasos normales cuando se preparan a tiempo.",
    ],
    perfil: ["Condominios frente al mar", "Casas de descanso", "Terrenos con vista"],
    faq: [
      {
        q: "¿Cómo compra un extranjero en Rosarito?",
        a: "Normalmente mediante fideicomiso bancario en zona restringida. Los costos y tiempos se estiman por adelantado y se confirman con el notario y el banco correspondientes.",
      },
      {
        q: "¿Qué revisan en un condominio frente al mar?",
        a: "Régimen de condominio, cuotas, estado de la administración y condición del edificio frente al ambiente marino, además del expediente de la unidad.",
      },
    ],
    mapQuery: "Playas de Rosarito, Baja California, México",
  },
  {
    slug: "tecate",
    nombre: "Tecate",
    municipio: "Tecate",
    resumen: "Pueblo Mágico fronterizo: ranchos, vivienda y proyectos campestres.",
    descripcion: [
      "Tecate ofrece un mercado distinto al de la zona metropolitana: terrenos amplios, ranchos, vivienda de pueblo y desarrollos campestres, con su propio cruce fronterizo.",
      "En propiedad rústica y campestre, la certeza documental es el punto de partida: medidas reales, régimen de propiedad y acceso legal al predio se confirman antes de hablar de precio.",
    ],
    perfil: ["Terrenos y ranchos", "Vivienda de pueblo", "Proyectos campestres"],
    faq: [
      {
        q: "¿Qué es lo primero que revisan en un rancho o terreno?",
        a: "Que las medidas y colindancias de la escritura correspondan al terreno físico, el régimen (privado o ejidal) y el acceso legal. Sin eso resuelto, no se publica.",
      },
      {
        q: "¿Atienden propiedad ejidal?",
        a: "La revisamos caso por caso. Si hay ruta legal viable te la explicamos con sus tiempos reales; si no la hay, también te lo decimos con claridad.",
      },
    ],
    mapQuery: "Tecate, Baja California, México",
  },
  {
    slug: "ensenada",
    nombre: "Ensenada",
    municipio: "Ensenada",
    resumen: "Puerto, valle vinícola y costa: el mercado más diverso del estado.",
    descripcion: [
      "Ensenada reúne puerto comercial, zona urbana consolidada, la costa hacia La Bufadora y el Valle de Guadalupe, con proyectos turísticos y enológicos que atraen inversión constante.",
      "Esa diversidad exige criterio por segmento: no se valúa igual una casa en el centro, un terreno con vocación turística o una propiedad en el valle. Cada operación lleva su propio análisis.",
    ],
    perfil: ["Vivienda urbana y costera", "Terrenos turísticos", "Proyectos en el valle"],
    faq: [
      {
        q: "¿Trabajan propiedades en el Valle de Guadalupe?",
        a: "Sí, con revisión reforzada de uso de suelo, agua y régimen de propiedad, que son los puntos que definen la viabilidad de un proyecto en el valle.",
      },
      {
        q: "¿Pueden atender mi operación si no vivo en Ensenada?",
        a: "Sí. El seguimiento por escrito y los reportes cada 30 días están pensados para propietarios a distancia; la firma se coordina con notario local.",
      },
    ],
    mapQuery: "Ensenada, Baja California, México",
  },
];

export function getZonaBySlug(slug: string): Zona | undefined {
  return zonas.find((z) => z.slug === slug);
}
