"use client";

import * as React from "react";
import { HOME_FIELDS, HOME_TEXT_KEYS, homeText, resolveSiteContent } from "@/data/home-copy";

import {
  AsyncForm,
  Field,
  PageHeader,
  btnDanger,
  btnGhost,
  btnPrimary,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  contentStore,
  useSingleton,
  type SiteContent,
} from "@/lib/admin/store";
import type { PreguntaFrecuente, Testimonio } from "@/lib/domain/records";

const newId = () => crypto.randomUUID();
const GRUPO_LABELS: Record<PreguntaFrecuente["grupo"], string> = { vender: "Para vender", comprar: "Para comprar", general: "En general" };

/*
  Contenido editorial de las secciones clave, persistido en el servidor.
*/
export default function ContenidoPage() {
  const value = useSingleton(contentStore);
  return value ? <Editor initial={value} /> : <PageHeader title="Textos del sitio" />;
}
function Editor({ initial }: { initial: SiteContent }) {
  const [content] = React.useState(() => resolveSiteContent(initial));
  const [version, setVersion] = React.useState(() =>
    contentStore.version("singleton"),
  );
  const [guardado, setGuardado] = React.useState(false);
  const [preguntas, setPreguntas] = React.useState<PreguntaFrecuente[]>(() => content.preguntas ?? []);
  const [testimonios, setTestimonios] = React.useState<Testimonio[]>(() => content.testimonios ?? []);

  if (!content) return <PageHeader title="Textos del sitio" />;

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
    next.preguntas = preguntas.map((item) => ({ ...item, pregunta: item.pregunta.trim(), respuesta: item.respuesta.trim() })).filter((item) => item.pregunta && item.respuesta);
    next.testimonios = testimonios.map((item) => ({ ...item, texto: item.texto.trim(), nombre: item.nombre.trim(), detalle: item.detalle.trim() })).filter((item) => item.texto && item.nombre);
    const saved = await contentStore.save(next, version);
    setVersion(contentStore.version(saved));
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <div className="max-w-[760px] space-y-6">
      <PageHeader
        title="Textos del sitio"
        description="Textos del sitio. Publica solo lo que puedas respaldar."
      />

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
            Por qué Fortius
          </h2>
          <Field label="Título de la sección" htmlFor="ct-manifiestoTitulo">
            <textarea
              id="ct-manifiestoTitulo"
              name="manifiestoTitulo"
              required
              defaultValue={content.manifiestoTitulo}
              className={inputClass}
            />
          </Field>
          <Field label="Precio con referencias · descripción" htmlFor="ct-manifiestoTexto">
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
        <details className="rounded-lg border border-border bg-card p-5">
          <summary className="min-h-11 cursor-pointer font-semibold text-foreground">Preguntas frecuentes adicionales ({preguntas.length})</summary>
          <p className="mt-3 text-sm text-muted-foreground">Se suman a «Preguntas frecuentes». Respuestas que puedas respaldar.</p>
          <ul className="mt-4 space-y-4">
            {preguntas.map((item, index) => (
              <li key={item.id} className="space-y-3 rounded-md border border-border p-4">
                <Field label="Grupo" htmlFor={`faq-grupo-${item.id}`}>
                  <select id={`faq-grupo-${item.id}`} value={item.grupo} className={selectClass}
                    onChange={(e) => setPreguntas((list) => list.map((row, i) => i === index ? { ...row, grupo: e.target.value as PreguntaFrecuente["grupo"] } : row))}>
                    {(Object.keys(GRUPO_LABELS) as PreguntaFrecuente["grupo"][]).map((key) => <option key={key} value={key}>{GRUPO_LABELS[key]}</option>)}
                  </select>
                </Field>
                <Field label="Pregunta" htmlFor={`faq-pregunta-${item.id}`}>
                  <input id={`faq-pregunta-${item.id}`} value={item.pregunta} maxLength={300} className={inputClass}
                    onChange={(e) => setPreguntas((list) => list.map((row, i) => i === index ? { ...row, pregunta: e.target.value } : row))} />
                </Field>
                <Field label="Respuesta" htmlFor={`faq-respuesta-${item.id}`}>
                  <textarea id={`faq-respuesta-${item.id}`} value={item.respuesta} rows={3} maxLength={4000} className={textareaClass}
                    onChange={(e) => setPreguntas((list) => list.map((row, i) => i === index ? { ...row, respuesta: e.target.value } : row))} />
                </Field>
                <button type="button" className={btnDanger} onClick={() => setPreguntas((list) => list.filter((_, i) => i !== index))}>Quitar pregunta</button>
              </li>
            ))}
          </ul>
          <button type="button" className={btnGhost + " mt-4"} onClick={() => setPreguntas((list) => [...list, { id: newId(), grupo: "vender", pregunta: "", respuesta: "" }])}>Agregar pregunta</button>
        </details>

        <details className="rounded-lg border border-border bg-card p-5">
          <summary className="min-h-11 cursor-pointer font-semibold text-foreground">Testimonios ({testimonios.length})</summary>
          <p className="mt-3 text-sm text-muted-foreground">Salen en el inicio solo con autorización por escrito. Sin ninguno, la sección no aparece.</p>
          <ul className="mt-4 space-y-4">
            {testimonios.map((item, index) => (
              <li key={item.id} className="space-y-3 rounded-md border border-border p-4">
                <Field label="Testimonio" htmlFor={`tes-texto-${item.id}`}>
                  <textarea id={`tes-texto-${item.id}`} value={item.texto} rows={3} maxLength={1200} className={textareaClass}
                    onChange={(e) => setTestimonios((list) => list.map((row, i) => i === index ? { ...row, texto: e.target.value } : row))} />
                </Field>
                <Field label="Nombre" htmlFor={`tes-nombre-${item.id}`}>
                  <input id={`tes-nombre-${item.id}`} value={item.nombre} maxLength={120} className={inputClass}
                    onChange={(e) => setTestimonios((list) => list.map((row, i) => i === index ? { ...row, nombre: e.target.value } : row))} />
                </Field>
                <Field label="Detalle (opcional)" htmlFor={`tes-detalle-${item.id}`} hint="Por ejemplo: vendió una casa en Tijuana.">
                  <input id={`tes-detalle-${item.id}`} value={item.detalle} maxLength={160} className={inputClass}
                    onChange={(e) => setTestimonios((list) => list.map((row, i) => i === index ? { ...row, detalle: e.target.value } : row))} />
                </Field>
                <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
                  <input type="checkbox" checked={item.autorizado} className="h-5 w-5"
                    onChange={(e) => setTestimonios((list) => list.map((row, i) => i === index ? { ...row, autorizado: e.target.checked } : row))} />
                  Tengo autorización por escrito de esta persona para publicarlo
                </label>
                <button type="button" className={btnDanger} onClick={() => setTestimonios((list) => list.filter((_, i) => i !== index))}>Quitar testimonio</button>
              </li>
            ))}
          </ul>
          <button type="button" className={btnGhost + " mt-4"} onClick={() => setTestimonios((list) => [...list, { id: newId(), texto: "", nombre: "", detalle: "", autorizado: false }])}>Agregar testimonio</button>
        </details>

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
