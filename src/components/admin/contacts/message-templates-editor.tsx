"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { Field, selectClass, textareaClass } from "@/components/admin/ui";
import { MESSAGE_TEMPLATES, TEMPLATE_FIELDS, TEMPLATE_MAX, changedTemplates, messagesFor, templateProblems, templateText, type TemplateId, type TemplateOverrides } from "@/lib/admin/message-templates";
import { errorMessage } from "@/lib/admin/store";
import { cn } from "@/lib/utils";

/*
  «Mensajes listos» en Configuración (CRM-02, titular 12/11/2026): el director cambia los textos que
  el asesor manda por WhatsApp desde la ficha. Se guarda solo lo que cambió; «Volver al texto
  aprobado» lo regresa al original. El asesor los ve, pero no los cambia (el servidor también lo
  impide). La vista previa usa datos de ejemplo.
*/

const EXAMPLE_PROPERTY = { slug: "casa-de-ejemplo", titulo: "Casa de ejemplo en Playas", zona: "Playas de Tijuana", precio: { modalidad: "publico" as const, monto: 4_500_000, moneda: "MXN" as const }, estado: "disponible" as const, publicada: true };

export function MessageTemplatesEditor({ saved, canEdit, adviserName, onSave }: {
  saved: TemplateOverrides; canEdit: boolean; adviserName?: string; onSave: (next: TemplateOverrides) => Promise<void>;
}) {
  const [choice, setChoice] = React.useState<TemplateId>(MESSAGE_TEMPLATES[0].id);
  const [drafts, setDrafts] = React.useState<Partial<Record<TemplateId, string>>>({});
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const area = React.useRef<HTMLTextAreaElement>(null);

  const approved = MESSAGE_TEMPLATES.find(t => t.id === choice)!;
  const textOf = (id: TemplateId) => drafts[id] ?? templateText(id, saved);
  const text = textOf(choice);
  const problems = templateProblems(text);
  const next = changedTemplates(Object.fromEntries(MESSAGE_TEMPLATES.map(t => [t.id, textOf(t.id)])));
  const dirty = JSON.stringify(next) !== JSON.stringify(changedTemplates(saved));
  const invalid = MESSAGE_TEMPLATES.filter(t => templateProblems(textOf(t.id)).length > 0);
  const preview = messagesFor({
    nombre: "Laura Méndez", asesor: adviserName || "Ana Ejemplo", zona: "Playas de Tijuana", origin: "https://fortiusinmuebles.com",
    property: choice === "ya-vendido" ? { ...EXAMPLE_PROPERTY, estado: "vendida" } : EXAMPLE_PROPERTY,
    visit: { dia: "jueves 14 de noviembre", hora: "11:00" },
  }, { [choice]: text }).find(m => m.id === choice)!;

  function change(value: string) { setDrafts(old => ({ ...old, [choice]: value })); setNotice(""); }
  function insert(key: string) {
    const el = area.current, token = `{${key}}`;
    const at = el?.selectionStart ?? text.length, end = el?.selectionEnd ?? at;
    change(text.slice(0, at) + token + text.slice(end));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + token.length, at + token.length); });
  }
  async function save() {
    if (invalid.length || busy) return;
    setBusy(true); setError("");
    try { await onSave(next); setDrafts({}); setNotice("Listo: los asesores ya ven los mensajes nuevos."); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  return <section aria-labelledby="cf-mensajes" className="space-y-4 rounded-lg border border-border bg-card p-5">
    <div className="space-y-1">
      <h2 id="cf-mensajes" className="display-soft text-lg text-foreground">Mensajes listos</h2>
      <p className="m-0 text-sm text-muted-foreground">Los textos que el asesor manda por WhatsApp desde la ficha de cada persona. Lo que va entre llaves, como {"{nombre}"}, se llena solo. Lo que va entre corchetes, como [horarios], lo escribe el asesor antes de enviar. Lo que va entre ⟨ ⟩ se quita si falta el dato.</p>
      {!canEdit && <p className="m-0 text-sm font-semibold">Solo el director puede cambiar los mensajes.</p>}
    </div>

    <Field label="Mensaje" htmlFor="cf-mensaje">
      <select id="cf-mensaje" className={selectClass} value={choice} onChange={event => { setChoice(event.target.value as TemplateId); setNotice(""); }}>
        {MESSAGE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}{textOf(t.id) !== t.text ? " · cambiado" : ""}</option>)}
      </select>
    </Field>

    <Field label="Texto" htmlFor="cf-mensaje-texto" hint={`${text.length} de ${TEMPLATE_MAX} caracteres`}>
      <textarea id="cf-mensaje-texto" ref={area} rows={7} className={textareaClass} value={text} readOnly={!canEdit} maxLength={TEMPLATE_MAX} aria-invalid={problems.length > 0} aria-describedby={problems.length ? "cf-mensaje-problemas" : undefined}
        onChange={event => change(event.target.value)} />
    </Field>
    {problems.length > 0 && <ul id="cf-mensaje-problemas" role="alert" className="m-0 list-none space-y-1 p-0 text-sm text-destructive">{problems.map(p => <li key={p}>{p}</li>)}</ul>}

    {canEdit && <div className="space-y-2">
      <p className="m-0 text-sm font-semibold">Agregar un dato</p>
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_FIELDS.map(f => <button key={f.key} type="button" onClick={() => insert(f.key)}
          className="inline-flex min-h-11 items-center rounded-full border px-4 text-[.9375rem] font-[560]">{f.label}</button>)}
      </div>
    </div>}

    <div className="space-y-1">
      <p className="m-0 text-sm font-semibold">Así lo verá la persona (datos de ejemplo)</p>
      <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere] rounded-md border border-border bg-background p-3 text-[.9375rem]">{preview.text}</p>
    </div>

    {canEdit && <div className="flex flex-wrap items-center gap-3">
      <Button disabled={!dirty || invalid.length > 0 || busy} onClick={save}>{busy ? "Guardando…" : "Guardar mensajes"}</Button>
      {text !== approved.text && <button type="button" className={cn("min-h-11 text-sm font-semibold underline underline-offset-4")} onClick={() => change(approved.text)}>Volver al texto aprobado</button>}
      {invalid.length > 0 && <p className="m-0 text-sm text-destructive">Corrige {invalid.map(t => `«${t.name}»`).join(", ")} antes de guardar.</p>}
      {notice && <p role="status" className="m-0 text-sm text-muted-foreground">{notice}</p>}
      {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
    </div>}
  </section>;
}
