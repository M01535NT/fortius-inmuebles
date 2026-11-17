"use client";
import * as React from "react";
import { Button, Card } from "@/components/admin/kit";
import { selectClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { fetchJson as json } from "@/lib/admin/store";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import { GUIA_NOMBRE, TIPOS_ELEGIBLES, tipoDeAsunto, type TipoElegible } from "@/lib/guias";
import { ACREEDORES, type Acreedor } from "@/lib/tramites";
import { cambiaDeTipo } from "@/lib/formatos/tipo-asunto";
import { saveError } from "./use-operation";

/*
  FLX-03 B (DEC-55): cambiar el tipo de un asunto. Lo hecho se conserva y el cambio queda en el
  historial; no frena. El riel pasa a dibujar las etapas de la guía nueva.
*/
export function TypeCard({ op, disabled, onReplaced }: { op: OperationRecord; disabled?: boolean; onReplaced: (op: OperationRecord) => void }) {
  const flow = flowOf(op), actual = tipoDeAsunto(op.flujo, op.operacion);
  const [tipo, setTipo] = React.useState<TipoElegible>((TIPOS_ELEGIBLES as readonly string[]).includes(actual) ? actual as TipoElegible : "venta");
  const [acreedor, setAcreedor] = React.useState<Acreedor>(flow.guia?.acreedor ?? "banco");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const id = React.useId();
  if (!cambiaDeTipo(op.flujo, op.operacion)) return null;
  const changed = tipo !== actual || (tipo === "cancelacion_hipoteca" && acreedor !== (flow.guia?.acreedor ?? "banco"));

  async function change() {
    if (!changed || busy) return;
    if (!await confirmAction(`El asunto pasa de «${GUIA_NOMBRE[actual]}» a «${GUIA_NOMBRE[tipo]}». Se conservan sus documentos, formatos, revisiones y notas, y el cambio queda en el historial.`, { title: "¿Cambiar el tipo del asunto?", confirmLabel: "Cambiar el tipo" })) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await json<{ expediente: OperationRecord }>(`/api/admin/expedientes/${op.id}/tipo`, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: op.version, tipo, ...(tipo === "cancelacion_hipoteca" ? { acreedor } : {}) }) });
      onReplaced(result.expediente);
      setNotice(`Ahora es «${GUIA_NOMBRE[tipo]}».`);
    } catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }

  return <Card className="flex flex-col gap-3 p-5" aria-labelledby={`${id}-titulo`}>
    <div><h2 id={`${id}-titulo`} className="m-0 text-lg">Tipo de asunto</h2><p className="mt-1 text-sm text-muted-foreground">Cada tipo trae sus etapas. Al cambiarlo se conserva lo hecho.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold" htmlFor={`${id}-tipo`}>Tipo
        <select id={`${id}-tipo`} className={selectClass} value={tipo} disabled={disabled || busy} onChange={event => setTipo(event.target.value as TipoElegible)}>
          {TIPOS_ELEGIBLES.map(clave => <option key={clave} value={clave}>{GUIA_NOMBRE[clave]}</option>)}
        </select>
      </label>
      {tipo === "cancelacion_hipoteca" && <label className="text-sm font-semibold" htmlFor={`${id}-acreedor`}>Quién dio el crédito
        <select id={`${id}-acreedor`} className={selectClass} value={acreedor} disabled={disabled || busy} onChange={event => setAcreedor(event.target.value as Acreedor)}>
          {(Object.entries(ACREEDORES) as Array<[Acreedor, string]>).map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}
        </select>
      </label>}
    </div>
    <Button className="self-start" disabled={disabled || busy || !changed} onClick={() => void change()}>{busy ? "Cambiando…" : "Cambiar el tipo"}</Button>
    {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="m-0 text-sm text-muted-foreground">{notice}</p>}
  </Card>;
}
