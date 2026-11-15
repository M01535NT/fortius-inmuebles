"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { usePanelPreference } from "@/components/admin/workspace/preferences-store";

/*
  Densidad del panel (DEC-51, LV-10a; UX-02): Cómodo por omisión o Compacto, con filas más juntas y
  fotos más chicas. Es una preferencia de cada usuario guardada en el servidor; solo cambia cómo se ve.
  Se aplica como `data-density` en la raíz del panel y cada pantalla decide qué aprieta.
*/
type Density = "comodo" | "compacto";
export function useDensity() {
  return usePanelPreference("densidad", "comodo" as Density);
}

/** Pone la densidad elegida en la raíz del panel. Va una vez, dentro del marco. */
export function DensityApplier() {
  const { value } = useDensity();
  React.useEffect(() => {
    const root = document.querySelector<HTMLElement>(".admin-root");
    if (!root) return;
    if (value === "compacto") root.dataset.density = "compacto"; else delete root.dataset.density;
  }, [value]);
  return null;
}

/** Dos botones, Cómodo y Compacto, para el menú de la cuenta. */
export function DensityToggle({ className }: { className?: string }) {
  const { value, save, error } = useDensity();
  const option = (id: Density, label: string) => <button type="button" aria-pressed={value === id} onClick={() => void save(id)}
    className={cn("min-h-9 rounded-[8px] px-3 text-sm font-semibold transition-colors", value === id ? "bg-[var(--panel-selected)] text-[var(--panel-selected-ink)]" : "text-muted-foreground hover:text-foreground")}>{label}</button>;
  return <span className={cn("flex flex-col items-end gap-1", className)}>
    <span role="group" aria-label="Densidad del panel" className="inline-flex gap-0.5 rounded-[10px] border border-[var(--edge-soft)] p-0.5">{option("comodo", "Cómodo")}{option("compacto", "Compacto")}</span>
    {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
  </span>;
}
