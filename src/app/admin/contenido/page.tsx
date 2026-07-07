"use client";

import * as React from "react";

import { DemoBanner, Field, PageHeader, btnPrimary, inputClass, textareaClass } from "@/components/admin/ui";
import { contentStore, useSingleton, type SiteContent } from "@/lib/admin/store";

/*
  Copy editable de las secciones clave del sitio. Al conectar el backend,
  estos campos alimentarán directamente los componentes públicos; hoy
  validan el flujo de edición.
*/
export default function ContenidoPage() {
  const content = useSingleton(contentStore);
  const [guardado, setGuardado] = React.useState(false);

  if (!content) return <PageHeader title="Contenido." />;

  function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = Object.fromEntries(
      Object.keys(content as SiteContent).map((k) => [k, String(data.get(k) ?? "")]),
    ) as SiteContent;
    contentStore.save(next);
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <div className="max-w-[760px] space-y-6">
      <PageHeader
        title="Contenido."
        description="El copy de las secciones clave. Guardrails vigentes: sin cifras no verificadas, sin 'garantizado', sin guiones largos."
      />
      <DemoBanner />

      <form onSubmit={guardar} className="space-y-6">
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">Hero</h2>
          <Field label="Titular (H1)" htmlFor="ct-heroTitulo">
            <input id="ct-heroTitulo" name="heroTitulo" required defaultValue={content.heroTitulo} className={inputClass} />
          </Field>
          <Field label="Subtítulo" htmlFor="ct-heroSubtitulo">
            <textarea id="ct-heroSubtitulo" name="heroSubtitulo" rows={2} required defaultValue={content.heroSubtitulo} className={textareaClass} />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">Manifiesto (bloque verde)</h2>
          <Field label="Titular" htmlFor="ct-manifiestoTitulo">
            <input id="ct-manifiestoTitulo" name="manifiestoTitulo" required defaultValue={content.manifiestoTitulo} className={inputClass} />
          </Field>
          <Field label="Texto" htmlFor="ct-manifiestoTexto">
            <textarea id="ct-manifiestoTexto" name="manifiestoTexto" rows={3} required defaultValue={content.manifiestoTexto} className={textareaClass} />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">SEO global</h2>
          <Field label="Title" htmlFor="ct-seoTitle" hint="Ideal: 50–60 caracteres.">
            <input id="ct-seoTitle" name="seoTitle" required defaultValue={content.seoTitle} className={inputClass} />
          </Field>
          <Field label="Description" htmlFor="ct-seoDescription" hint="Ideal: 140–160 caracteres.">
            <textarea id="ct-seoDescription" name="seoDescription" rows={2} required defaultValue={content.seoDescription} className={textareaClass} />
          </Field>
        </section>

        <div className="flex items-center gap-4">
          <button type="submit" className={btnPrimary}>Guardar contenido</button>
          {guardado ? (
            <p aria-live="polite" className="text-[13px] font-medium text-primary">Guardado.</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
