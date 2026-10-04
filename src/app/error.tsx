"use client";

import { useEffect } from "react";
import { DocumentLink } from "@/components/navigation/document-link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public-page] No se pudo completar la carga.");
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center bg-background px-5 py-32 text-foreground">
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-7 md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-primary">Error temporal</p>
        <h1 className="display-title mt-4 text-4xl md:text-5xl">No pudimos cargar esta página.</h1>
        <p className="mt-4 max-w-[52ch] leading-7 text-muted-foreground">
          La información no se mostró como vacía. Intenta cargarla nuevamente en unos momentos.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground"
          >
            Reintentar
          </button>
          <DocumentLink href="/" className="inline-flex min-h-11 items-center rounded-md border border-border px-5 font-medium hover:bg-secondary">
            Volver al inicio
          </DocumentLink>
        </div>
      </div>
    </main>
  );
}
