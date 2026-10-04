"use client";
import { inputClass, selectClass, textareaClass, btnGhost } from "./ui";
import { VALOR_TABLES } from "@/lib/formatos/valor-fields";
import { calcularConstruccion, CONSTRUCTION_STATES } from "@/lib/formatos/valor";

export function ValorRowsEditor({ kind, value, onChange, images = [] }: { kind: string; value: unknown; onChange: (rows: Record<string, unknown>[]) => void; images?: { id: string; kind: string; caption: string }[] }) {
  const table = VALOR_TABLES[kind];
  const rows = Array.isArray(value) ? value as Record<string, unknown>[] : [];
  const change = (index: number, key: string, value: unknown) => onChange(rows.map((row, at) => at === index ? { ...row, [key]: value } : row));
  return <div className="space-y-4">
    {kind === "construcciones" && <p className="text-sm text-muted-foreground">{CONSTRUCTION_STATES.map((label, index) => `${index + 1}: ${label}`).join(". ")}. La plantilla calcula Ross-Heidecke sin rescate; documenta costo, vida útil y pertinencia del método.</p>}
    {rows.map((row, index) => <fieldset key={index} className="rounded-lg border border-border p-4">
      <legend className="px-2 text-sm font-semibold">{table.singular} {index + 1}</legend>
      <div className="grid gap-3 md:grid-cols-2">{table.columns.filter((column) => row.seleccion !== "excluir" || ["id", "seleccion", "razonSeleccion"].includes(column.key)).map((column) => <label key={column.key} className={`text-sm ${column.type === "long" ? "md:col-span-2" : ""}`}>{column.label}
        {column.options ? <select className={selectClass} value={String(row[column.key] ?? "")} onChange={(event) => change(index, column.key, event.target.value)}><option value="">Selecciona</option>{column.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        : column.type === "asset" ? <select className={selectClass} value={String(row[column.key] ?? "")} onChange={(event) => change(index, column.key, event.target.value)}><option value="">Selecciona una fotografía adjunta</option>{images.filter((image) => image.kind === "foto").map((image) => <option key={image.id} value={image.id}>{image.caption}</option>)}</select>
        : column.type === "long" ? <textarea rows={3} className={textareaClass} value={String(row[column.key] ?? "")} onChange={(event) => change(index, column.key, event.target.value)} />
        : <input type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"} min={column.type === "number" ? 0 : undefined} step={column.type === "number" ? "any" : undefined} className={inputClass} value={String(row[column.key] ?? "")} onChange={(event) => change(index, column.key, column.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} />}
      </label>)}</div>
      {kind === "construcciones" && calcularConstruccion(row).parcial !== null && <p className="mt-3 text-sm">Valor neto calculado: {calcularConstruccion(row).parcial?.toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN</p>}
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar {table.singular} {index + 1}</button>
    </fieldset>)}
    <button type="button" className={btnGhost} disabled={rows.length >= table.max} onClick={() => onChange([...rows, {}])}>Agregar {table.singular}</button>
  </div>;
}

