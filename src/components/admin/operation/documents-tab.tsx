"use client";
import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, Card } from "@/components/admin/kit";
import { selectClass } from "@/components/admin/ui";
import { FORMATOS } from "@/lib/formatos/catalog";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { InterviewAccess } from "@/components/admin/intake/interview-access";
import { flowOf } from "@/lib/admin/operation-view";
import { DocumentsByStage } from "./stages";
import type { DocumentsController } from "./use-documents";

/*
  Expediente de la operación (boceto C): todos sus documentos con su estado, PDF y copia
  editable. Abrir o crear un documento lleva a su ventana de captura; aquí no se edita nada.
*/

export type Documento = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; updated_at: string };

export function DocumentsTab({ op, docs }: { op: OperationRecord; docs: DocumentsController }) {
  const [formatoId, setFormatoId] = React.useState(FORMATOS.find(f => !f.globalRoute)?.id ?? "01");
  const [valor, setValor] = React.useState("");
  const valuations = docs.list.filter(d => d.formato_id === "07");
  async function create(event: React.FormEvent) {
    event.preventDefault();
    // Solo para el neto (08): puede partir de una opinión de valor revisada; el valor sugerido se distingue del precio acordado.
    const [id, version] = valor.split(":");
    await docs.createAndOpen(formatoId, formatoId === "08" ? (id ? { id, version: Number(version) } : null) : undefined);
  }
  return <div className="flex min-w-0 flex-col gap-5">
    <Card className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Documentos de la operación">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1"><h2 className="m-0 text-lg font-bold">Expediente</h2><p className="text-sm text-muted-foreground">Cada documento se abre en su propia ventana. Cada vez que guardas se crea una versión nueva.</p></div>
      </div>
      <DocumentsByStage docs={docs} folio={op.folio} />
      {docs.error && <p role="alert" className="text-sm text-destructive">{docs.error}</p>}
    </Card>
    <Card className="flex flex-col gap-3 p-5 sm:p-6" aria-label="Nuevo documento">
      <h2 className="m-0 text-base font-bold">Nuevo documento</h2>
      <form onSubmit={event => void create(event)} className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm">Formato<select className={selectClass} value={formatoId} onChange={e => setFormatoId(e.target.value)}>{FORMATOS.filter(item => !item.globalRoute).map(item => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></label>
        {formatoId === "08" && valuations.length > 0 && <label className="min-w-0 flex-1 text-sm">Usar una opinión de valor (07)<select className={selectClass} value={valor} onChange={e => setValor(e.target.value)}><option value="">No usarla · capturar el valor</option>{valuations.map(d => <option key={d.id} value={`${d.id}:${d.version}`}>Opinión de valor · versión {d.version}</option>)}</select></label>}
        <Button type="submit" variant="primary" disabled={docs.busy}><Plus size={16} aria-hidden="true" />Crear y abrir</Button>
      </form>
      <p className="text-sm text-muted-foreground">El <Link href="/admin/control-comercial" className="font-semibold text-foreground underline underline-offset-4">03 · Control comercial</Link> reúne carteras, historial y PDF en su propia sección. El contrato 09 se captura, pero su PDF espera el cotejo del modelo registrado.</p>
    </Card>
    <InterviewAccess key={op.id} expedienteId={op.id} clienteId={op.cliente_id} intencion={intent(op)} disabled={docs.busy} />
  </div>;
}

/** Qué quiere el cliente, para abrir su entrevista del primer contacto. */
function intent(op: OperationRecord) {
  const flow = flowOf(op);
  return flow.ruta === "inversion" ? "invertir" : op.operacion === "renta" ? (flow.ruta === "arrendatario" ? "rentar" : "arrendar") : flow.ruta === "compra" ? "comprar" : "vender";
}
