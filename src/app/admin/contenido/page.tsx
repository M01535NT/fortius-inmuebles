"use client";

import * as React from "react";
import { HOME_FIELDS, HOME_TEXT_KEYS, homeText, resolveSiteContent } from "@/data/home-copy";

import {
  AsyncForm,
  DemoBanner,
  Field,
  PageHeader,
  btnPrimary,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  contentStore,
  useSingleton,
  type SiteContent,
} from "@/lib/admin/store";

/*
  Contenido editorial de las secciones clave, persistido en el servidor.
*/
export default function ContenidoPage() {
  const value = useSingleton(contentStore);
  return value ? <Editor initial={value} /> : <PageHeader title="Contenido." />;
}
function Editor({ initial }: { initial: SiteContent }) {
  const [content] = React.useState(() => resolveSiteContent(initial));
  const [version, setVersion] = React.useState(() =>
    contentStore.version("singleton"),
  );
  const [guardado, setGuardado] = React.useState(false);

  if (!content) return <PageHeader title="Contenido." />;

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: SiteContent = { ...content, ...Object.fromEntries(
      ["heroTitulo", "heroSubtitulo", "manifiestoTitulo", "manifiestoTexto", "seoTitle", "seoDescription"].map((k) => [
        k,
        String(data.get(k) ?? ""),
      ]),
    ) };
    next.homeTexts = Object.fromEntries(HOME_TEXT_KEYS.map((key) => [key, String(data.get(`home-${key}`) ?? "").trim()]));
    const saved = await contentStore.save(next, version);
    setVersion(contentStore.version(saved));
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <div className="max-w-[760px] space-y-6">
      <PageHeader
        title="Contenido."
        description="Edita los textos del sitio. Publica servicios y afirmaciones que puedas respaldar; los saltos de línea se conservan en los títulos."
      />
      <DemoBanner />

      <AsyncForm onSubmit={guardar} className="space-y-6">
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">Hero</h2>
          <Field label="Titular (H1)" htmlFor="ct-heroTitulo">
            <textarea
              id="ct-heroTitulo"
              name="heroTitulo"
              required
              defaultValue={content.heroTitulo}
              className={inputClass}
            />
          </Field>
          <Field label="Subtítulo" htmlFor="ct-heroSubtitulo">
            <textarea
              id="ct-heroSubtitulo"
              name="heroSubtitulo"
              rows={2}
              required
              defaultValue={content.heroSubtitulo}
              className={textareaClass}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">
            Manifiesto (bloque azul)
          </h2>
          <Field label="Titular" htmlFor="ct-manifiestoTitulo">
            <textarea
              id="ct-manifiestoTitulo"
              name="manifiestoTitulo"
              required
              defaultValue={content.manifiestoTitulo}
              className={inputClass}
            />
          </Field>
          <Field label="Texto" htmlFor="ct-manifiestoTexto">
            <textarea
              id="ct-manifiestoTexto"
              name="manifiestoTexto"
              rows={3}
              required
              defaultValue={content.manifiestoTexto}
              className={textareaClass}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">SEO global</h2>
          <Field
            label="Title"
            htmlFor="ct-seoTitle"
            hint="Ideal: 50–60 caracteres."
          >
            <input
              id="ct-seoTitle"
              name="seoTitle"
              required
              defaultValue={content.seoTitle}
              className={inputClass}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="ct-seoDescription"
            hint="Ideal: 140–160 caracteres."
          >
            <textarea
              id="ct-seoDescription"
              name="seoDescription"
              rows={2}
              required
              defaultValue={content.seoDescription}
              className={textareaClass}
            />
          </Field>
        </section>

        {Array.from(new Set(HOME_TEXT_KEYS.map((key) => HOME_FIELDS[key].group))).map((group) => (
          <details key={group} className="rounded-lg border border-border bg-card p-5">
            <summary className="min-h-11 cursor-pointer font-semibold text-foreground">{group}</summary>
            <div className="mt-4 space-y-4">
              {HOME_TEXT_KEYS.filter((key) => HOME_FIELDS[key].group === group).map((key) => (
                <Field key={key} label={HOME_FIELDS[key].label} htmlFor={`home-${key}`}>
                  <textarea id={`home-${key}`} name={`home-${key}`} defaultValue={homeText(content, key)} rows={3} maxLength={4000} className={textareaClass} />
                </Field>
              ))}
            </div>
          </details>
        ))}
        <div className="flex items-center gap-4">
          <button type="submit" className={btnPrimary}>
            Guardar contenido
          </button>
          {guardado ? (
            <p
              aria-live="polite"
              className="text-sm font-medium text-primary-ink"
            >
              Guardado.
            </p>
          ) : null}
        </div>
      </AsyncForm>
    </div>
  );
}
