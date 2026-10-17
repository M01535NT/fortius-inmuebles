import * as React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
const { request, push, nav } = vi.hoisted(() => ({ request: vi.fn(), push: vi.fn(), nav: { search: new URLSearchParams(), listeners: new Set<() => void>() } }));
vi.mock("next/navigation", async () => {
  const react = await import("react");
  const subscribe = (cb: () => void) => { nav.listeners.add(cb); return () => nav.listeners.delete(cb); };
  const replace = (url: string) => { nav.search = new URL(url, "http://localhost").searchParams; nav.listeners.forEach(cb => cb()); };
  return { useRouter: () => ({ push, replace }), useSearchParams: () => react.useSyncExternalStore(subscribe, () => nav.search) };
});
vi.mock("@/lib/admin/store", () => {
  const store = () => ({ load: vi.fn().mockResolvedValue(undefined) });
  const stores = { leads: store(), clientes: store(), tareas: store(), propiedades: store(), asesores: store() };
  const people: Record<string, unknown[]> = {
    asesores: [{ id: "a", nombre: "Ana", activo: true }],
    leads: [{ id: "lead-1", nombre: "Ramón Félix Arce", telefono: "664 351 0928", email: "" }],
  };
  return {
    AdminApiError: class extends Error { status = 503; },
    apiRequest: request, db: stores,
    errorMessage: (e: unknown) => e instanceof Error ? e.message : String(e),
    useCollection: (c: unknown) => people[Object.entries(stores).find(([, v]) => v === c)?.[0] ?? ""] ?? [],
    useLoadState: () => ({ loaded: true }),
  };
});
import { NewOperationWizard } from "@/components/admin/intake/wizard";
import { dontKnowValue, firstOpenScreen, interviewScreens, screenIssues } from "@/lib/intake/wizard";
import { interviewFields } from "@/lib/intake/interview";

const id = "54000000-0000-4000-8000-000000000001";
const interview = { id, intencion: "vender", asesor_id: "a", lead_id: "lead", cliente_id: null, expediente_id: null, anterior_id: null, contacto: { nombre: "Propietario", telefono: "6640000000" }, respuestas: { fecha: "2026-10-13" }, estado: "borrador", version: 2, completed_at: null, updated_at: "2026-10-13" };
const config = (url: string) => url.endsWith("/config") ? { administrador: true, asesorId: null } : { entrevistas: [] };
beforeEach(() => { nav.search = new URLSearchParams(); });
afterEach(() => { cleanup(); request.mockReset(); push.mockReset(); });

it("elige qué quiere el cliente, captura quién es y no envía dos veces", async () => {
  let done!: (v: unknown) => void;
  request.mockImplementation((url: string, method?: string) => method === "POST" ? new Promise(r => { done = r; }) : Promise.resolve(url.startsWith("/api/admin/entrevistas/") && !url.endsWith("/config") ? { entrevista: interview } : config(url)));
  render(<NewOperationWizard />);
  expect(screen.getByText("Paso 1 de 4")).toBeTruthy();
  expect(screen.getAllByRole("radio")).toHaveLength(5);
  expect((screen.getByRole("button", { name: /Continuar/ }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("radio", { name: /Vender su inmueble/ }));
  fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));
  expect(screen.getByRole("heading", { name: "¿Quién es?" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Ana Propietaria" } });
  fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "6641234567" } });
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Asesor responsable" })).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: /Continuar con los datos del prospecto/ }));
  expect(screen.getByRole("alert").textContent).toBe("Elige al asesor responsable.");
  fireEvent.change(screen.getByRole("combobox", { name: "Asesor responsable" }), { target: { value: "a" } });
  fireEvent.click(screen.getByRole("button", { name: /Continuar con los datos del prospecto/ }));
  fireEvent.click(screen.getByRole("button", { name: /Guardando/ }));
  expect(request.mock.calls.filter(c => c[1] === "POST")).toHaveLength(1);
  expect(request.mock.calls.find(c => c[1] === "POST")?.[2]).toMatchObject({ intencion: "vender", contacto: { tipo: "nuevo", nombre: "Ana Propietaria", asesorId: "a" }, seguimiento: { origen: "llamada", accion: "Terminar la entrevista" } });
  await act(async () => done({ entrevista: interview }));
  expect(nav.search.get("entrevista")).toBe(id);
  expect(await screen.findByRole("heading", { name: "Datos del prospecto" })).toBeTruthy();
  expect(screen.getByText("Paso 3 de 4")).toBeTruthy();
});

