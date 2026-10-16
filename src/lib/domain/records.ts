// Shared domain contracts: no React state or browser dependencies.
import type { Asesor as AsesorBase } from "@/data/asesores";
import type { Property } from "@/data/propiedades";
import type { LeadProfile } from "@/lib/lead-profile";
export type AdminProperty = Property;

export type Asesor = AsesorBase & {
  perfilPublico?: { publicado: boolean; descripcion: string; foto?: string; telefono?: string; whatsapp?: string; email?: string; instagram?: string; facebook?: string; linkedin?: string };
  telefono?: string;
  whatsapp?: string;
  email?: string;
  activo: boolean;
};

export const LEAD_ESTADOS = [
  "nuevo",
  "contactado",
  "en-evaluacion",
  "activo",
  "cerrado",
  "descartado",
] as const;
export type LeadEstado = (typeof LEAD_ESTADOS)[number];

export const LEAD_ESTADO_LABELS: Record<LeadEstado, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  "en-evaluacion": "En evaluación",
  activo: "Activo",
  cerrado: "Cerrado",
  descartado: "Descartado",
};

export type LeadOrigen =
  | "evaluar"
  | "contacto"
  | "interes-propiedad"
  | "checklist"
  | "documentos"
  | "manual";

export const LEAD_ORIGEN_LABELS: Record<LeadOrigen, string> = {
  evaluar: "Evaluación (Home)",
  contacto: "Contacto",
  "interes-propiedad": "Interés en propiedad",
  checklist: "Checklist de venta",
  documentos: "Descarga de documentos",
  manual: "Captura manual",
};

type LeadNota = { id: string; texto: string; fecha: string };

export type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  origen: LeadOrigen;
  estado: LeadEstado;
  propiedadSlug?: string;
  zona?: string;
  tipoPropiedad?: string;
  mensaje?: string;
  perfil?: LeadProfile;
  asesorId?: string;
  creadoEl: string; // ISO
  notas: LeadNota[];
  clienteId?: string;
  convertidoEl?: string;
  convertidoPor?: string;
  firstContactedAt?: string;
};

export const EVENTO_TIPOS = [
  "visita",
  "llamada",
  "firma",
  "reunion",
  "otro",
] as const;
export type EventoTipo = (typeof EVENTO_TIPOS)[number];

export const EVENTO_TIPO_LABELS: Record<EventoTipo, string> = {
  visita: "Visita",
  llamada: "Llamada",
  firma: "Firma",
  reunion: "Reunión",
  otro: "Otro",
};

export type Evento = {
  id: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  tipo: EventoTipo;
  leadId?: string;
  clienteId?: string;
  propiedadSlug?: string;
  expedienteId?: string;
  asesorId?: string;
  notas?: string;
};

export type Nota = {
  id: string;
  titulo: string;
  texto: string;
  actualizadoEl: string;
};

export type Post = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string; // párrafos separados por línea en blanco
  estado: "borrador" | "publicado";
  actualizadoEl: string;
  publicadoEl?: string;
  categoria?: import("@/lib/blog-editorial").BlogCategory;
  formato?: import("@/lib/blog-editorial").BlogFormat;
  destacado?: boolean;
  autor?: string;
  ambito?: string;
  fuenteNombre?: string;
  fuenteUrl?: string;
};

export type ArchivoTipo = "imagen" | "pdf" | "video" | "otro";

export type Archivo = {
  id: string;
  nombre: string;
  url: string;
  tipo: ArchivoTipo;
  notas?: string;
  bucket?: "fortius-inmuebles-private" | "fortius-inmuebles-public";
  path?: string;
  visibility?: "private" | "public";
};

export type SiteContent = {
  homeTexts?: import("@/data/home-copy").HomeTexts;
  heroTitulo: string;
  heroSubtitulo: string;
  manifiestoTitulo: string;
  manifiestoTexto: string;
  seoTitle: string;
  seoDescription: string;
};

export type SiteSettings = {
  nombreComercial: string;
  telefono: string;
  whatsapp: string;
  email: string;
  horario: string;
  facebook: string;
  instagram: string;
  videoInstitucionalUrl: string;
};
