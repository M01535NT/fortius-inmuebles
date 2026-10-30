import { ESTADO_LABELS, OPERACION_LABELS, type Property, type TipoPropiedad } from "@/data/propiedades";
import { TIPOS_INMUEBLE } from "@/lib/inmueble-tipos";

/*
  Propiedades destacadas del inicio como baraja (titular, 30/10/2026): cada carta ocupa una
  pantalla, así que cada baraja lleva pocas. Con destacadas de varios tipos aparecen botones
  («Casas», «Terrenos», «En renta»…) que cambian la baraja; el resto vive en el inventario.
*/
export const DESTACADAS_POR_BARAJA = 5;

const PLURAL: Record<TipoPropiedad, string> = {
  terreno: "Terrenos",
  casa: "Casas",
  departamento: "Departamentos",
  oficina: "Oficinas",
  local: "Locales",
  "nave-industrial": "Naves y bodegas",
  plaza: "Plazas",
};

export type BarajaDestacadas = {
  key: string;
  label: string;
  /* Enlace al inventario con el mismo filtro; la baraja «Todas» no lo necesita. */
  inventario?: { href: string; label: string };
  properties: Property[];
};

/* Los tipos en venta van en el orden de la lista de tipos; lo que está en renta, junto y al final. */
export function barajasDestacadas(properties: Property[], max = DESTACADAS_POR_BARAJA): BarajaDestacadas[] {
  const grupos: BarajaDestacadas[] = [];
  for (const { key } of TIPOS_INMUEBLE) {
    const enVenta = properties.filter((p) => p.operacion === "venta" && p.tipo === key);
    if (enVenta.length) grupos.push({
      key: `venta-${key}`,
      label: PLURAL[key],
      inventario: { href: `/inventario?op=venta&tipo=${key}`, label: `Ver ${PLURAL[key].toLowerCase()} en venta` },
      properties: enVenta.slice(0, max),
    });
  }
  const enRenta = properties.filter((p) => p.operacion === "renta");
  if (enRenta.length) grupos.push({
    key: "renta",
    label: "En renta",
    inventario: { href: "/inventario?op=renta", label: "Ver todo lo que está en renta" },
    properties: enRenta.slice(0, max),
  });
  const todas: BarajaDestacadas = { key: "todas", label: "Todas", properties: properties.slice(0, max) };
  return grupos.length > 1 ? [todas, ...grupos] : [todas];
}

/* La misma marca que la tarjeta del inventario: operación o estado, y «de ejemplo» en datos demo. */
export function marcaDestacada(property: Property): string {
  const base = property.estado !== "disponible" ? ESTADO_LABELS[property.estado] : OPERACION_LABELS[property.operacion];
  return base + (property.demo ? " de ejemplo" : "");
}

export function datosDestacada(property: Property): string[] {
  const { recamaras, banos, construccionM2, terrenoM2 } = property.ficha;
  return [
    recamaras ? `${recamaras} rec.` : null,
    banos ? `${banos} baños` : null,
    construccionM2 ? `${construccionM2} m² const.` : terrenoM2 ? `${terrenoM2} m² terreno` : null,
  ].filter((dato): dato is string => Boolean(dato));
}
