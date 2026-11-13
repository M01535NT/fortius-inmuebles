import type { Nota } from "@/lib/domain/records";

/*
  DEC-42 (titular, 12/11/2026): las notas viven pegadas a lo que describen. La persona ya tiene las
  suyas en su ficha; el inmueble y la operación las tienen en su panel «Notas». No hay tablero de
  notas sueltas: lo que el director quiera decir a todo el equipo es un «Aviso» en Hoy.
*/

export type NoteLink = { propiedadSlug: string } | { expedienteId: string; clienteId?: string };

/** El título sale de la primera línea del texto; nadie escribe dos campos para una nota. */
export function noteTitle(text: string) {
  const first = text.trim().split(/\r?\n/)[0]?.trim() ?? "";
  return (first.length > 80 ? `${first.slice(0, 79)}…` : first) || "Nota";
}

export function notesFor(notes: readonly Nota[], link: NoteLink): Nota[] {
  const mine = (note: Nota) => "propiedadSlug" in link ? note.propiedadSlug === link.propiedadSlug && !note.expedienteId : note.expedienteId === link.expedienteId;
  return notes.filter(note => !note.aviso && mine(note)).sort(newestFirst);
}

export const announcements = (notes: readonly Nota[]) => notes.filter(note => note.aviso).sort(newestFirst);

export function newNote(text: string, link: NoteLink | "aviso", id: string, now: string, autor?: string, autorId?: string): Nota {
  const texto = text.trim();
  return { id, titulo: noteTitle(texto), texto, actualizadoEl: now, ...(link === "aviso" ? { aviso: true } : link), ...(autor ? { autor } : {}), ...(autorId ? { autorId } : {}) };
}

function newestFirst(a: Nota, b: Nota) { return b.actualizadoEl.localeCompare(a.actualizadoEl); }
