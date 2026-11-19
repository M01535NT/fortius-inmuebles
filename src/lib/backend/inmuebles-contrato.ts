import type { TipoInmueble } from "./consultas-contrato";

/**
 * Inmuebles del panel (SPEC.md, sección 5): lo que comparten el servidor y la pantalla.
 * La ficha técnica cambia según el tipo (la nave pide altura, andenes y kVA; la casa, recámaras y baños).
 * Ningún dato es obligatorio: lo que falta se ve como «Falta» en «Qué lleva» y no impide publicar.
 */

export type { TipoInmueble };

export const OPERACIONES = ["venta", "renta"] as const;
export type Operacion = (typeof OPERACIONES)[number];
export const NOMBRE_OPERACION: Record<Operacion, string> = { venta: "Venta", renta: "Renta" };

export const ESTADOS_INMUEBLE = ["libre", "apartado", "rentado", "vendido", "retirado"] as const;
export type EstadoInmueble = (typeof ESTADOS_INMUEBLE)[number];
export const NOMBRE_ESTADO: Record<EstadoInmueble, string> = { libre: "Libre", apartado: "Apartado", rentado: "Rentado", vendido: "Vendido", retirado: "Retirado" };
/** Los estados que tienen sentido para su operación: un inmueble en renta no se «vende». */
export const estadosPara = (op: Operacion | null): EstadoInmueble[] =>
  op === "renta" ? ["libre", "apartado", "rentado", "retirado"] : op === "venta" ? ["libre", "apartado", "vendido", "retirado"] : [...ESTADOS_INMUEBLE];

export const MONEDAS = ["MXN", "USD"] as const;
export type Moneda = (typeof MONEDAS)[number];

const SN = ["Sí", "No", "No sabe"] as const;
const CONSERVA = ["Buena", "Regular", "Para remodelar", "No sabe"] as const;

/** Un dato de la ficha: número con su unidad, texto libre o una lista de opciones. */
export type CampoFicha = { clave: string; nombre: string; unidad?: string; opciones?: readonly string[]; texto?: boolean };
export type GrupoFicha = { nombre: string; campos: CampoFicha[] };

const n = (clave: string, nombre: string, unidad?: string): CampoFicha => ({ clave, nombre, unidad });
const t = (clave: string, nombre: string): CampoFicha => ({ clave, nombre, texto: true });
const o = (clave: string, nombre: string, opciones: readonly string[]): CampoFicha => ({ clave, nombre, opciones });

/**
 * Los datos de cada tipo, como el boceto aprobado, para los siete tipos con que empieza el catálogo. Un tipo que agregue
 * el director todavía no trae ficha técnica propia (eso llega con las fichas, etapa 12, paso 3).
 */
export const FICHA_POR_TIPO: Partial<Record<TipoInmueble, GrupoFicha[]>> = {
  casa: [
    { nombre: "Medidas", campos: [n("terreno", "Terreno", "m²"), n("construccion", "Construcción", "m²"), n("niveles", "Niveles")] },
    { nombre: "Espacios", campos: [n("recamaras", "Recámaras"), n("banos", "Baños"), n("estac", "Estacionamientos"), o("cisterna", "Cisterna", SN),
      o("boiler", "Boiler", ["Gas", "Solar", "Eléctrico", "No tiene", "No sabe"]), o("paneles", "Paneles solares", SN)] },
    { nombre: "Estado", campos: [n("anio", "Año de construcción"), o("conserva", "Conservación", CONSERVA)] },
  ],
  departamento: [
    { nombre: "Medidas", campos: [n("construccion", "Superficie", "m²"), n("piso", "Piso")] },
    { nombre: "Espacios", campos: [n("recamaras", "Recámaras"), n("banos", "Baños"), n("estac", "Estacionamientos"), o("elevador", "Elevador", SN)] },
    { nombre: "Condominio", campos: [n("mant", "Mantenimiento", "$/mes"), n("anio", "Año de construcción")] },
  ],
  terreno: [
    { nombre: "Medidas", campos: [n("terreno", "Superficie", "m²"), n("frente", "Frente", "m"), n("fondo", "Fondo", "m")] },
    { nombre: "Uso y servicios", campos: [o("uso", "Uso de suelo", ["Habitacional", "Comercial", "Industrial", "Mixto", "No sabe"]), o("agua", "Agua al pie", SN),
      o("luz", "Luz al pie", SN), o("drenaje", "Drenaje", SN), o("topo", "Topografía", ["Plano", "Pendiente ligera", "Pendiente fuerte", "No sabe"])] },
  ],
  local: [
    { nombre: "Medidas", campos: [n("construccion", "Superficie", "m²"), n("frente", "Frente", "m")] },
    { nombre: "Espacios", campos: [n("banos", "Baños"), n("estac", "Estacionamientos"), t("giro", "Giro permitido")] },
    { nombre: "Condominio", campos: [n("mant", "Mantenimiento", "$/mes")] },
  ],
  oficina: [
    { nombre: "Medidas", campos: [n("construccion", "Superficie", "m²"), n("piso", "Piso")] },
    { nombre: "Espacios", campos: [n("privados", "Privados"), n("banos", "Baños"), n("estac", "Estacionamientos")] },
    { nombre: "Condominio", campos: [n("mant", "Mantenimiento", "$/mes")] },
  ],
  nave_bodega: [
    { nombre: "Medidas", campos: [n("terreno", "Terreno", "m²"), n("construccion", "Construcción", "m²"), n("oficinas", "Oficinas", "m²"),
      n("patio", "Patio de maniobras", "m²"), n("altura", "Altura libre", "m")] },
    { nombre: "Instalaciones", campos: [n("kva", "Carga eléctrica", "kVA"), o("subestacion", "Subestación propia", SN), n("andenes", "Andenes"), n("rampas", "Rampas"),
      n("piso", "Resistencia del piso", "t/m²"), o("incendio", "Contra incendio", ["Hidrantes", "Rociadores", "Extintores", "Ninguno", "No sabe"]), n("estac", "Estacionamientos")] },
    { nombre: "Uso y estado", campos: [o("uso", "Uso de suelo", ["Industrial ligero", "Industrial pesado", "Mixto", "Comercial", "No sabe"]),
      n("anio", "Año de construcción"), o("conserva", "Conservación", CONSERVA)] },
  ],
  plaza_conjunto: [
    { nombre: "Medidas", campos: [n("terreno", "Terreno", "m²"), n("construccion", "Construcción", "m²")] },
    { nombre: "Locales", campos: [n("total", "Locales en total"), n("libres", "Locales libres"), n("estac", "Estacionamientos")] },
  ],
};

