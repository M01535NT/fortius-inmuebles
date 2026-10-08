"use client";

import * as React from "react";
import Image from "next/image";
import {
  FileText,
  Film,
  ImageIcon,
  Link2,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";

import {
  AsyncForm,
  AsyncButton,
  UploadControl,
  DemoBanner,
  EmptyState,
  Field,
  PageHeader,
  btnPrimary,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import {
  db,
  archivoFromUpload,
  removeById,
  uid,
  upsert,
  useCollection,
  type ArchivoTipo,
  openFile,
} from "@/lib/admin/store";

/*
  Biblioteca: URLs externas y cargas validadas. Quitar del catálogo solo
  elimina metadatos; los bytes almacenados no se borran desde esta pantalla.
*/
const ICONOS: Record<ArchivoTipo, typeof FileText> = {
  imagen: ImageIcon,
  pdf: FileText,
  video: Film,
  otro: Paperclip,
};

export default function ArchivosPage() {
  const archivos = useCollection(db.archivos);
  const [filtro, setFiltro] = React.useState<ArchivoTipo | "todos">("todos");

  const filtrados = archivos.filter(
    (a) => filtro === "todos" || a.tipo === filtro,
  );

  async function agregar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    await upsert(
      db.archivos,
      {
        id: uid(),
        nombre: String(data.get("nombre") ?? ""),
        url: String(data.get("url") ?? ""),
        tipo: String(data.get("tipo") ?? "otro") as ArchivoTipo,
        notas: String(data.get("notas") ?? ""),
      },
      null,
    );
    form.reset();
  }

  const chip =
    "inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archivos."
        description="Catálogo de imágenes, PDFs y videos. Carga validada de hasta 20 MB; archivos privados solo para personal autorizado."
      />
      <DemoBanner />
      <UploadControl
        onUploaded={async (file) => {
          await upsert(
            db.archivos,
            archivoFromUpload(uid(), file),
            null,
          );
        }}
      />

      <AsyncForm
        onSubmit={agregar}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label
            htmlFor="ar-nombre"
            className="text-sm font-medium text-foreground"
          >
            Nombre
          </label>
          <input
            id="ar-nombre"
            name="nombre"
            required
            placeholder="Brochure residencial"
            className={inputClass}
          />
        </div>
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <label
            htmlFor="ar-url"
            className="text-sm font-medium text-foreground"
          >
            URL
          </label>
          <input
            id="ar-url"
            name="url"
            required
            placeholder="/descargas/… o https://…"
            className={inputClass}
          />
        </div>
        <Field label="Tipo" htmlFor="ar-tipo">
          <select
            id="ar-tipo"
            name="tipo"
            className={selectClass + " w-[120px]"}
          >
            <option value="imagen">Imagen</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="otro">Otro</option>
          </select>
        </Field>
        <Field label="Notas del archivo" htmlFor="ar-notas">
          <input id="ar-notas" name="notas" className={inputClass} />
        </Field>
        <button type="submit" className={btnPrimary}>
          <Plus className="size-4" strokeWidth={1.5} /> Registrar
        </button>
      </AsyncForm>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filtrar por tipo"
      >
        {(["todos", "imagen", "pdf", "video", "otro"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={filtro === t}
            onClick={() => setFiltro(t)}
            className={
              chip +
              (filtro === t
                ? " border-primary/50 bg-secondary text-foreground"
                : " border-border text-foreground/70 hover:bg-secondary")
            }
          >
            {t === "todos" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <EmptyState title="Sin archivos de ese tipo." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((archivo) => {
            const Icono = ICONOS[archivo.tipo];
            return (
              <article
                key={archivo.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                {archivo.tipo === "imagen" &&
                !archivo.url.includes("/api/admin/") ? (
                  <div className="relative aspect-[16/10] border-b border-border">
                    <Image
                      src={archivo.url}
                      alt={archivo.nombre}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center border-b border-border bg-secondary/40">
                    <Icono
                      className="size-8 text-muted-foreground"
                      strokeWidth={1.25}
                    />
                  </div>
                )}
                <div className="p-3.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {archivo.nombre}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {archivo.url}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <AsyncButton
                      type="button"
                      onClick={async () => await openFile(archivo.url)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink hover:text-foreground"
                    >
                      <Link2 className="size-3.5" strokeWidth={1.5} /> Abrir
                    </AsyncButton>
                    <AsyncButton
                      type="button"
                      aria-label={`Quitar de la biblioteca ${archivo.nombre}`}
                      onClick={async () => {
                        if (
                          window.confirm(
                            `¿Quitar "${archivo.nombre}" del catálogo? El archivo físico no se borra.`,
                          )
                        )
                          await removeById(
                            db.archivos,
                            archivo.id,
                            db.archivos.version(archivo),
                          );
                      }}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </AsyncButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
