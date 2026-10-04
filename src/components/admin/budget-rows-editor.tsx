"use client";
import { btnGhost, inputClass, selectClass } from "@/components/admin/ui";

type Row = Record<string, unknown>;
type Column = { key: string; label: string; type?: "number" | "date"; options?: readonly string[] };
const partidaColumns: readonly Column[] = [
  { key: "id", label: "ID único" }, { key: "area", label: "Área" }, { key: "concepto", label: "Concepto" },
  { key: "tipoCosto", label: "Tipo de costo", options: ["Material", "Mano de obra", "Equipo", "Servicio", "Indirecto"] },
  { key: "unidad", label: "Unidad", options: ["pieza", "m2", "m3", "metro", "jornada", "lote", "servicio"] },
  { key: "cantidad", label: "Cantidad", type: "number" }, { key: "precioUnitario", label: "Precio unitario con impuestos", type: "number" },
  { key: "estado", label: "Estado", options: ["Por cotizar", "Cotizado", "Autorizado", "Descartado"] },
  { key: "soporte", label: "Cotización o autorización" },
];
const pagoColumns: readonly Column[] = [
  { key: "fechaPago", label: "Fecha de pago", type: "date" }, { key: "partidaId", label: "ID de partida" },
  { key: "proveedor", label: "Proveedor" }, { key: "concepto", label: "Concepto del pago" },
  { key: "importe", label: "Importe pagado", type: "number" },
  { key: "medio", label: "Medio", options: ["Transferencia", "Efectivo", "Tarjeta", "Cheque", "Otro"] },
  { key: "comprobante", label: "Comprobante" }, { key: "estado", label: "Estado", options: ["Pagado", "Por confirmar", "Anulado"] },
];

export function BudgetRowsEditor({ kind, value, onChange }: { kind: "partidas" | "pagos"; value: unknown; onChange: (rows: Row[]) => void }) {
  const rows = Array.isArray(value) ? value.filter((item): item is Row => item !== null && typeof item === "object" && !Array.isArray(item)) : [];
  const columns = kind === "partidas" ? partidaColumns : pagoColumns;
  const max = kind === "partidas" ? 50 : 70;
  const update = (index: number, key: string, next: string) => onChange(rows.map((row, position) => position === index ? { ...row, [key]: columns.find((column) => column.key === key)?.type === "number" && next !== "" ? Number(next) : next } : row));
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={index} className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">{kind === "partidas" ? "Partida" : "Pago"} {index + 1}</h3><button type="button" className={btnGhost} onClick={() => onChange(rows.filter((_, position) => position !== index))}>Eliminar</button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{columns.map((column) => <label key={column.key} className="text-sm">{column.label}
        {column.options ? <select className={selectClass} value={String(row[column.key] ?? "")} onChange={(event) => update(index, column.key, event.target.value)}><option value="">Selecciona</option>{column.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          : <input className={inputClass} type={column.type ?? "text"} min={column.type === "number" ? 0 : undefined} step={column.key === "cantidad" ? "any" : column.type === "number" ? "0.01" : undefined} value={String(row[column.key] ?? "")} onChange={(event) => update(index, column.key, event.target.value)} />}
      </label>)}</div>
    </div>)}
    <button type="button" className={btnGhost} disabled={rows.length >= max} onClick={() => onChange([...rows, {}])}>Agregar {kind === "partidas" ? "partida" : "pago"}</button>
    <p className="text-xs text-muted-foreground">{rows.length} de {max} {kind === "partidas" ? "partidas" : "pagos"}.</p>
  </div>;
}
