import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useOperationDocuments } from "@/components/admin/operation/use-documents";
import type { OperationRecord } from "@/lib/admin/operation-view";

/*
  BUG-C04: si falla la consulta de documentos de la operación (500, 403, red), el hook la trata como
  lista vacía. La pantalla muestra todo como «Iniciar» sin avisar y `start()` crea un borrador nuevo
  aunque ya exista uno en el servidor (y en el recibo 18 avanza el consecutivo).
*/
const op = { id: "51000000-0000-4000-8000-000000000001", folio: "EXP-2026-041", version: 3, operacion: "venta", etapa: "captacion", cliente_id: "c1", asesor_id: "a1", propiedad_slug: "casa" } as unknown as OperationRecord;
let posts: string[] = [];

beforeEach(() => {
  posts = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if ((init?.method ?? "GET") === "POST") {
      posts.push(url);
      return Response.json({ documento: { id: "nuevo", expediente_id: op.id, formato_id: "02", data: {}, version: 1, updated_at: "2026-11-13T00:00:00Z" } });
    }
    if (url.endsWith("/formatos")) return Response.json({ error: "No se pudo consultar" }, { status: 500 });
    return Response.json({});
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("una carga fallida de documentos no se muestra como «sin documentos»", async () => {
  const { result } = renderHook(() => useOperationDocuments({ op, interviewAnswers: {} }));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
  // Mientras no se sepa qué hay en el servidor, la lista no puede declararse vacía, o el error debe verse.
  expect(result.current.documents === undefined || result.current.error !== "").toBe(true);
});

test("con la carga fallida, iniciar un formato no crea un borrador duplicado", async () => {
  const { result } = renderHook(() => useOperationDocuments({ op, interviewAnswers: {} }));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
  await act(async () => { await result.current.start("02"); });
  expect(posts).toEqual([]);
});
