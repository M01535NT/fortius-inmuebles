/*
  LV-10d · «¿Dónde se guarda?» (RP-101, RP-102). Sugiere destinos comparando el nombre del archivo
  con los inmuebles, las operaciones y las personas que ya ve el asesor. Es una coincidencia de
  palabras, sin lectura del contenido: nada se archiva hasta que la persona lo elige, y el servidor
  vuelve a comprobar cada destino.
*/

export type Destino = { propiedadSlug: string | null; expedienteId: string | null; clienteId: string | null };
export type Sugerencia = { id: string; tipo: "operacion" | "inmueble" | "persona"; label: string; detail: string; destino: Destino };

type Doc = { titulo: string; nombre_original: string };
type Inmueble = { slug: string; titulo: string; codigo?: string | null };
type Persona = { id: string; nombre: string };
type Operacion = { id: string; folio: string; unidad?: string | null; cliente_id?: string | null; propiedad_slug?: string | null };

/** Palabras que aparecen en casi todo y no distinguen un destino de otro. */
const COMUNES = new Set(["fortius", "casa", "terreno", "departamento", "local", "bodega", "oficina", "venta", "renta", "contrato", "documento", "escritura", "avaluo", "predial", "copia", "scan", "imagen", "foto"]);

const normal = (texto: string) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
/** Palabras de cuatro o más letras; de las cifras solo cuentan las de cinco o más (el número de un folio o un código, EXP-000342), no un año. */
const palabras = (texto: string) => normal(texto).split(/[^a-z0-9]+/).filter(w => (/^\d+$/.test(w) ? w.length >= 5 : w.length >= 4) && !COMUNES.has(w));

function coincidencias(archivo: Set<string>, ...campos: Array<string | null | undefined>) {
  return new Set(campos.flatMap(campo => campo ? palabras(campo) : []).filter(w => archivo.has(w))).size;
}

export const SIN_DESTINO: Destino = { propiedadSlug: null, expedienteId: null, clienteId: null };

/** Hasta tres destinos, del que más coincide al que menos; una operación arrastra su inmueble y su persona. */
export function sugerirDestinos(doc: Doc, inmuebles: Inmueble[], operaciones: Operacion[], personas: Persona[], maximo = 3): Sugerencia[] {
  const archivo = new Set(palabras(`${doc.titulo} ${doc.nombre_original.replace(/\.[a-z0-9]+$/i, "")}`));
  if (!archivo.size) return [];
  const persona = new Map(personas.map(p => [p.id, p]));
  const inmueble = new Map(inmuebles.map(i => [i.slug, i]));
  const opciones: Array<{ puntos: number; orden: number; s: Sugerencia }> = [];
  for (const op of operaciones) {
    const cliente = op.cliente_id ? persona.get(op.cliente_id) : undefined, casa = op.propiedad_slug ? inmueble.get(op.propiedad_slug) : undefined;
    const puntos = coincidencias(archivo, op.folio, op.unidad, cliente?.nombre, casa?.titulo, casa?.codigo);
    if (puntos) opciones.push({ puntos, orden: 0, s: { id: `op:${op.id}`, tipo: "operacion", label: op.unidad || op.folio, detail: ["Asunto", op.unidad ? op.folio : null, cliente?.nombre].filter(Boolean).join(" · "), destino: { expedienteId: op.id, propiedadSlug: op.propiedad_slug ?? null, clienteId: op.cliente_id ?? null } } });
  }
  for (const casa of inmuebles) {
    const puntos = coincidencias(archivo, casa.titulo, casa.codigo);
    if (puntos) opciones.push({ puntos, orden: 1, s: { id: `in:${casa.slug}`, tipo: "inmueble", label: casa.titulo, detail: ["Inmueble", casa.codigo].filter(Boolean).join(" · "), destino: { ...SIN_DESTINO, propiedadSlug: casa.slug } } });
  }
  for (const p of personas) {
    const puntos = coincidencias(archivo, p.nombre);
    if (puntos) opciones.push({ puntos, orden: 2, s: { id: `pe:${p.id}`, tipo: "persona", label: p.nombre, detail: "Persona", destino: { ...SIN_DESTINO, clienteId: p.id } } });
  }
  return opciones.sort((a, b) => b.puntos - a.puntos || a.orden - b.orden || a.s.label.localeCompare(b.s.label, "es")).slice(0, maximo).map(o => o.s);
}
