import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PropertyShare } from "@/components/property/property-share";
import { propertyShare, propertyShareMetadata } from "@/lib/property-share";
import { siteConfig } from "@/data/site";
import { propiedades } from "../fixtures/propiedades";

const payload = { title: "Casa en renta", text: "Playas · $24,500 MXN /mes", url: "https://fortius-inmuebles.vercel.app/inventario/casa" };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function browser(share?: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "share", { configurable: true, get: () => share });
}

test("native sharing receives only the public URL and property details", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", { configurable: true, get: () => undefined });
  browser(share);
  render(<PropertyShare {...payload} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
  await waitFor(() => expect(share).toHaveBeenCalledWith(payload));
});
test("copy fallback confirms success only after clipboard write", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", { configurable: true, get: () => undefined });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<PropertyShare {...payload} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
  await screen.findByRole("status");
  expect(writeText).toHaveBeenCalledWith(payload.url);
  expect(screen.getByRole("status").textContent).toContain("Enlace copiado");
});
test("cancelling the native share does not silently copy the URL", async () => {
  const writeText = vi.fn();
  Object.defineProperty(navigator, "share", { configurable: true, get: () => undefined });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  browser(vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")));
  render(<PropertyShare {...payload} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
  await waitFor(() => expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false));
  expect(writeText).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).toBeNull();
});
test("clipboard denial leaves a selectable URL instead of claiming success", async () => {
  Object.defineProperty(navigator, "share", { configurable: true, get: () => undefined });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
  render(<PropertyShare {...payload} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
  expect((await screen.findByRole("textbox") as HTMLInputElement).value).toBe(payload.url);
  expect(screen.getByRole("status").textContent).not.toContain("Enlace copiado");
});
test("each property has its own social metadata, public URL, image and demo disclosure", () => {
  const p = { ...propiedades[0], operacion: "renta" as const, precio: { modalidad: "publico" as const, monto: 24500, moneda: "MXN" as const, periodo: "mensual" as const } };
  const share = propertyShare(p);
  const meta = propertyShareMetadata(p);
  expect(share.url).not.toContain("localhost");
  expect(share.text).toContain("24,500");
  expect(share.text).toContain("demostración");
  expect(share.title).toContain("Renta");
  expect(meta.openGraph).toMatchObject({ title: share.title, description: share.text, images: [{ url: share.image, type: "image/jpeg", width: 1200, height: 630 }] });
  expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
});

test.each(["http://localhost:3001", "http://127.0.0.1:3001", "http://[::1]:3001"])("sharing from %s points to the independent Fortius site", (origin) => {
  const previous = siteConfig.url;
  try {
    siteConfig.url = origin;
    const share = propertyShare(propiedades[0]);
    expect(new URL(share.url).origin).toBe("https://fortiusinmuebles.com");
    expect(share.image).toBe(`${share.url}/imagen-social`);
  } finally { siteConfig.url = previous; }
});
