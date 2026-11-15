"use client";
import * as React from "react";
import { CalendarDays as CalendarIcon, X } from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/*
  Campo de fecha del panel (shadcn/ui «Date Picker»: Popover + Calendar, DEC-52). Reemplaza a
  <input type="date"> en las pantallas: se ve igual en todos los navegadores, en español y con la
  semana en lunes. Funciona dentro de un <form> como el nativo: manda `name` con el valor
  «AAAA-MM-DD» (o vacío) por un campo oculto, y admite `value`/`onChange` controlados o
  `defaultValue` sin control. Las fechas se leen como día del calendario (sin zona horaria).
*/
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (v?: string | null) => {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})/.exec(v) : null;
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
};
const shown = (d: Date) => d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export type DateFieldProps = {
  id?: string; name?: string; value?: string; defaultValue?: string; onChange?: (iso: string) => void;
  min?: string; max?: string; required?: boolean; disabled?: boolean; placeholder?: string; clearable?: boolean;
  className?: string; "aria-label"?: string; "aria-describedby"?: string; "aria-invalid"?: boolean;
};

export function DateField({ id, name, value, defaultValue, onChange, min, max, required, disabled, placeholder = "Elegir fecha", clearable = !required, className, ...aria }: DateFieldProps) {
  const [inner, setInner] = React.useState(defaultValue ?? "");
  const current = value ?? inner;
  const [open, setOpen] = React.useState(false);
  const selected = fromIso(current);
  const set = (iso: string) => { if (value === undefined) setInner(iso); onChange?.(iso); };
  const minDate = fromIso(min), maxDate = fromIso(max);
  const disabledDays = [minDate ? { before: minDate } : null, maxDate ? { after: maxDate } : null].filter(Boolean) as Array<{ before: Date } | { after: Date }>;
  return <div className={cn("relative flex w-full items-center", className)}>
    {name && <input type="hidden" name={name} value={current} />}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} disabled={disabled} {...aria} aria-haspopup="dialog"
          className={cn(
            "inline-flex min-h-11 w-full items-center gap-2.5 rounded-[var(--field-radius)] border border-[var(--control-edge)] bg-[var(--field-surface)] px-3 text-left text-[0.9375rem] text-foreground",
            "disabled:cursor-not-allowed disabled:opacity-60",
            !selected && "text-muted-foreground",
            clearable && selected && "pr-11",
          )}>
          <CalendarIcon size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate first-letter:uppercase">{selected ? shown(selected) : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="rounded-[12px] border border-[var(--card-edge)] bg-card shadow-[var(--shadow-raised)]">
        <Calendar mode="single" selected={selected} defaultMonth={selected ?? minDate} disabled={disabledDays.length ? disabledDays : undefined} required={required}
          onSelect={(day?: Date) => { set(day ? toIso(day) : ""); setOpen(false); }} autoFocus />
      </PopoverContent>
    </Popover>
    {clearable && selected && !disabled && <button type="button" onClick={() => set("")} aria-label="Quitar fecha"
      className="absolute right-0.5 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:bg-secondary hover:text-foreground">
      <X size={16} aria-hidden="true" />
    </button>}
  </div>;
}
