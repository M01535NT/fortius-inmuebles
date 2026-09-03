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

function deferNextResponse() {
  let resolve!: (response: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  return (body: unknown) => resolve(Response.json(body));
}

test("a late PUT cannot replace a newer GET and returns its own saved version", async () => {
  const { db } = await import("@/lib/admin/store");
  await db.notas.load();
  const opening = db.notas.list()[0];
  const respond = deferNextResponse();
  const saving = db.notas.put({ ...note, titulo: "Mi guardado" }, 1);
  rows = [record({ ...note, titulo: "Cambio posterior" }, 3)];
  await db.notas.load();
  const seen: string[] = [];
  const unsubscribe = db.notas.subscribe(() => {
    seen.push(db.notas.list()[0]?.titulo ?? "ausente");
  });
  respond({ record: record({ ...note, titulo: "Mi guardado" }, 2) });
  const saved = await saving;
  unsubscribe();
  expect(seen).not.toContain("Mi guardado");
  expect(db.notas.list()[0].titulo).toBe("Cambio posterior");
  expect(db.notas.version(note.id)).toBe(3);
  expect(saved.titulo).toBe("Mi guardado");
  expect(db.notas.version(saved)).toBe(2);
  expect(db.notas.version(opening)).toBe(1);
});

test.each(["deleted", "recreated"] as const)(
  "a late PUT revalidates after GET observed a %s record",
  async (outcome) => {
    const { db } = await import("@/lib/admin/store");
    await db.notas.load();
    const respond = deferNextResponse();
    const saving = db.notas.put({ ...note, titulo: "Mi guardado" }, 1);
    // The PUT committed v2 before its reply was delayed; a later delete or
    // recreation has already been observed. Recreated versions restart at 1.
    rows =
      outcome === "deleted"
        ? []
        : [record({ ...note, titulo: "Recreado" }, 1)];
    await db.notas.load();
    // Authority can change again before the delayed acknowledgement arrives.
    if (outcome === "recreated")
      rows = [record({ ...note, titulo: "Recreado vigente" }, 2)];
    respond({ record: record({ ...note, titulo: "Mi guardado" }, 2) });
    const saved = await saving;
    expect(db.notas.list().map((item) => item.titulo)).toEqual(
      outcome === "deleted" ? [] : ["Recreado vigente"],
    );
    expect(db.notas.version(note.id)).toBe(outcome === "deleted" ? null : 2);
    expect(db.notas.version(saved)).toBe(2);
  },
);

test("a late DELETE revalidates without hiding the recreation seen by GET", async () => {
  const { db } = await import("@/lib/admin/store");
  await db.notas.load();
  const respond = deferNextResponse();
  const deleting = db.notas.remove(note.id, 1);
  rows = [record({ ...note, titulo: "Recreado" }, 1)];
  await db.notas.load();
  const seen: string[] = [];
  const unsubscribe = db.notas.subscribe(() => {
    seen.push(db.notas.list()[0]?.titulo ?? "ausente");
  });
  rows = [record({ ...note, titulo: "Recreado vigente" }, 2)];
  respond({ ok: true });
  await deleting;
  unsubscribe();
  expect(seen).not.toContain("ausente");
  expect(db.notas.list()[0].titulo).toBe("Recreado vigente");
  expect(db.notas.version(note.id)).toBe(2);
});

test.each(["PUT", "DELETE"] as const)(
  "an acknowledged %s stays successful when reconciliation fails, with retryable cache error",
  async (method) => {
    const { db } = await import("@/lib/admin/store");
    await db.notas.load();
    const respond = deferNextResponse();
    const saving =
      method === "PUT"
        ? db.notas.put({ ...note, titulo: "Mi guardado" }, 1)
        : db.notas.remove(note.id, 1);
    rows = [record({ ...note, titulo: "Vigente" }, 3)];
    await db.notas.load();
    fail = 503;
    respond(
      method === "PUT"
        ? { record: record({ ...note, titulo: "Mi guardado" }, 2) }
        : { ok: true },
    );
    const saved = await saving;
    expect(db.notas.list()[0].titulo).toBe("Vigente");
    expect(db.notas.version(note.id)).toBe(3);
    if (saved) expect(db.notas.version(saved)).toBe(2);
    expect(db.notas.state()).toMatchObject({ status: "error", loaded: true });
    expect(db.notas.state().error).toContain("se guardó");
    fail = 0;
    await db.notas.load();
    expect(db.notas.state()).toEqual({
      status: "ready",
      error: null,
      loaded: true,
    });
  },
);

test.each(["PUT", "DELETE"] as const)(
  "a late GET cannot undo an acknowledged %s",
  async (method) => {
    const { db } = await import("@/lib/admin/store");
    await db.notas.load();
    const respond = deferNextResponse();
    const loading = db.notas.load();
    if (method === "PUT") await db.notas.put({ ...note, titulo: "Guardado" }, 1);
    else await db.notas.remove(note.id, 1);
    respond({ records: [record()] });
    await loading;
    expect(db.notas.list().map((item) => item.titulo)).toEqual(
      method === "PUT" ? ["Guardado"] : [],
    );
    expect(db.notas.version(note.id)).toBe(method === "PUT" ? 2 : null);
    expect(db.notas.state()).toEqual({
      status: "ready",
      error: null,
      loaded: true,
    });
  },
);

test("a second acknowledgement cannot cancel unresolved cache reconciliation", async () => {
  const { db } = await import("@/lib/admin/store");
  await db.notas.load();
  const respondPut = deferNextResponse();
  const saving = db.notas.put({ ...note, titulo: "Mi guardado" }, 1);
  rows = [record({ ...note, titulo: "Cambio posterior" }, 3)];
  await db.notas.load();
  const respondGet = deferNextResponse();
  respondPut({ record: record({ ...note, titulo: "Mi guardado" }, 2) });
  await vi.waitFor(() => expect(db.notas.state().status).toBe("loading"));
  rows = [record({ ...note, titulo: "Vigente" }, 4)];
  await db.notas.put({ ...note, id: "note-2", titulo: "Segunda nota" }, null);
  expect(db.notas.list().map((item) => item.titulo)).toEqual([
    "Vigente",
    "Segunda nota",
  ]);
  respondGet({ records: [record({ ...note, titulo: "Cambio posterior" }, 3)] });
  await saving;
  expect(db.notas.list().map((item) => item.titulo)).toEqual([
    "Vigente",
    "Segunda nota",
  ]);
});

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
