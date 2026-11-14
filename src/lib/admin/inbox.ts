import type { Nota } from "@/lib/domain/records";
import { isTaskOpen, type Task } from "@/lib/tasks";

/*
  Bandeja «Para ti» (RP-20, UX-05): lo que otra persona del equipo hizo y te toca a ti.
  - Mención: una nota con «@tu nombre» que escribió alguien más.
  - Asignación: una tarea abierta a tu nombre que creó alguien más.
  - Respuesta: un comentario de alguien más en una tarea tuya.
  Las aprobaciones se suman cuando exista APR-01. Todo sale de lo que el usuario ya puede ver
  (el servidor filtra notas y tareas por permisos), así que una mención solo avisa a quien puede
  ver el registro. Lo leído se guarda en el servidor por usuario (preferencias, UX-02).
*/

export type InboxKind = "mencion" | "asignacion" | "respuesta";
export type InboxItem = { key: string; kind: InboxKind; title: string; text: string; who?: string; at: string; href: string };
export type InboxMe = { userId: string; asesorId: string | null; names: string[] };
export type InboxVisible = { property: (slug: string) => string | undefined; client: (id: string) => string | undefined };

export const INBOX_LABEL: Record<InboxKind, string> = { mencion: "Mención", asignacion: "Asignada", respuesta: "Respuesta" };
/** Lo que se muestra: los últimos 30 días; lo anterior ya no es noticia. */
export const INBOX_DAYS = 30;

const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Formas en que te pueden mencionar: nombre completo, primer nombre y el usuario del correo. */
export function mentionNames(name?: string, email?: string) {
  const full = name?.trim().replace(/\s+/g, " ") ?? "";
  const names = [full, full.split(" ")[0] ?? "", email?.split("@")[0] ?? ""].map(fold).filter(value => value.length >= 2);
  return [...new Set(names)];
}

/** ¿El texto dice «@nombre» con alguno de tus nombres (sin importar acentos ni mayúsculas)? */
export function mentions(text: string, names: readonly string[]) {
  const folded = fold(text);
  return names.some(name => {
    for (let at = folded.indexOf(`@${name}`); at >= 0; at = folded.indexOf(`@${name}`, at + 1)) {
      const after = folded[at + name.length + 1];
      if (!after || !/[\p{L}\p{N}_-]/u.test(after)) return true;
    }
    return false;
  });
}

const excerpt = (text: string) => { const line = text.trim().replace(/\s+/g, " "); return line.length > 140 ? `${line.slice(0, 139)}…` : line; };

export function inboxItems({ tasks, notes, me, visible, now }: { tasks: readonly Task[]; notes: readonly Nota[]; me: InboxMe; visible: InboxVisible; now: Date }): InboxItem[] {
  const since = new Date(now.getTime() - INBOX_DAYS * 86_400_000).toISOString();
  const items: InboxItem[] = [];
  const myName = new Set(me.names);
  for (const note of notes) {
    if (note.aviso || note.actualizadoEl < since || !mentions(note.texto, me.names)) continue;
    // Quien se menciona a sí mismo no se avisa.
    if (note.autorId ? note.autorId === me.userId : !!note.autor && myName.has(fold(note.autor.trim()))) continue;
    let where: string | undefined, href: string;
    if (note.propiedadSlug) { where = visible.property(note.propiedadSlug); href = `/admin/propiedades/${encodeURIComponent(note.propiedadSlug)}/editar?notas=1`; }
    else if (note.expedienteId) { where = note.clienteId ? visible.client(note.clienteId) : "una operación"; href = `/admin/operaciones/${encodeURIComponent(note.expedienteId)}?notas=1`; }
    else continue;
    // Si no puedes ver el inmueble o la persona, la nota no es para ti.
    if (!where) continue;
    items.push({ key: `mencion:${note.id}:${note.actualizadoEl}`, kind: "mencion", title: `Te mencionaron en ${where}`, text: excerpt(note.texto), who: note.autor, at: note.actualizadoEl, href });
  }
  for (const task of tasks) {
    const history = task.historial ?? [];
    const created = history.find(entry => entry.accion === "creada");
    const assignedToMe = !!me.asesorId && task.asesorId === me.asesorId;
    const href = `/admin/tareas/${encodeURIComponent(task.id)}`;
    if (assignedToMe && isTaskOpen(task) && created && created.actorId !== me.userId && created.fecha >= since)
      items.push({ key: `asignacion:${task.id}`, kind: "asignacion", title: "Te asignaron una tarea", text: task.titulo, at: created.fecha, href });
    if (!assignedToMe && created?.actorId !== me.userId) continue;
    for (const entry of history) {
      if (entry.accion !== "nota" || entry.actorId === me.userId || entry.fecha < since || !entry.texto) continue;
      items.push({ key: `respuesta:${task.id}:${entry.fecha}`, kind: "respuesta", title: `Comentaron en «${task.titulo}»`, text: excerpt(entry.texto), who: entry.actorEmail, at: entry.fecha, href });
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/** Lo leído: llave → fecha. Se guarda acotado para que la preferencia no crezca sin fin. */
export type InboxRead = Record<string, string>;
export const INBOX_READ_LIMIT = 300;
export function markRead(read: InboxRead, keys: readonly string[], at: string): InboxRead {
  const next = { ...read };
  for (const key of keys) next[key] = at;
  const entries = Object.entries(next);
  return entries.length <= INBOX_READ_LIMIT ? next : Object.fromEntries(entries.sort((a, b) => b[1].localeCompare(a[1])).slice(0, INBOX_READ_LIMIT));
}
export const unread = (items: readonly InboxItem[], read: InboxRead | undefined) => read ? items.filter(item => !read[item.key]) : [];
