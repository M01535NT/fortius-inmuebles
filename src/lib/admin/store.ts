"use client";

import * as React from "react";

/*
  Capa de datos del panel de administración.

  DEMO FUNCIONAL sin backend: cada colección vive en localStorage, sembrada
  desde src/data/* la primera vez. Todas las operaciones (alta, edición,
  baja) funcionan de verdad en este navegador. TODO(M3/M4): sustituir este
  módulo por repositorios Supabase (auth, Postgres, storage) manteniendo la
  misma interfaz; las páginas del panel no deberían cambiar.

  Nota de arquitectura: el sitio público se prerenderiza desde src/data/*,
  así que los cambios hechos aquí NO alteran las páginas públicas hasta que
  exista el backend. El panel valida flujo y operación completa.
*/

import { asesores as asesoresSeed, type Asesor as AsesorBase } from "@/data/asesores";
import { propiedades as propiedadesSeed, type Property } from "@/data/propiedades";
import { siteConfig } from "@/data/site";
import { enviarProspecto, type OrigenProspecto } from "@/lib/prospectos";

const PREFIX = "cota-admin:v1:";

/* ---------- tipos ---------- */

export type AdminProperty = Property;

export type Asesor = AsesorBase & {
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

export type LeadNota = { id: string; texto: string; fecha: string };

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
  asesorId?: string;
  creadoEl: string; // ISO
  notas: LeadNota[];
};

export const EVENTO_TIPOS = ["visita", "llamada", "firma", "reunion", "otro"] as const;
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
  propiedadSlug?: string;
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
};

export type ArchivoTipo = "imagen" | "pdf" | "video" | "otro";

export type Archivo = {
  id: string;
  nombre: string;
  url: string;
  tipo: ArchivoTipo;
  notas?: string;
};

