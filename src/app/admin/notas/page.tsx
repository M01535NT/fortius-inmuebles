"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import { Plus, Trash2 } from "@/components/admin/icons";

import {
  EmptyState,
  PageHeader,
  btnPrimary,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  db,
  fechaCorta,
  removeById,
  uid,
  upsert,
  useCollection,
  type Nota,
} from "@/lib/admin/store";

/*
  Notas internas del equipo: tablero simple de tarjetas editables in situ.
  Para notas de un lead concreto, usar su expediente (módulo Leads).
*/
function TarjetaNota({ nota: source }: { nota: Nota }) {
  const [nota, setNota] = React.useState(source);
  const [version, setVersion] = React.useState(() => db.notas.version(source));
  const [titulo, setTitulo] = React.useState(nota.titulo);
  const [texto, setTexto] = React.useState(nota.texto);
  const dirty = titulo !== nota.titulo || texto !== nota.texto;

  return (
    <article className="flex flex-col rounded-lg border border-border bg-card p-4">
      <input
        aria-label="Título de la nota"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Título"
      />
      <textarea
        aria-label="Contenido de la nota"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={5}
        className="mt-2 flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground/85 outline-none placeholder:text-muted-foreground"
        placeholder="Escribe aquí…"
      />
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-xs text-muted-foreground">
          {fechaCorta(nota.actualizadoEl)}
        </span>
        <div className="flex gap-1.5">
          {dirty ? (
            <AsyncButton
              type="button"
              onClick={async () => {
                const saved = await upsert(
                  db.notas,
                  {
                    ...nota,
                    titulo,
                    texto,
                    actualizadoEl: new Date().toISOString(),
                  },
                  version,
                );
                setNota(saved);
                setVersion(db.notas.version(saved));
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Guardar
            </AsyncButton>
          ) : null}
          <AsyncButton
            type="button"
            aria-label={`Eliminar nota ${nota.titulo}`}
            onClick={async () => {
              if (await confirmAction(`¿Eliminar la nota "${nota.titulo}"?`))
                await removeById(db.notas, nota.id, version);
            }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </AsyncButton>
        </div>
      </div>
    </article>
  );
}

export default function NotasPage() {
  const notas = useCollection(db.notas);

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    await upsert(
      db.notas,
      {
        id: uid(),
        titulo: String(data.get("titulo") ?? "Nota"),
        texto: String(data.get("texto") ?? ""),
        actualizadoEl: new Date().toISOString(),
      },
      null,
    );
    form.reset();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas."
        description="Pendientes y acuerdos internos del equipo."
      />

      <AsyncForm
        onSubmit={crear}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <label
            htmlFor="nota-titulo"
            className="text-sm font-medium text-foreground"
          >
            Título
          </label>
          <input
            id="nota-titulo"
            name="titulo"
            required
            placeholder="Pendientes de la semana"
            className={inputClass}
          />
        </div>
        <div className="flex min-w-0 w-full sm:min-w-[240px] flex-1 flex-col gap-1.5">
          <label
            htmlFor="nota-texto"
            className="text-sm font-medium text-foreground"
          >
            Contenido
          </label>
          <textarea
            id="nota-texto"
            name="texto"
            rows={1}
            placeholder="Detalle…"
            className={textareaClass}
          />
        </div>
        <button type="submit" className={btnPrimary}>
          <Plus className="size-4" strokeWidth={1.5} /> Nueva nota
        </button>
      </AsyncForm>

      {notas.length === 0 ? (
        <EmptyState
          title="Sin notas."
          hint="Crea la primera con el formulario de arriba."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notas.map((nota) => (
            <TarjetaNota key={nota.id} nota={nota} />
          ))}
        </div>
      )}
    </div>
  );
}
