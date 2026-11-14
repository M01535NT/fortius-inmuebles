"use client";
import { ButtonLink, Notice } from "@/components/admin/kit";
import { db, useCollection } from "@/lib/admin/store";
import { cancelacionInscrita, frenaFirma } from "@/lib/admin/tramite-firma";
import { pasosDe, TOTAL_PASOS } from "@/lib/tramites";
import { WORKFLOW_STAGES, type WorkflowStage } from "@/lib/formatos/operation-workflow";

const CIERRE = WORKFLOW_STAGES.indexOf("cierre");
const fecha = (iso?: string) => iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", timeZone: "America/Tijuana" }) : "";

/**
  TRA-01 · en una venta, la firma espera la cancelación de hipoteca ligada. Se avisa antes de llegar
  a la firma (cuando lo que sigue es el cierre) y siempre que el servidor la frenó (`blocked`).
  El asesor puede no ver el trámite; entonces la liga lleva a la lista de trámites.
*/
export function MortgageGateNotice({ operationId, operacion, stage, next, blocked, className }: { operationId: string; operacion: string; stage: WorkflowStage; next?: WorkflowStage | null; blocked: boolean; className?: string }) {
  const tramites = useCollection(db.tramites).filter(t => t.expedienteId === operationId);
  if (operacion !== "venta" || WORKFLOW_STAGES.indexOf(stage) >= CIERRE) return null;
  const abiertos = tramites.filter(frenaFirma);
  const autorizados = tramites.filter(t => t.firmaSinCancelacion && !cancelacionInscrita(t));
  const nearSignature = !!next && WORKFLOW_STAGES.indexOf(next) >= CIERRE;
  if (abiertos.length || blocked) {
    if (!blocked && !nearSignature) return null;
    return <Notice className={className} title="La firma espera la cancelación de hipoteca"
      actions={abiertos.length
        ? abiertos.slice(0, 3).map(t => <ButtonLink key={t.id} href={`/admin/tramites?id=${encodeURIComponent(t.id)}`}>{abiertos.length > 1 ? `Abrir «${t.titulo}»` : "Abrir el trámite"}</ButtonLink>)
        : <ButtonLink href="/admin/tramites">Ver los trámites</ButtonLink>}>
      <p>Antes de la firma, la cancelación de hipoteca de esta venta debe quedar inscrita en el Registro Público. Si se firma sin ella, lo decide el director en el trámite, con su motivo.</p>
      {abiertos.map(t => <p key={t.id} className="mt-1 text-muted-foreground">{t.titulo}: va en «{t.pasoActual >= TOTAL_PASOS ? "Terminado" : pasosDe(t.acreedor)[t.pasoActual].nombre}»{t.estado === "cancelado" ? " · trámite cancelado" : ""}.</p>)}
    </Notice>;
  }
  if (autorizados.length && nearSignature) return <Notice tone="info" className={className} title="Se firma sin la cancelación inscrita"
    actions={<ButtonLink href={`/admin/tramites?id=${encodeURIComponent(autorizados[0].id)}`}>Abrir el trámite</ButtonLink>}>
    {autorizados.map(t => <p key={t.id}>El director lo autorizó{t.firmaSinCancelacion?.autorizadoEl ? ` el ${fecha(t.firmaSinCancelacion.autorizadoEl)}` : ""}: {t.firmaSinCancelacion?.motivo}</p>)}
  </Notice>;
  return null;
}
