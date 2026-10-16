"use client";
import * as React from "react";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { db, errorMessage, fetchJson as json, loadAllDossiers } from "@/lib/admin/store";
import { operationWorkflowSchema, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { flowOf, stageOf, type OperationRecord } from "@/lib/admin/operation-view";

/** Carga una operación (activa o eliminada) y la guarda con control de versión. */
export function useOperation(id: string) {
  const [op, setOp] = React.useState<OperationRecord | null | undefined>(undefined);
  const [all, setAll] = React.useState<OperationRecord[]>([]);
  const [loadError, setLoadError] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const active = await loadAllDossiers<OperationRecord>();
        if (!alive) return;
        setAll(active);
        let found = active.find(item => item.id === id);
        if (!found) found = (await json<{ expedientes: OperationRecord[] }>("/api/admin/expedientes?estado=eliminados")).expedientes?.find(item => item.id === id);
        if (alive) { setOp(found ?? null); setLoadError(""); }
      } catch (cause) { if (alive) { setOp(null); setLoadError(errorMessage(cause)); } }
    })();
    return () => { alive = false; };
  }, [id, attempt]);
  const reload = React.useCallback(() => { setOp(undefined); setAttempt(n => n + 1); }, []);

  /** Guarda la guía. «target» cambia la etapa; sin él, conserva la actual. */
  const save = React.useCallback(async (current: OperationRecord, changes: { flujo?: OperationWorkflow; etapa?: WorkflowStage; propiedadSlug?: string | null; fechaObjetivo?: string | null }) => {
    const flujo = operationWorkflowSchema.parse(changes.flujo ?? flowOf(current));
    const result = await json<{ expediente: OperationRecord }>(`/api/admin/expedientes/${current.id}/operacion`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: current.version, etapa: changes.etapa ?? stageOf(current), fechaObjetivo: changes.fechaObjetivo !== undefined ? changes.fechaObjetivo : current.fecha_objetivo ?? null, checklist: current.checklist ?? {}, flujo, propiedadSlug: changes.propiedadSlug !== undefined ? changes.propiedadSlug : current.propiedad_slug ?? null }),
    });
    setOp(result.expediente);
    await Promise.allSettled([db.tareas.load(), db.propiedades.load()]);
    return result.expediente;
  }, []);
  return { op, setOp, all, loadError, reload, save };
}

/** Mientras haya captura sin guardar, pide confirmación antes de salir de la operación. */
export function useLeaveGuard(dirty: boolean) {
  const allow = React.useRef(false), pending = React.useRef(false);
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { if (allow.current) return; event.preventDefault(); event.returnValue = ""; };
    const protect = (event: MouseEvent) => {
      if (allow.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const target = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(target.protocol) || target.origin === window.location.origin && target.pathname === window.location.pathname) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (pending.current) return;
      pending.current = true;
      void confirmAction("Hay captura sin guardar. ¿Descartar los cambios y salir de esta operación?").then(approved => { if (approved) { allow.current = true; window.location.assign(target.href); } }).finally(() => { pending.current = false; });
    };
    window.addEventListener("beforeunload", warn); document.addEventListener("click", protect, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", protect, true); };
  }, [dirty]);
}

/** Mensaje claro para un error de guardado. */
export function saveError(cause: unknown) {
  const message = errorMessage(cause);
  return /cambió|version|versión/i.test(message) ? "La operación cambió en otra pantalla. Recarga para ver la versión más reciente antes de seguir." : message.replace(/^Requisito pendiente: /, "Falta: ");
}
