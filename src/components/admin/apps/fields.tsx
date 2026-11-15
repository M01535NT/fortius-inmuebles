"use client";
import * as React from "react";
import { Checkbox } from "@/components/ui/controls";
import { cn } from "@/lib/utils";

/*
  Casilla con su texto para las herramientas y las páginas de Más (LV-10, bloque g): la casilla de
  Radix (`Checkbox` de `src/components/ui/controls.tsx`) dentro de un <label> que hace de objetivo
  táctil de 44 px. Con `name` funciona dentro de un <form> como la nativa (Radix manda el valor
  cuando está marcada).
*/
export function CheckField({ label, checked, onChange, id, name, value, defaultChecked, disabled, className, labelClassName, "aria-label": ariaLabel, children }: {
  label?: React.ReactNode; checked?: boolean; onChange?: (checked: boolean) => void; id?: string; name?: string; value?: string; defaultChecked?: boolean;
  disabled?: boolean; className?: string; labelClassName?: string; "aria-label"?: string; children?: React.ReactNode;
}) {
  return <label className={cn("flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-sm has-[:disabled]:cursor-not-allowed", className)}>
    <Checkbox id={id} name={name} value={value} aria-label={ariaLabel} disabled={disabled} defaultChecked={defaultChecked}
      {...(checked === undefined ? {} : { checked })} onCheckedChange={next => onChange?.(next === true)} className="mt-px" />
    {(label || children) && <span className={cn("min-w-0 break-words", labelClassName)}>{label}{children}</span>}
  </label>;
}
