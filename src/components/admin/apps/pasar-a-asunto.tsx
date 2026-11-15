"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@/components/admin/icons";
import { Avatar, Button } from "@/components/admin/kit";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { adjuntosDe } from "@/lib/apps/documentos";
import type { AppRun } from "@/lib/apps/types";
import { apiRequest, db, errorMessage, loadAllDossiers, useCollection } from "@/lib/admin/store";
import type { OperationRecord } from "@/lib/admin/operation-view";

/*
  HER-04 (FLX-02): un documento suelto pasa a un asunto con sus datos. Se crea un borrador del mismo
  formato dentro del asunto elegido; lo capturado manda sobre lo que el asunto ya sabe, y lo que
  falte lo llena el asunto (persona, inmueble, Fortius). El suelto se queda en «Mis documentos»
  como estaba; las fotos del suelto son archivos del usuario y no se copian.
*/
export function PasarAAsunto({ run, onClose }: { run: AppRun; onClose: () => void }) {
  const router = useRouter();
  const clientes = useCollection(db.clientes);
  const [ops, setOps] = React.useState<OperationRecord[] | null>(null);
  const [target, setTarget] = React.useState(""), [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    loadAllDossiers<OperationRecord>()
      .then(all => { if (alive) setOps(all.filter(o => !o.deleted_at && o.etapa !== "cerrado" && o.flujo?.estado !== "descartada")); })
      .catch(cause => { if (alive) { setOps([]); setError(errorMessage(cause)); } });
    return () => { alive = false; };
  }, []);
  const options = React.useMemo<ComboboxOption[]>(() => (ops ?? []).map(o => {
    const nombre = clientes.find(c => c.id === o.cliente_id)?.nombre;
    return { value: o.id, label: nombre ? `${nombre} · ${o.folio}` : o.folio, detail: o.unidad || undefined, media: <Avatar name={nombre ?? o.folio} size={28} />, keywords: [o.folio] };
  }), [ops, clientes]);
  const conFotos = adjuntosDe((run.input.data ?? {}) as Record<string, unknown>).length > 0;

  async function pasar() {
    if (!target || busy) return;
    setBusy(true); setError("");
    try {
      // La versión guardada más reciente: la lista puede traer una anterior.
      const { run: fresh } = await apiRequest<{ run: AppRun }>(`/api/admin/apps/runs/${encodeURIComponent(run.id)}`);
      const { adjuntos: _fotos, ...data } = (fresh.input.data ?? {}) as Record<string, unknown>;
      void _fotos;
      const { documento } = await apiRequest<{ documento: { id: string } }>(`/api/admin/expedientes/${encodeURIComponent(target)}/formatos`, "POST", { formatoId: fresh.input.formatoId, data });
      router.push(`/admin/operaciones/${encodeURIComponent(target)}?documento=${encodeURIComponent(documento.id)}`);
    } catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }

  return <Dialog open onOpenChange={next => { if (!next && !busy) onClose(); }}>
    <DialogContent>
      <div className="flex flex-col gap-1 pr-10"><DialogTitle>Pasar a un asunto</DialogTitle>
        <DialogDescription>«{run.title}» se copia al asunto con lo que capturaste; lo que falte lo completa el asunto. Este documento se queda aquí como está.</DialogDescription></div>
      <label className="flex flex-col gap-1.5 text-sm"><span>Asunto</span>
        <Combobox aria-label="Asunto" value={target} onChange={setTarget} options={options} disabled={busy || ops === null} placeholder={ops === null ? "Consultando asuntos…" : options.length ? "Elige el asunto" : "No hay asuntos abiertos"} searchPlaceholder="Buscar por persona o folio…" empty="No hay coincidencias" />
      </label>
      {conFotos && <p className="m-0 text-sm text-muted-foreground">Las fotos de este documento no se copian; agrégalas en el asunto.</p>}
      {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" disabled={busy} onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={!target || busy} aria-busy={busy} onClick={() => void pasar()}>{busy ? "Pasando…" : "Pasar al asunto"}<ArrowRight size={16} aria-hidden="true" /></Button>
      </div>
    </DialogContent>
  </Dialog>;
}
