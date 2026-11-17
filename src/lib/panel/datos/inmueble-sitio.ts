import type { ImagenPropiedad, Property } from "@/data/propiedades";

/**
 * Fotos, textos del sitio y publicación de un inmueble (boceto de Inmuebles, función 9). Funciones puras.
 * Guardar nunca publica: publicar es su propio paso, y los avisos no bloquean («Publicar así»),
 * salvo lo que el servidor exige (al menos una foto pública y no estar en evaluación).
 */

/** Una foto es pública si no viene de un depósito privado, de staging ni de una URL firmada o del panel. */
export function fotoPublica(src: string): boolean {
  if (/([a-z0-9-]+-(?:private|staging)|\/api\/admin\/|\/storage\/v1\/object\/sign\/)/i.test(src)) return false;
  if (/[\s\\]/.test(src) || src.startsWith("//")) return false;
  if (src.startsWith("/")) return true;
  try {
    const u = new URL(src);
    return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password;
  } catch { return false; }
}

const conGaleria = (p: Property, galeria: ImagenPropiedad[]): Property => ({ ...p, galeria });

export function agregarFotos(p: Property, fotos: readonly ImagenPropiedad[]): Property {
  const nuevas = fotos.map((f) => ({ src: f.src, alt: f.alt.trim().slice(0, 160) }));
  return conGaleria(p, [...p.galeria, ...nuevas].slice(0, 100));
}
export function quitarFoto(p: Property, src: string): Property {
  return conGaleria(p, p.galeria.filter((g) => g.src !== src));
}
export function ordenarFotos(p: Property, galeria: readonly ImagenPropiedad[]): Property {
  return conGaleria(p, [...galeria]);
}
/** Muestra en el sitio una foto que entró sin mostrarse (por ejemplo, desde la Bandeja a un inmueble publicado). */
export function mostrarFoto(p: Property, src: string): Property {
  return conGaleria(p, p.galeria.map((g) => (g.src === src ? { src: g.src, alt: g.alt } : g)));
}
export function describirFoto(p: Property, src: string, alt: string): Property {
  return conGaleria(p, p.galeria.map((g) => (g.src === src ? { ...g, alt: alt.trim().slice(0, 160) } : g)));
}
/** Texto alternativo a partir del nombre del archivo: sin extensión ni guiones. */
export function altDeArchivo(nombre: string): string {
  return nombre.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

/** La descripción del sitio se escribe como texto libre; cada línea en blanco separa un párrafo. */
export const textoDescripcion = (p: Property) => p.descripcion.join("\n\n");
export function editarTextos(p: Property, d: { descripcion: string; direccionAproximada: string }): Property {
  const parrafos = d.descripcion.split(/\n\s*\n/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 100);
  return { ...p, descripcion: parrafos, direccionAproximada: d.direccionAproximada.trim().slice(0, 160) || p.direccionAproximada };
}

export type EstadoPublicacion = { publicado: boolean; bloqueos: string[]; avisos: string[] };

/** Lo que impide publicar (lo exige el servidor) y lo que solo conviene revisar. */
export function estadoPublicacion(p: Property, propietarioLigado: boolean): EstadoPublicacion {
  const bloqueos: string[] = [];
  const avisos: string[] = [];
  if (p.estado === "evaluacion") bloqueos.push("Está en captación: cámbialo a Disponible en «Editar datos».");
  if (!p.galeria.some((g) => fotoPublica(g.src) && !g.oculta)) bloqueos.push("Falta al menos una foto que se muestre en el sitio.");
  if (p.precio.modalidad !== "publico") avisos.push("Sin precio: el sitio dirá «Precio a consulta».");
  if (!p.descripcion.length) avisos.push("Sin descripción para el sitio.");
  if (p.galeria.length > 0 && p.galeria.length < 5) avisos.push(`Solo ${p.galeria.length} ${p.galeria.length === 1 ? "foto" : "fotos"}; con 5 o más se ve mejor.`);
  if (p.galeria.some((g) => !g.alt.trim())) avisos.push("Hay fotos sin descripción.");
  if (!propietarioLigado) avisos.push("Sin propietario ligado.");
  if (p.demo) avisos.push("Está marcado como ejemplo: el sitio lo mostrará como ejemplo.");
  return { publicado: p.publicada === true, bloqueos, avisos };
}

export function publicar(p: Property, ahora = new Date()): Property {
  return { ...p, publicada: true, publicadaEl: p.publicadaEl || ahora.toISOString().slice(0, 10) };
}
/** Quitar del sitio conserva la fecha de la primera publicación, salvo en evaluación, donde no puede haberla. */
export function quitarDelSitio(p: Property): Property {
  return { ...p, publicada: false, publicadaEl: p.estado === "evaluacion" ? "" : p.publicadaEl };
}