it("avisa si el teléfono ya está registrado y usa esa ficha cuando es la misma persona", async () => {
  request.mockImplementation((url: string, method?: string) => Promise.resolve(method === "POST" ? { entrevista: interview } : config(url)));
  nav.search = new URLSearchParams({ intencion: "comprar" });
  render(<NewOperationWizard />);
  fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));
  fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Ramón" } });
  fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "6643510928" } });
  expect(screen.getByText("Ya tenemos a alguien con ese teléfono")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Sí, es la misma persona" }));
  expect(screen.getByText("Ramón Félix Arce")).toBeTruthy();
  await waitFor(() => expect((screen.getByRole("button", { name: /Continuar con la entrevista/ }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: /Continuar con la entrevista/ }));
  await waitFor(() => expect(request.mock.calls.find(c => c[1] === "POST")?.[2]).toMatchObject({ intencion: "comprar", contacto: { tipo: "lead", id: "lead-1" } }));
});

it("guarda lo capturado con la versión actual y lo conserva si el servidor rechaza", async () => {
  nav.search = new URLSearchParams({ entrevista: id });
  request.mockImplementation((_url: string, method?: string) => method === "PUT" ? Promise.reject(new Error("La entrevista cambió; conserva tu captura")) : Promise.resolve({ entrevista: interview }));
  render(<NewOperationWizard />);
  const question = await screen.findByLabelText("¿Qué quiere hacer y por qué?");
  fireEvent.change(question, { target: { value: "Vender mi casa" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar y seguir después" }));
  expect((await screen.findByRole("alert")).textContent).toContain("La entrevista cambió");
  expect(request.mock.calls.find(c => c[1] === "PUT")?.[2]).toMatchObject({ version: 2, completar: false, respuestas: { objetivo: "Vender mi casa" } });
  expect((question as HTMLTextAreaElement).value).toBe("Vender mi casa");
  expect(push).not.toHaveBeenCalled();
});

it("no avanza una pantalla incompleta y dice qué falta; «No sabe» cuenta como respuesta", async () => {
  const buyer = { ...interview, intencion: "comprar" };
  nav.search = new URLSearchParams({ entrevista: id });
  request.mockResolvedValue({ entrevista: buyer });
  render(<NewOperationWizard />);
  fireEvent.click(await screen.findByRole("button", { name: /^Continuar/ }));
  expect(request.mock.calls.some(c => c[1] === "PUT")).toBe(false);
  expect(screen.getByRole("alert").textContent).toContain("Te falta: ¿Qué quiere lograr?");
  expect(screen.getByRole("heading", { name: "Qué busca" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("¿Qué quiere lograr?"), { target: { value: "Comprar" } });
  const plazo = screen.getByLabelText("¿En qué plazo quiere realizar la operación?");
  fireEvent.click(within(plazo.parentElement!).getByLabelText("No sabe"));
  expect((plazo as HTMLInputElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Municipio y zonas de interés"), { target: { value: "Tijuana" } });
  fireEvent.click(within(screen.getByRole("radiogroup", { name: "Tipo de inmueble" })).getByRole("radio", { name: "Casa" }));
  request.mockImplementation((_url: string, method?: string, body?: { respuestas: Record<string, string> }) => Promise.resolve({ entrevista: method === "PUT" ? { ...buyer, version: 3, respuestas: body!.respuestas } : buyer }));
  fireEvent.click(screen.getByRole("button", { name: /^Continuar/ }));
  expect(await screen.findByRole("heading", { name: "Lo que necesita" })).toBeTruthy();
  expect(request.mock.calls.find(c => c[1] === "PUT")?.[2]).toMatchObject({ completar: false, respuestas: { objetivo: "Comprar", plazo: "No sabe" } });
});

it("el prospecto pide lo básico del primer contacto y deja lo demás para la entrevista inicial", async () => {
  nav.search = new URLSearchParams({ entrevista: id });
  request.mockResolvedValue({ entrevista: interview });
  render(<NewOperationWizard />);
  expect(await screen.findByRole("heading", { name: "Datos del prospecto" })).toBeTruthy();
  expect(screen.getByLabelText("Domicilio del inmueble")).toBeTruthy();
  expect(screen.getByLabelText("¿Cuándo es la entrevista inicial?")).toBeTruthy();
  expect((screen.getByLabelText("Lo que sigue") as HTMLInputElement).value).toBe("Entrevista inicial en persona");
  expect(screen.queryByRole("radiogroup", { name: "Estado civil" })).toBeNull();
  expect(screen.queryByRole("radiogroup", { name: "¿Quién ocupa el inmueble?" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Guardar prospecto/ }));
  expect(screen.getByRole("alert").textContent).toContain("Domicilio del inmueble");
  expect(request.mock.calls.some(c => c[1] === "PUT")).toBe(false);
});

it("al terminar la entrevista muestra la operación creada", async () => {
  const answers = { fecha: "2026-10-13", ubicacion: "Paseo Ensenada 120, Playas de Tijuana", objetivo: "Vender", plazo: "6 meses", zona: "Playas", tipoInmueble: "casa", presupuestoEstado: "por_definir", privacidad: "presentado", siguienteFecha: "2026-10-20" };
  const ready = { ...interview, respuestas: answers };
  nav.search = new URLSearchParams({ entrevista: id });
  request.mockImplementation((url: string, method?: string) => Promise.resolve(method === "PUT" ? { entrevista: { ...ready, estado: "completada", version: 3, expediente_id: "exp-1", completed_at: "2026-10-13T18:00:00Z" } } : url === "/api/admin/expedientes" ? { expedientes: [{ id: "exp-1", folio: "EXP-2026-047" }] } : { entrevista: ready }));
  render(<NewOperationWizard />);
  expect(await screen.findByRole("heading", { name: "Datos del prospecto" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Guardar prospecto/ }));
  expect(await screen.findByRole("heading", { name: "Listo, la operación está creada" })).toBeTruthy();
  // Lo que el prospecto no pregunta queda «por aclarar» para la entrevista inicial (02).
  expect(request.mock.calls.find(c => c[1] === "PUT")?.[2]).toMatchObject({ completar: true, respuestas: { relacion: "por_aclarar", ocupacion: "por_aclarar", alertas: "por_aclarar", siguienteAccion: "Entrevista inicial en persona" } });
  expect(screen.getByText("La encuentras en Operaciones, en la etapa Prospecto.")).toBeTruthy();
  expect(await screen.findByText("EXP-2026-047")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Abrir la operación/ }).getAttribute("href")).toBe("/admin/operaciones/exp-1");
  expect(screen.getByText("Paso 4 de 4")).toBeTruthy();
});

it("agrupa la entrevista en pantallas y deja «No sabe» solo donde se puede", () => {
  expect(interviewScreens("vender").map(s => s.title)).toEqual(["Datos del prospecto"]);
  expect(interviewScreens("comprar").map(s => s.title)).toEqual(["Qué busca", "Lo que necesita", "Presupuesto y acuerdos", "Lo que sigue"]);
  const field = (intent: "vender" | "comprar", key: string) => interviewFields(intent).find(f => f.key === key)!;
  expect(dontKnowValue("vender", field("vender", "tipoInmueble"))).toBeNull();
  expect(dontKnowValue("comprar", field("comprar", "tipoInmueble"))).toBe("por_definir");
  expect(dontKnowValue("vender", field("vender", "relacion"))).toBe("por_aclarar");
  expect(dontKnowValue("vender", field("vender", "objetivo"))).toBe("No sabe");
  expect([dontKnowValue("vender", field("vender", "fecha")), dontKnowValue("vender", field("vender", "siguienteAccion")), dontKnowValue("vender", field("vender", "privacidad"))]).toEqual([null, null, null]);
  expect(firstOpenScreen("comprar", { fecha: "2026-10-13", objetivo: "x", plazo: "y", zona: "z", tipoInmueble: "casa" })).toBe(1);
  expect(screenIssues("vender", { fecha: "2026-10-13", privacidad: "presentado", siguienteAccion: "Entrevista", siguienteFecha: "2026-10-20", presupuestoEstado: "por_definir" }, interviewScreens("vender")[0]).map(i => i.key)).toEqual(["ubicacion", "objetivo", "plazo", "zona", "tipoInmueble"]);
});
