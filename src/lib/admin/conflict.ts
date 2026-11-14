/*
  Conflicto de versión explicado (RP-17, UX-04). Cuando otra persona guardó el mismo registro
  antes, se compara campo por campo lo que había al empezar (base), lo que tú cambiaste (mine)
  y lo que quedó guardado (theirs). Nada se sobrescribe sin elegir: los campos que solo cambió
  la otra persona quedan con su valor, los que solo cambiaste tú con el tuyo, y los que cambiaron
  los dos se eligen uno por uno.
*/
export type ConflictSide = "mine" | "theirs";
export type ConflictField = {
  key: string;
  label: string;
  mine: unknown;
  theirs: unknown;
  /** Quién lo cambió desde la base: solo tú, solo la otra persona o los dos (sin base conocida, los dos). */
  changed: "mine" | "theirs" | "both";
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Campos internos que el sistema pone solo y no se eligen. */
const INTERNAL = new Set(["id", "slug", "actualizadoEl", "creadoEl", "updatedAt", "createdAt", "historial"]);

const LABELS: Record<string, string> = {
  titulo: "Título", nombre: "Nombre", telefono: "Teléfono", email: "Correo", descripcion: "Descripción", notas: "Notas",
  texto: "Texto", contenido: "Contenido", resumen: "Resumen", estado: "Estado", prioridad: "Prioridad", vence: "Fecha límite",
  fecha: "Fecha", hora: "Hora", inicio: "Inicio", fin: "Fin", lugar: "Lugar", categoria: "Categoría", asesorId: "Responsable",
  pasos: "Pasos", precio: "Precio", zona: "Zona", tipo: "Tipo", operacion: "Operación", ficha: "Ficha técnica", galeria: "Fotos",
  amenidades: "Amenidades", publicada: "Publicado", destacada: "Destacado", perfil: "Perfil", mensaje: "Mensaje", origen: "Origen",
  canal: "Canal", tipoPropiedad: "Tipo de inmueble", propiedadSlug: "Inmueble", expedienteId: "Operación", leadId: "Prospecto",
  clienteId: "Cliente", direccionAproximada: "Dirección aproximada", documentos: "Documentos", recordatorio: "Recordatorio",
};

/** Nombre del campo para el asesor: el conocido o el nombre interno separado en palabras. */
export function fieldLabel(key: string) {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Los campos en los que tu versión y la guardada difieren. */
export function conflictFields(base: object | undefined, mine: object, theirs: object): ConflictField[] {
  const b = (base ?? {}) as Record<string, unknown>, m = mine as Record<string, unknown>, t = theirs as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(m), ...Object.keys(t)])].filter(key => !INTERNAL.has(key));
  return keys.flatMap(key => {
    if (same(m[key], t[key])) return [];
    const mineChanged = !base || !same(m[key], b[key]), theirsChanged = !base || !same(t[key], b[key]);
    const changed = mineChanged && theirsChanged ? "both" : mineChanged ? "mine" : "theirs";
    return [{ key, label: fieldLabel(key), mine: m[key], theirs: t[key], changed }];
  });
}

/** Lo que propone el panel antes de que elijas: el lado que cambió; si cambiaron los dos, ninguno. */
export function suggestedSide(field: ConflictField): ConflictSide | undefined {
  return field.changed === "both" ? undefined : field.changed;
}

/** Parte de lo guardado y aplica tus valores en los campos donde elegiste el tuyo. */
export function mergeChoice<T extends object>(theirs: T, mine: T, choice: Record<string, ConflictSide>): T {
  const merged: Record<string, unknown> = { ...(theirs as Record<string, unknown>) };
  const m = mine as Record<string, unknown>;
  // El historial del registro no se elige: se conservan las entradas de los dos.
  if (Array.isArray(merged.historial) && Array.isArray(m.historial)) {
    const seen = new Set((merged.historial as unknown[]).map(entry => JSON.stringify(entry)));
    merged.historial = [...merged.historial as unknown[], ...(m.historial as unknown[]).filter(entry => !seen.has(JSON.stringify(entry)))];
  }
  for (const [key, side] of Object.entries(choice)) {
    if (side !== "mine") continue;
    if (m[key] === undefined) delete merged[key]; else merged[key] = m[key];
  }
  return merged as T;
}

/** Texto corto de un valor para comparar a simple vista. */
export function describeValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Vacío";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return value.toLocaleString("es-MX");
  // Valores de lista («alta», «en_revision») se leen como palabra: «Alta», «En revision».
  if (typeof value === "string" && /^[a-z]+(?:[_-][a-z]+)*$/.test(value)) return fieldLabel(value);
  if (typeof value === "string") return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : value;
  if (Array.isArray(value)) {
    if (!value.length) return "Vacío";
    const texts = value.map(item => typeof item === "string" ? item : item && typeof item === "object" ? String((item as Record<string, unknown>).texto ?? (item as Record<string, unknown>).titulo ?? (item as Record<string, unknown>).nombre ?? "") : String(item)).filter(Boolean);
    return texts.length === value.length && texts.join(", ").length <= 160 ? texts.join(", ") : `${value.length} ${value.length === 1 ? "elemento" : "elementos"}`;
  }
  const parts = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null && v !== "" && typeof v !== "object").slice(0, 4).map(([k, v]) => `${fieldLabel(k)}: ${describeValue(v)}`);
  return parts.length ? parts.join(" · ") : "Datos sin texto";
}
