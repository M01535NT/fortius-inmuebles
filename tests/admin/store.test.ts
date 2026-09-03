import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as store from "@/lib/admin/store";

const note = {
  id: "note-1",
  titulo: "Original",
  texto: "Texto",
  actualizadoEl: "2026-09-03T00:00:00Z",
};
const record = (data = note, version = 1) => ({
  id: data.id,
  data,
  version,
  createdAt: note.actualizadoEl,
  updatedAt: note.actualizadoEl,
});
let rows = [record()];
let fail = 0;
beforeEach(async () => {
  vi.resetModules();
  rows = [record()];
  fail = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/auth/logout") return Response.json({ ok: true });
      if (fail)
        return Response.json({ error: "Fallo controlado" }, { status: fail });
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body));
        const current = rows.find((r) => r.id === body.data.id);
        if ((current?.version ?? null) !== body.version)
          return Response.json({ error: "Conflicto" }, { status: 409 });
        const next = record(body.data, (current?.version ?? 0) + 1);
        rows = [...rows.filter((r) => r.id !== next.id), next];
        return Response.json({ record: next });
      }
      if (init?.method === "DELETE") {
        rows = [];
        return Response.json({ ok: true });
      }
      return Response.json({ records: rows });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

test("reload retrieves server persistence instead of demo or browser data", async () => {
  const api = await import("@/lib/admin/store");
  expect(typeof api.db.notas.load).toBe("function");
  await api.db.notas.load();
  expect(api.db.notas.list()).toEqual([note]);
  await api.upsert(api.db.notas, { ...note, titulo: "Persistido" }, 1);
  api.clearAdminCache();
  expect(api.db.notas.list()).toEqual([]);
  await api.db.notas.load();
  expect(api.db.notas.list()[0].titulo).toBe("Persistido");
});
test("failed save and delete leave acknowledged data unchanged", async () => {
  const api = await import("@/lib/admin/store");
  expect(typeof api.db.notas.load).toBe("function");
  await api.db.notas.load();
  fail = 503;
  await expect(
    api.upsert(api.db.notas, { ...note, titulo: "Perdido" }, 1),
  ).rejects.toThrow();
  await expect(api.removeById(api.db.notas, note.id, 1)).rejects.toThrow();
  expect(api.db.notas.list()).toEqual([note]);
});
test("an edit keeps its original version after refresh and receives 409", async () => {
  const api = await import("@/lib/admin/store");
  expect(typeof api.db.notas.load).toBe("function");
  await api.db.notas.load();
  const version = api.db.notas.version(api.db.notas.list()[0]);
  rows = [record({ ...note, titulo: "Otro usuario" }, 2)];
  await api.db.notas.load();
  await expect(
    api.upsert(api.db.notas, { ...note, titulo: "Mi borrador" }, version),
  ).rejects.toMatchObject({ status: 409 });
  expect(api.db.notas.list()[0].titulo).toBe("Otro usuario");
});
test("logout clears cache and late in-flight loads cannot restore private records", async () => {
  const api = await import("@/lib/admin/store");
  expect(typeof api.db.notas.load).toBe("function");
  await api.db.notas.load();
  let resolve!: (value: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const pending = api.db.notas.load();
  await api.logout();
  resolve(Response.json({ records: [record()] }));
  await pending;
  expect(api.db.notas.list()).toEqual([]);
});
test("public lead capture delivers only through BFF and never writes a local lead", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({ id: "lead-server" }, { status: 201 }),
  );
  await expect(
    store.captureLead({
      nombre: "Real",
      telefono: "6645550101",
      origen: "contacto",
    }),
  ).resolves.toBe("lead-server");
  expect(store.db.leads.list()).toEqual([]);
});
