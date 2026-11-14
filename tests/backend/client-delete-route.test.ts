import { beforeEach, expect, it, vi } from "vitest";
const { requireStaff, deleteRecord } = vi.hoisted(() => ({ requireStaff: vi.fn(), deleteRecord: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
vi.mock("@/lib/backend/repository", () => ({ listRecords: vi.fn(), putRecord: vi.fn(), deleteRecord }));
import { DELETE } from "@/app/api/admin/collections/[collection]/[id]/route";

/* 13/11/2026: un cliente con una operación en curso no se elimina; uno sin ella va a Eliminados. */
const request = (collection: string, id: string) => new Request(`https://panel.test/api/admin/collections/${collection}/${id}`, { method: "DELETE", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify({ version: 2 }) });
const context = (collection: string, id: string) => ({ params: Promise.resolve({ collection, id }) });
function withOperations(rows: Array<{ folio: string; etapa: string; flujo?: { estado?: string } | null }>) {
  const query = { select: vi.fn(), eq: vi.fn(), is: vi.fn() };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  query.is.mockResolvedValue({ data: rows, error: null });
  const client = { from: vi.fn(() => query) };
  requireStaff.mockResolvedValue({ client, user: { role: "admin" } });
  return { client, query };
}
beforeEach(() => { vi.clearAllMocks(); deleteRecord.mockResolvedValue(undefined); });

it("no elimina a un cliente con una operación en curso y dice cuál", async () => {
  const { query } = withOperations([{ folio: "EXP-2026-0007", etapa: "comercializacion", flujo: {} }]);
  const response = await DELETE(request("clientes", "cli-1"), context("clientes", "cli-1"));
  expect(response.status).toBe(409);
  expect(JSON.stringify(await response.json())).toContain("EXP-2026-0007");
  expect(query.eq).toHaveBeenCalledWith("cliente_id", "cli-1");
  expect(deleteRecord).not.toHaveBeenCalled();
});
it("elimina a un cliente cuyas operaciones están cerradas o descartadas", async () => {
  withOperations([{ folio: "EXP-1", etapa: "cerrado" }, { folio: "EXP-2", etapa: "dictamen", flujo: { estado: "descartada" } }]);
  expect((await DELETE(request("clientes", "cli-1"), context("clientes", "cli-1"))).status).toBe(200);
  expect(deleteRecord).toHaveBeenCalledOnce();
});
it("los prospectos no consultan operaciones", async () => {
  const { client } = withOperations([]);
  expect((await DELETE(request("leads", "lead-1"), context("leads", "lead-1"))).status).toBe(200);
  expect(client.from).not.toHaveBeenCalled();
  expect(deleteRecord).toHaveBeenCalledOnce();
});
