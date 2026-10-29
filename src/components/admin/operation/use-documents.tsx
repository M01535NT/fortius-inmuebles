"use client";
import * as React from "react";
import { apiRequest, db, errorMessage, fetchJson as json, upsert } from "@/lib/admin/store";
import { formatoById } from "@/lib/formatos/catalog";
import { AVISO_TEMPLATE_VERSION } from "@/lib/formatos/aviso";
import { checklistFor, checklistTaskId, levantamientoFor } from "@/lib/formatos/checklist-documentos";
import { JURIDICA_TABLES } from "@/lib/formatos/juridica";
import { CARGOS_NETO } from "@/lib/formatos/neto";
import { calcularValor } from "@/lib/formatos/valor";
import type { LevantamientoId } from "@/lib/formatos/levantamiento";
import { downloadFormatoCopia, saveBlob } from "@/lib/admin/download-word";
import type { FormatStatus, OperationRecord } from "@/lib/admin/operation-view";
import type { Task } from "@/lib/tasks";
import { FormatoCapture, type CaptureContext, type Emision } from "./formato-capture";
import type { Documento } from "./documents-tab";

/*
  Documentos de la operación en un solo lugar: el borrador más reciente de cada formato,
  sus PDF y las acciones para iniciarlo, continuarlo o descargarlo. Abrir un documento
  siempre lleva a su ventana de captura (decisión del titular, 17/10/2026): la operación
  dice qué toca y la ventana concentra la captura.
*/

