import * as React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";
import { AVISO_TEMPLATE_VERSION } from "@/lib/formatos/aviso";
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual=await importOriginal<typeof import("@/lib/admin/store")>();
  const clientes = {}, propiedades = {};
  return { ...actual, db: { ...actual.db, clientes, propiedades }, useCollection: (collection: unknown) => collection === clientes ? [{ id: "c-qa", nombre: "Cliente del expediente QA", tipo: "propietario" }] : [] };
});
import ExpedientesPage from "@/app/admin/expedientes/page";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const values = {
  fechaEmision: "2026-10-04", responsable: "Persona responsable QA", domicilioResponsable: "Calle Prueba 123, Centro, Tijuana, Baja California",
  contactoPrivacidad: "Atención QA", correoPrivacidad: "privacidad@example.invalid", titular: "Titular QA", tipoTitular: "propietario", operacion: "Venta",
  consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "no", transferenciaAsesor: "no", transferenciaFinanciera: "no", transferenciaOperacion: "no", acuseEstado: "pendiente",
};

it("agrupa los datos comunes sin perder la captura y permite mostrar sólo los detalles necesarios", () => {
  function Editor() { const [data, setData] = React.useState<Record<string, unknown>>({ ...values }); return <FormatoEditor definition={formatoById("01")} values={data} onChange={(key, value) => setData(current => ({ ...current, [key]: value }))} />; }
  render(<Editor />);
  const common = screen.getByText("Datos de Fortius").closest("details");
  expect(common).not.toBeNull();
  expect(common?.open).toBe(false);
  expect((screen.getByLabelText("Identidad del responsable") as HTMLInputElement).value).toBe("Persona responsable QA");
  expect(screen.queryByLabelText("Documento de representación")).toBeNull();
  fireEvent.change(screen.getByLabelText("Calidad del titular"), { target: { value: "representante" } });
  expect(screen.getByLabelText("Documento de representación")).toBeTruthy();
});
it("mantiene abiertos los datos de Fortius mientras se termina de escribir el último campo", () => {
  function Editor() { const [data, setData] = React.useState<Record<string, unknown>>({ ...values, correoPrivacidad: "" }); return <FormatoEditor definition={formatoById("01")} values={data} onChange={(key, value) => setData(current => ({ ...current, [key]: value }))} />; }
  render(<Editor />);
  const common = screen.getByText("Datos de Fortius").closest("details");
  expect(common?.open).toBe(true);
  fireEvent.change(screen.getByLabelText("Correo para derechos de privacidad"), { target: { value: "a@b.c" } });
  expect(common?.open).toBe(true);
});

it("captura decisiones propias del representante sin copiar las del titular", () => {
  const changes = vi.fn();
  render(<FormatoEditor definition={formatoById("01")} values={{ ...values, representante: "Representante QA", consentimientoPatrimonial: "si" }} onChange={changes} />);
  expect((screen.getByLabelText("Representante: datos patrimoniales y financieros") as HTMLSelectElement).value).toBe("");
  fireEvent.change(screen.getByLabelText("Representante: datos patrimoniales y financieros"), { target: { value: "no" } });
  expect(changes).toHaveBeenCalledWith("representanteConsentimientoPatrimonial", "no");
});

it("genera la plantilla actual cuando sólo hay un PDF archivado con el diseño anterior", async () => {
  let emitted = 0;
  const clicked: string[] = [];
  vi.stubGlobal("URL", class extends URL { static createObjectURL = () => "blob:qa-pdf"; static revokeObjectURL = vi.fn(); });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { clicked.push(this.download); });
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url === "/api/admin/expedientes") return Response.json({ expedientes: [exp] });
    if (url.endsWith("/formatos")) return Response.json({ documentos: [draft] });
    if (url.endsWith("/firmado")) return Response.json({ copias: [] });
    if (url.endsWith("/emitir")) {
      emitted++;
      expect(JSON.parse(String(init?.body)).version).toBe(5);
      return Response.json({ emision: { id: "pdf-current", draft_version: 5, plantillaVersion: AVISO_TEMPLATE_VERSION } }, { status: 201 });
    }
    if (url.endsWith("/descargar")) { expect(url).toContain("pdf-current"); return new Response("%PDF-1.7 QA", { headers: { "Content-Type": "application/pdf" } }); }
    return Response.json({ documento: draft, emisiones: [{ id: "pdf-old", draft_version: 5, created_at: "2026-10-04" }] });
  });
  render(<ExpedientesPage />);
  fireEvent.click(await screen.findByRole("button", { name: /EXP-QA/ }));
  fireEvent.click(await screen.findByRole("tab", { name: "Documentos" }));
  fireEvent.click(await screen.findByRole("button", { name: /^01 ·/ }));
  await screen.findByLabelText("Nombre del titular");
  expect(screen.queryByRole("link", { name: "Descargar PDF del aviso" })).toBeNull();
  expect(screen.getByRole("link", { name: /PDF emitido · versión 5/ }).getAttribute("href")).toContain("pdf-old");
  fireEvent.click(screen.getByRole("button", { name: "Guardar y descargar PDF" }));
  await waitFor(() => expect(clicked).toHaveLength(1));
  expect(emitted).toBe(1);
});

