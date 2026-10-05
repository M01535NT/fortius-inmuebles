import { expect, it, vi } from "vitest";
import sharp from "sharp";
import { ApiError } from "@/lib/backend/http";
const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { POST } from "@/app/api/admin/formatos/[id]/adjuntos/route";
import { GET as download } from "@/app/api/admin/adjuntos/[id]/descargar/route";

const id = "51000000-0000-4000-8000-000000000011";
const expedienteId = "51000000-0000-4000-8000-000000000010";

function accessibleDraft(formato = "04A") {
  return { from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id, expediente_id: expedienteId, formato_id: formato }, error: null }) }) }) })) };
}

function formRequest(bytes: Uint8Array, fileType = "image/png") {
  const form = new FormData();
  form.set("tipo", "foto"); form.set("descripcion", "Fachada principal"); form.set("fuente", "Visita del asesor");
  form.set("archivo", new File([Uint8Array.from(bytes)], "fachada.png", { type: fileType }));
  return new Request(`https://panel.test/api/admin/formatos/${id}/adjuntos`, { method: "POST", headers: { origin: "https://panel.test" }, body: form });
}

it("no usa la llave privilegiada si el borrador no es visible", async () => {
  requireStaff.mockResolvedValue({ client: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) } });
  createServerClient.mockClear();
  const response = await POST(formRequest(new Uint8Array([1, 2, 3])), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(404);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("rechaza bytes falsos aunque el navegador declare PNG", async () => {
  requireStaff.mockResolvedValue({ client: accessibleDraft(), user: { id } });
  createServerClient.mockClear();
  const response = await POST(formRequest(new TextEncoder().encode("no es una imagen")), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(400);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("archiva una imagen válida con su hash y la devuelve solo con acceso al registro", async () => {
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#aabbcc" } }).png().toBuffer();
  requireStaff.mockResolvedValue({ client: accessibleDraft(), user: { id } });
  const upload = vi.fn(async () => ({ error: null }));
  const insert = vi.fn((data: Record<string, unknown>) => ({ select: () => ({ single: async () => ({ data: { ...data, id: data.id }, error: null }) }) }));
  createServerClient.mockReturnValue({ storage: { from: () => ({ upload }) }, from: () => ({ insert }) });
  const response = await POST(formRequest(bytes), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(201);
  expect(upload).toHaveBeenCalledWith(expect.stringMatching(/\.png$/), bytes, expect.objectContaining({ contentType: "image/png", upsert: false }));
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ draft_id: id, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }));
});

it("deniega descarga sin sesión y no usa Storage privilegiado", async () => {
  requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
  createServerClient.mockClear();
  const response = await download(new Request(`https://panel.test/api/admin/adjuntos/${id}/descargar`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(401);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("rechaza una imagen archivada si sus bytes ya no coinciden con la huella", async () => {
  requireStaff.mockResolvedValue({ client: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id, path: `${expedienteId}/${id}/${id}.png`, mime: "image/png", sha256: "a".repeat(64) }, error: null }) }) }) }) } });
  createServerClient.mockReturnValue({ storage: { from: () => ({ download: async () => ({ data: new Blob(["alterado"]), error: null }) }) } });
  const response = await download(new Request(`https://panel.test/api/admin/adjuntos/${id}/descargar`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toContain("no-store");
});
