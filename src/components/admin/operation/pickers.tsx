"use client";
import * as React from "react";
import { toast } from "sonner";
import { Building2, ChevronDown } from "@/components/admin/icons";
import { Avatar, Thumb } from "@/components/admin/kit";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Checkbox, RadioGroup, RadioGroupItem } from "@/components/ui/controls";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/disclosure";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PANEL_TOASTER } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/*
  Selectores de Asuntos (LV-10c, DEC-52) sobre las piezas de `src/components/ui/`: el asesor con su
  cara (`Select`), el cliente con su cara y el inmueble con su foto (`Combobox`, porque son listas
  largas), las opciones de radio con su etiqueta táctil de 44 px y la casilla con la suya. Radix pone
  flechas, Escape y el foco; aquí solo va la apariencia de cada opción.
*/

/** Valor vacío para `Select`: Radix no admite `value=""` en un elemento. */
const NONE = "__ninguno__";

export type Person = { id: string; nombre: string };

/** Asesor (o persona de una lista corta) con su cara en cada opción. */
export function PersonSelect({ people, value, onChange, id, disabled, placeholder = "Elegir", emptyLabel, className, ...aria }: {
  people: Person[]; value: string; onChange: (id: string) => void; id?: string; disabled?: boolean; placeholder?: string;
  /** Con texto, agrega la opción vacía («Sin responsable», «Ninguna»). */
  emptyLabel?: string; className?: string; "aria-label"?: string; "aria-describedby"?: string;
}) {
  return <Select value={value || (emptyLabel ? NONE : "")} onValueChange={next => onChange(next === NONE ? "" : next)} disabled={disabled}>
    <SelectTrigger id={id} className={className} {...aria}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>
      {emptyLabel && <SelectItem value={NONE}>{emptyLabel}</SelectItem>}
      {people.map(p => <SelectItem key={p.id} value={p.id}><span className="flex min-w-0 items-center gap-2.5"><Avatar name={p.nombre} size={24} /><span className="truncate">{p.nombre}</span></span></SelectItem>)}
    </SelectContent>
  </Select>;
}

/** Opciones de texto corto con su ícono o color, para lo que se elige en pantalla (no en un formulario largo). */
export function OptionSelect<V extends string>({ options, value, onChange, id, disabled, placeholder = "Elegir", className, ...aria }: {
  options: ReadonlyArray<{ value: V; label: string; icon?: React.ReactNode }>; value: V | ""; onChange: (value: V) => void; id?: string; disabled?: boolean; placeholder?: string;
  className?: string; "aria-label"?: string; "aria-describedby"?: string;
}) {
  return <Select value={value} onValueChange={next => onChange(next as V)} disabled={disabled}>
    <SelectTrigger id={id} className={className} {...aria}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}><span className="flex min-w-0 items-center gap-2.5">{o.icon}<span className="truncate">{o.label}</span></span></SelectItem>)}</SelectContent>
  </Select>;
}

/** Cara de una persona para una opción de `Combobox`. */
export const faceOption = (id: string, nombre: string, detail?: string, keywords?: string[]): ComboboxOption =>
  ({ value: id, label: nombre, detail, keywords, media: <Avatar name={nombre} size={28} /> });

/** Foto de un inmueble para una opción de `Combobox`. */
export const photoOption = (slug: string, titulo: string, photo?: string | null, detail?: string): ComboboxOption =>
  ({ value: slug, label: titulo, detail, keywords: [slug], media: <Thumb src={photo ?? undefined} size={36} icon={<Building2 size={16} aria-hidden="true" />} /> });

export { Combobox };
export type { ComboboxOption };

/** Grupo de opciones (radio) con etiquetas de 44 px. `disabled` apaga todo el grupo. */
export function Choices<V extends string>({ name, value, onChange, options, disabled, label, className }: {
  name: string; value: V | ""; onChange: (value: V) => void; options: ReadonlyArray<{ value: V; label: React.ReactNode; detail?: React.ReactNode }>;
  disabled?: boolean; label: string; className?: string;
}) {
  const base = React.useId();
  return <RadioGroup name={name} value={value} onValueChange={next => onChange(next as V)} disabled={disabled} aria-label={label} className={cn("gap-1", className)}>
    {options.map(o => {
      const id = `${base}-${o.value}`;
      return <label key={o.value} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
        <RadioGroupItem id={id} value={o.value} />
        <span className="flex min-w-0 flex-col">{o.label}{o.detail && <span className="text-xs text-muted-foreground">{o.detail}</span>}</span>
      </label>;
    })}
  </RadioGroup>;
}

/** Casilla con su etiqueta (44 px de alto). Se usa como un <input type="checkbox"> controlado. */
export function CheckField({ checked, onChange, disabled, children, className, id, required, ...aria }: {
  checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; children: React.ReactNode; className?: string; id?: string; required?: boolean;
  "aria-describedby"?: string;
}) {
  const own = React.useId(), boxId = id ?? own;
  return <label htmlFor={boxId} className={cn("flex min-h-11 cursor-pointer items-start gap-2.5 py-2.5 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60", className)}>
    <Checkbox id={boxId} checked={checked} onCheckedChange={next => onChange(next === true)} disabled={disabled} required={required} className="mt-px" {...aria} />
    <span className="min-w-0">{children}</span>
  </label>;
}

/**
  Plegable de Asuntos («Lo que dijo en el primer contacto», «Entregas anteriores»): reemplaza a
  <details> con `Collapsible` de Radix. El botón dice si está abierto, la flecha gira y la altura se
  anima en 200 ms; con «reducir movimiento» se abre sin animación (lo resuelve la pieza de ui).
*/
export function Fold({ summary, children, defaultOpen, open, onOpenChange, className, triggerClassName, contentClassName }: {
  summary: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void;
  className?: string; triggerClassName?: string; contentClassName?: string;
}) {
  return <Collapsible defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange} className={className}>
    <CollapsibleTrigger className={cn("group/fold inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] border-0 bg-transparent p-0 text-left font-semibold text-foreground", triggerClassName)}>
      <span>{summary}</span>
      <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform duration-200 ease-[var(--ease-out)] group-data-[state=open]/fold:rotate-180 motion-reduce:transition-none" />
    </CollapsibleTrigger>
    <CollapsibleContent className={contentClassName}>{children}</CollapsibleContent>
  </Collapsible>;
}

/**
  Aviso pasajero de Asuntos («Listo: quedó registrado…») en el apilado de Sonner, abajo al centro,
  con el mismo aspecto que el de «Deshacer». Lo anuncia el lector de pantalla. Si el apilado no está
  montado (pruebas o pantallas sueltas), no hace nada: la pantalla sigue mostrando su aviso en línea.
*/
export function notify(text: string) {
  toast.custom(() => <div role="status" className="flex max-w-[calc(100vw-2rem)] items-center rounded-[14px] bg-[#061f3f] px-4 py-3 text-sm text-[#f8f8ff] shadow-[var(--shadow-float)]">{text}</div>, { toasterId: PANEL_TOASTER, duration: 5000 });
}
