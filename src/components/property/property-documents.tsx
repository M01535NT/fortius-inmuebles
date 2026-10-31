"use client";

import * as React from "react";
import { ArrowDownToLine, FileText } from "lucide-react";

import type { DocumentoPropiedad } from "@/data/propiedades";
import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

/*
  Material comercial público. El formulario registra el interés; no es
  un control de confidencialidad. Los archivos privados usan el backend autorizado.
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

  // Confirmar la persistencia antes de anunciar que se recibió el contacto.
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setEnviando(true);
    setError(null);
    try {
      await captureLead({
        website: String(data.get("website") ?? ""),
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
      <div className="fe-card-head p-5">
        <h2 className="text-lg font-semibold text-foreground">Documentos comerciales</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Material público. Los documentos privados se comparten por un canal autorizado.
        </p>
      </div>

      <ul className="divide-y divide-border">
        {documentos.map((doc) => (
          <li key={doc.codigo + doc.url} className="flex items-center gap-3 px-5 py-3.5">
            <FileText className="size-4.5 shrink-0 text-primary-ink" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{doc.nombre} <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">{doc.codigo}</span></p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {doc.descripcion}
              </p>
            </div>
            {unlocked ? (
              <a
                href={doc.url}
                download
                // Los archivos del panel viven en Storage (otro dominio): el navegador los abre; mejor en otra pestaña.
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${doc.nombre} en PDF (se abre en otra pestaña)`}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                <ArrowDownToLine className="size-3.5" strokeWidth={1.5} />
                PDF
              </a>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">PDF</span>
            )}
          </li>
        ))}
      </ul>

      {!unlocked ? (
        <PublicLeadForm onSubmit={onSubmit} className="border-t border-border p-5">
          <div className="grid gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`docs-nombre-${slug}`} className="text-sm font-medium text-foreground">
                Nombre
              </label>
              <input
                id={`docs-nombre-${slug}`}
                name="nombre"
                required
                autoComplete="name"
                placeholder="Tu nombre"
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`docs-telefono-${slug}`} className="text-sm font-medium text-foreground">
                Teléfono o WhatsApp
              </label>
              <input
                id={`docs-telefono-${slug}`}
                name="telefono"
                type="tel"
                required
                autoComplete="tel"
                placeholder="664 000 0000"
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            <ArrowDownToLine className="size-4" strokeWidth={1.5} />
            {enviando ? "Enviando…" : "Liberar descargas"}
          </button>
          {error ? (
            <p
              role="alert"
              className="mt-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm leading-relaxed text-destructive"
            >
              {error}
            </p>
          ) : null}
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Sin compromiso. Usamos tus datos solo para dar seguimiento.
          </p>
        </PublicLeadForm>
      ) : (
        <p className="border-t border-border p-5 text-sm leading-relaxed text-muted-foreground">
          Descargas liberadas. Si quieres el expediente completo o agendar
          visita, escríbenos.
        </p>
      )}
    </div>
  );
}
