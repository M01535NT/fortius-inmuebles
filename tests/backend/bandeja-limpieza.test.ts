import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { limpiarBandejaVencida } from "@/lib/backend/bandeja";

// Limpieza diaria de la Bandeja (DEC-54): lo vencido se descarta y su archivo sale de la carga temporal.
type Vencido = { id: string; staging_path: string; version: number };

function cliente(vencidos: Vencido[] | null, error: { code?: string; message?: string } | null = null) {
  const remove = vi.fn(async () => ({ error: null }));
  const updates: unknown[] = [];
  const consulta = { eq: () => consulta, lt: () => consulta, order: () => consulta, limit: async () => ({ data: vencidos, error }) };
  const service = {
    from: () => ({
      select: () => consulta,
      update: (valores: unknown) => { updates.push(valores); const u = { eq: () => u, then: (ok: (r: { error: null }) => void) => ok({ error: null }) }; return u; },
    }),
    storage: { from: () => ({ remove }) },
  };
  return { service: service as unknown as Parameters<typeof limpiarBandejaVencida>[0], remove, updates };
}

it("descarta lo vencido con la versión leída y borra sus archivos", async () => {
  const { service, remove, updates } = cliente([{ id: "a", staging_path: "u/1.pdf", version: 2 }, { id: "b", staging_path: "u/2.png", version: 1 }]);
  expect(await limpiarBandejaVencida(service)).toBe(2);
  expect(remove).toHaveBeenCalledWith(["u/1.pdf", "u/2.png"]);
  expect(updates).toEqual([{ estado: "descartado", version: 2 }, { estado: "descartado", version: 1 }]);
});

it("sin vencidos no toca nada", async () => {
  const { service, remove } = cliente([]);
  expect(await limpiarBandejaVencida(service)).toBe(0);
  expect(remove).not.toHaveBeenCalled();
});

it("mientras la tabla no exista, no hace nada", async () => {
  const { service, remove } = cliente(null, { code: "PGRST205", message: "Could not find the table" });
  expect(await limpiarBandejaVencida(service)).toBe(0);
  expect(remove).not.toHaveBeenCalled();
});
