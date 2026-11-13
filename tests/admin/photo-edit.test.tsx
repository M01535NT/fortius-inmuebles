import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PhotoEditButton } from "@/components/admin/properties/photo-edit";

const mocks = vi.hoisted(() => ({ uploadFile: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/admin/store", () => ({ uploadFile: mocks.uploadFile, errorMessage: (error: Error) => error.message }));

beforeEach(() => {
  mocks.uploadFile.mockResolvedValue({ bucket: "public", path: "x/editada.jpg", url: "https://cdn.example/editada.jpg", name: "fortius-foto-editada.jpg", type: "image/jpeg" });
  mocks.fetch.mockResolvedValue({ ok: true, blob: async () => new Blob(["picture"], { type: "image/jpeg" }) }); vi.stubGlobal("fetch", mocks.fetch);
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })));
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect: vi.fn(), save: vi.fn(), translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(), restore: vi.fn(), fillText: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["rendered"], { type: "image/jpeg" })));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

it("edita una foto de la galería y la reemplaza con la copia pública ajustada", async () => {
  const onSaved = vi.fn();
  render(<div className="admin-root"><PhotoEditButton src="https://cdn.example/original.jpg" label="Portada" onSaved={onSaved} /></div>);
  fireEvent.click(screen.getByRole("button", { name: "Editar portada" }));
  await screen.findByAltText("Vista previa de portada con los ajustes");
  expect(mocks.fetch).toHaveBeenCalledWith("https://cdn.example/original.jpg");
  const save = screen.getByRole("button", { name: "Guardar en la galería" });
  expect(save.hasAttribute("disabled")).toBe(true);
  fireEvent.change(screen.getByLabelText(/^Luz/), { target: { value: "120" } });
  fireEvent.click(save);
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith("https://cdn.example/editada.jpg"));
  const [file, visibility, destino] = mocks.uploadFile.mock.calls[0];
  expect(visibility).toBe("public");
  expect(destino).toEqual({ destino: "inmueble", inmueble: undefined });
  expect((file as File).type).toBe("image/jpeg");
});

it("si la foto no abre, avisa y no deja guardar", async () => {
  mocks.fetch.mockResolvedValue({ ok: false });
  render(<div className="admin-root"><PhotoEditButton src="https://cdn.example/rota.jpg" label="Foto 2" onSaved={vi.fn()} /></div>);
  fireEvent.click(screen.getByRole("button", { name: "Editar foto 2" }));
  expect((await screen.findByRole("alert")).textContent).toMatch(/No se pudo abrir/);
  expect(screen.getByRole("button", { name: "Guardar en la galería" }).hasAttribute("disabled")).toBe(true);
  expect(mocks.uploadFile).not.toHaveBeenCalled();
});
