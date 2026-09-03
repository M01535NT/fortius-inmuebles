"use client";

import * as React from "react";
import { ArrowDownToLine, FileText, LockKeyhole } from "lucide-react";

import type { DocumentoPropiedad } from "@/data/propiedades";
import { captureLead } from "@/lib/admin/store";

/*
  Documentos descargables de la propiedad (PDFs cargados desde el panel,
  sección Inmuebles). Se liberan a cambio de nombre y teléfono: cada
  descarga es un lead persistido con la propiedad de origen.
*/
type Props = {
  documentos: DocumentoPropiedad[];
  slug: string;
  codigo: string;
};

export function PropertyDocuments({ documentos, slug, codigo }: Props) {
  const [unlocked, setUnlocked] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (documentos.length === 0) return null;

  /*
    Los PDFs se entregan a cambio del contacto. Si el contacto no llegó al
    backend dedicado de COTA, no se libera la descarga: sería regalar el documento y perder
    el prospecto a la vez.
  */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setEnviando(true);
    setError(null);
    try {
      await captureLead({
        nombre: String(data.get("nombre") ?? ""),
        telefono: String(data.get("telefono") ?? ""),
        origen: "documentos",
        propiedadSlug: slug,
        mensaje: `Descargó documentos de ${codigo}`,
      });
      setUnlocked(true);
    } catch {
      setError("No pudimos enviar tus datos. Inténtalo otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-5 pb-0">
        <h2 className="display-soft text-xl text-foreground">Documentos de la propiedad</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Déjanos tu contacto y los PDFs se liberan de inmediato; el
          expediente completo se comparte en persona.
        </p>
      </div>

      <ul className="mt-4 divide-y divide-border border-t border-border">
        {documentos.map((doc) => (
          <li key={doc.codigo + doc.url} className="flex items-center gap-3 px-5 py-3.5">
            <FileText className="size-4.5 shrink-0 text-primary" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-foreground">{doc.nombre}</p>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                <span className="font-mono text-[11px]">{doc.codigo}</span> · {doc.descripcion}
              </p>
            </div>
            {unlocked ? (
              <a
                href={doc.url}
                download
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                <ArrowDownToLine className="size-3.5" strokeWidth={1.5} />
                PDF
              </a>
            ) : (
              <LockKeyhole className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
            )}
          </li>
        ))}
      </ul>

      {!unlocked ? (
        <form onSubmit={onSubmit} className="border-t border-border p-5">
          <div className="grid gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`docs-nombre-${slug}`} className="text-[13px] font-medium text-foreground">
                Nombre
              </label>
              <input
                id={`docs-nombre-${slug}`}
                name="nombre"
                required
                autoComplete="name"
                placeholder="Tu nombre"
                className="h-10 rounded-md border border-input bg-background px-3 text-[14px] text-foreground placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`docs-telefono-${slug}`} className="text-[13px] font-medium text-foreground">
                Teléfono o WhatsApp
              </label>
              <input
                id={`docs-telefono-${slug}`}
                name="telefono"
                type="tel"
                required
                autoComplete="tel"
                placeholder="664 000 0000"
                className="h-10 rounded-md border border-input bg-background px-3 text-[14px] text-foreground placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            <ArrowDownToLine className="size-4" strokeWidth={1.5} />
            {enviando ? "Enviando…" : "Liberar descargas"}
          </button>
          {error ? (
            <p
              role="alert"
              className="mt-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12.5px] leading-relaxed text-destructive"
            >
              {error}
            </p>
          ) : null}
          <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">
            Sin compromiso. Usamos tus datos solo para dar seguimiento.
          </p>
        </form>
      ) : (
        <p className="border-t border-border p-5 text-[13px] leading-relaxed text-muted-foreground">
          Descargas liberadas. Si quieres el expediente completo o agendar
          visita, escríbenos.
        </p>
      )}
    </div>
  );
}
