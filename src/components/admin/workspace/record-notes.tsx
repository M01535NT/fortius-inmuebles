"use client";
import * as React from "react";
import { Trash2 } from "@/components/admin/icons";
import { Button, Sheet } from "@/components/admin/kit";
import { textareaClass } from "@/components/admin/ui";
import { confirmDelete } from "@/components/admin/workspace/confirm";
import { newNote, notesFor, type NoteLink } from "@/lib/admin/notes";
import { db, errorMessage, removeById, uid, upsert, useCollection, useSession } from "@/lib/admin/store";
import { humanDateTime } from "@/lib/utils";

/*
  Notas del inmueble o de la operación (DEC-42, E-01): el botón «Notas» abre este panel lateral.
  Lo que se escribe aquí se queda con lo que describe; ya no hay un tablero de notas sueltas.
*/

export function useRecordNotes(link: NoteLink) {
  return notesFor(useCollection(db.notas), link);
}

export function RecordNotes({ link, open, onClose, title, description }: { link: NoteLink; open: boolean; onClose: () => void; title: string; description: string }) {
  const notes = useRecordNotes(link);
  const session = useSession();
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setError("");
    try {
      await upsert(db.notas, newNote(text, link, uid(), new Date().toISOString(), session?.name || session?.email || undefined), null);
      setText("");
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function remove(id: string, titulo: string) {
    const note = notes.find(item => item.id === id);
    if (!note || !await confirmDelete("nota", `Se elimina la nota «${titulo}».`, "a")) return;
    try { await removeById(db.notas, id, db.notas.version(note)); } catch (cause) { setError(errorMessage(cause)); }
  }

  return <Sheet open={open} onClose={onClose} title={title} description={description}>
    <form onSubmit={add} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm font-semibold">Nueva nota
        <textarea className={textareaClass} rows={3} maxLength={5000} value={text} placeholder="Qué se acordó, qué falta, qué hay que recordar" onChange={e => setText(e.target.value)} />
      </label>
      {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
      <span><Button type="submit" variant="primary" disabled={busy || !text.trim()}>Guardar nota</Button></span>
    </form>
    {notes.length ? <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Notas guardadas">{notes.map(note => <li key={note.id} className="flex items-start gap-2 rounded-[12px] border border-border p-3">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="whitespace-pre-wrap text-[.9375rem] [overflow-wrap:anywhere]">{note.texto || note.titulo}</span>
        <small className="text-muted-foreground">{humanDateTime(note.actualizadoEl)}{note.autor ? ` · ${note.autor}` : ""}</small>
      </span>
      <button type="button" aria-label={`Eliminar la nota «${note.titulo}»`} className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-destructive" onClick={() => void remove(note.id, note.titulo)}><Trash2 size={18} aria-hidden="true" /></button>
    </li>)}</ul> : <p className="m-0 text-sm text-muted-foreground">Todavía no hay notas.</p>}
  </Sheet>;
}
