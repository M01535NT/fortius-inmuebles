import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

/*
  Hallazgo de Calidad (sin prueba previa): en la captura en vivo, aceptar un dato no esperaba al
  anterior. Dos aceptaciones seguidas salían con la misma versión del borrador: la segunda chocaba
  con un 409 falso y, si pasaba, podía pisar el primer dato.
*/
const accepts: Array<(patch: Record<string, unknown>) => Promise<void>> = [];
vi.mock("@/components/admin/operation/documento-en-vivo", () => ({
  EN_VIVO: new Set(["02"]),
  DocumentoEnVivo: ({ onAccept }: { onAccept: (patch: Record<string, unknown>) => Promise<void> }) => { accepts[0] = onAccept; return <p>Stub en vivo</p>; },
}));
import { FormatoCapture } from "@/components/admin/operation/formato-capture";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); accepts.length = 0; });

test("un segundo dato aceptado mientras se guarda el primero no se envía con la versión vieja", async () => {
  const puts: number[] = [];
  let release: () => void = () => undefined;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)); puts.push(body.version);
      await new Promise<void>(resolve => { release = resolve; });
      return Response.json({ documento: { id: "d1", expediente_id: "op", formato_id: "02", data: body.data, version: body.version + 1, updated_at: "2026-11-13T00:00:00Z" } });
    }
    if (url.endsWith("/adjuntos")) return Response.json({ adjuntos: [] });
    return Response.json({ emisiones: [] });
  }));
  render(<FormatoCapture document={{ id: "d1", expediente_id: "op", formato_id: "02", data: {}, version: 3, updated_at: "2026-11-13T00:00:00Z" } as never} folio="EXP-1" context={{}} onSaved={() => undefined} onEmitted={() => undefined} onClose={() => undefined} />);
  expect(await screen.findByText("Stub en vivo")).toBeTruthy();
  let first: Promise<void> = Promise.resolve(), second: Promise<string> = Promise.resolve("");
  await act(async () => { first = accepts[0]({ nombre: "Ana" }); });
  await act(async () => { second = accepts[0]({ telefono: "664" }).then(() => "guardó", (error: Error) => error.message); });
  expect(await second).toBe("Espera a que termine de guardarse el dato anterior.");
  await act(async () => { release(); await first; });
  expect(puts).toEqual([3]);
});

/* Hallazgo de Calidad: si fallaba la consulta de los PDF, la pestaña decía «Sin PDF» como si no hubiera ninguno. */
test("si no se pueden consultar los PDF lo dice y se puede reintentar", async () => {
  let fail = true;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.endsWith("/adjuntos")) return Response.json({ adjuntos: [] });
    if (fail) return Response.json({ error: "Falla" }, { status: 500 });
    return Response.json({ emisiones: [] });
  }));
  render(<FormatoCapture document={{ id: "d1", expediente_id: "op", formato_id: "02", data: {}, version: 3, updated_at: "2026-11-13T00:00:00Z" } as never} folio="EXP-1" context={{}} onSaved={() => undefined} onEmitted={() => undefined} onClose={() => undefined} />);
  act(() => { screen.getByRole("tab", { name: /PDF y copias firmadas/ }).click(); });
  expect((await screen.findByText("No se pudieron consultar los PDF de este documento."))).toBeTruthy();
  expect(screen.queryByText(/Sin PDF/)).toBeNull();
  fail = false;
  act(() => { screen.getByRole("button", { name: "Reintentar" }).click(); });
  expect(await screen.findByText(/Sin PDF/)).toBeTruthy();
});