const exp = { id: "exp-qa", cliente_id: "c-qa", asesor_id: "a-qa", folio: "EXP-QA", operacion: "venta", version: 1 };
const draft = { id: "draft-qa", expediente_id: exp.id, formato_id: "01", data: values, version: 5, updated_at: "2026-10-04" };
it("recupera el cliente y la operación al crear un aviso, sin presumir autorizaciones ni firma", async () => {
  let initial: Record<string, unknown> = {};
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url === "/api/admin/expedientes") return Response.json({ expedientes: [exp] });
    if (init?.method === "POST") {
      initial = JSON.parse(String(init.body)).data;
      return Response.json({ documento: { ...draft, data: {...initial,titular:"Cliente del expediente QA",tipoTitular:"propietario",operacion:"Venta"}, version: 1 } }, { status: 201 });
    }
    return Response.json({ documentos: [] });
  });
  render(<ExpedientesPage />);
  fireEvent.click(await screen.findByRole("button", { name: /EXP-QA/ }));
  fireEvent.click(await screen.findByRole("tab", { name: "Documentos" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Formato" }), { target: { value: "01" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear borrador" }));
  await screen.findByLabelText("Nombre del titular");
  expect((screen.getByLabelText("Nombre del titular") as HTMLInputElement).value).toBe("Cliente del expediente QA");
  expect(initial).not.toHaveProperty("titular");
  expect(initial).toMatchObject({ consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "pendiente", transferenciaAsesor: "pendiente", transferenciaFinanciera: "pendiente", transferenciaOperacion: "pendiente", acuseEstado: "pendiente" });
  expect(initial.fechaEmision).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(initial).not.toHaveProperty("responsable");
});
async function setup(failure?: "save" | "emit" | "download") {
  const steps: string[] = [];
  const clicked: string[] = [];
  vi.stubGlobal("URL", class extends URL { static createObjectURL = () => "blob:qa-pdf"; static revokeObjectURL = vi.fn(); });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { clicked.push(this.download); });
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url === "/api/admin/expedientes") return Response.json({ expedientes: [exp] });
    if (url.endsWith("/formatos")) return Response.json({ documentos: [draft] });
    if (init?.method === "PUT") {
      steps.push("save");
      const body = JSON.parse(String(init.body));
      expect(body.version).toBe(5); expect(body.data.titular).toBe("Titular actualizado QA");
      return failure === "save" ? Response.json({ error: "No se pudo guardar" }, { status: 503 }) : Response.json({ documento: { ...draft, version: 6, data: body.data } });
    }
    if (url.endsWith("/emitir")) {
      steps.push("emit"); expect(JSON.parse(String(init?.body)).version).toBe(6);
      return failure === "emit" ? Response.json({ error: "No se pudo archivar" }, { status: 503 }) : Response.json({ emision: { id: "pdf-qa", draft_version: 6, created_at: "2026-10-04", sha256: "a".repeat(64), plantillaVersion: AVISO_TEMPLATE_VERSION } }, { status: 201 });
    }
    if (url.endsWith("/descargar")) {
      steps.push("download");
      return failure === "download" ? Response.json({ error: "No se pudo descargar" }, { status: 503 }) : new Response("%PDF-1.7 QA", { headers: { "Content-Type": "application/pdf" } });
    }
    return Response.json({ documento: draft, emisiones: [] });
  });
  render(<ExpedientesPage />);
  fireEvent.click(await screen.findByRole("button", { name: /EXP-QA/ }));
  fireEvent.click(await screen.findByRole("tab", { name: "Documentos" }));
  fireEvent.click(await screen.findByRole("button", { name: /^01 ·/ }));
  fireEvent.change(await screen.findByLabelText("Nombre del titular"), { target: { value: "Titular actualizado QA" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar y descargar PDF" }));
  return { steps, clicked };
}

it("guarda la captura actual, emite esa versión y descarga el PDF con un botón", async () => {
  const result = await setup();
  await waitFor(() => expect(result.clicked).toHaveLength(1));
  expect(result.steps).toEqual(["save", "emit", "download"]);
  expect(result.clicked[0]).toMatch(/Aviso.*\.pdf$/);
  expect(screen.getByRole("link", { name: "Descargar PDF del aviso" }).getAttribute("href")).toBe("/api/admin/emisiones/pdf-qa/descargar");
});

it.each(["save", "emit", "download"] as const)("conserva los datos si falla %s y ofrece el PDF archivado cuando existe", async failure => {
  const result = await setup(failure);
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Nombre del titular") as HTMLInputElement).value).toBe("Titular actualizado QA");
  expect(result.clicked).toEqual([]);
  expect(result.steps).toEqual(failure === "save" ? ["save"] : failure === "emit" ? ["save", "emit"] : ["save", "emit", "download"]);
  expect(Boolean(screen.queryByRole("link", { name: "Descargar PDF del aviso" }))).toBe(failure === "download");
});
