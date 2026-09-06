"use client";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  btnGhost,
  btnPrimary,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  db,
  fechaCorta,
  removeById,
  uid,
  upsert,
  useCollection,
  type Post,
} from "@/lib/admin/store";

/* Blog: redacción, borradores y publicación en las rutas públicas del sitio. */
function Editor({ post: source, onDone }: { post?: Post; onDone: () => void }) {
  const [post] = React.useState(source);
  const [version] = React.useState(() =>
    source ? db.posts.version(source) : null,
  );
  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await upsert(
      db.posts,
      {
        id: post?.id ?? uid(),
        slug: post?.slug ?? String(data.get("slug") ?? ""),
        titulo: String(data.get("titulo") ?? ""),
        resumen: String(data.get("resumen") ?? ""),
        contenido: String(data.get("contenido") ?? ""),
        estado: String(data.get("estado") ?? "borrador") as Post["estado"],
        actualizadoEl: new Date().toISOString(),
      },
      version,
    );
    onDone();
  }

  return (
    <AsyncForm
      onSubmit={guardar}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <h2 className="display-soft text-lg text-foreground">
        {post ? `Editando: ${post.titulo}` : "Nueva entrada"}
      </h2>
      <Field
        label="Slug"
        htmlFor="post-slug"
        hint={
          post
            ? "La ruta queda fija después de crear la entrada."
            : "Ruta pública sin espacios, por ejemplo: guia-para-comprar."
        }
      >
        <input
          id="post-slug"
          name="slug"
          required
          readOnly={Boolean(post)}
          defaultValue={post?.slug}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className={
            inputClass +
            (post ? " bg-secondary text-muted-foreground" : "")
          }
        />
      </Field>
      <Field label="Título" htmlFor="post-titulo">
        <input
          id="post-titulo"
          name="titulo"
          required
          defaultValue={post?.titulo}
          className={inputClass}
        />
      </Field>
      <Field label="Resumen" htmlFor="post-resumen">
        <textarea
          id="post-resumen"
          name="resumen"
          rows={2}
          required
          defaultValue={post?.resumen}
          className={textareaClass}
        />
      </Field>
      <Field
        label="Contenido"
        htmlFor="post-contenido"
        hint="Párrafos separados por línea en blanco. Voz de la marca: directa, sin promesas absolutas."
      >
        <textarea
          id="post-contenido"
          name="contenido"
          rows={10}
          required
          defaultValue={post?.contenido}
          className={textareaClass}
        />
      </Field>
      <Field label="Estado" htmlFor="post-estado">
        <select
          id="post-estado"
          name="estado"
          defaultValue={post?.estado ?? "borrador"}
          className={selectClass + " max-w-[220px]"}
        >
          <option value="borrador">Borrador</option>
          <option value="publicado">Expuesto públicamente</option>
        </select>
      </Field>
      <div className="flex gap-3">
        <button type="submit" className={btnPrimary}>
          Guardar entrada
        </button>
        <button type="button" onClick={onDone} className={btnGhost}>
          Cancelar
        </button>
      </div>
    </AsyncForm>
  );
}

export default function BlogAdminPage() {
  const posts = useCollection(db.posts);
  const [editando, setEditando] = React.useState<string | "nuevo" | null>(null);

  const post =
    editando && editando !== "nuevo"
      ? posts.find((p) => p.id === editando)
      : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog."
        description="Redacta y publica artículos del sitio. Los borradores permanecen visibles únicamente en el panel."
        actions={
          <button
            type="button"
            onClick={() => setEditando("nuevo")}
            className={btnPrimary}
          >
            <Plus className="size-4" strokeWidth={1.5} /> Nueva entrada
          </button>
        }
      />
      {editando ? (
        <Editor key={editando} post={post} onDone={() => setEditando(null)} />
      ) : null}

      {posts.length === 0 ? (
        <EmptyState
          title="Sin entradas."
          hint="Redacta la primera guía local: es la base del SEO editorial."
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[14.5px] font-medium text-foreground">
                    {p.titulo}
                  </span>
                  <Badge tone={p.estado === "publicado" ? "green" : "amber"}>
                    {p.estado === "publicado" ? "Expuesto públicamente" : "Borrador"}
                  </Badge>
                </p>
                <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                  Slug: {p.slug} · {fechaCorta(p.actualizadoEl)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  aria-label={`Editar ${p.titulo}`}
                  onClick={() => setEditando(p.id)}
                  className="rounded-md border border-border p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="size-3.5" strokeWidth={1.5} />
                </button>
                <AsyncButton
                  type="button"
                  aria-label={`Eliminar ${p.titulo}`}
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar "${p.titulo}"?`))
                      await removeById(db.posts, p.id, db.posts.version(p));
                  }}
                  className="rounded-md border border-border p-2 text-foreground/70 transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </AsyncButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