export type SiteContent = {
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

/* ---------- storage genérico ---------- */

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage lleno o bloqueado: el panel sigue en memoria */
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/*
  Colección con cache en memoria + suscripción: los componentes leen vía
  useCollection (useSyncExternalStore), así el SSR prerenderiza vacío y el
  cliente hidrata sin mismatch ni setState-en-effect.
*/
export type Collection<T> = {
  list(): T[];
  save(items: T[]): void;
  subscribe(cb: () => void): () => void;
};

const EMPTY: never[] = [];

function collection<T>(key: string, seed: () => T[]): Collection<T> {
  let cache: T[] | null = null;
  const listeners = new Set<() => void>();
  return {
    list(): T[] {
      if (cache) return cache;
      if (typeof window === "undefined") return EMPTY;
      const stored = read<T[]>(key);
      cache = stored ?? seed();
      if (!stored) write(key, cache);
      return cache;
    },
    save(items: T[]) {
      cache = items;
      write(key, items);
      listeners.forEach((l) => l());
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

export function useCollection<T>(col: Collection<T>): T[] {
  return React.useSyncExternalStore(col.subscribe, col.list, () => EMPTY);
}

/* Singleton con el mismo patrón (contenido y configuración). */
export type Singleton<T> = {
  get(): T | null;
  save(value: T): void;
  subscribe(cb: () => void): () => void;
};

function singleton<T>(key: string, seed: () => T): Singleton<T> {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  return {
    get(): T | null {
      if (cache) return cache;
      if (typeof window === "undefined") return null;
      const stored = read<T>(key);
      cache = stored ?? seed();
      if (!stored) write(key, cache);
      return cache;
    },
    save(value: T) {
      cache = value;
      write(key, value);
      listeners.forEach((l) => l());
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

export function useSingleton<T>(store: Singleton<T>): T | null {
  return React.useSyncExternalStore(store.subscribe, store.get, () => null);
}

/* ---------- seeds ---------- */

function hoyMas(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

const seedLeads = (): Lead[] => [
  {
    id: "lead-demo-01",
    nombre: "Laura Cisneros",
    telefono: "664 555 0101",
    origen: "evaluar",
    estado: "en-evaluacion",
    zona: "Playas de Tijuana",
    tipoPropiedad: "Casa",
    asesorId: "asesor-01",
    creadoEl: new Date(Date.now() - 3 * 86400000).toISOString(),
    notas: [
      {
        id: "n1",
        texto: "Quiere vender en 6 meses; pedí escritura y predial para el análisis.",
        fecha: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: "lead-demo-02",
    nombre: "Jorge Ahumada",
    telefono: "664 555 0102",
    origen: "interes-propiedad",
    estado: "contactado",
    propiedadSlug: "nave-industrial-otay",
    mensaje: "Busco nave para operación logística, 2500 m2 mínimo.",
    asesorId: "asesor-02",
    creadoEl: new Date(Date.now() - 1 * 86400000).toISOString(),
    notas: [],
  },
  {
    id: "lead-demo-03",
    nombre: "Sofía Beltrán",
    telefono: "664 555 0103",
    origen: "checklist",
    estado: "nuevo",
    creadoEl: new Date().toISOString(),
    notas: [],
  },
];

const seedEventos = (): Evento[] => [
  {
    id: "evento-demo-01",
    titulo: "Visita a residencia en Playas",
    fecha: hoyMas(1),
    hora: "11:00",
    tipo: "visita",
    leadId: "lead-demo-01",
    propiedadSlug: "residencia-vista-al-mar-playas",
  },
  {
    id: "evento-demo-02",
    titulo: "Llamada de seguimiento nave Otay",
    fecha: hoyMas(2),
    hora: "16:30",
    tipo: "llamada",
    leadId: "lead-demo-02",
  },
];

const seedPosts = (): Post[] => [
  {
    id: "post-demo-01",
    slug: "que-revisar-antes-de-vender",
    titulo: "Qué revisar antes de poner tu casa en venta",
    resumen: "Los cinco pendientes documentales que detienen más ventas en Tijuana, y cómo resolverlos a tiempo.",
    contenido:
      "La mayoría de las ventas que se caen no se caen por precio: se caen por papeles.\n\nAntes de publicar, confirma escritura inscrita, predial al corriente y la situación de todos los propietarios. Ese es el corazón de nuestro análisis de factibilidad.",
    estado: "borrador",
    actualizadoEl: new Date().toISOString(),
  },
];

const seedNotas = (): Nota[] => [
  {
    id: "nota-demo-01",
    titulo: "Pendientes de la semana",
    texto: "Confirmar fotógrafo para la residencia de Playas. Pedir uso de suelo actualizado de la nave de Otay.",
    actualizadoEl: new Date().toISOString(),
  },
];

const seedArchivos = (): Archivo[] => [
  { id: "arch-01", nombre: "Checklist de venta (lead magnet)", url: "/descargas/checklist-venta-cota.pdf", tipo: "pdf" },
  { id: "arch-02", nombre: "Ficha técnica demo", url: "/descargas/ficha-tecnica-demo.pdf", tipo: "pdf" },
  { id: "arch-03", nombre: "Hero: casa frente al mar", url: "/hero/casa-playa.webp", tipo: "imagen" },
  { id: "arch-04", nombre: "Hero: edificio Zona Río", url: "/hero/edificio-ciudad.webp", tipo: "imagen" },
  { id: "arch-05", nombre: "Hero: interior departamento", url: "/hero/interior-depa.webp", tipo: "imagen" },
  { id: "arch-06", nombre: "Hero: plaza comercial", url: "/hero/plaza.webp", tipo: "imagen" },
  { id: "arch-07", nombre: "Nave industrial Tijuana", url: "/hero/nave-tijuana.webp", tipo: "imagen" },
];

const seedContent = (): SiteContent => ({
  heroTitulo: "Vende con plan, no con anuncios.",
  heroSubtitulo:
    "Precio con datos, expediente revisado y seguimiento por escrito. De la captación a la firma ante notario, en Tijuana y Baja California.",
  manifiestoTitulo: "No prometemos resultados. Documentamos el proceso.",
  manifiestoTexto:
    "Cada operación sigue el mismo método por escrito, de la captación a la firma. Por eso siempre sabes en qué paso va la tuya, y qué sigue después.",
  seoTitle: "COTA | Vende tu propiedad en Tijuana con método",
  seoDescription:
    "Firma inmobiliaria en Tijuana y Baja California. Precio con datos, expediente revisado y seguimiento por escrito, de la captación a la firma ante notario.",
});

const seedSettings = (): SiteSettings => ({
  nombreComercial: siteConfig.name,
  telefono: siteConfig.contact.phone,
  whatsapp: siteConfig.contact.whatsapp,
  email: siteConfig.contact.email,
  horario: "Lunes a viernes 9:00–18:00; sábado con cita",
  facebook: "",
  instagram: "",
  videoInstitucionalUrl: "",
});

/* ---------- repositorios ---------- */

export const db = {
  propiedades: collection<AdminProperty>("propiedades", () => propiedadesSeed),
  asesores: collection<Asesor>("asesores", () =>
    asesoresSeed.map((a) => ({ ...a, activo: true })),
  ),
  leads: collection<Lead>("leads", seedLeads),
  eventos: collection<Evento>("eventos", seedEventos),
  posts: collection<Post>("posts", seedPosts),
  notas: collection<Nota>("notas", seedNotas),
  archivos: collection<Archivo>("archivos", seedArchivos),
};

export const contentStore = singleton<SiteContent>("contenido", seedContent);
export const settingsStore = singleton<SiteSettings>("config", seedSettings);

/* ---------- helpers de mutación ---------- */

export function upsert<T extends { id: string }>(col: Collection<T>, item: T): T[] {
  const items = col.list();
  const i = items.findIndex((x) => x.id === item.id);
  const next = i >= 0 ? items.map((x) => (x.id === item.id ? item : x)) : [item, ...items];
  col.save(next);
  return next;
}

export function removeById<T extends { id: string }>(col: Collection<T>, id: string): T[] {
  const next = col.list().filter((x) => x.id !== id);
  col.save(next);
  return next;
}

/* Las propiedades se identifican por slug (no llevan id). */
export function upsertPropiedad(item: AdminProperty): AdminProperty[] {
  const items = db.propiedades.list();
  const exists = items.some((p) => p.slug === item.slug);
  const next = exists ? items.map((p) => (p.slug === item.slug ? item : p)) : [item, ...items];
  db.propiedades.save(next);
  return next;
}

export function removePropiedad(slug: string): AdminProperty[] {
  const next = db.propiedades.list().filter((p) => p.slug !== slug);
  db.propiedades.save(next);
  return next;
}

/* ---------- sesión (placeholder de autenticación) ---------- */

const SESSION_KEY = PREFIX + "sesion";
/* TODO(M4): sustituir por Supabase Auth. Clave visible a propósito: demo. */
export const DEMO_PASSWORD = "cota2026";

export function isLoggedIn(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
export function login(password: string): boolean {
  if (password !== DEMO_PASSWORD) return false;
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
  return true;
}
export function logout() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

/* ---------- captura de leads desde el sitio público ---------- */

/*
  Punto ÚNICO por el que pasan los cinco formularios del sitio.

  Antes solo escribía en el `localStorage` del visitante: el lead se quedaba en
  SU navegador y el negocio nunca lo veía. Ahora se entrega al back-office
  (inmobiliaria-os) y, si la entrega falla, ESTA FUNCIÓN LANZA: un formulario no
  debe dar las gracias por un lead que se perdió.

  La copia local se conserva porque el panel /admin de este repo la usa como
  bandeja de demostración. La fuente de verdad es el back-office.
*/
export async function captureLead(input: {
  nombre: string;
  telefono: string;
  origen: LeadOrigen;
  email?: string;
  propiedadSlug?: string;
  zona?: string;
  tipoPropiedad?: string;
  mensaje?: string;
}): Promise<string> {
  if (typeof window === "undefined") return "";

  const lead: Lead = {
    id: uid(),
    estado: "nuevo",
    creadoEl: new Date().toISOString(),
    notas: [],
    ...input,
  };
  upsert(db.leads, lead);

  // El origen del panel usa guion (`interes-propiedad`); el del back-office usa
  // guion bajo, como el resto de sus enumerados. Se traduce aquí, en la frontera.
  const origen = input.origen.replace(/-/g, "_") as OrigenProspecto;

  return enviarProspecto({ ...input, origen });
}

/* ---------- formato ---------- */

export function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
