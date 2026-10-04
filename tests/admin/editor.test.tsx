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
import { PropertyForm } from "@/components/admin/property-form";
import EditPropertyPage from "@/app/admin/propiedades/[slug]/editar/page";
import LeadPage from "@/app/admin/leads/[id]/page";
import ConfigPage from "@/app/admin/configuracion/page";
import ContenidoPage from "@/app/admin/contenido/page";
import ClientesPage from "@/app/admin/clientes/page";
import {
  db,
  settingsStore,
  contentStore,
  clearAdminCache,
} from "@/lib/admin/store";
import type { Property } from "@/data/propiedades";
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const property: Property = {
  slug: "real",
  codigo: "C-1",
  titulo: "Inmueble real",
  tipo: "casa",
  operacion: "venta",
  precio: { modalidad: "publico", monto: 1500000, moneda: "MXN" },
  zona: "Zona Río",
  direccionAproximada: "Referencia",
  descripcion: ["Primero", "Segundo"],
  ficha: {
    terrenoM2: 200,
    construccionM2: 150,
    recamaras: 3,
    banos: 2.5,
    estacionamientos: 2,
    antiguedad: "5 años",
  },
  amenidades: ["Jardín"],
  galeria: [{ src: "/hero/casa-playa.webp", alt: "Fachada" }],
  videoUrl: "https://example.com/a.mp4",
  tour360Url: "https://example.com/tour",
  documentos: [
    {
      codigo: "PDF-1",
      nombre: "Plano",
      descripcion: "Plano público",
      url: "https://example.com/plano.pdf",
    },
  ],
  asesorId: "",
  creditoDisponible: true,
  puntosDeInteres: [{ lugar: "Escuela", minutos: 5 }],
  destacada: true,
  estado: "disponible",
  publicadaEl: "2026-09-03",
  demo: false,
  publicada: false,
};
const lead = {
  id: "l1",
  nombre: "Contacto",
  telefono: "6645551234",
  origen: "manual",
  estado: "nuevo",
  creadoEl: "2026-09-03",
  notas: [],
};
let fail = 0,
  version = 1,
  removed = false;
let sent: { data: Record<string, unknown>; version: number | null } | null =
  null;
