import * as React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import NotasPage from "@/app/admin/notas/page";
import BlogPage from "@/app/admin/blog/page";
import { AdminShell } from "@/components/admin/admin-shell";
import * as api from "@/lib/admin/store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn() }),
}));
let fail = false;
let version = 1;
let saved: Record<string, unknown>[] = [];
const post = {
  id: "p1",
  slug: "guia",
  titulo: "Guía",
  resumen: "Resumen",
  contenido: "Contenido",
  estado: "borrador",
  actualizadoEl: "2026-09-03",
};
beforeEach(() => {
  fail = false;
  version = 1;
  saved = [];
  api.clearAdminCache?.();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/auth/session")
        return Response.json({
          user: { id: "staff", email: "staff@example.com", role: "admin" },
        });
      if (url.startsWith("/api/auth/")) return Response.json({ ok: true });
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body));
        if (fail)
          return Response.json({ error: "No se guardó" }, { status: 503 });
        if (url.includes("/posts/") && body.version !== version)
          return Response.json({ error: "Conflicto" }, { status: 409 });
        saved.push(body);
        return Response.json({
          record: {
            id: body.data.id,
            data: body.data,
            version: version + 1,
            createdAt: "2026-09-03",
            updatedAt: "2026-09-03",
          },
        });
      }
      return Response.json({
        records: url.endsWith("/posts")
          ? [
              {
                id: "p1",
                data: post,
                version,
                createdAt: "2026-09-03",
                updatedAt: "2026-09-03",
              },
            ]
          : [],
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("note save failure preserves input and shows an error, success resets after persistence", async () => {
  render(<NotasPage />);
  fireEvent.change(screen.getByLabelText("Título"), {
    target: { value: "Pendiente real" },
  });
  fail = true;
  fireEvent.click(screen.getByRole("button", { name: /Nueva nota/ }));
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe(
    "Pendiente real",
  );
  expect(saved).toHaveLength(0);
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: /Nueva nota/ }));
  await waitFor(() =>
    expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe(
      "",
    ),
  );
  expect(saved).toHaveLength(1);
});
test("blog edit holds opening version after background refresh and stays open on 409", async () => {
  render(<BlogPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Editar Guía" }));
  fireEvent.change(screen.getByLabelText("Título"), {
    target: { value: "Mi borrador" },
  });
  version = 2;
  await act(async () => {
    await api.db.posts.load();
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar entrada" }));
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe(
    "Mi borrador",
  );
  expect(saved).toHaveLength(0);
});
test("blog publishes an entry while clearly keeping drafts inside the panel", async () => {
  render(<BlogPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Editar Guía" }));
  const state = screen.getByLabelText("Estado") as HTMLSelectElement;
  const publicOption = Array.from(state.options).find((option) => option.value === "publicado")!;
  expect(publicOption.textContent).toMatch(/públic[ao]/i);
  expect(document.body.textContent).toMatch(/borradores.*panel/i);
  fireEvent.change(state, { target: { value: "publicado" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar entrada" }));
  await waitFor(() => expect(saved).toHaveLength(1));
  expect((saved[0].data as Record<string, unknown>).estado).toBe("publicado");
  expect(screen.getByText("Expuesto públicamente")).toBeTruthy();
});
test("authenticated shell exposes every module, clients and logout on mobile navigation", async () => {
  render(
    <AdminShell>
      <p>Privado</p>
    </AdminShell>,
  );
  await screen.findByText("Privado");
  expect(
    screen
      .getByRole("complementary")
      .querySelector('svg[aria-label="MNT Inmuebles"]'),
  ).toBeTruthy();
  const menu = screen.getByRole("button", { name: "Menú del panel" });
  fireEvent.click(menu);
  const nav = screen.getByRole("navigation", { name: "Módulos móviles" });
  expect(
    Array.from(nav.querySelectorAll("a")).map((a) => a.getAttribute("href")),
  ).toContain("/admin/clientes");
  expect(nav.querySelectorAll("a")).toHaveLength(12);
  fireEvent.click(
    Array.from(nav.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Salir"),
    )!,
  );
  await screen.findByRole("heading", { name: "Acceso al panel" });
  expect(screen.queryByText("Privado")).toBeNull();
  expect(screen.getByRole("img", { name: "MNT Inmuebles" })).toBeTruthy();
});
test("callback secrets are removed before request, password mode survives verification", async () => {
  window.history.replaceState(
    null,
    "",
    "/admin#type=invite&access_token=secret&refresh_token=refresh",
  );
  render(
    <AdminShell>
      <p>Privado</p>
    </AdminShell>,
  );
  await screen.findByLabelText("Nueva contraseña");
  expect(window.location.hash).toBe("");
  expect(screen.queryByText("Privado")).toBeNull();
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "password-new-123" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
    target: { value: "password-new-123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));
  await screen.findByText("Privado");
});

test("failed post-save reconciliation shows a retryable warning without discarding the open draft", async () => {
  render(
    <AdminShell>
      <input aria-label="Borrador abierto" defaultValue="Mi texto sin perder" />
    </AdminShell>,
  );
  await screen.findByLabelText("Borrador abierto");
  let respond!: (response: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(
    () => new Promise<Response>((done) => { respond = done; }),
  );
  const note = {
    id: "n1",
    titulo: "Guardado",
    texto: "Texto",
    actualizadoEl: "2026-09-03",
  };
  const saving = api.db.notas.put(note, null);
  await act(async () => {
    await api.db.notas.load();
  });
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({ error: "Sin conexión" }, { status: 503 }),
  );
  await act(async () => {
    respond(Response.json({
      record: {
        id: "n1",
        data: note,
        version: 1,
        createdAt: "2026-09-03",
        updatedAt: "2026-09-03",
      },
    }));
    const saved = await saving;
    expect(api.db.notas.version(saved)).toBe(1);
  });
  expect((await screen.findByRole("alert")).textContent).toContain("se guardó");
  expect((screen.getByLabelText("Borrador abierto") as HTMLInputElement).value)
    .toBe("Mi texto sin perder");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar carga" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect((screen.getByLabelText("Borrador abierto") as HTMLInputElement).value)
    .toBe("Mi texto sin perder");
});
test("email login rejection keeps private content hidden and displays the server failure", async () => {
  vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
    if (String(url) === "/api/auth/session")
      return Response.json({ error: "Sin sesión" }, { status: 401 });
    return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
  });
  render(
    <AdminShell>
      <p>Privado</p>
    </AdminShell>,
  );
  await screen.findByLabelText("Correo");
  fireEvent.change(screen.getByLabelText("Correo"), {
    target: { value: "staff@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "incorrecta" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Credenciales",
  );
  expect(screen.queryByText("Privado")).toBeNull();
});
test("recovery rejection never shows an email-sent confirmation", async () => {
  vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
    if (String(url) === "/api/auth/session")
      return Response.json({ error: "Sin sesión" }, { status: 401 });
    return Response.json({ error: "Proveedor no disponible" }, { status: 503 });
  });
  render(
    <AdminShell>
      <p>Privado</p>
    </AdminShell>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Olvidé mi contraseña" }),
  );
  fireEvent.change(screen.getByLabelText("Correo"), {
    target: { value: "staff@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Proveedor");
  expect(screen.queryByText(/recibirá un enlace/)).toBeNull();
});
