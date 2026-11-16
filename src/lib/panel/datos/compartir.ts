import { formatPrecio, type Property } from "@/data/propiedades";

/**
 * Compartir un inmueble en un toque (boceto de Inmuebles, función 3). Solo se comparte con clientes lo que está en el sitio:
 * un inmueble sin publicar o en evaluación no tiene enlace público. No guarda nada.
 */
export type Compartible =
  | { publico: true; enlace: string; pdf: string; texto: string; whatsapp: string }
  | { publico: false; motivo: string };

export function compartirInmueble(p: Property, origen: string): Compartible {
  if (!p.publicada || p.estado === "evaluacion") {
    return { publico: false, motivo: p.estado === "evaluacion" ? "Está en evaluación: todavía no se comparte con clientes." : "Todavía no está en el sitio: publícalo para compartirlo." };
  }
  const enlace = new URL(`/inventario/${encodeURIComponent(p.slug)}`, origen).toString();
  const pdf = new URL(`/inventario/${encodeURIComponent(p.slug)}/ficha-tecnica`, origen).toString();
  const precio = formatPrecio(p.precio);
  const texto = [`${p.titulo}${p.zona ? `, ${p.zona}` : ""}.`, precio ? `${precio}.` : "", p.demo ? "(Inmueble de ejemplo.)" : "", enlace].filter(Boolean).join(" ");
  return { publico: true, enlace, pdf, texto, whatsapp: `https://wa.me/?text=${encodeURIComponent(texto)}` };
}