beforeEach(() => {
  clearAdminCache();
  fail = 0;
  version = 1;
  removed = false;
  sent = null;
  push.mockClear();
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      sent = JSON.parse(String(init.body));
      if (fail) return Response.json({ error: "Fallo" }, { status: fail });
      if (sent!.version !== null && sent!.version !== version)
        return Response.json({ error: "Conflicto" }, { status: 409 });
      return Response.json({
        record: {
          id: sent!.data.id ?? sent!.data.slug ?? "singleton",
          data: sent!.data,
          version: version + 1,
          createdAt: "2026-09-03",
          updatedAt: "2026-09-03",
        },
      });
    }
    const data =
      url.endsWith("propiedades") && !removed
        ? [property]
        : url.endsWith("leads")
          ? [lead]
          : url.endsWith("config")
            ? [
                {
                  nombreComercial: "MNT",
                  telefono: "6645551234",
                  whatsapp: "https://wa.me/526645551234",
                  email: "hola@example.com",
                  horario: "Horario",
                  facebook: "",
                  instagram: "",
                  videoInstitucionalUrl: "",
                },
              ]
            : [];
    return Response.json({
      records: data.map((d) => ({
        id: "slug" in d ? d.slug : "id" in d ? d.id : "singleton",
        data: d,
        version,
        createdAt: "2026-09-03",
        updatedAt: "2026-09-03",
      })),
    });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("property edits preserve all multimedia and fields and never navigate on failed save", async () => {
  await db.propiedades.load();
  render(<PropertyForm initial={db.propiedades.list()[0]} />);
  fail = 503;
  fireEvent.submit(
    screen.getByRole("button", { name: "Guardar cambios" }).closest("form")!,
  );
  await screen.findByRole("alert");
  expect(push).not.toHaveBeenCalled();
  expect(sent?.data).toEqual(property);
  fail = 0;
  fireEvent.submit(
    screen.getByRole("button", { name: "Guardar cambios" }).closest("form")!,
  );
  await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/propiedades"));
});
test("staff can save the public source and delivery facts on a property", async () => {
  await db.propiedades.load();
  render(<PropertyForm initial={db.propiedades.list()[0]} />);
  fireEvent.change(screen.getByLabelText("Fuente de terreno"), { target: { value: "escritura" } });
  fireEvent.change(screen.getByLabelText("Fuente de construcción"), { target: { value: "plano" } });
  fireEvent.change(screen.getByLabelText("Disponibilidad revisada el"), { target: { value: "2026-10-04" } });
  fireEvent.change(screen.getByLabelText("Ocupación y entrega"), { target: { value: "Entrega por acordar" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar cambios" }).closest("form")!);
  await waitFor(() => expect(sent?.data.informacionPublica).toEqual({
    fuenteTerreno: "escritura",
    fuenteConstruccion: "plano",
    disponibilidadRevisadaEl: "2026-10-04",
    ocupacionEntrega: "Entrega por acordar",
  }));
});
test("new real property defaults unpublished and not demo", async () => {
  render(<PropertyForm />);
  expect(
    (screen.getByLabelText("Publicar en el sitio") as HTMLInputElement).checked,
  ).toBe(false);
  expect(
    (screen.getByLabelText("Dato de demostración (Demo)") as HTMLInputElement)
      .checked,
  ).toBe(false);
});
test.each([
  "/api/admin/files?bucket=mnt-private&path=private.jpg",
  "https://assets.example/storage/v1/object/public/mnt-staging/private.jpg",
  "https://assets.example/storage/v1/object/public/cota-private/private.jpg",
  "https://assets.example/storage/v1/object/public/cota-staging/private.jpg",
])("publication refuses a non-public gallery URL: %s", async (src) => {
  render(
    <PropertyForm
      initial={{
        ...property,
        galeria: [
          {
            src,
            alt: "Privada",
          },
        ],
      }}
    />,
  );
  fireEvent.click(screen.getByLabelText("Publicar en el sitio"));
  fireEvent.submit(
    screen.getByRole("button", { name: "Guardar cambios" }).closest("form")!,
  );
  expect((await screen.findByRole("alert")).textContent).toContain("pública");
  expect(sent).toBeNull();
  expect(push).not.toHaveBeenCalled();
});
test("changing the property route cannot reuse another record's editor snapshot", async () => {
  await db.propiedades.load();
  const first = Promise.resolve({ slug: "real" }),
    next = Promise.resolve({ slug: "missing" });
  await first;
  await next;
  const view = await act(async () =>
    render(<EditPropertyPage params={first} />),
  );
  await act(async () => view.rerender(<EditPropertyPage params={next} />));
  expect(screen.queryByLabelText("Título")).toBeNull();
  expect(
    screen.getByText('No existe "missing" en el inventario.'),
  ).toBeTruthy();
});
test("removal in background refresh does not discard a property's unsaved editor", async () => {
  await db.propiedades.load();
  const params = Promise.resolve({ slug: "real" });
  await params;
  await act(async () => {
    render(<EditPropertyPage params={params} />);
  });
  fireEvent.change(screen.getByLabelText("Título"), {
    target: { value: "Conservar borrador" },
  });
  removed = true;
  await act(async () => {
    await db.propiedades.load();
  });
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe(
    "Conservar borrador",
  );
});
test("lead note composition retains the opening version across refresh", async () => {
  await db.leads.load();
  const params = Promise.resolve({ id: "l1" });
  await params;
  await act(async () => {
    render(<LeadPage params={params} />);
  });
  fireEvent.focus(screen.getByLabelText("Nueva nota"));
  fireEvent.change(screen.getByLabelText("Nueva nota"), {
    target: { value: "Mi nota" },
  });
  version = 2;
  await act(async () => {
    await db.leads.load();
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Agregar nota" }).closest("form")!,
  );
  await screen.findByRole("alert");
  expect(sent?.version).toBe(1);
  expect(
    (screen.getByLabelText("Nueva nota") as HTMLTextAreaElement).value,
  ).toBe("Mi nota");
});
test("singleton draft retains opening version and never shows success on conflict", async () => {
  await settingsStore.load();
  render(<ConfigPage />);
  fireEvent.change(screen.getByLabelText("Nombre comercial"), {
    target: { value: "Mi cambio" },
  });
  version = 2;
  await act(async () => {
    await settingsStore.load();
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Guardar configuración" })
      .closest("form")!,
  );
  await screen.findByRole("alert");
  expect(sent?.version).toBe(1);
  expect(screen.queryByText("Guardado.")).toBeNull();
  expect(
    (screen.getByLabelText("Nombre comercial") as HTMLInputElement).value,
  ).toBe("Mi cambio");
});
test("client failure preserves details and only acknowledged save closes its editor", async () => {
  render(<ClientesPage />);
  fireEvent.click(screen.getByRole("button", { name: "Nuevo cliente" }));
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Cliente real" },
  });
  fireEvent.change(screen.getByLabelText("Teléfono"), {
    target: { value: "6645550101" },
  });
  fail = 503;
  fireEvent.submit(
    screen.getByRole("button", { name: "Guardar cliente" }).closest("form")!,
  );
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe(
    "Cliente real",
  );
  fail = 0;
  fireEvent.submit(
    screen.getByRole("button", { name: "Guardar cliente" }).closest("form")!,
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Guardar cliente" }),
    ).toBeNull(),
  );
  expect(db.clientes.list()[0].nombre).toBe("Cliente real");
});

const singletonEditors = [
  {
    name: "Configuración",
    Page: ConfigPage,
    store: settingsStore,
    label: "Nombre comercial",
    field: "nombreComercial",
    button: "Guardar configuración",
    initial: {
      nombreComercial: "MNT",
      telefono: "6645551234",
      whatsapp: "https://wa.me/526645551234",
      email: "hola@example.com",
      horario: "Horario",
      facebook: "",
      instagram: "",
      videoInstitucionalUrl: "",
    },
  },
  {
    name: "Contenido",
    Page: ContenidoPage,
    store: contentStore,
    label: "Titular (H1)",
    field: "heroTitulo",
    button: "Guardar contenido",
    initial: {
      heroTitulo: "MNT",
      heroSubtitulo: "Subtítulo",
      manifiestoTitulo: "Manifiesto",
      manifiestoTexto: "Texto",
      seoTitle: "MNT Inmobiliaria",
      seoDescription: "Descripción",
    },
  },
];
test.each(
  singletonEditors.flatMap((editor) =>
    [false, true].map((failRevalidation) => ({ ...editor, failRevalidation })),
  ),
)(
  "$name submits its own saved v2 after cache reaches v3 (revalidation failure: $failRevalidation)",
  async ({ Page, store, label, field, button, initial, failRevalidation }) => {
    let serverData: Record<string, unknown> = { ...initial };
    let serverVersion = 1;
    let failGet = false;
    let finishFirstPut!: () => void;
    const submittedVersions: (number | null)[] = [];
    const envelope = () => ({
      id: "singleton",
      data: { ...serverData },
      version: serverVersion,
      createdAt: "2026-09-03",
      updatedAt: "2026-09-03",
    });
    vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body));
        submittedVersions.push(body.version);
        if (body.version !== serverVersion)
          return Response.json({ error: "Conflicto" }, { status: 409 });
        serverData = body.data;
        serverVersion++;
        const saved = envelope();
        if (submittedVersions.length === 1)
          return new Promise<Response>((resolve) => {
            finishFirstPut = () => resolve(Response.json({ record: saved }));
          });
        return Response.json({ record: saved });
      }
      return failGet
        ? Response.json({ error: "Recarga no disponible" }, { status: 503 })
        : Response.json({ records: [envelope()] });
    });
    await store.load();
    render(<Page />);
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: "Mi guardado" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: button }).closest("form")!,
    );
    await waitFor(() => expect(submittedVersions).toEqual([1]));
    // Our v2 committed, but its response is still in flight when another
    // user commits v3 and a background GET exposes that newer snapshot.
    serverData = { ...serverData, [field]: "Otro usuario" };
    serverVersion = 3;
    await act(async () => {
      await store.load();
    });
    failGet = failRevalidation;
    await act(async () => {
      finishFirstPut();
    });
    await screen.findByText("Guardado.");
    expect(store.version("singleton")).toBe(3);
    expect(store.get()).toMatchObject({ [field]: "Otro usuario" });
    expect(store.state().status).toBe(failRevalidation ? "error" : "ready");
    expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe(
      "Mi guardado",
    );
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: "Segundo borrador" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: button }).closest("form")!,
    );
    await waitFor(() => expect(submittedVersions).toHaveLength(2));
    expect(submittedVersions).toEqual([1, 2]);
    expect((await screen.findByRole("alert")).textContent).toContain("Conflicto");
    expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe(
      "Segundo borrador",
    );
    expect(serverVersion).toBe(3);
    expect(serverData[field]).toBe("Otro usuario");
  },
);
