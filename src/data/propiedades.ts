/*
  CONTRATO DEL INVENTARIO — tipos, etiquetas y formateo.

  El sitio público lee `src/lib/inventario.ts`, que consulta exclusivamente la
  proyección pública del backend independiente de MNT. Este archivo conserva
  tipos, etiquetas, formateo y ejemplos históricos para pruebas; ni la web ni
  el panel utilizan este array como fuente operativa.
*/

import { TIPO_INMUEBLE_LABELS, type TipoInmueble } from "@/lib/inmueble-tipos";

export type Operacion = "venta" | "renta";

/** Los siete tipos de la lista única (src/lib/inmueble-tipos.ts). */
export type TipoPropiedad = TipoInmueble;

type EstadoPropiedad = "evaluacion" | "disponible" | "apartada" | "vendida" | "rentada";

export const ESTADOS_POR_OPERACION: Record<Operacion, readonly EstadoPropiedad[]> = {
  venta: ["evaluacion", "disponible", "apartada", "vendida"],
  renta: ["evaluacion", "disponible", "apartada", "rentada"],
};

export function estadoValido(operacion: Operacion, estado: EstadoPropiedad): boolean {
  return ESTADOS_POR_OPERACION[operacion].includes(estado);
}

/*
  Precio como unión discriminada: evita strings libres ("Consultar") y
  permite filtrar/ordenar con números reales cuando crezca el inventario.
*/
type PrecioPropiedad =
  | { modalidad: "publico"; monto: number; moneda: "MXN" | "USD"; periodo?: "mensual" }
  | { modalidad: "consulta" };

type FichaTecnica = {
  terrenoM2?: number;
  construccionM2?: number;
  recamaras?: number;
  banos?: number;
  estacionamientos?: number;
  antiguedad?: string;
};

export type FuenteSuperficie = "escritura" | "catastro" | "plano" | "medicion" | "declaracion";
export const FUENTE_SUPERFICIE_LABELS: Record<FuenteSuperficie, string> = {
  escritura: "Escritura",
  catastro: "Catastro",
  plano: "Plano",
  medicion: "Medición orientativa",
  declaracion: "Declaración del propietario",
};

type InformacionPublica = {
  fuenteTerreno?: FuenteSuperficie;
  fuenteConstruccion?: FuenteSuperficie;
  disponibilidadRevisadaEl?: string; // YYYY-MM-DD; no sustituye confirmar antes de una visita
  ocupacionEntrega?: string; // solo condiciones autorizadas para publicación
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

export const CATEGORIAS_PUNTO = ["playa", "escuelas", "comercio", "salud", "restaurantes", "transporte", "parques", "otros"] as const;
export type CategoriaPunto = (typeof CATEGORIAS_PUNTO)[number];
export const CATEGORIA_PUNTO_LABELS: Record<CategoriaPunto, string> = {
  playa: "Playa", escuelas: "Escuelas", comercio: "Comercio", salud: "Salud",
  restaurantes: "Restaurantes", transporte: "Transporte", parques: "Parques", otros: "Otros",
};
export type PuntoDeInteres = { lugar: string; minutos: number; categoria?: CategoriaPunto };

export const GRUPOS_CARACTERISTICAS = ["interior", "exterior", "servicios", "seguridad", "otros"] as const;
export type GrupoCaracteristica = (typeof GRUPOS_CARACTERISTICAS)[number];
export const GRUPO_CARACTERISTICA_LABELS: Record<GrupoCaracteristica, string> = {
  interior: "Interior", exterior: "Exterior", servicios: "Servicios y estacionamiento", seguridad: "Seguridad y acceso", otros: "Otros",
};
export type GrupoCaracteristicas = { grupo: GrupoCaracteristica; elementos: string[] };
export type BeneficioPropiedad = { titulo: string; texto: string };
/* Montos recurrentes que el propietario autoriza publicar, en la moneda del precio. */
export type CostosPropiedad = { predialAnual?: number; mantenimientoMensual?: number };

export type Property = {
  slug: string;
  codigo: string; // "FORTIUS-001", se muestra en mono
  titulo: string;
  tipo: TipoPropiedad;
  /**
    Plaza o conjunto al que pertenece este local u oficina (slug de la plaza). Decisión del titular
    (27/10/2026): una plaza completa se comercializa como un inmueble; un local suelto es su propio
    inmueble y operación, ligado a su plaza, que lo muestra entre sus locales.
  */
  conjunto?: string;
  operacion: Operacion;
  precio: PrecioPropiedad;
  zona: string;
  direccionAproximada: string; // referencia, nunca dirección exacta
  descripcion: string[]; // párrafos
  ficha: FichaTecnica;
  informacionPublica?: InformacionPublica;
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
  puntosDeInteres: PuntoDeInteres[];
  /* Ficha «Escenario»: secciones opcionales; si faltan, no se muestran. */
  beneficios?: BeneficioPropiedad[];
  caracteristicas?: GrupoCaracteristicas[]; // si falta, se usan las amenidades
  costos?: CostosPropiedad;
  destacada: boolean;
  estado: EstadoPropiedad;
  publicadaEl: string; // ISO
  demo: boolean; // marca explícita de dato de ejemplo
  publicada?: boolean; // solo se publica por decisión explícita
};

export const TIPO_LABELS: Record<TipoPropiedad, string> = TIPO_INMUEBLE_LABELS;

export const OPERACION_LABELS: Record<Operacion, string> = {
  venta: "Venta",
  renta: "Renta",
};

export const ESTADO_LABELS: Record<EstadoPropiedad, string> = {
  evaluacion: "En evaluación · privado",
  disponible: "Disponible",
  apartada: "Apartada",
  vendida: "Vendida",
  rentada: "Rentada",
};

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
