/* Enlaces hermanos de las páginas por segmento (cabecera «Especialidades»). */
export const SEGMENT_LINKS = [
  { href: "/residencial", label: "Residencial" },
  { href: "/comercial", label: "Comercial" },
  { href: "/industrial", label: "Industrial" },
] as const;

export function segmentLinks(current: string) {
  return SEGMENT_LINKS.map(link => ({ ...link, current: link.href === current }));
}
