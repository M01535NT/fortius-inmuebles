"use client";
import * as React from "react";
import { Button, Card } from "@/components/admin/kit";
import { FileDown } from "@/components/admin/icons";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { saveBlob } from "@/lib/admin/download-word";
import { DocumentsByStage } from "./stages";
import type { DocumentsController } from "./use-documents";

/*
  Expediente de la operación (boceto C): todos sus documentos con su estado, PDF y copia
  editable. Abrir o crear un documento lleva a su ventana de captura; aquí no se edita nada.
  FCH-06: el expediente completo se descarga en un PDF (portada, índice y lo emitido en orden)
  o en un ZIP con los PDF originales; el servidor comprueba el acceso y las huellas.
*/

export type Documento = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; updated_at: string };

type Formato = "pdf" | "zip";
const TIPOS: Record<Formato, string> = { pdf: "application/pdf", zip: "application/zip" };

async function descargarExpediente(id: string, folio: string, formato: Formato) {
  const response = await fetch(`/api/admin/expedientes/${encodeURIComponent(id)}/completo?formato=${formato}`, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "No se pudo reunir el expediente. Inténtalo de nuevo.");
  }
  if (!response.headers.get("content-type")?.includes(TIPOS[formato])) throw new Error("No se recibió el archivo del expediente. Inténtalo de nuevo.");
  saveBlob(await response.blob(), `Fortius-Expediente-${folio.replace(/[^A-Za-z0-9-]+/g, "-")}.${formato}`);
}

export function DocumentsTab({ op, docs }: { op: OperationRecord; docs: DocumentsController }) {
  const [busy, setBusy] = React.useState<Formato | null>(null), [error, setError] = React.useState("");
  const emitidos = Object.values(docs.emissions).some(list => list.length > 0);
  async function bajar(formato: Formato) {
    setBusy(formato); setError("");
    try { await descargarExpediente(op.id, op.folio, formato); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo reunir el expediente."); } finally { setBusy(null); }
  }
  return <div className="flex min-w-0 flex-col gap-5">
    <Card className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Documentos de la operación">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1"><h2 className="m-0 text-lg font-bold">Expediente</h2><p className="text-sm text-muted-foreground">Los formatos de la operación. Se inician desde su etapa; aquí se abren, se descargan en PDF o en copia editable.</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Descargar el expediente completo">
          <Button variant="ghost" disabled={!emitidos || !!busy} aria-busy={busy === "pdf"} onClick={() => void bajar("pdf")}><FileDown size={16} aria-hidden="true" />{busy === "pdf" ? "Reuniendo…" : "Expediente en PDF"}</Button>
          <Button variant="ghost" disabled={!emitidos || !!busy} aria-busy={busy === "zip"} onClick={() => void bajar("zip")}><FileDown size={16} aria-hidden="true" />{busy === "zip" ? "Reuniendo…" : "PDF originales en ZIP"}</Button>
        </div>
      </div>
      {!emitidos && docs.documents !== undefined && <p className="text-sm text-muted-foreground">El expediente completo se descarga cuando haya al menos un documento con PDF.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DocumentsByStage docs={docs} folio={op.folio} />
      {docs.error && <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive"><p className="m-0">{docs.error}</p>{docs.loadFailed && <Button variant="ghost" onClick={docs.reload}>Volver a intentar</Button>}</div>}
    </Card>
  </div>;
}
