import type { TipoInmueble } from "@/lib/inmueble-tipos";

/*
  Agrupación de los siete tipos de inmueble para el sitio público: la portada y el inventario
  ofrecen «Residencial», «Comercial» e «Industrial» como atajos de filtro. No es otra lista de
  tipos; solo decide qué tipos entran en cada atajo. Una plaza se comercializa como inmueble
  comercial; el terreno se agrupa con lo industrial hasta que el titular indique otra cosa.
*/
export const SEGMENTOS_INMUEBLE = [
  { key: "residencial", label: "Residencial", detalle: "Casas y departamentos", tipos: ["casa", "departamento"] },
  { key: "comercial", label: "Comercial", detalle: "Locales, oficinas y plazas", tipos: ["local", "oficina", "plaza"] },
  { key: "industrial", label: "Industrial", detalle: "Naves, bodegas y terrenos", tipos: ["nave-industrial", "terreno"] },
] as const satisfies readonly { key: string; label: string; detalle: string; tipos: readonly TipoInmueble[] }[];

export type SegmentoInmueble = typeof SEGMENTOS_INMUEBLE[number]["key"];

export const SEGMENTO_LABELS = Object.fromEntries(SEGMENTOS_INMUEBLE.map(segmento => [segmento.key, segmento.label])) as Record<SegmentoInmueble, string>;

export function segmentoInmueble(value: unknown): SegmentoInmueble | undefined {
  return SEGMENTOS_INMUEBLE.find(segmento => segmento.key === value)?.key;
}

export function tiposDeSegmento(segmento: SegmentoInmueble): readonly TipoInmueble[] {
  return SEGMENTOS_INMUEBLE.find(item => item.key === segmento)?.tipos ?? [];
}

export function inventarioDeSegmento(segmento: SegmentoInmueble): string {
  return `/inventario?segmento=${segmento}`;
}
