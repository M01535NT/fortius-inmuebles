"use client";
import * as React from "react";
import { CircleHelp } from "lucide-react";
import { inputClass, selectClass } from "@/components/admin/ui";
import type { Plantilla } from "@/lib/formatos/ayuda";

/*
  Ayuda discreta para capturar formatos: un «?» junto a la etiqueta muestra la explicación
  (también aparece sola mientras se escribe en el campo), los campos cortos eligen de una
  lista con opción «Otro» y los textos largos ofrecen sus plantillas en un desplegable.
*/

const OTHER = "__otro";

/** Etiqueta con su «?»; la explicación se ve al pulsarlo o al estar dentro del campo. */
export function AssistedLabel({ id, label, help, children }: { id: string; label: string; help?: string; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <>
    <div className="mb-1.5 flex min-h-6 items-center gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      {help && <button type="button" aria-label={`Qué poner en «${label}»`} aria-expanded={open} aria-controls={`${id}-ayuda`} onClick={() => setOpen(value => !value)}
        className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
        <CircleHelp size={15} aria-hidden="true" />
      </button>}
      {children && <div className="ml-auto">{children}</div>}
    </div>
    {help && <p id={`${id}-ayuda`} className={`mb-2 text-xs leading-relaxed text-muted-foreground ${open ? "block" : "hidden group-focus-within:block"}`}>{help}</p>}
  </>;
}

/** Desplegable compacto que inserta una plantilla en un texto largo. */
export function TemplateMenu({ label, templates, onPick }: { label: string; templates: Plantilla[]; onPick: (text: string) => void }) {
  return <select aria-label={`Usar una plantilla en «${label}»`} value="" onChange={event => { const pick = templates.find(t => t.label === event.target.value); if (pick) onPick(pick.text); }}
    className="cursor-pointer rounded-md border-transparent! bg-transparent! pr-7 text-right font-semibold text-primary-ink! hover:bg-secondary!">
    <option value="">Usar plantilla…</option>
    {templates.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
  </select>;
}

/** Campo corto: se elige de la lista; «Otro» permite escribirlo. */
export function ChoiceOrOther({ id, value, templates, required, describedBy, onChange }: { id: string; value: string; templates: Plantilla[]; required: boolean; describedBy?: string; onChange: (value: string) => void }) {
  const listed = templates.some(t => t.text === value);
  const [other, setOther] = React.useState(!!value && !listed);
  if (other) return <div className="flex gap-2">
    <input id={id} aria-describedby={describedBy} required={required} value={value} autoFocus={!value} onChange={event => onChange(event.target.value)} className={inputClass} placeholder="Escribe la respuesta" />
    <button type="button" onClick={() => { setOther(false); if (!templates.some(t => t.text === value)) onChange(""); }} className="shrink-0 text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground">Ver lista</button>
  </div>;
  return <select id={id} aria-describedby={describedBy} required={required} value={listed ? value : ""} onChange={event => { if (event.target.value === OTHER) { setOther(true); onChange(""); } else onChange(event.target.value); }} className={selectClass}>
    <option value="">Selecciona</option>
    {templates.map(t => <option key={t.label} value={t.text}>{t.text}</option>)}
    <option value={OTHER}>Otro (escribir)</option>
  </select>;
}