const post = (body: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const byNewest = (a: Documento, b: Documento) => b.updated_at.localeCompare(a.updated_at);
/** «04» es el levantamiento de cualquier tipo (04A–04G). */
const matches = (formato: string, id: string) => formato === "04" ? id.startsWith("04") : id === formato;

/** Control documental del 05 con lo marcado en el checklist: recibido o por recibir; lo demás queda por determinar. */
export function juridicaDocumentsFrom(checklist?: Task) {
  return (JURIDICA_TABLES.documentos.fixed ?? []).map(item => {
    const paso = checklist?.pasos.find(p => p.id === item.key);
    return paso ? { concepto: item.key, aplica: "si", estado: paso.hecho ? "recibido" : "no_recibido", referencia: "Checklist de documentos de la operación" } : { concepto: item.key };
  });
}

/** PDF que vale para la versión guardada; el aviso (01) solo si se generó con la plantilla vigente. */
export function pdfFor(doc: Documento | undefined, emissions: Record<string, Emision[]>) {
  if (!doc) return undefined;
  return emissions[doc.id]?.find(e => e.draft_version === doc.version && (doc.formato_id !== "01" || e.plantillaVersion === AVISO_TEMPLATE_VERSION));
}

export type DocumentsController = ReturnType<typeof useOperationDocuments>;

export function useOperationDocuments({ op, checklist, interviewAnswers, cliente }: {
  op: OperationRecord; checklist?: Task; interviewAnswers: Record<string, unknown>; cliente?: string;
}) {
  const [documents, setDocuments] = React.useState<Documento[] | undefined>(undefined);
  const [emissions, setEmissions] = React.useState<Record<string, Emision[]>>({});
  const [open, setOpen] = React.useState<Documento | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ documentos?: Documento[] }>(`/api/admin/expedientes/${op.id}/formatos`).then(r => { if (alive) setDocuments(r.documentos ?? []); }).catch(() => { if (alive) setDocuments([]); });
    return () => { alive = false; };
  }, [op.id]);
  // Los PDF de cada borrador se consultan una vez por borrador.
  const ids = (documents ?? []).map(d => d.id).join(",");
  React.useEffect(() => {
    let alive = true;
    for (const id of ids ? ids.split(",") : []) {
      apiRequest<{ emisiones?: Emision[] }>(`/api/admin/formatos/${id}`).then(r => { if (alive) setEmissions(old => ({ ...old, [id]: r.emisiones ?? [] })); }).catch(() => { if (alive) setEmissions(old => ({ ...old, [id]: [] })); });
    }
    return () => { alive = false; };
  }, [ids]);

  const list = React.useMemo(() => documents ?? [], [documents]);
  const latest = React.useCallback((formato: string) => list.filter(d => matches(formato, d.formato_id)).sort(byNewest)[0], [list]);
  // Lo que contestó el propietario: la entrevista inicial (02) y, si todavía no hay, el primer contacto.
  const answers = (latest("02")?.data ?? interviewAnswers) as Record<string, unknown>;
  const pdfOf = React.useCallback((doc?: Documento) => pdfFor(doc, emissions), [emissions]);
  /**
    Terminado: tiene PDF de su última versión; el contrato (09) todavía no genera PDF y cuenta con existir.
    Un PDF con datos faltantes también deja avanzar (RP-82: ningún dato faltante detiene el flujo);
    la lista de etapas lo señala como «PDF incompleto».
  */
  const status = React.useCallback((formato: string): FormatStatus => {
    const doc = latest(formato);
    if (!doc) return undefined;
    return !formatoById(doc.formato_id).readyForEmission || pdfOf(doc) ? "terminado" : "borrador";
  }, [latest, pdfOf]);

  async function guard<T>(task: () => Promise<T>) {
    setBusy(true); setError("");
    try { return await task(); } catch (cause) { setError(errorMessage(cause)); return null; } finally { setBusy(false); }
  }
  function seedFor(formatoId: string) {
    if (formatoId === "01") {
      const now = new Date();
      return { data: { fechaEmision: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`, consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "pendiente", transferenciaAsesor: "pendiente", transferenciaFinanciera: "pendiente", transferenciaOperacion: "pendiente", acuseEstado: "pendiente" } };
    }
    if (formatoId === "05") return { data: { documentos: juridicaDocumentsFrom(checklist) } };
    if (formatoId === "08") {
      const valor = latest("07");
      return { data: { erogaciones: CARGOS_NETO.map(item => ({ concepto: item.key, estado: "Pendiente", justificacion: "" })) }, ...(valor && pdfOf(valor) ? { valorReferencia: { id: valor.id, version: valor.version } } : {}) };
    }
    if (formatoId === "10") return { data: planSeed(latest("04")?.data, latest("07")?.data, latest("09")?.data) };
    return { data: {} };
  }
  /** Crea un borrador del formato; el 05, el 08 y el 10 nacen con lo que ya se sabe de la operación. */
  async function create(formatoId: string, seed: { data?: Record<string, unknown>; valorReferencia?: { id: string; version: number } } = seedFor(formatoId)) {
    return guard(async () => {
      const result = await json<{ documento: Documento }>(`/api/admin/expedientes/${op.id}/formatos`, post({ formatoId, data: seed.data ?? {}, ...(seed.valorReferencia ? { valorReferencia: seed.valorReferencia } : {}) }));
      setDocuments(items => [result.documento, ...(items ?? [])]);
      return result.documento;
    });
  }
  /** Abre la ventana del formato: el borrador más reciente o uno nuevo. El levantamiento nace del tipo elegido. */
  async function start(formato: string, survey?: LevantamientoId) {
    const existing = latest(formato);
    const doc = existing ?? await create(formato === "04" ? survey ?? levantamientoFor(answers.tipoInmueble) : formato);
    if (doc) setOpen(doc);
  }
  /** Crea y abre un formato desde el expediente; en el neto (08) se elige si parte de una opinión de valor (null: no usarla). */
  async function createAndOpen(formatoId: string, valorReferencia?: { id: string; version: number } | null) {
    const { valorReferencia: suggested, ...seed } = seedFor(formatoId) as ReturnType<typeof seedFor> & { valorReferencia?: { id: string; version: number } };
    const reference = valorReferencia === undefined ? suggested : valorReferencia ?? undefined;
    const doc = await create(formatoId, { ...seed, ...(reference ? { valorReferencia: reference } : {}) });
    if (doc) setOpen(doc);
  }
  function word(doc: Documento) { void guard(() => downloadFormatoCopia(doc, op.folio, cliente)); }
  /** El checklist de documentos se guarda como pasos de una tarea de la operación. */
  function startChecklist() {
    return guard(async () => {
      const vence = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      await upsert(db.tareas, { id: checklistTaskId(op.id), titulo: "Reunir los documentos del propietario", descripcion: "Checklist de documentos de la operación. Marca cada documento al recibirlo; con ellos se hace el dictamen jurídico.", categoria: "documentacion", estado: "en-curso", prioridad: "normal", pasos: checklistFor(answers).map(item => ({ ...item, hecho: false })), asesorId: op.asesor_id, expedienteId: op.id, clienteId: op.cliente_id, propiedadSlug: op.propiedad_slug ?? "", vence }, null);
    });
  }
  function checklistFile(kind: "pdf" | "docx") {
    void guard(async () => {
      const items = checklist?.pasos.map(p => ({ id: p.id, texto: p.texto })) ?? checklistFor(answers);
      const fileContext = { folio: op.folio, cliente, recibidos: checklist?.pasos.filter(p => p.hecho).map(p => p.id) };
      const { checklistPdf, checklistDocx } = await import("@/lib/formatos/checklist-print");
      if (kind === "pdf") saveBlob(new Blob([new Uint8Array(await checklistPdf(items, fileContext))], { type: "application/pdf" }), `Fortius-Checklist-documentos-${op.folio}.pdf`);
      else saveBlob(await checklistDocx(items, fileContext), `Fortius-Checklist-documentos-${op.folio}.docx`);
    });
  }

  /** La ventana de captura del documento abierto, con los datos de la operación que se le pasen. */
  const capture = (context: CaptureContext) => open && <FormatoCapture key={open.id} document={open} folio={op.folio} context={context}
    onSaved={doc => setDocuments(items => (items ?? []).map(item => item.id === doc.id ? doc : item))}
    onEmitted={emision => setEmissions(old => ({ ...old, [open.id]: [emision, ...(old[open.id] ?? [])] }))}
    onClose={() => setOpen(null)} />;

  return { documents, list, emissions, latest, pdfOf, status, start, createAndOpen, openDocument: setOpen, word, startChecklist, checklistFile, busy, error, capture, isOpen: !!open };
}

/**
  Plan 10: lo que ya saben el levantamiento, la opinión de valor y el contrato. Solo propone
  datos para un borrador nuevo; el asesor los confirma o corrige sobre el documento.
*/
function planSeed(levantamiento?: Record<string, unknown>, valor?: Record<string, unknown>, contrato?: Record<string, unknown>): Record<string, unknown> {
  const l = levantamiento ?? {}, o = valor ?? {}, c = contrato ?? {};
  const numero = (...values: unknown[]) => values.find(value => typeof value === "number" && Number.isFinite(value) && value >= 0);
  const texto = (...values: unknown[]) => values.find(value => typeof value === "string" && value.trim());
  let concluido: number | null = null;
  try { concluido = valor ? calcularValor(o).concluido : null; } catch { /* opinión incompleta */ }
  const firma = typeof c.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.fecha) ? new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${c.fecha}T00:00:00Z`)) : "";
  const seed: Record<string, unknown> = {
    terreno: numero(l.superficieTerreno, o.terreno), construccion: numero(l.superficieConstruccion, l.superficieConstrucciones, o.construccion),
    recamaras: numero(l.recamaras, o.recamaras), banos: numero(l.banos, o.banos), mediosBanos: numero(l.mediosBanos),
    claveCatastral: texto(c.claveCatastral, o.cuentaCatastral), folioReal: texto(c.folioReal),
    valorReferencia07: concluido ?? undefined,
    contrato09: contrato ? [texto(c.folio), firma].filter(Boolean).join(" · ") || undefined : undefined,
  };
  return Object.fromEntries(Object.entries(seed).filter(([, value]) => value !== undefined && value !== ""));
}
