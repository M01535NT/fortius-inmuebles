import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import { DocumentEditor } from "@/components/admin/apps/document-editor";
import type { AppInput } from "@/lib/apps/types";
const mocks = vi.hoisted(() => ({ apiRequest: vi.fn(), uploadFile: vi.fn(), change: vi.fn(), result: vi.fn(), busy: vi.fn(), qr: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/admin/store", () => ({ apiRequest: mocks.apiRequest, uploadFile: mocks.uploadFile, errorMessage: (error: Error) => error.message }));
vi.mock("qrcode", () => ({ default: { toDataURL: mocks.qr } }));
function Harness({ slug, initial = {} }: { slug: string; initial?: AppInput }) { const [input, setInput] = useState(initial); return <DocumentEditor slug={slug} context={{ expedienteId: "exp-1" }} input={input} onChange={value => { mocks.change(value); setInput(value); }} onResult={mocks.result} onBusyChange={mocks.busy} />; }
const saved = (id: string, name = `${id}.pdf`, mime = "application/pdf") => ({ id, name, mime, url: "" });
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function pdfFile(name: string) { const pdf = await PDFDocument.create(); pdf.addPage(); const bytes = await pdf.save(); const file = new File([new Uint8Array(bytes)], name, { type: "application/pdf" }); Object.defineProperty(file, "arrayBuffer", { value: async () => new Uint8Array(bytes).buffer }); return file; }
const oldPdf = { originals: [saved("previous")], names: ["previous.pdf"], pages: [{ file: 0, page: 1, rotation: 90 }], output: saved("previous-output") };
const photo = () => new File(["picture"], "original.jpg", { type: "image/jpeg" });
const share = { id: "share-1", file_id: "file-1", expires_at: "2099-01-01T00:00:00Z", revoked: false };
const privateInput = { kind: "private", url: "https://fortiusinmuebles.com/api/apps/shared/token", fileId: "file-1", shareId: "share-1", expiresAt: share.expires_at, revoked: false };
beforeEach(() => {
  mocks.uploadFile.mockImplementation(async (file: File) => ({ path: `private/${file.name}` }));
  mocks.apiRequest.mockImplementation(async (url: string, method?: string, body?: { name?: string; mime?: string }) => method === "POST" ? { file: saved(body?.name ?? "output", body?.name, body?.mime) } : url.includes("shares") ? { shares: [share] } : { files: [saved("file-1")] });
  mocks.qr.mockImplementation(async (url: string) => `data:image/png;base64,${btoa(url)}`);
  mocks.fetch.mockResolvedValue({ ok: true, blob: async () => photo() }); vi.stubGlobal("fetch", mocks.fetch);
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })));
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect: vi.fn(), save: vi.fn(), translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(), restore: vi.fn(), fillText: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["rendered"], { type: "image/jpeg" })));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllGlobals(); });
it("conserva PDF originales al seleccionar, bloquea guardar durante la carga y permite reabrir antes de generar", async () => {
  const pending = deferred<{ file: ReturnType<typeof saved> }>(); mocks.apiRequest.mockReturnValue(pending.promise); const file = await pdfFile("contrato.pdf");
  const view = render(<Harness slug="pdf" />); fireEvent.change(screen.getByLabelText("PDF originales"), { target: { files: [file] } });
  await waitFor(() => expect(mocks.uploadFile).toHaveBeenCalledWith(file, "private")); expect(mocks.change).not.toHaveBeenCalled(); expect(mocks.busy).toHaveBeenLastCalledWith(true);
  await act(async () => pending.resolve({ file: saved("original-1", file.name) })); await waitFor(() => expect(mocks.busy).toHaveBeenLastCalledWith(false));
  const input = mocks.change.mock.lastCall![0]; expect(input.originals).toEqual([saved("original-1", file.name)]); expect(input.pages).toHaveLength(1); expect(mocks.result).not.toHaveBeenCalled();
  view.unmount(); render(<Harness slug="pdf" initial={JSON.parse(JSON.stringify(input))} />); expect(screen.getByText(/contrato.pdf · página 1/)).toBeTruthy(); expect(screen.getByRole<HTMLButtonElement>("button", { name: "Generar y conservar PDF" }).disabled).toBe(false);
  mocks.fetch.mockResolvedValue({ ok: true, blob: async () => file }); mocks.apiRequest.mockResolvedValue({ file: saved("generated") }); fireEvent.click(screen.getByRole("button", { name: "Generar y conservar PDF" }));
  await waitFor(() => expect(mocks.result).toHaveBeenCalled()); expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/apps/media?id=original-1", { cache: "no-store" }); expect(mocks.uploadFile).toHaveBeenCalledTimes(2); expect(mocks.change.mock.lastCall![0].originals).toEqual(input.originals);
});
it("conserva el borrador PDF previo y reintenta únicamente el registro pendiente de una carga parcial", async () => {
  let fail = true; mocks.apiRequest.mockImplementation(async (_url: string, _method: string, body: { name: string }) => { if (body.name === "b.pdf" && fail) throw new Error("Registro interrumpido"); return { file: saved(body.name) }; });
  render(<Harness slug="pdf" initial={oldPdf} />); fireEvent.change(screen.getByLabelText("PDF originales"), { target: { files: [await pdfFile("a.pdf"), await pdfFile("b.pdf")] } });
  await screen.findByRole("alert"); expect(mocks.change).not.toHaveBeenCalled(); expect(screen.getByText(/previous.pdf · página 1 · 90/)).toBeTruthy(); expect(mocks.busy).toHaveBeenLastCalledWith(false);
  fail = false; fireEvent.click(screen.getByRole("button", { name: "Reintentar carga de originales" })); await waitFor(() => expect(mocks.change).toHaveBeenCalledTimes(1));
  expect(mocks.uploadFile).toHaveBeenCalledTimes(2); expect(mocks.apiRequest.mock.calls.map(call => call[2].name)).toEqual(["a.pdf", "b.pdf", "b.pdf"]); expect(mocks.change.mock.lastCall![0].originals).toHaveLength(2);
});
it("conserva la captura previa ante PDF ilegible sin iniciar carga", async () => {
  const file = new File(["no pdf"], "invalid.pdf", { type: "application/pdf" }); Object.defineProperty(file, "arrayBuffer", { value: async () => new TextEncoder().encode("no pdf").buffer }); render(<Harness slug="pdf" initial={oldPdf} />);
  fireEvent.change(screen.getByLabelText("PDF originales"), { target: { files: [file] } }); await screen.findByRole("alert"); expect(mocks.change).not.toHaveBeenCalled(); expect(mocks.uploadFile).not.toHaveBeenCalled(); expect(screen.getByText(/previous.pdf/)).toBeTruthy();
});
it("conserva fotografía original antes de guardar y recupera su vista previa al reabrir", async () => {
  const pending = deferred<{ file: ReturnType<typeof saved> }>(); mocks.apiRequest.mockReturnValue(pending.promise); const file = photo(); const view = render(<Harness slug="fotografias" />);
  fireEvent.change(screen.getByLabelText("Fotografía original"), { target: { files: [file] } }); await waitFor(() => expect(mocks.uploadFile).toHaveBeenCalled()); expect(mocks.change).not.toHaveBeenCalled(); expect(mocks.busy).toHaveBeenLastCalledWith(true);
  await act(async () => pending.resolve({ file: saved("photo-original", file.name, file.type) })); await waitFor(() => expect(mocks.change).toHaveBeenCalled()); const input = mocks.change.mock.lastCall![0]; expect(input.original.id).toBe("photo-original"); expect(mocks.result).not.toHaveBeenCalled(); view.unmount();
  render(<Harness slug="fotografias" initial={JSON.parse(JSON.stringify(input))} />); await screen.findByAltText("Vista previa de la fotografía editada"); expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/apps/media?id=photo-original", { cache: "no-store" });
});
it("un fallo de carga de foto conserva original y ajustes anteriores y ofrece reintentar", async () => {
  let fail = true; mocks.apiRequest.mockImplementation(async () => { if (fail) throw new Error("Registro interrumpido"); return { file: saved("new-photo", "original.jpg", "image/jpeg") }; });
  render(<Harness slug="fotografias" initial={{ original: saved("old-photo"), brightness: 130, watermark: "Anterior" }} />); await screen.findByAltText("Vista previa de la fotografía editada"); fireEvent.change(screen.getByLabelText("Fotografía original"), { target: { files: [photo()] } }); await screen.findByRole("alert"); expect(mocks.change).not.toHaveBeenCalled(); expect(screen.getByLabelText<HTMLInputElement>("Marca de agua").value).toBe("Anterior");
  fail = false; fireEvent.click(screen.getByRole("button", { name: "Reintentar carga del original" })); await waitFor(() => expect(mocks.change).toHaveBeenCalledTimes(1)); expect(mocks.uploadFile).toHaveBeenCalledTimes(1); expect(mocks.change.mock.lastCall![0].original.id).toBe("new-photo");
});
it("rechaza fotografía ilegible antes de sustituir el borrador", async () => {
  vi.mocked(createImageBitmap).mockRejectedValue(new Error("Imagen ilegible")); render(<Harness slug="fotografias" />); fireEvent.change(screen.getByLabelText("Fotografía original"), { target: { files: [photo()] } }); await screen.findByRole("alert"); expect(mocks.change).not.toHaveBeenCalled(); expect(mocks.uploadFile).not.toHaveBeenCalled();
});
it("retira el QR anterior inmediatamente al cambiar a una URL inválida", async () => {
  render(<Harness slug="qr" initial={{ url: "https://fortiusinmuebles.com/inventario/a", qrUrl: "https://fortiusinmuebles.com/inventario/a", kind: "public" }} />); await screen.findByAltText("Código QR generado"); fireEvent.change(screen.getByLabelText("Enlace público del inmueble"), { target: { value: "javascript:old" } }); expect(screen.queryByAltText("Código QR generado")).toBeNull();
});
it("expone error de capacidad QR sin conservar una imagen de otro destino", async () => {
  mocks.qr.mockRejectedValue(new Error("Contenido demasiado extenso")); render(<Harness slug="qr" initial={{ url: "https://fortiusinmuebles.com/inventario/a", qrUrl: "https://fortiusinmuebles.com/inventario/a", kind: "public" }} />); expect((await screen.findByRole("alert")).textContent).toContain("Contenido demasiado extenso"); expect(screen.queryByAltText("Código QR generado")).toBeNull();
});
it("consulta revocación real al reabrir aunque el borrador diga que el enlace está vigente", async () => {
  mocks.apiRequest.mockImplementation(async (url: string) => url.includes("shares") ? { shares: [{ ...share, revoked: true }] } : { files: [saved("file-1")] }); render(<Harness slug="qr" initial={privateInput} />); await screen.findByText("Enlace revocado"); expect(screen.queryByAltText("Código QR generado")).toBeNull(); expect(mocks.qr).not.toHaveBeenCalled();
});
it("cambiar el archivo seleccionado desvincula el QR anterior y requiere compartir el nuevo archivo", async () => {
  mocks.apiRequest.mockImplementation(async (url: string) => url.includes("shares") ? { shares: [share] } : { files: [saved("file-1"), saved("file-2")] }); render(<Harness slug="qr" initial={privateInput} />); await screen.findByAltText("Código QR generado"); fireEvent.change(screen.getByLabelText("Documento conservado en las apps"), { target: { value: "file-2" } }); expect(screen.queryByAltText("Código QR generado")).toBeNull(); expect(mocks.change.mock.lastCall![0]).toMatchObject({ fileId: "file-2", url: "", shareId: null });
});
it("revocar desde enlaces anteriores actualiza también el QR activo y comunica ocupado", async () => {
  const pending = deferred<{ ok: boolean }>(); mocks.apiRequest.mockImplementation(async (url: string, method?: string) => method === "PATCH" ? pending.promise : url.includes("shares") ? { shares: [share] } : { files: [saved("file-1")] }); render(<Harness slug="qr" initial={privateInput} />); await screen.findByAltText("Código QR generado"); fireEvent.click(screen.getByText("Enlaces anteriores")); fireEvent.click(screen.getByRole("button", { name: "Revocar" })); await waitFor(() => expect(mocks.busy).toHaveBeenLastCalledWith(true)); await act(async () => pending.resolve({ ok: true })); await waitFor(() => expect(screen.queryByAltText("Código QR generado")).toBeNull()); expect(mocks.change.mock.lastCall![0].revoked).toBe(true);
});
it("un enlace escrito no genera QR antes de confirmar y una URL ajena se rechaza al confirmar", async () => {
  render(<Harness slug="qr" />); fireEvent.change(screen.getByLabelText("Enlace público del inmueble"), { target: { value: "https://outside.invalid/inventario/a" } });
  await waitFor(() => expect(mocks.apiRequest).toHaveBeenCalledTimes(2)); expect(mocks.qr).not.toHaveBeenCalled(); expect(screen.queryByAltText("Código QR generado")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Crear QR de ficha pública" })); expect((await screen.findByRole("alert")).textContent).toContain("enlace público"); expect(mocks.qr).not.toHaveBeenCalled();
});
it("al reabrir rechaza un destino confirmado que no pertenece a Fortius", async () => {
  render(<Harness slug="qr" initial={{ kind: "public", url: "https://outside.invalid/inventario/a", qrUrl: "https://outside.invalid/inventario/a" }} />); expect((await screen.findByRole("alert")).textContent).toContain("enlace público"); expect(mocks.qr).not.toHaveBeenCalled();
});
it("un enlace nuevo después de revocar se guarda vigente y conserva el QR al reabrir", async () => {
  const newShare = { id: "share-2", url: "https://fortiusinmuebles.com/api/apps/shared/newtoken", expiresAt: "2099-02-01T00:00:00Z" };
  const current = { id: newShare.id, file_id: "file-1", expires_at: newShare.expiresAt, revoked: false };
  let created = false;
  mocks.apiRequest.mockImplementation(async (url: string, method?: string) => {
    if(method === "POST") { created = true; return { share: newShare }; }
    return url.includes("shares") ? { shares: [...(created ? [current] : []), { ...share, revoked: true }] } : { files: [saved("file-1")] };
  });
  const view = render(<Harness slug="qr" initial={{ ...privateInput, revoked: true }} />); await screen.findByText("Enlace revocado"); fireEvent.click(screen.getByRole("button", { name: "Compartir documento y crear QR" })); await waitFor(() => expect(mocks.result).toHaveBeenCalled());
  const draft = JSON.parse(JSON.stringify(mocks.change.mock.lastCall![0])); expect(draft).toMatchObject({ revoked: false, shareId: "share-2", url: newShare.url, qrUrl: newShare.url, expiresAt: newShare.expiresAt }); view.unmount();
  render(<Harness slug="qr" initial={draft} />); expect((await screen.findByAltText("Código QR generado")).getAttribute("src")).toContain(btoa(newShare.url));
});
it("el QR privado vencido se oculta aunque el borrador tenga otra fecha de vigencia", async () => {
  mocks.apiRequest.mockImplementation(async (url: string) => url.includes("shares") ? { shares: [{ ...share, expires_at: "2020-01-01T00:00:00Z" }] } : { files: [saved("file-1")] }); render(<Harness slug="qr" initial={privateInput} />); await screen.findByText("Enlace vencido"); expect(mocks.qr).not.toHaveBeenCalled(); expect(screen.queryByAltText("Código QR generado")).toBeNull();
});
it("no habilita QR privado cuando no puede consultar su vigencia", async () => {
  mocks.apiRequest.mockRejectedValue(new Error("Servicio no disponible")); render(<Harness slug="qr" initial={privateInput} />); await screen.findByRole("alert"); expect(mocks.qr).not.toHaveBeenCalled(); expect(screen.queryByAltText("Código QR generado")).toBeNull(); expect(screen.getByRole<HTMLButtonElement>("button", { name: "Compartir documento y crear QR" }).disabled).toBe(true);
});
it("no muestra el resultado tardío de un QR cuyo destino ya cambió", async () => {
  const pending = deferred<string>(); mocks.qr.mockReturnValue(pending.promise); render(<Harness slug="qr" initial={{ kind: "public", url: "https://fortiusinmuebles.com/inventario/a", qrUrl: "https://fortiusinmuebles.com/inventario/a" }} />);
  await waitFor(() => expect(mocks.qr).toHaveBeenCalled()); fireEvent.change(screen.getByLabelText("Enlace público del inmueble"), { target: { value: "https://fortiusinmuebles.com/inventario/b" } }); await act(async () => pending.resolve("data:image/png;base64,OLD")); expect(screen.queryByAltText("Código QR generado")).toBeNull();
});
it("un resultado tardío de generación no oculta el estado revocado al cambiar el borrador", async () => {
  const pending = deferred<string>(); mocks.qr.mockReturnValue(pending.promise);
  const view = render(<DocumentEditor slug="qr" input={privateInput} context={{}} onChange={mocks.change} onResult={mocks.result} />); await waitFor(() => expect(mocks.qr).toHaveBeenCalled());
  view.rerender(<DocumentEditor slug="qr" input={{ ...privateInput, revoked: true }} context={{}} onChange={mocks.change} onResult={mocks.result} />); await act(async () => pending.resolve("data:image/png;base64,OLD")); expect(screen.queryByAltText("Código QR generado")).toBeNull();
});
