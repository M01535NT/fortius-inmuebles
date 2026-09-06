import { afterEach, expect, test, vi } from "vitest";
import {
  uploadFile,
  archivoTipo,
  archivoFromUpload,
  resolveFileUrl,
  acceptPasswordLink,
  db,
  clearAdminCache,
  isLoggedIn,
  logout,
  login,
} from "@/lib/admin/store";
afterEach(() => {
  vi.unstubAllGlobals();
  clearAdminCache();
});
test("20 MB uploads use preparation, direct bytes without credentials, then finalize into a stable private URL", async () => {
  const file = new File([new Uint8Array(20 * 1024 * 1024)], "video.mp4", {
    type: "video/mp4",
  });
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith("/upload"))
      return Response.json({
        signedUrl: "https://storage.example/staging",
        path: "staging",
        ticket: "ticket",
      });
    if (url === "https://storage.example/staging")
      return new Response("", { status: 200 });
    return Response.json({
      bucket: "mnt-private",
      path: "x.mp4",
      url: "/api/admin/files?bucket=mnt-private&path=x.mp4",
      name: "video.mp4",
      type: "video/mp4",
    });
  });
  const result = await uploadFile(file);
  expect(calls.map((c) => c.url)).toEqual([
    "/api/admin/files/upload",
    "https://storage.example/staging",
    "/api/admin/files/complete",
  ]);
  expect(JSON.parse(String(calls[0].init?.body))).toEqual({
    name: "video.mp4",
    size: 20971520,
    contentType: "video/mp4",
    visibility: "private",
  });
  expect(calls[1].init).toMatchObject({
    method: "PUT",
    credentials: "omit",
    body: file,
  });
  expect(JSON.parse(String(calls[2].init?.body))).toEqual({ ticket: "ticket" });
  expect(result).toMatchObject({
    bucket: "mnt-private",
    path: "x.mp4",
    url: "/api/admin/files?bucket=mnt-private&path=x.mp4",
  });
  expect(archivoTipo(result.type)).toBe("video");
});
test("uploaded files keep storage identity and selected visibility in the library record", () => {
  expect(
    archivoFromUpload("record-1", {
      bucket: "mnt-public",
      path: "staff/file.pdf",
      url: "https://storage.example/mnt-public/staff/file.pdf",
      name: "ficha.pdf",
      type: "application/pdf",
    }),
  ).toEqual({
    id: "record-1",
    nombre: "ficha.pdf",
    url: "https://storage.example/mnt-public/staff/file.pdf",
    tipo: "pdf",
    bucket: "mnt-public",
    path: "staff/file.pdf",
    visibility: "public",
  });
});
test("oversize and unsupported files cannot start upload", async () => {
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  await expect(
    uploadFile(
      new File([new Uint8Array(20971521)], "big.pdf", {
        type: "application/pdf",
      }),
    ),
  ).rejects.toThrow();
  await expect(
    uploadFile(new File(["svg"], "bad.svg", { type: "image/svg+xml" })),
  ).rejects.toThrow();
  expect(network).not.toHaveBeenCalled();
});
test("private resolver signs at open, does not persist signed capabilities", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json({
          url: "https://storage.example/sign?token=short-lived",
          expiresIn: 60,
        }),
      ),
  );
  expect(
    await resolveFileUrl("/api/admin/files?bucket=mnt-private&path=x.pdf"),
  ).toBe("https://storage.example/sign?token=short-lived");
  expect(db.archivos.list()).toEqual([]);
  await expect(resolveFileUrl("javascript:alert(1)")).rejects.toThrow();
});
test("callback failure still clears hash before transport", async () => {
  window.history.replaceState(
    null,
    "",
    "/admin#type=recovery&access_token=secret&refresh_token=refresh",
  );
  vi.stubGlobal("fetch", async () => {
    expect(window.location.hash).toBe("");
    return Response.json({ error: "Expired" }, { status: 400 });
  });
  await expect(acceptPasswordLink()).rejects.toThrow("Expired");
  expect(window.location.hash).toBe("");
});
test("session request begun before logout cannot restore authentication", async () => {
  let resolve!: (r: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      )
      .mockResolvedValue(Response.json({ ok: true })),
  );
  const pending = isLoggedIn();
  await logout();
  resolve(
    Response.json({
      user: { id: "old", email: "old@example.com", role: "admin" },
    }),
  );
  await expect(pending).resolves.toBe(false);
});
test("an old session rejection cannot clear a newer login's acknowledged cache", async () => {
  let resolve!: (r: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      )
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(
        Response.json({
          user: { id: "new", email: "new@example.com", role: "admin" },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          records: [
            {
              id: "n",
              data: {
                id: "n",
                titulo: "Actual",
                texto: "",
                actualizadoEl: "2026-09-03",
              },
              version: 1,
              createdAt: "2026-09-03",
              updatedAt: "2026-09-03",
            },
          ],
        }),
      ),
  );
  const stale = isLoggedIn();
  await login("new@example.com", "password");
  await db.notas.load();
  resolve(Response.json({ error: "Old session" }, { status: 401 }));
  await stale;
  expect(db.notas.list()[0]?.titulo).toBe("Actual");
});
