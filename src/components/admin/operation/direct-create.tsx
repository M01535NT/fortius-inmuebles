"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { db, fetchJson as json, useCollection } from "@/lib/admin/store";
import { emptyWorkflow, WORKFLOW_ROUTES, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";
import { operationHref, type OperationRecord } from "@/lib/admin/operation-view";

/** Alta directa: abre una operación sin entrevista. La Fase 5 la reúne con el asistente de nueva operación. */
export function DirectCreate({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const router = useRouter();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const clientes = useCollection(db.clientes), propiedades = useCollection(db.propiedades);
  const [client, setClient] = React.useState(params.get("clienteId") ?? "");
  const [property, setProperty] = React.useState(params.get("inmueble") ?? "");
  const [operation, setOperation] = React.useState("venta");
  const [route, setRoute] = React.useState<OperationWorkflow["ruta"]>(params.get("ruta") === "compra" ? "compra" : "captacion");
  const [dirty, setDirty] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const form = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const data = new FormData(event.currentTarget);
      const clienteId = String(data.get("clienteId") ?? "");
      const cliente = clientes.find(item => item.id === clienteId);
      if (!cliente?.asesorId) throw new Error("Asigna un asesor responsable al cliente antes de abrir su operación.");
      const result = await json<{ expediente: OperationRecord }>("/api/admin/expedientes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, asesorId: cliente.asesorId, operacion: operation, propiedadSlug: property || undefined, unidad: String(data.get("unidad") ?? ""), ...(["venta", "renta", "inversion"].includes(operation) ? { flujo: emptyWorkflow(route) } : {}) }),
      });
      setDirty(false); onDirtyChange?.(false);
      router.push(operationHref(result.expediente.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setBusy(false); }
  }
  async function discard() {
    if (!await confirmAction("¿Descartar la nueva operación sin guardar?")) return;
    form.current?.reset(); setClient(""); setProperty(""); setOperation("venta"); setRoute("captacion"); setDirty(false); setError("");
  }
  return <form ref={form} id="alta-directa" onChange={() => setDirty(true)} onSubmit={create} className="grid gap-4 md:grid-cols-2" aria-label="Alta directa">
    <p className="text-sm text-muted-foreground md:col-span-2">Abre una operación sin entrevista. Puedes empezar con documentos pendientes y vincular el inmueble después; la operación te dirá qué falta.</p>
    {error && <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p>}
    <label className="text-sm">Cliente<select name="clienteId" required disabled={busy} value={client} onChange={e => { setClient(e.target.value); setRoute(clientes.find(c => c.id === e.target.value)?.tipo === "comprador" ? "compra" : "captacion"); }} className={selectClass}><option value="">Selecciona</option>{clientes.map(item => <option key={item.id} value={item.id}>{item.nombre}{item.asesorId ? "" : " · sin asesor"}</option>)}</select></label>
    <label className="text-sm">Operación<select name="operacion" disabled={busy} value={operation} onChange={e => { setOperation(e.target.value); setRoute(e.target.value === "inversion" ? "inversion" : e.target.value === "renta" ? "arrendador" : "captacion"); }} className={selectClass}>{Object.entries(EXPEDIENTE_OPERACIONES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="text-sm">Inmueble<select name="propiedadSlug" disabled={busy} value={property} onChange={e => setProperty(e.target.value)} className={selectClass}><option value="">Sin vincular</option>{propiedades.filter(item => route === "compra" || !client || item.asesorId === clientes.find(c => c.id === client)?.asesorId).map(item => <option key={item.slug} value={item.slug}>{item.titulo}</option>)}</select></label>
    {["venta", "renta", "inversion"].includes(operation) && <label className="text-sm">Ruta<select disabled={busy} value={route} onChange={e => setRoute(e.target.value as OperationWorkflow["ruta"])} className={selectClass}>{Object.entries(WORKFLOW_ROUTES).filter(([k]) => operation === "inversion" ? k === "inversion" : operation === "renta" ? ["arrendador", "arrendatario"].includes(k) : ["captacion", "compra"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
    <label className="text-sm">Unidad, si aplica<input name="unidad" disabled={busy} className={inputClass} /></label>
    <p className="text-sm text-muted-foreground md:col-span-2">El folio se asigna al guardar.</p>
    <div className="flex flex-wrap gap-2 md:col-span-2">
      <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Abriendo…" : "Abrir operación"}</button>
      {dirty && <button type="button" disabled={busy} className={btnGhost} onClick={() => void discard()}>Descartar</button>}
    </div>
  </form>;
}
