import { beforeEach, expect, test, vi } from "vitest";
import { propiedades } from "../fixtures/propiedades";
const mocks = vi.hoisted(() => ({ property: vi.fn(), settings: vi.fn(), advisers: vi.fn(), pdf: vi.fn() }));
vi.mock("@/lib/inventario", () => ({ getPropertyBySlug: mocks.property }));
vi.mock("@/lib/backend/public", () => ({ getPublicSettings: mocks.settings, getPublicAdvisers: mocks.advisers }));
vi.mock("@/lib/property-pdf", () => ({ createPropertyPdf: mocks.pdf }));
import { GET } from "@/app/inventario/[slug]/ficha-tecnica/route";
const call = () => GET(new Request("https://example.com/inventario/demo/ficha-tecnica"), { params: Promise.resolve({ slug: "demo" }) });
beforeEach(() => { vi.resetAllMocks(); mocks.settings.mockResolvedValue(null); mocks.advisers.mockResolvedValue([]); mocks.pdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70])); });
test("removed or unpublished properties return 404 without generating a PDF", async () => {
  mocks.property.mockResolvedValue(undefined);
  expect((await call()).status).toBe(404);
  expect(mocks.pdf).not.toHaveBeenCalled();
});
test("download is an uncached PDF attachment derived from the current public property", async () => {
  mocks.property.mockResolvedValue(propiedades[0]);
  const result = await call();
  expect(result.status).toBe(200);
  expect(result.headers.get("content-type")).toBe("application/pdf");
  expect(result.headers.get("content-disposition")).toContain("attachment; filename=\"fortius-ficha-");
  expect(result.headers.get("cache-control")).toContain("no-store");
  expect(mocks.pdf.mock.calls[0][0]).toEqual(propiedades[0]);
});
test("backend errors do not return a misleading or partial PDF", async () => {
  mocks.property.mockRejectedValue(new Error("private backend details"));
  const result = await call();
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain("private backend details");
});
