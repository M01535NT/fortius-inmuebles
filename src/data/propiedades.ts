/*
  CONTRATO DEL INVENTARIO — tipos, etiquetas y formateo.

  El sitio público lee `src/lib/inventario.ts`, que consulta exclusivamente la
  proyección pública del backend independiente de COTA. Este archivo conserva
  tipos, etiquetas, formateo y ejemplos históricos para pruebas; ni la web ni
  el panel utilizan este array como fuente operativa.
*/

export type Operacion = "venta" | "renta";

export type TipoPropiedad =
  | "casa"
  | "departamento"
  | "terreno"
  | "local"
  | "oficina"
  | "nave-industrial";

export type EstadoPropiedad = "disponible" | "apartada" | "vendida";

/*
  Precio como unión discriminada: evita strings libres ("Consultar") y
  permite filtrar/ordenar con números reales cuando crezca el inventario.
*/
export type PrecioPropiedad =
  | { modalidad: "publico"; monto: number; moneda: "MXN" | "USD"; periodo?: "mensual" }
  | { modalidad: "consulta" };

export type FichaTecnica = {
  terrenoM2?: number;
  construccionM2?: number;
  recamaras?: number;
  banos?: number;
  estacionamientos?: number;
  antiguedad?: string;
};

export type ImagenPropiedad = { src: string; alt: string };

/*
  Documentos descargables por propiedad (PDFs): se entregan a cambio de los
  datos del interesado. Se administran desde el panel (sección Inmuebles).
*/
export type DocumentoPropiedad = {
  codigo: string; // "FIC-PRO-001", se muestra en mono
  nombre: string;
  descripcion: string;
  url: string; // PDF en /descargas o storage cuando exista backend
};

export type Property = {
  slug: string;
  codigo: string; // "COTA-001", se muestra en mono
  titulo: string;
  tipo: TipoPropiedad;
  operacion: Operacion;
  precio: PrecioPropiedad;
  zona: string;
  direccionAproximada: string; // referencia, nunca dirección exacta
  descripcion: string[]; // párrafos
  ficha: FichaTecnica;
  amenidades: string[];
  galeria: ImagenPropiedad[];
  /* Placeholders multimedia: cuando el cliente cargue los archivos reales,
     estas URLs activan el reproductor; mientras, la galería muestra el
     espacio reservado. */
  videoUrl?: string;
  tour360Url?: string;
  /* PDFs descargables (ficha, plano, brochure); captura de datos previa. */
  documentos?: DocumentoPropiedad[];
  asesorId: string; // ver src/data/asesores.ts
  creditoDisponible: boolean; // habilita la calculadora de hipoteca (solo venta)
  /* Puntos de interés cercanos (placeholder demo; tiempos aproximados en auto). */
  puntosDeInteres: { lugar: string; minutos: number }[];
  destacada: boolean;
  estado: EstadoPropiedad;
  publicadaEl: string; // ISO
  demo: boolean; // marca explícita de dato de ejemplo
  publicada?: boolean; // solo se publica por decisión explícita
};

export const TIPO_LABELS: Record<TipoPropiedad, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
  "nave-industrial": "Nave industrial",
};

export const OPERACION_LABELS: Record<Operacion, string> = {
  venta: "Venta",
  renta: "Renta",
};

export const ESTADO_LABELS: Record<EstadoPropiedad, string> = {
  disponible: "Disponible",
  apartada: "Apartada",
  vendida: "Vendida",
};

