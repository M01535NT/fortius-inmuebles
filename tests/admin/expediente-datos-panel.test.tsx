import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExpedienteDatosPanel } from "@/components/admin/operation/expediente-datos-panel";

/* Datos del expediente (titular, 29/10/2026): se confirman una vez y llenan los formatos. */
const OP = "51000000-0000-4000-8000-000000000010";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function servidor(conflicto = false) {
  const puts: { version: number | null; datos: Record<string, { valor: unknown; estado: string }> }[] = [];
  let version: number | null = 1;
  let datos: Record<string, unknown> = { propietarioNombre: { valor: "María Ramírez", estado: "propuesto", fuente: { documento: "Escritura", pagina: 2, cita: "comparece María Ramírez" } } };
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url !== `/api/admin/expedientes/${OP}/datos`) return Response.json({ error: "No" }, { status: 404 });
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      puts.push(body);
      if (conflicto && puts.length === 1) return Response.json({ error: "Otra persona guardó los datos; recarga antes de continuar" }, { status: 409 });
      datos = body.datos; version = (version ?? 0) + 1;
      return Response.json({ datos, version, formatosActualizados: 3 });
    }
    return Response.json({ datos, version });
  }));
  return puts;
}

it("muestra lo propuesto con su fuente y al confirmarlo avisa cuántos formatos llenó", async () => {
  const puts = servidor();
  render(<ExpedienteDatosPanel operationId={OP} />);
  expect(await screen.findByText("María Ramírez")).toBeTruthy();
  expect(screen.getByText(/De Escritura, página 2/)).toBeTruthy();
  expect(screen.getByText("Por confirmar")).toBeTruthy();
  // Regla del titular (29/10/2026): nada en pantalla dice «propuesto» ni que algo lo hizo la IA.
  expect(document.body.textContent).not.toMatch(/propuest|\bIA\b|inteligencia artificial/i);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar nombre del propietario o razón social" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Se llenaron 3 formatos."));
  expect(puts[0]).toMatchObject({ version: 1, datos: { propietarioNombre: { valor: "María Ramírez", estado: "confirmado" } } });
});

it("un dato escrito a mano queda confirmado y un número se guarda como número", async () => {
  const puts = servidor();
  render(<ExpedienteDatosPanel operationId={OP} />);
  await screen.findByText("María Ramírez");
  fireEvent.click(screen.getByRole("button", { name: "Escribir superficie de terreno (m²)" }));
  fireEvent.change(screen.getByLabelText("Superficie de terreno (m²)"), { target: { value: "160" } });
  fireEvent.click(screen.getByRole("button", { name: /^Confirmar$/ }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0].datos.superficieTerreno).toMatchObject({ valor: 160, estado: "confirmado" });
});

it("si otra persona guardó antes, avisa y vuelve a consultar en lugar de pisar su cambio", async () => {
  const puts = servidor(true);
  render(<ExpedienteDatosPanel operationId={OP} />);
  await screen.findByText("María Ramírez");
  fireEvent.click(screen.getByRole("button", { name: "Confirmar nombre del propietario o razón social" }));
  expect((await screen.findByRole("alert")).textContent).toContain("recarga");
  expect(puts).toHaveLength(1);
});
