import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useOperationDocuments } from "@/components/admin/operation/use-documents";
import type { OperationRecord } from "@/lib/admin/operation-view";

/*
  BUG-C38: mientras la lista de documentos de la operación carga, «Iniciar» espera sin marcar que
  está ocupado. Un segundo toque (el primero «no hizo nada» visible) encuentra la misma lista sin el
  formato y ambos crean un borrador: quedan dos, uno se abre y el otro queda huérfano.
*/
const op = { id: "51000000-0000-4000-8000-000000000001", folio: "EXP-2026-041", version: 3, operacion: "venta", etapa: "captacion", cliente_id: "c1", asesor_id: "a1", propiedad_slug: "casa" } as unknown as OperationRecord;
let posts = 0;
let soltarLista: () => void = () => undefined;

beforeEach(() => {
  posts = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if ((init?.method ?? "GET") === "POST") {
      posts++;
      return Response.json({ documento: { id: `nuevo-${posts}`, expediente_id: op.id, formato_id: "02", data: {}, version: 1, updated_at: "2026-11-13T00:00:00Z" } });
    }
    if (url.endsWith("/formatos")) return new Promise<Response>(resolve => { soltarLista = () => resolve(Response.json({ documentos: [] })); });
    return Response.json({});
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("dos toques en «Iniciar» mientras carga la lista crean un solo borrador", async () => {
  const { result } = renderHook(() => useOperationDocuments({ op, interviewAnswers: {} }));
  let uno: Promise<void> = Promise.resolve(), dos: Promise<void> = Promise.resolve();
  act(() => { uno = result.current.start("02"); dos = result.current.start("02"); });
  await act(async () => { soltarLista(); await uno; await dos; });
  expect(posts).toBe(1);
});
