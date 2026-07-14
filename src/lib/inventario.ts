/*
  Inventario REAL, leído del back-office (inmobiliaria-os).

  Hasta ahora el sitio pintaba `src/data/propiedades.ts`: un array escrito a mano
  con tres propiedades ficticias. Ahora lee la vista `public_listings`, que es lo
  ÚNICO que este sitio puede ver de esa base: solo lo publicado a propósito, y
  solo los campos publicables. Las notas internas, los identificadores
  registrales, los hallazgos, el RFC de las personas — nada de eso existe para
  este cliente, y no por discreción: por permisos.

  El tipo `Property` no cambia. La forma la impone este repo y la base se adapta
  a ella, no al revés.
*/
import { createClient } from "@supabase/supabase-js";

import type { Property, PrecioPropiedad, TipoPropiedad, Operacion, EstadoPropiedad } from "@/data/propiedades";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://fvvmvnduvzxvodeombld.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_IntpkDu0B57y5t3z1LG09w_vKJBIUyB";

/** Las fotos viven en un bucket público: son de una web abierta. */
const FOTOS = `${SUPABASE_URL}/storage/v1/object/public/listings`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Cada fila de `public_listings`. Los nombres son los del contrato. */
type ListingRow = {
  slug: string;
  codigo: string;
  titulo: string | null;
  tipo: TipoPropiedad;
  operacion: Operacion;
  precio_modalidad: "publico" | "consulta";
  precio_monto: number | null;
  precio_moneda: "MXN" | "USD" | null;
  precio_periodo: "mensual" | null;
  zona: string | null;
  direccion_aproximada: string | null;
  descripcion: string[] | null;
  terreno_m2: number | null;
  construccion_m2: number | null;
  recamaras: number | null;
  banos: number | null;
  estacionamientos: number | null;
  antiguedad: string | null;
  amenidades: string[] | null;
  galeria: { path: string; alt: string }[] | null;
  destacada: boolean;
  estado: EstadoPropiedad;
  publicada_el: string | null;
  demo: boolean;
};

function toPrecio(row: ListingRow): PrecioPropiedad {
  if (row.precio_modalidad !== "publico" || row.precio_monto == null) {
    return { modalidad: "consulta" };
  }
  return {
    modalidad: "publico",
    monto: Number(row.precio_monto),
    moneda: row.precio_moneda ?? "MXN",
    ...(row.precio_periodo === "mensual" ? { periodo: "mensual" as const } : {}),
  };
}

function toProperty(row: ListingRow): Property {
  return {
    slug: row.slug,
    codigo: row.codigo,
    titulo: row.titulo ?? row.codigo,
    tipo: row.tipo,
    operacion: row.operacion,
    precio: toPrecio(row),
    zona: row.zona ?? "",
    direccionAproximada: row.direccion_aproximada ?? "",
    descripcion: row.descripcion ?? [],
    ficha: {
      terrenoM2: row.terreno_m2 ?? undefined,
      construccionM2: row.construccion_m2 ?? undefined,
      recamaras: row.recamaras ?? undefined,
      banos: row.banos ?? undefined,
      estacionamientos: row.estacionamientos ?? undefined,
      antiguedad: row.antiguedad ?? undefined,
    },
    amenidades: row.amenidades ?? [],
    galeria: (row.galeria ?? []).map((g) => ({ src: `${FOTOS}/${g.path}`, alt: g.alt })),
    asesorId: "asesor-01",
    creditoDisponible: row.operacion === "venta",
    puntosDeInteres: [],
    destacada: row.destacada,
    estado: row.estado,
    publicadaEl: (row.publicada_el ?? "").slice(0, 10),
    // El guardarraíl se conserva: un inmueble marcado como demo en el
    // back-office sigue saliendo `noindex` y fuera del sitemap.
    demo: row.demo as true,
  };
}

/*
  Fuente única. Una propiedad sin foto rompería la tarjeta (`galeria[0]`), y la
  base ya lo impide al publicar; aquí se filtra igualmente, porque una web
  pública no se cae por un dato inesperado.
*/
export async function getPropiedades(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("public_listings")
    .select("*")
    .order("publicada_el", { ascending: false });

  if (error) {
    // Si el inventario no carga, el sitio se muestra vacío en vez de romperse.
    console.error("No se pudo leer el inventario:", error.message);
    return [];
  }

  return ((data ?? []) as ListingRow[])
    .map(toProperty)
    .filter((p) => p.galeria.length > 0);
}

export async function getPropertyBySlug(slug: string): Promise<Property | undefined> {
  const todas = await getPropiedades();
  return todas.find((p) => p.slug === slug);
}

export async function getFeaturedProperties(): Promise<Property[]> {
  const todas = await getPropiedades();
  return todas.filter((p) => p.destacada);
}

/*
  Relacionadas: misma zona o mismo tipo, excluyendo la actual y las vendidas;
  si faltan, rellena con el resto del inventario disponible.
*/
export async function getRelatedProperties(slug: string, limit = 3): Promise<Property[]> {
  const todas = await getPropiedades();
  const actual = todas.find((p) => p.slug === slug);
  if (!actual) return [];

  const pool = todas.filter((p) => p.slug !== slug && p.estado !== "vendida");
  const related = pool.filter((p) => p.zona === actual.zona || p.tipo === actual.tipo);
  const fill = pool.filter((p) => !related.includes(p));
  return [...related, ...fill].slice(0, limit);
}
