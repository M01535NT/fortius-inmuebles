"use client";
import { Checkbox, Label } from "@/components/ui/controls";

export function InventoryScope({ count, included, onChange }: { count: number; included: boolean; onChange: (value: boolean) => void }) {
  return <div className="admin-data-scope" role="group" aria-label="Alcance de los indicadores de inmuebles">
    <p>{included ? "Indicadores con ejemplos Demo" : "Indicadores sin inmuebles Demo"}{count > 0 && <span> · {count} {count === 1 ? "ejemplo conservado" : "ejemplos conservados"} en inventario</span>}</p>
    {count > 0 && <Label className="text-sm"><Checkbox checked={included} onCheckedChange={checked => onChange(checked === true)} />Incluir inmuebles Demo</Label>}
  </div>;
}
