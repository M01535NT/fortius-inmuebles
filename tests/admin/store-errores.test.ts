import { afterEach, expect, test, vi } from "vitest";
import { AdminApiError, RequestError, fetchJson } from "@/lib/admin/store";

afterEach(() => vi.unstubAllGlobals());

// BUG-C02: si el servidor o un proxy responde HTML (error 502/504, página de inicio de sesión),
// fetchJson propaga el SyntaxError de response.json() y la pantalla muestra «Unexpected token '<'».
test("fetchJson convierte una respuesta que no es JSON en un RequestError legible con su código", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("<!DOCTYPE html><html><body>Bad Gateway</body></html>", { status: 502, headers: { "Content-Type": "text/html" } })),
  );
  const error = await fetchJson("/api/admin/archivos-cliente/x/leer").catch((e: unknown) => e);
  expect(error).toBeInstanceOf(RequestError);
  expect(error).toMatchObject({ status: 502 });
  expect((error as Error).message).not.toMatch(/Unexpected token|JSON/);
});

test("fetchJson no trata como éxito una respuesta 200 que no es JSON", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html" } })));
  const error = await fetchJson("/api/admin/expedientes").catch((e: unknown) => e);
  expect(error).toBeInstanceOf(RequestError);
  expect((error as Error).message).not.toMatch(/Unexpected token|JSON/);
});

test("fetchJson sin cuerpo de error conserva el mensaje genérico y el código", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
  await expect(fetchJson("/api/admin/expedientes")).rejects.toMatchObject({ status: 500 });
});

// BUG-C03: el mensaje 409 del servidor (http.ts) no termina en punto y se pega a
// «Conserva tu borrador…», quedando «…recarga antes de continuar Conserva tu borrador…».
test("el aviso de conflicto 409 separa con puntuación el mensaje del servidor y la indicación del borrador", () => {
  const message = new AdminApiError(409, "El registro cambió o tiene referencias; recarga antes de continuar").message;
  expect(message).toContain("recarga antes de continuar");
  expect(message).toMatch(/[.!?]\s+Conserva tu borrador/);
});

test("el aviso 409 no duplica el punto cuando el mensaje del servidor ya lo trae", () => {
  const message = new AdminApiError(409, "Resuelve las observaciones abiertas.").message;
  expect(message).not.toContain("..");
});