export const propiedades: Property[] = [
  {
    slug: "residencia-vista-al-mar-playas",
    codigo: "COTA-001",
    titulo: "Residencia con vista al mar",
    tipo: "casa",
    operacion: "venta",
    precio: { modalidad: "publico", monto: 12850000, moneda: "MXN" },
    zona: "Playas de Tijuana",
    direccionAproximada: "Sección Costa, a dos calles del malecón",
    descripcion: [
      "Residencia contemporánea en dos niveles con orientación poniente y vista despejada al mar. Espacios abiertos, dobles alturas y cancelería de piso a techo en las áreas sociales.",
      "La cocina integra barra central y despensa; la recámara principal cuenta con vestidor y terraza privada. Cochera techada para dos autos y patio de servicio independiente.",
      "Expediente revisado: escritura, predial y servicios al corriente. Lista para promoverse con el proceso completo de la firma.",
    ],
    ficha: {
      terrenoM2: 320,
      construccionM2: 385,
      recamaras: 4,
      banos: 4.5,
      estacionamientos: 2,
      antiguedad: "6 años",
    },
    amenidades: [
      "Vista al mar",
      "Terraza en recámara principal",
      "Doble altura en sala",
      "Cocina con barra central",
      "Cochera techada",
      "Patio de servicio",
    ],
    galeria: [
      { src: "/hero/casa-playa.webp", alt: "Fachada de residencia frente al mar al atardecer" },
      { src: "/hero/interior-depa.webp", alt: "Área social con acabados claros y cancelería amplia" },
      { src: "/hero/edificio-ciudad.webp", alt: "Vista del entorno urbano cercano a la propiedad" },
    ],
    documentos: [
      {
        codigo: "FIC-PRO-001",
        nombre: "Ficha técnica en PDF",
        descripcion: "Superficies, distribución y amenidades en un documento imprimible.",
        url: "/descargas/ficha-tecnica-demo.pdf",
      },
      {
        codigo: "CHK-VEN-001",
        nombre: "Checklist de compra segura",
        descripcion: "Los puntos documentales que revisamos antes de cualquier operación.",
        url: "/descargas/checklist-venta-cota.pdf",
      },
    ],
    asesorId: "asesor-01",
    creditoDisponible: true,
    puntosDeInteres: [
      { lugar: "Malecón de Playas", minutos: 5 },
      { lugar: "Plaza Coronado", minutos: 7 },
      { lugar: "Garita San Ysidro", minutos: 25 },
    ],
    destacada: true,
    estado: "disponible",
    publicadaEl: "2026-06-18",
    demo: true,
  },
  {
    slug: "departamento-zona-rio-renta",
    codigo: "COTA-002",
    titulo: "Departamento amueblado en Zona Río",
    tipo: "departamento",
    operacion: "renta",
    precio: { modalidad: "publico", monto: 24500, moneda: "MXN", periodo: "mensual" },
    zona: "Zona Río",
    direccionAproximada: "Torre sobre Paseo de los Héroes, piso alto",
    descripcion: [
      "Departamento de dos recámaras en piso alto, amueblado y equipado, con vista abierta a la ciudad. Ideal para estancias corporativas o residentes con dinámica binacional.",
      "El edificio cuenta con acceso controlado, gimnasio y estacionamiento techado. La renta incluye mantenimiento; servicios por cuenta del inquilino.",
    ],
    ficha: {
      construccionM2: 96,
      recamaras: 2,
      banos: 2,
      estacionamientos: 1,
      antiguedad: "3 años",
    },
    amenidades: [
      "Amueblado y equipado",
      "Acceso controlado",
      "Gimnasio en el edificio",
      "Estacionamiento techado",
      "Vista a la ciudad",
    ],
    galeria: [
      { src: "/hero/interior-depa.webp", alt: "Interior del departamento con sala y comedor amueblados" },
      { src: "/hero/edificio-ciudad.webp", alt: "Edificio residencial en zona urbana" },
    ],
    asesorId: "asesor-01",
    creditoDisponible: false, // renta: no aplica hipoteca
    puntosDeInteres: [
      { lugar: "Plaza Río", minutos: 5 },
      { lugar: "CECUT", minutos: 6 },
      { lugar: "Garita San Ysidro", minutos: 15 },
    ],
    destacada: true,
    estado: "apartada",
    publicadaEl: "2026-06-27",
    demo: true,
  },
  {
    slug: "nave-industrial-otay",
    codigo: "COTA-003",
    titulo: "Nave industrial con andén en Otay",
    tipo: "nave-industrial",
    operacion: "venta",
    precio: { modalidad: "consulta" },
    zona: "Otay",
    direccionAproximada: "Parque industrial consolidado, cerca del cruce fronterizo",
    descripcion: [
      "Nave industrial con altura libre de 9 metros, andén de carga y patio de maniobras. Ubicación estratégica para operaciones de manufactura o logística transfronteriza.",
      "Cuenta con área de oficinas en mezzanine, subestación propia y acceso para tráiler. Uso de suelo industrial verificado.",
      "El valor se comparte a solicitud, con el cálculo de gastos y la revisión documental que forman parte del proceso de la firma.",
    ],
    ficha: {
      terrenoM2: 4200,
      construccionM2: 3100,
      estacionamientos: 18,
      antiguedad: "12 años",
    },
    amenidades: [
      "Altura libre de 9 m",
      "Andén de carga",
      "Patio de maniobras",
      "Oficinas en mezzanine",
      "Subestación eléctrica",
      "Uso de suelo industrial",
    ],
    galeria: [
      { src: "/hero/nave-tijuana.webp", alt: "Nave industrial con andén de carga" },
      { src: "/hero/plaza.webp", alt: "Entorno comercial e industrial de la zona" },
    ],
    documentos: [
      {
        codigo: "FIC-PRO-001",
        nombre: "Ficha técnica en PDF",
        descripcion: "Alturas, superficies, capacidad eléctrica y accesos en un documento imprimible.",
        url: "/descargas/ficha-tecnica-demo.pdf",
      },
    ],
    asesorId: "asesor-02",
    creditoDisponible: false, // precio a consulta: sin base para calcular
    puntosDeInteres: [
      { lugar: "Garita de Otay", minutos: 10 },
      { lugar: "Aeropuerto de Tijuana", minutos: 12 },
      { lugar: "UABC Campus Otay", minutos: 8 },
    ],
    destacada: true,
    estado: "disponible",
    publicadaEl: "2026-07-02",
    demo: true,
  },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return propiedades.find((p) => p.slug === slug);
}

export function getFeaturedProperties(): Property[] {
  return propiedades.filter((p) => p.destacada);
}

/*
  Relacionadas: misma zona o mismo tipo, excluyendo la actual y las vendidas;
  si faltan, rellena con el resto del inventario disponible.
*/
export function getRelatedProperties(slug: string, limit = 3): Property[] {
  const current = getPropertyBySlug(slug);
  if (!current) return [];
  const pool = propiedades.filter((p) => p.slug !== slug && p.estado !== "vendida");
  const related = pool.filter((p) => p.zona === current.zona || p.tipo === current.tipo);
  const fill = pool.filter((p) => !related.includes(p));
  return [...related, ...fill].slice(0, limit);
}

/*
  Formateo manual de miles a propósito: Intl con currency puede diferir entre
  el ICU de Node (prerender) y el navegador ("$" vs "MX$") y causar errores
  de hidratación. "en-US" produce separadores de miles estables.
*/
export function formatPrecio(precio: PrecioPropiedad): string {
  if (precio.modalidad === "consulta") return "Valor a consulta";
  const monto = precio.monto.toLocaleString("en-US");
  const sufijo = precio.periodo === "mensual" ? " /mes" : "";
  return `$${monto} ${precio.moneda}${sufijo}`;
}
