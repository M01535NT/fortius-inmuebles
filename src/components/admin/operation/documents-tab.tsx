"use client";
import * as React from "react";
import { Card } from "@/components/admin/kit";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { DocumentsByStage } from "./stages";
import type { DocumentsController } from "./use-documents";

/*
  Expediente de la operación (boceto C): todos sus documentos con su estado, PDF y copia
  editable. Abrir o crear un documento lleva a su ventana de captura; aquí no se edita nada.
*/

export type Documento = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; updated_at: string };

export function DocumentsTab({ op, docs }: { op: OperationRecord; docs: DocumentsController }) {
  return <div className="flex min-w-0 flex-col gap-5">
    <Card className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Documentos de la operación">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1"><h2 className="m-0 text-lg font-bold">Expediente</h2><p className="text-sm text-muted-foreground">Los formatos de la operación. Se inician desde su etapa; aquí se abren, se descargan en PDF o en copia editable.</p></div>
      </div>
      <DocumentsByStage docs={docs} folio={op.folio} />
      {docs.error && <p role="alert" className="text-sm text-destructive">{docs.error}</p>}
    </Card>
  </div>;
}
