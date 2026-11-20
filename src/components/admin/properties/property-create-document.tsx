"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@/components/admin/icons";
import { ButtonLink } from "@/components/admin/kit";
import { CreateDocument } from "@/components/admin/operation/create-document";
import { loadAllDossiers } from "@/lib/admin/store";
import type { OperationRecord } from "@/lib/admin/operation-view";

/*
  FLX-02: «Crear documento» desde el inmueble. Los formatos viven dentro de un asunto: se crea en el
  asunto abierto del inmueble (si tiene varios, se elige en cuál) y se abre ahí con lo que ya saben
  la persona y el inmueble. Sin asunto, se ofrece abrir uno con el inmueble puesto.
*/
export function PropertyCreateDocument({ slug }: { slug: string }) {
  const router = useRouter();
  const [ops, setOps] = React.useState<OperationRecord[] | null>(null);
  React.useEffect(() => {
    let alive = true;
    loadAllDossiers<OperationRecord>()
      .then(all => { if (alive) setOps(all.filter(o => o.propiedad_slug === slug && !o.deleted_at && o.etapa !== "cerrado" && o.flujo?.estado !== "descartada")); })
      .catch(() => { if (alive) setOps([]); });
    return () => { alive = false; };
  }, [slug]);
  if (ops === null) return null;
  if (!ops.length) return <ButtonLink href={`/admin-anterior/operaciones?nuevo=1&inmueble=${encodeURIComponent(slug)}`}><Plus size={16} aria-hidden="true" />Abrir un asunto para sus documentos</ButtonLink>;
  return <CreateDocument where={`el asunto ${ops[0].folio}`} targets={ops.map(o => ({ id: o.id, label: `${o.folio}${o.unidad ? ` · ${o.unidad}` : ""}` }))}
    onCreate={(formato, target) => router.push(`/admin-anterior/operaciones/${encodeURIComponent(target ?? ops[0].id)}?crear=${formato}`)} />;
}
