import { beforeEach, expect, it, vi } from "vitest";
const { requireStaff, listRecords, putRecord } = vi.hoisted(() => ({ requireStaff: vi.fn(), listRecords: vi.fn(), putRecord: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
vi.mock("@/lib/backend/repository", () => ({ listRecords, putRecord, deleteRecord: vi.fn() }));
import { PUT } from "@/app/api/admin/collections/[collection]/[id]/route";

/* CRM-02: los textos de «Mensajes listos» solo los cambia el director; el asesor sí guarda lo demás. */
const settings = { nombreComercial: "Fortius", telefono: "", whatsapp: "", email: "", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "" };
const stored = { mensajes: { "primera-busqueda": "Hola, {nombre}." } };
const request = (data: unknown) => new Request("https://panel.test/api/admin/collections/config/singleton", { method: "PUT", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify({ data, version: 3 }) });
const context = { params: Promise.resolve({ collection: "config", id: "singleton" }) };
const as = (role: string) => requireStaff.mockResolvedValue({ client: {}, user: { role } });
beforeEach(() => {
  vi.clearAllMocks();
  listRecords.mockResolvedValue([{ id: "singleton", data: { ...settings, ...stored }, version: 3 }]);
  putRecord.mockResolvedValue({ id: "singleton", version: 4 });
});

it("el asesor guarda la configuración sin tocar los mensajes", async () => {
  as("editor");
  expect((await PUT(request({ ...settings, telefono: "6640000000", ...stored }), context)).status).toBe(200);
  expect(putRecord).toHaveBeenCalledOnce();
});
it("el asesor no puede cambiar ni borrar los mensajes", async () => {
  as("editor");
  for (const mensajes of [{ "primera-busqueda": "Otro texto, {nombre}." }, undefined]) {
    const response = await PUT(request({ ...settings, ...(mensajes ? { mensajes } : {}) }), context);
    expect(response.status).toBe(403);
  }
  expect(putRecord).not.toHaveBeenCalled();
});
it("el director cambia los mensajes; un dato que no existe se rechaza", async () => {
  as("admin");
  expect((await PUT(request({ ...settings, mensajes: { opcion: "Mira {inmueble}: {liga_ficha}" } }), context)).status).toBe(200);
  expect(listRecords).not.toHaveBeenCalled();
  const { parseRecord } = await import("@/lib/backend/validation");
  expect(() => parseRecord("config", "singleton", { ...settings, mensajes: { opcion: "Llama al {telefono}" } })).toThrow();
  expect(() => parseRecord("config", "singleton", { ...settings, mensajes: { inventado: "Hola" } })).toThrow();
  const { projectPublic } = await import("@/lib/backend/validation");
  expect(projectPublic("config", [{ ...settings, ...stored }])[0]).not.toHaveProperty("mensajes");
});
