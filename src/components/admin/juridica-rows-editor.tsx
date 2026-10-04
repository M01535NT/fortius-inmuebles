"use client";
import { btnGhost, inputClass, selectClass } from "@/components/admin/ui";
import { JURIDICA_TABLES, mostrarColumnaJuridica, type JuridicaRow, type JuridicaTable } from "@/lib/formatos/juridica";

export function JuridicaRowsEditor({ kind, value, onChange }: { kind: JuridicaTable; value: unknown; onChange: (rows: JuridicaRow[]) => void }) {
  const config = JURIDICA_TABLES[kind];
  const saved = Array.isArray(value) ? value as JuridicaRow[] : [];
  const rows: JuridicaRow[] = config.fixed ? config.fixed.map((item) => ({ concepto: item.key, ...saved.find((row) => row.concepto === item.key) })) : saved;
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={config.fixed?.[index]?.key ?? index} className="rounded-lg border border-border bg-card p-4">
      {config.fixed && <h4 className="mb-3 text-sm font-semibold">{config.fixed[index].key} · {config.fixed[index].label}</h4>}
      <div className="grid gap-3 sm:grid-cols-2">{config.columns.filter((column) => mostrarColumnaJuridica(kind, column.key, row)).map((column) => <label key={column.key} className="text-sm">{column.label}
        {column.options ? <select className={selectClass} value={row[column.key] ?? ""} onChange={(event) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: event.target.value } : item))}>
          <option value="">Selecciona</option>{column.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : <input className={inputClass} type={column.type === "date" ? "date" : "text"} value={row[column.key] ?? ""}
          onChange={(event) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: event.target.value } : item))} />}
      </label>)}</div>
      {!config.fixed && <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar registro</button>}
    </div>)}
    {!config.fixed && <button type="button" className={btnGhost} disabled={rows.length >= 35} onClick={() => onChange([...rows, {}])}>Agregar registro</button>}
  </div>;
}
