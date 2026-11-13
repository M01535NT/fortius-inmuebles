"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { AsyncForm, AsyncButton, Field, PageHeader, inputClass, textareaClass } from "@/components/admin/ui";
import * as React from "react";
import { Plus, Trash2 } from "@/components/admin/icons";
import { Button, Card, EmptyBox } from "@/components/admin/kit";
import { humanDateTime } from "@/lib/utils";
import { db, removeById, uid, upsert, useCollection, type Nota } from "@/lib/admin/store";

/*
  Notas del equipo (SIM-15, C46): acuerdos y pendientes internos, editables en su tarjeta.
  Lo de una persona o una operación va en su ficha, no aquí.
*/
function TarjetaNota({ nota: source }: { nota: Nota }) {
  const [nota, setNota] = React.useState(source);
  const [version, setVersion] = React.useState(() => db.notas.version(source));
  const [titulo, setTitulo] = React.useState(nota.titulo);
  const [texto, setTexto] = React.useState(nota.texto);
  const dirty = titulo !== nota.titulo || texto !== nota.texto;

  return (
    <Card as="article" className="flex min-w-0 flex-col gap-2 p-4">
      <input aria-label="Título de la nota" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título"
        className="min-h-11 rounded-[10px] bg-transparent px-1 text-base font-semibold text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2" />
      <textarea aria-label="Contenido de la nota" value={texto} onChange={e => setTexto(e.target.value)} rows={5} placeholder="Escribe aquí…"
        className="flex-1 resize-none rounded-[10px] bg-transparent px-1 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2" />
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">{dirty ? "Cambios sin guardar" : humanDateTime(nota.actualizadoEl)}</span>
        <div className="flex gap-1.5">
          {dirty && <AsyncButton type="button" className="inline-flex min-h-11 items-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={async () => {
            const saved = await upsert(db.notas, { ...nota, titulo, texto, actualizadoEl: new Date().toISOString() }, version);
            setNota(saved); setVersion(db.notas.version(saved));
          }}>Guardar</AsyncButton>}
          <AsyncButton type="button" aria-label={`Eliminar nota ${nota.titulo}`} className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-destructive" onClick={async () => {
            if (await confirmAction(`¿Eliminar la nota «${nota.titulo}»? Se puede recuperar desde Historial.`)) await removeById(db.notas, nota.id, version);
          }}><Trash2 size={18} aria-hidden="true" /></AsyncButton>
        </div>
      </div>
    </Card>
  );
}

export default function NotasPage() {
  const notas = useCollection(db.notas);
  const titleRef = React.useRef<HTMLInputElement>(null);

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    await upsert(db.notas, { id: uid(), titulo: String(data.get("titulo") ?? "Nota"), texto: String(data.get("texto") ?? ""), actualizadoEl: new Date().toISOString() }, null);
    form.reset();
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader title="Notas del equipo" description="Acuerdos y pendientes internos. Lo de una persona o una operación va en su ficha." />
      <Card>
        <AsyncForm onSubmit={crear} className="flex flex-wrap items-end gap-3 p-4">
          <Field label="Título" htmlFor="nota-titulo" className="min-w-[12rem] flex-1">
            <input ref={titleRef} id="nota-titulo" name="titulo" required placeholder="Pendientes de la semana" className={inputClass} />
          </Field>
          <Field label="Contenido" htmlFor="nota-texto" className="w-full min-w-0 sm:min-w-[15rem] sm:flex-[2]">
            <textarea id="nota-texto" name="texto" rows={1} placeholder="Detalle…" className={textareaClass} />
          </Field>
          <Button type="submit" variant="primary"><Plus size={16} aria-hidden="true" />Nueva nota</Button>
        </AsyncForm>
      </Card>
      {notas.length === 0
        ? <EmptyBox title="Todavía no hay notas" steps={["Escribe un título y el detalle arriba.", "Pulsa «Nueva nota».", "Edítala en su tarjeta y guarda cuando cambie algo."]}
            action={<Button onClick={() => titleRef.current?.focus()}>Escribir la primera nota</Button>}>
            Sirven para lo que el equipo acuerda y no es de una sola persona u operación: guardias, pendientes de oficina, recordatorios.
          </EmptyBox>
        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{notas.map(nota => <TarjetaNota key={nota.id} nota={nota} />)}</div>}
    </div>
  );
}
