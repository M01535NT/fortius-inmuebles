"use client";
import { btnGhost, inputClass } from "./ui";
import { INTERMEDIACION_TABLES, type IntermediacionTable, type IntermediacionRow } from "@/lib/formatos/intermediacion";

export function IntermediacionRowsEditor({ kind, value, onChange }: { kind: IntermediacionTable; value: unknown; onChange: (rows: IntermediacionRow[]) => void }) {
  const rows = Array.isArray(value) ? value as IntermediacionRow[] : [];
  const config = INTERMEDIACION_TABLES[kind];
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={index} className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">{config.columns.map((column) => <label key={column.key} className="text-sm">{column.label}<input className={inputClass} type={column.key === "fecha" ? "date" : "text"} value={row[column.key] ?? ""} onChange={(event) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: event.target.value } : item))} /></label>)}</div>
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar {config.label} {index + 1}</button>
    </div>)}
    <button type="button" className={btnGhost} disabled={rows.length >= 30} onClick={() => onChange([...rows, {}])}>Agregar {config.label}</button>
  </div>;
}
