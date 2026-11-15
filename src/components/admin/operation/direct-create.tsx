"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { db, fetchJson as json, useCollection } from "@/lib/admin/store";
import { emptyWorkflow, stageLabel, WORKFLOW_ROUTES, WORKFLOW_STAGES, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { etapasDeGuia, GUIA_NOMBRE, GUIAS_PROPIAS, type GuiaPropia } from "@/lib/guias";
import { ACREEDORES, type Acreedor } from "@/lib/tramites";
import { EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";
import { operationHref, type OperationRecord } from "@/lib/admin/operation-view";
import { Combobox, faceOption, photoOption } from "./pickers";

/** Alta directa: abre una operación sin entrevista. FLX-03 B (DEC-55): se elige el tipo (con su guía) y la etapa en la que empieza; lo que queda atrás se anota como aviso. */
export function DirectCreate({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const router = useRouter();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const clientes = useCollection(db.clientes), propiedades = useCollection(db.propiedades);
  const [client, setClient] = React.useState(params.get("clienteId") ?? "");
  const [property, setProperty] = React.useState(params.get("inmueble") ?? "");
  const [operation, setOperation] = React.useState("venta");
  const [route, setRoute] = React.useState<OperationWorkflow["ruta"]>(params.get("ruta") === "compra" ? "compra" : "captacion");
  const [guide, setGuide] = React.useState<GuiaPropia | "">("");
  const [acreedor, setAcreedor] = React.useState<Acreedor>("banco");
  const [start, setStart] = React.useState("");
  const [dirty, setDirty] = React.useState(false);
  const owner = ["venta", "renta"].includes(operation) && (route === "captacion" || route === "arrendador");
  const guia = owner && guide ? { clave: guide, paso: Number(start) || 0, ...(guide === "cancelacion_hipoteca" ? { acreedor } : {}) } : undefined;
  const startOptions = guia ? etapasDeGuia(guia).map((label, i) => ({ value: String(i), label })) : owner ? WORKFLOW_STAGES.filter(st => st !== "cerrado").map(st => ({ value: st, label: stageLabel(st, route) })) : [];
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
      if (!cliente?.asesorId) throw new Error("Asigna un asesor responsable al cliente antes de abrir su asunto.");
      const result = await json<{ expediente: OperationRecord }>("/api/admin/expedientes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, asesorId: cliente.asesorId, operacion: operation, propiedadSlug: property || undefined, unidad: String(data.get("unidad") ?? ""), ...(["venta", "renta", "inversion"].includes(operation) ? { flujo: guia ? { ...emptyWorkflow(route), guia } : emptyWorkflow(route) } : {}), ...(owner && !guia && start ? { etapa: start as WorkflowStage } : {}) }),
      });
      setDirty(false); onDirtyChange?.(false);
      router.push(operationHref(result.expediente.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setBusy(false); }
  }
  async function discard() {
    if (!await confirmAction("¿Descartar el nuevo asunto sin guardar?")) return;
    form.current?.reset(); setClient(""); setProperty(""); setOperation("venta"); setRoute("captacion"); setGuide(""); setStart(""); setDirty(false); setError("");
  }
  return <form ref={form} id="alta-directa" onChange={() => setDirty(true)} onSubmit={create} className="grid gap-4 md:grid-cols-2" aria-label="Alta directa">
    <p className="text-sm text-muted-foreground md:col-span-2">Sin entrevista. El inmueble se liga después y el asunto te dice qué falta.</p>
    {error && <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p>}
    {/* LV-10c: cliente e inmueble son listas largas: se buscan escribiendo, con su cara y su foto. */}
    <span className="flex flex-col gap-1.5 text-sm"><span>Cliente</span><Combobox name="clienteId" aria-label="Cliente" placeholder="Selecciona" searchPlaceholder="Buscar cliente…" disabled={busy} value={client}
      options={clientes.map(item => faceOption(item.id, item.nombre, item.asesorId ? undefined : "Sin asesor"))}
      onChange={id => { setClient(id); setDirty(true); setRoute(clientes.find(c => c.id === id)?.tipo === "comprador" ? "compra" : "captacion"); }} /></span>
    <label className="text-sm">Operación<select name="operacion" disabled={busy} value={operation} onChange={e => { setOperation(e.target.value); setRoute(e.target.value === "inversion" ? "inversion" : e.target.value === "renta" ? "arrendador" : "captacion"); }} className={selectClass}>{Object.entries(EXPEDIENTE_OPERACIONES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <span className="flex flex-col gap-1.5 text-sm"><span>Inmueble</span><Combobox name="propiedadSlug" aria-label="Inmueble" placeholder="Sin vincular" searchPlaceholder="Buscar inmueble…" disabled={busy} value={property} onChange={slug => { setProperty(slug); setDirty(true); }}
      options={[{ value: "", label: "Sin vincular" }, ...propiedades.filter(item => route === "compra" || !client || item.asesorId === clientes.find(c => c.id === client)?.asesorId).map(item => photoOption(item.slug, item.titulo, item.galeria[0]?.src))]} /></span>
    {["venta", "renta", "inversion"].includes(operation) && <label className="text-sm">Ruta<select disabled={busy} value={route} onChange={e => setRoute(e.target.value as OperationWorkflow["ruta"])} className={selectClass}>{Object.entries(WORKFLOW_ROUTES).filter(([k]) => operation === "inversion" ? k === "inversion" : operation === "renta" ? ["arrendador", "arrendatario"].includes(k) : ["captacion", "compra"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
    {owner && <label className="text-sm">Tipo de asunto<select disabled={busy} value={guide} onChange={e => { setGuide(e.target.value as GuiaPropia | ""); setStart(""); }} className={selectClass}>
      <option value="">{operation === "renta" ? GUIA_NOMBRE.renta : GUIA_NOMBRE.venta}</option>
      {GUIAS_PROPIAS.map(clave => <option key={clave} value={clave}>{GUIA_NOMBRE[clave]}</option>)}
    </select></label>}
    {guide === "cancelacion_hipoteca" && <label className="text-sm">Quién dio el crédito<select disabled={busy} value={acreedor} onChange={e => setAcreedor(e.target.value as Acreedor)} className={selectClass}>{(Object.entries(ACREEDORES) as Array<[Acreedor, string]>).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
    {startOptions.length > 0 && <label className="text-sm">Empieza en<select disabled={busy} value={start} onChange={e => setStart(e.target.value)} className={selectClass}>
      <option value="">{startOptions[0].label} (desde el principio)</option>
      {startOptions.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select></label>}
    {start && <p className="text-sm text-muted-foreground md:col-span-2">Lo de las etapas anteriores quedará anotado como aviso en el historial del asunto.</p>}
    <label className="text-sm">Unidad, si aplica<input name="unidad" disabled={busy} className={inputClass} /></label>
    <p className="text-sm text-muted-foreground md:col-span-2">El folio se asigna al guardar.</p>
    <div className="flex flex-wrap gap-2 md:col-span-2">
      <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Abriendo…" : "Abrir asunto"}</button>
      {dirty && <button type="button" disabled={busy} className={btnGhost} onClick={() => void discard()}>Descartar</button>}
    </div>
  </form>;
}
