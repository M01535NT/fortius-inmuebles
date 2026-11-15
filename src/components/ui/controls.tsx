"use client";
import * as React from "react";
import { Checkbox as CheckboxPrimitive, RadioGroup as RadioPrimitive, Switch as SwitchPrimitive, ToggleGroup as TogglePrimitive, Label as LabelPrimitive, Separator as SeparatorPrimitive } from "radix-ui";
import { Check, Minus } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/*
  Controles del panel (shadcn/ui «Checkbox», «RadioGroup», «Switch», «ToggleGroup», «Label» y
  «Separator» sobre Radix, DEC-52). Objetivo táctil de 44 px: la caja se ve de 20 px pero la etiqueta
  que la acompaña amplía el área (úsese dentro de un <label> o con `Label`). Colores del panel:
  marcado en azul de marca, foco con el anillo del panel.
*/
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root data-slot="checkbox" className={cn(
    "peer inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-[var(--control-edge)] bg-[var(--field-surface)] text-[var(--on-navy)] outline-none",
    "data-[state=checked]:border-[var(--brand-navy)] data-[state=checked]:bg-[var(--brand-navy)] data-[state=indeterminate]:border-[var(--brand-navy)] data-[state=indeterminate]:bg-[var(--brand-navy)]",
    "dark:data-[state=checked]:border-[var(--on-navy-focus)] dark:data-[state=checked]:bg-[var(--on-navy-focus)] dark:data-[state=checked]:text-[var(--background)]",
    "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-color)]",
    className,
  )} {...props}>
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      {props.checked === "indeterminate" ? <Minus size={14} strokeWidth={2.5} aria-hidden="true" /> : <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>;
}

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return <SwitchPrimitive.Root data-slot="switch" className={cn(
    "peer inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent bg-[var(--edge-soft)] p-0.5 outline-none transition-colors duration-150",
    "data-[state=checked]:bg-[var(--success)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-color)]",
    className,
  )} {...props}>
    <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(6,31,63,.25)] transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none data-[state=checked]:translate-x-4" />
  </SwitchPrimitive.Root>;
}

export const RadioGroup = ({ className, ...props }: React.ComponentProps<typeof RadioPrimitive.Root>) =>
  <RadioPrimitive.Root data-slot="radio-group" className={cn("grid gap-2", className)} {...props} />;
export function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioPrimitive.Item>) {
  return <RadioPrimitive.Item data-slot="radio-group-item" className={cn(
    "peer inline-flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--control-edge)] bg-[var(--field-surface)] outline-none",
    "data-[state=checked]:border-[var(--brand-navy)] dark:data-[state=checked]:border-[var(--on-navy-focus)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-color)]",
    className,
  )} {...props}>
    <RadioPrimitive.Indicator className="block size-2.5 rounded-full bg-[var(--brand-navy)] dark:bg-[var(--on-navy-focus)]" />
  </RadioPrimitive.Item>;
}

/** Botones que se excluyen o se suman (barra de vista, filtros rápidos). Para «uno de pocos» con su caja, `Segmented` del kit. */
export function ToggleGroup({ className, ...props }: React.ComponentProps<typeof TogglePrimitive.Root>) {
  return <TogglePrimitive.Root data-slot="toggle-group" className={cn("inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-secondary p-1", className)} {...props} />;
}
export function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof TogglePrimitive.Item>) {
  return <TogglePrimitive.Item data-slot="toggle-group-item" className={cn(
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-medium text-muted-foreground outline-none hover:text-foreground",
    "data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[0_1px_2px_rgba(6,31,63,.08)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-color)]",
    className,
  )} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root data-slot="label" className={cn("flex min-h-11 cursor-pointer select-none items-center gap-2.5 text-[0.9375rem] font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-60", className)} {...props} />;
}

export function Separator({ className, orientation = "horizontal", decorative = true, ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return <SeparatorPrimitive.Root data-slot="separator" decorative={decorative} orientation={orientation} className={cn("shrink-0 bg-[var(--card-edge)]", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)} {...props} />;
}

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("rounded-[var(--radius-thumb)] bg-secondary motion-safe:animate-pulse", className)} {...props} />;
}
