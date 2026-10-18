"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "@/components/admin/icons";
import { BLOG_CATEGORIES, BLOG_FORMATS, postCategory, postFormat, formatBlogDate } from "@/lib/blog-editorial";

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
        categoria: String(data.get("categoria") || "") as Post["categoria"] || undefined,
        formato: String(data.get("formato") || "guia") as Post["formato"],
        destacado: data.get("destacado") === "on",
        autor: String(data.get("autor") ?? "").trim(),
        ambito: String(data.get("ambito") ?? "").trim(),
        fuenteNombre: String(data.get("fuenteNombre") ?? "").trim(),
        fuenteUrl: String(data.get("fuenteUrl") ?? "").trim(),
        ...(post?.publicadoEl ? { publicadoEl: post.publicadoEl } : {}),
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de contenido" htmlFor="post-formato">
          <select id="post-formato" name="formato" defaultValue={post ? postFormat(post) : "guia"} className={selectClass}>
            {Object.entries(BLOG_FORMATS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Tema" htmlFor="post-categoria">
          <select id="post-categoria" name="categoria" defaultValue={post ? postCategory(post) ?? "" : ""} className={selectClass}>
            <option value="">Sin clasificar</option>
            {Object.entries(BLOG_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Autor" htmlFor="post-autor">
          <input id="post-autor" name="autor" maxLength={500} defaultValue={post?.autor} className={inputClass} />
        </Field>
        <Field label="Ámbito o zona" htmlFor="post-ambito" hint="Por ejemplo: Tijuana, Baja California o México.">
          <input id="post-ambito" name="ambito" maxLength={500} defaultValue={post?.ambito} className={inputClass} />
        </Field>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" name="destacado" defaultChecked={post?.destacado} className="size-5 accent-primary" />
        Destacar en portada
      </label>
      <p className="text-sm text-muted-foreground">Si hay varios destacados, se muestra primero el más reciente. Sin destacados, se presenta la última publicación.</p>
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
        hint="Separa párrafos con una línea en blanco. Usa ## para títulos, ### para subtítulos, - para viñetas y 1. para listas numeradas; cada elemento va en su propia línea. Enlaces: [texto](/ruta) o [texto](https://sitio.com); también se admite http://. El HTML se muestra como texto. Voz directa, sin promesas absolutas."
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
      <fieldset className="space-y-4 rounded-md border border-border p-4">
        <legend className="px-2 text-sm font-medium">Fuente principal</legend>
        <p className="text-sm text-muted-foreground">En actualidad, indica qué ocurrió, cuándo y a quién afecta. Enlaza la fuente original; puedes añadir más fuentes en el contenido.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de la fuente" htmlFor="post-fuente-nombre">
            <input id="post-fuente-nombre" name="fuenteNombre" maxLength={500} defaultValue={post?.fuenteNombre} className={inputClass} />
          </Field>
          <Field label="Enlace a la fuente" htmlFor="post-fuente-url">
            <input id="post-fuente-url" name="fuenteUrl" type="url" maxLength={2048} defaultValue={post?.fuenteUrl} placeholder="https://" className={inputClass} />
          </Field>
        </div>
      </fieldset>
      <p className="text-sm text-muted-foreground">
        {post?.publicadoEl ? `Publicado el ${formatBlogDate(post.publicadoEl)}. La fecha se conserva al editar.` : post?.estado === "publicado" ? "Artículo anterior sin fecha de primera publicación registrada. Se muestra su última actualización." : "La fecha de publicación se registra automáticamente al publicar por primera vez."}
      </p>
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
        title="Blog"
        description="Publica guías y actualidad, clasifica los temas y elige el destacado de portada. Los borradores permanecen en el panel."
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
                  <span className="truncate text-base font-medium text-foreground">
                    {p.titulo}
                  </span>
                  <Badge tone={p.estado === "publicado" ? "green" : "amber"}>
                    {p.estado === "publicado" ? "Expuesto públicamente" : "Borrador"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{BLOG_FORMATS[postFormat(p)]}{postCategory(p) ? ` · ${BLOG_CATEGORIES[postCategory(p)!]}` : ""}{p.destacado ? " · Destacado" : ""}</span>
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
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
                    if (await confirmAction(`¿Eliminar "${p.titulo}"?`))
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
