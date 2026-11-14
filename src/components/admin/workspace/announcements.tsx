"use client";
import * as React from "react";
import { Plus, Trash2 } from "@/components/admin/icons";
import { Button, Card } from "@/components/admin/kit";
import { textareaClass } from "@/components/admin/ui";
import { confirmDelete } from "@/components/admin/workspace/confirm";
import { announcements, newNote } from "@/lib/admin/notes";
import { db, errorMessage, removeById, uid, upsert, useCollection, useSession } from "@/lib/admin/store";
import { cn, humanDateTime } from "@/lib/utils";

/*
  «Avisos» en Hoy (DEC-42): lo que el director dice a todo el equipo. Solo el administrador los
  escribe o quita (la base también lo exige); el resto del equipo los lee. Reemplaza el tablero de
  notas sueltas.
*/
export function Announcements({ className }: { className?: string }) {
  const items = announcements(useCollection(db.notas));
  const session = useSession();
  const director = session?.role === "admin";
  const [writing, setWriting] = React.useState(false);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  if (!items.length && !director) return null;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setError("");
    try {
      await upsert(db.notas, newNote(text, "aviso", uid(), new Date().toISOString(), session?.name || session?.email || undefined), null);
      setText(""); setWriting(false);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    const item = items.find(note => note.id === id);
    if (!item || !await confirmDelete("aviso", `El aviso «${item.titulo}» deja de verse en Hoy.`, "o")) return;
    try { await removeById(db.notas, id, db.notas.version(item)); } catch (cause) { setError(errorMessage(cause)); }
  }

  // Sin avisos, el director ve solo el botón para escribir uno: un bloque vacío no ocupa la pantalla (13/11/2026).
  if (!items.length && !writing) return <Button variant="ghost" className={cn("self-start", className)} onClick={() => setWriting(true)}><Plus size={16} aria-hidden="true" />Escribir aviso para el equipo</Button>;

  return <section aria-labelledby="hoy-avisos" className={cn("flex min-w-0 flex-col gap-3", className)}>
    <div className="flex items-center justify-between gap-3">
      <h2 id="hoy-avisos" className="m-0 text-lg font-semibold">Avisos</h2>
      {director && !writing && <Button onClick={() => setWriting(true)}><Plus size={16} aria-hidden="true" />Escribir aviso</Button>}
    </div>
    <Card as="div" className="flex flex-col gap-3 p-4">
      {writing && <form onSubmit={add} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm font-semibold">Aviso para el equipo
          <textarea autoFocus className={textareaClass} rows={3} maxLength={5000} value={text} placeholder="Guardias del fin de semana, cambios de horario, recordatorios…" onChange={e => setText(e.target.value)} />
        </label>
        <span className="flex flex-wrap gap-2"><Button type="submit" variant="primary" disabled={busy || !text.trim()}>Publicar aviso</Button><Button variant="ghost" disabled={busy} onClick={() => { setWriting(false); setText(""); }}>Cancelar</Button></span>
      </form>}
      {items.length ? <ul className="m-0 flex list-none flex-col gap-2 p-0">{items.map(item => <li key={item.id} className="flex items-start gap-2">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="whitespace-pre-wrap text-[.9375rem] [overflow-wrap:anywhere]">{item.texto || item.titulo}</span>
          <small className="text-muted-foreground">{humanDateTime(item.actualizadoEl)}{item.autor ? ` · ${item.autor}` : ""}</small>
        </span>
        {director && <button type="button" aria-label={`Eliminar el aviso «${item.titulo}»`} className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-destructive" onClick={() => void remove(item.id)}><Trash2 size={18} aria-hidden="true" /></button>}
      </li>)}</ul> : <p className="m-0 text-sm text-muted-foreground">Lo que escribas aquí lo ve todo el equipo en Hoy.</p>}
      {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
    </Card>
  </section>;
}
