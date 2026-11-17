"use client";
import * as React from "react";
import { Check, ChevronDown } from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import { normalizedText } from "@/lib/admin/workspace";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/*
  Selector con buscador (shadcn/ui «Combobox»: Popover + Command, DEC-52): para elegir una persona,
  un inmueble, un asunto o un responsable de una lista larga escribiendo. Cada opción puede llevar
  su cara, su foto o su ícono (`media`). Busca sin acentos ni mayúsculas. Dentro de un <form> manda
  `name` con el valor elegido.
*/
export type ComboboxOption = { value: string; label: string; detail?: string; media?: React.ReactNode; keywords?: string[] };

export function Combobox({ options, value, onChange, name, id, placeholder = "Elegir…", searchPlaceholder = "Buscar…", empty = "Sin resultados", disabled, className, ...aria }: {
  options: ComboboxOption[]; value: string; onChange: (value: string) => void; name?: string; id?: string;
  placeholder?: string; searchPlaceholder?: string; empty?: string; disabled?: boolean; className?: string;
  "aria-label"?: string; "aria-describedby"?: string; "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const chosen = options.find(o => o.value === value);
  const filter = React.useCallback((itemValue: string, search: string, keywords?: string[]) => {
    const hay = normalizedText([itemValue, ...(keywords ?? [])].join(" "));
    return normalizedText(search).split(/\s+/).filter(Boolean).every(word => hay.includes(word)) ? 1 : 0;
  }, []);
  return <>
    {name && <input type="hidden" name={name} value={value} />}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Radix pone aria-controls al botón (apunta a la ventanita); la regla no lo ve. */}
        {/* eslint-disable-next-line jsx-a11y/role-has-required-aria-props */}
        <button type="button" id={id} role="combobox" aria-expanded={open} disabled={disabled} {...aria} className={cn(
          "inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--field-radius)] border border-[var(--control-edge)] bg-[var(--field-surface)] px-3 text-left text-[0.9375rem] text-foreground disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}>
          <span className={cn("flex min-w-0 items-center gap-2", !chosen && "text-muted-foreground")}>{chosen?.media}<span className="truncate">{chosen ? chosen.label : placeholder}</span></span>
          <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[max(var(--radix-popover-trigger-width),18rem)] overflow-hidden rounded-[12px] border border-[var(--card-edge)] bg-card p-0 shadow-[var(--shadow-raised)]">
        <Command filter={filter}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            <CommandGroup>
              {options.map(o => <CommandItem key={o.value} value={o.value} keywords={[o.label, o.detail ?? "", ...(o.keywords ?? [])]} onSelect={() => { onChange(o.value); setOpen(false); }}>
                {o.media}
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate">{o.label}</span>{o.detail && <span className="truncate text-xs font-normal text-muted-foreground">{o.detail}</span>}</span>
                <Check size={18} aria-hidden="true" className={cn("ml-auto !text-foreground", o.value === value ? "opacity-100" : "opacity-0")} />
              </CommandItem>)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </>;
}
