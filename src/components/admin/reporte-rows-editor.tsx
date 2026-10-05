"use client";
import { btnGhost, inputClass } from "@/components/admin/ui";
import { REPORTE_TABLES, type ReporteRow, type ReporteTable } from "@/lib/formatos/reporte";

export function ReporteRowsEditor({ kind, value, onChange }: { kind: ReporteTable; value: unknown; onChange: (rows: ReporteRow[]) => void }) {
  const rows = Array.isArray(value) ? value as ReporteRow[] : [];
  const columns = REPORTE_TABLES[kind].columns;
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={index} className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">{columns.map((column) => <label key={column.key} className="text-sm">{column.label}
        <input className={inputClass} type={["autorizado", "ejercido"].includes(column.key) ? "number" : column.key === "fecha" ? "date" : "text"}
          min={["autorizado", "ejercido"].includes(column.key) ? 0 : undefined} step={["autorizado", "ejercido"].includes(column.key) ? "0.01" : undefined}
          value={String(row[column.key] ?? "")} onChange={(event) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: ["autorizado", "ejercido"].includes(column.key) ? event.target.value === "" ? undefined : Number(event.target.value) : event.target.value } : item))} />
      </label>)}</div>
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar registro</button>
    </div>)}
    <button type="button" className={btnGhost} disabled={rows.length >= 30} onClick={() => onChange([...rows, {}])}>Agregar registro</button>
  </div>;
}
