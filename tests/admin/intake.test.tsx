import * as React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import NewOperation from "@/app/admin/operaciones/nueva/page";
import Interview from "@/app/admin/entrevistas/[id]/page";
const { request, push } = vi.hoisted(() => ({
  request: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/admin/store", () => {
  const stores = {
    leads: { load: vi.fn().mockResolvedValue(undefined) },
    clientes: { load: vi.fn().mockResolvedValue(undefined) },
    tareas: { load: vi.fn().mockResolvedValue(undefined) },
    asesores: {},
  };
  return {
    AdminApiError: class extends Error {
      status = 503;
    },
    apiRequest: request,
    db: stores,
    useCollection: (c: unknown) =>
      c === stores.asesores ? [{ id: "a", nombre: "Ana", activo: true }] : [],
    useLoadState: () => ({ loaded: true }),
  };
});
const id = "54000000-0000-4000-8000-000000000001";
const interview = {
  id,
  intencion: "vender",
  asesor_id: "a",
  lead_id: "lead",
  cliente_id: null,
  expediente_id: null,
  anterior_id: null,
  contacto: { nombre: "Propietario", telefono: "6640000000" },
  respuestas: { fecha: "2026-10-13" },
  estado: "borrador",
  version: 2,
  completed_at: null,
  updated_at: "2026-10-13",
};
afterEach(() => {
  cleanup();
  request.mockReset();
  push.mockReset();
  window.history.replaceState(null, "", "/");
});
it("chooses a profile before contact capture and prevents double submission", async () => {
  let done!: (v: unknown) => void;
  request.mockImplementation((url: string, method?: string) =>
    method === "POST"
      ? new Promise((r) => {
          done = r;
        })
      : Promise.resolve(
          url.endsWith("/config")
            ? { administrador: true, asesorId: null }
            : { entrevistas: [] },
        ),
  );
  render(<NewOperation />);
  expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(5);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Vender un inmueble Propietario vendedor",
    }),
  );
  expect(screen.getByRole("list", { name: "Inicio de la operación" }).textContent).toContain("3. Persona");
  expect(screen.getByRole("list", { name: "Inicio de la operación" }).textContent).toContain("4. Inmueble");
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar con el contacto" }),
  );
  fireEvent.change(screen.getByLabelText("Nombre completo"), {
    target: { value: "Ana Propietaria" },
  });
  fireEvent.change(screen.getByLabelText("Teléfono"), {
    target: { value: "6641234567" },
  });
  fireEvent.change(screen.getByLabelText("Siguiente acción"), {target:{value:"Entrevistar al propietario"}});
  fireEvent.change(screen.getByLabelText("Fecha de la siguiente acción"), {target:{value:"2030-12-31"}});
  await waitFor(() =>
    expect(
      (
        screen.getByRole("combobox", {
          name: "Asesor responsable",
        }) as HTMLSelectElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.change(
    screen.getByRole("combobox", { name: "Asesor responsable" }),
    { target: { value: "a" } },
  );
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Iniciar entrevista",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Iniciar entrevista" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Preparando entrevista…" }),
  );
  expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(1);
  expect(request.mock.calls.find((c) => c[1] === "POST")?.[2]).toMatchObject({
    intencion: "vender",
    contacto: { tipo: "nuevo", nombre: "Ana Propietaria" },
  });
  await act(async () => done({ entrevista: interview }));
  expect(push).toHaveBeenCalledWith("/admin/entrevistas/" + id);
});
it("saves partial answers with the current version and preserves them on server conflict", async () => {
  request.mockImplementation((_url: string, method?: string) =>
    method === "PUT"
      ? Promise.reject(new Error("La entrevista cambió; conserva tu captura"))
      : Promise.resolve({ entrevista: interview }),
  );
  await act(async () => {
    render(
      <React.Suspense fallback={<p>Cargando</p>}>
        <Interview params={Promise.resolve({ id })} />
      </React.Suspense>,
    );
  });
  const question = await screen.findByLabelText("¿Qué quiere lograr? *");
  fireEvent.change(question, { target: { value: "Vender mi casa" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
  await screen.findByRole("alert");
  expect(request.mock.calls.find((c) => c[1] === "PUT")?.[2]).toMatchObject({
    version: 2,
    completar: false,
    respuestas: { objetivo: "Vender mi casa" },
  });
  expect((question as HTMLTextAreaElement).value).toBe("Vender mi casa");
  expect(
    screen.queryByRole("region", { name: "Entrevista completada" }),
  ).toBeNull();
});
it("does not advance an incomplete interview and displays the missing question", async () => {
  request.mockResolvedValue({ entrevista: interview });
  await act(async () => {
    render(
      <React.Suspense fallback={<p>Cargando</p>}>
        <Interview params={Promise.resolve({ id })} />
      </React.Suspense>,
    );
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Continuar con el inmueble" }),
  );
  expect(request.mock.calls.some((c) => c[1] === "PUT")).toBe(false);
  expect(screen.getByRole("alert").textContent).toContain("Faltan respuestas");
  expect(screen.queryByLabelText("Tipo de inmueble *")).toBeNull();
});
it("shows spouse fields only after a married answer and keeps the house step next", async () => {
  request.mockResolvedValue({ entrevista: interview });
  await act(async () => {
    render(
      <React.Suspense fallback={<p>Cargando</p>}>
        <Interview params={Promise.resolve({ id })} />
      </React.Suspense>,
    );
  });
  expect(await screen.findByLabelText("Estado civil")).toBeTruthy();
  expect(screen.queryByLabelText("Nombre del cónyuge")).toBeNull();
  fireEvent.change(screen.getByLabelText("Estado civil"), {
    target: { value: "casado" },
  });
  expect(screen.getByLabelText("Nombre del cónyuge")).toBeTruthy();
  expect(screen.getByLabelText("Régimen matrimonial")).toBeTruthy();
  expect(screen.queryByLabelText("Tipo de inmueble *")).toBeNull();
});