/** Todas las claves válidas de la ficha, con su campo (para validar en el servidor). */
export function camposDe(tipo: TipoInmueble | null): CampoFicha[] {
  return tipo ? (FICHA_POR_TIPO[tipo] ?? []).flatMap((g) => g.campos) : [];
}

export type Ficha = Record<string, number | string>;

export type Medio = {
  id: string; tipo: "foto" | "video" | "recorrido_360"; url: string; subido: boolean; nombre: string | null;
  alt: string | null; orden: number; created_at: string;
};
export type CambioPrecio = {
  id: string; precio_antes: number | null; moneda_antes: Moneda | null; precio: number | null; moneda: Moneda;
  motivo: string | null; cambiado_por: string | null; created_at: string;
};
export type AsuntoDelInmueble = { id: string; folio: string; nombre: string };
export type DocumentoDelInmueble = { id: string; nombre: string; grupo: string | null; estado: "falta" | "recibido" | "no_aplica"; archivos: number };

/** Un renglón de la lista de Inmuebles. */
export type FilaInmueble = {
  id: string; folio: string; nombre: string; tipo: TipoInmueble | null; operacion: Operacion | null; colonia: string | null;
  precio: number | null; moneda: Moneda; estado: EstadoInmueble; publicado: boolean; es_ejemplo: boolean;
  conjunto_id: string | null; responsable_id: string; portada: string | null;
  fotos: number; video: boolean; recorrido: boolean; asunto: AsuntoDelInmueble | null; version: number;
};

/** La ficha completa, con lo privado (dirección exacta) que solo ve el equipo. */
export type Inmueble = FilaInmueble & {
  slug: string | null; unidades_total: number | null; ficha: Ficha; ciudad: string; referencias: string | null;
  direccion_exacta: string | null; mostrar_direccion: boolean; lat: number | null; lng: number | null; mapa: string | null;
  descripcion: string; publicado_el: string | null; compartido: boolean; inmobiliaria: string | null; portada_id: string | null;
  medios: Medio[]; precios: CambioPrecio[]; asuntos: AsuntoDelInmueble[]; documentos: DocumentoDelInmueble[];
  conjunto: { id: string; folio: string; nombre: string } | null; unidades: { id: string; folio: string; nombre: string; estado: EstadoInmueble; precio: number | null; publicado: boolean }[];
};

/** Lo que el sitio recomienda tener; nada de esto impide publicar. */
export const FOTOS_RECOMENDADAS = 5;

/** «Qué lleva»: lo que ya está y lo que falta para que la ficha del sitio se vea completa. */
export function queLleva(i: Inmueble): { clave: "datos" | "fotos" | "media" | "permisos" | "ubic"; nombre: string; listo: boolean; detalle: string }[] {
  const campos = camposDe(i.tipo);
  const llenos = campos.filter((c) => i.ficha[c.clave] !== undefined && i.ficha[c.clave] !== "").length;
  const fotos = i.medios.filter((m) => m.tipo === "foto").length;
  const video = i.medios.find((m) => m.tipo === "video");
  const tomas = i.medios.filter((m) => m.tipo === "recorrido_360");
  const planos = i.documentos.filter((d) => /plano/i.test(d.nombre) && d.estado === "recibido").length;
  return [
    { clave: "datos", nombre: "Ficha técnica", listo: campos.length > 0 && llenos >= Math.ceil(campos.length * 0.6), detalle: campos.length ? `${llenos} de ${campos.length} datos` : "Elige el tipo" },
    { clave: "fotos", nombre: "Fotos", listo: fotos >= FOTOS_RECOMENDADAS, detalle: `${fotos} de ${FOTOS_RECOMENDADAS} recomendadas` },
    { clave: "media", nombre: "Video", listo: Boolean(video), detalle: video ? (video.subido ? video.nombre ?? "Video cargado" : "Enlace puesto") : "Sin video" },
    { clave: "media", nombre: "Recorrido 360", listo: tomas.length > 0, detalle: tomas.some((t) => !t.subido) ? "Enlace puesto" : tomas.length ? `${tomas.length} tomas` : "Sin recorrido" },
    { clave: "permisos", nombre: "Planos", listo: planos > 0, detalle: planos ? `${planos} cargado${planos > 1 ? "s" : ""}` : "Sin planos" },
    { clave: "ubic", nombre: "Ubicación", listo: Boolean(i.colonia), detalle: i.colonia ?? "Sin colonia" },
  ];
}

/** Precio para leer: «$2,400,000 MXN», «$3,500 USD al mes» o «A consulta». */
export function precioTexto(precio: number | null, moneda: Moneda, operacion: Operacion | null): string {
  if (!precio) return "A consulta";
  const cifra = `$${precio.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${moneda}`;
  return operacion === "renta" ? `${cifra} al mes` : cifra;
}
