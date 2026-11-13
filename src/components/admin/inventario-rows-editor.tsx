"use client";
import { btnGhost, inputClass, selectClass } from "./ui";
import { INVENTARIO_TABLAS, type InventarioRow, type InventarioTabla } from "@/lib/formatos/inventario-renta";

/** Renglones del inventario de la renta (23): lo de la entrega primero; las columnas «al devolver» se llenan al salir. */
export function InventarioRowsEditor({ kind, value, onChange }: { kind: InventarioTabla; value: unknown; onChange: (rows: InventarioRow[]) => void }) {
  const rows = Array.isArray(value) ? value as InventarioRow[] : [];
  const config = INVENTARIO_TABLAS[kind];
  const set = (index: number, key: string, next: string) => onChange(rows.map((item, at) => at === index ? { ...item, [key]: next } : item));
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={index} className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">{config.columns.filter(column => column.key !== "danoSalida" || row.salida === "dano").map((column) => <label key={column.key} className="text-sm">{column.label}
        {column.options
          ? <select className={selectClass} value={row[column.key] ?? ""} onChange={(event) => set(index, column.key, event.target.value)}><option value="">Selecciona</option>{column.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : <input className={inputClass} value={row[column.key] ?? ""} onChange={(event) => set(index, column.key, event.target.value)} />}
      </label>)}</div>
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar {config.label} {index + 1}</button>
    </div>)}
    <button type="button" className={btnGhost} disabled={rows.length >= 80} onClick={() => onChange([...rows, {}])}>Agregar {config.label}</button>
  </div>;
}
