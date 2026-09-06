import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContactForm } from "@/components/sections/contact-form";
import { Evaluar } from "@/components/home/evaluar";
import { LeadMagnet } from "@/components/sections/lead-magnet";
import { PropertyDocuments } from "@/components/property/property-documents";
import { PropertyInterestForm } from "@/components/property/property-interest-form";
import { parseLead } from "@/lib/backend/validation";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
// Animation hooks do not participate in submission or its native boundary.
vi.mock("@/lib/gsap", () => ({ useGSAP: () => {}, prefersReducedMotion: () => true }));
vi.mock("@/components/gsap/scrub", () => ({ Scrub: ({ children }: React.PropsWithChildren) => children }));
vi.mock("@/components/gsap/split-heading", () => ({ SplitHeading: () => null }));
vi.mock("@/components/magicui/blur-fade", () => ({ BlurFade: ({ children }: React.PropsWithChildren) => children }));

const variants = [
  { name: "contacto", component: <ContactForm />, button: "Solicitar evaluación" },
  { name: "evaluar", component: <Evaluar />, button: "Solicitar evaluación" },
  { name: "checklist", component: <LeadMagnet />, button: "Obtener el checklist" },
  { name: "documentos", component: <PropertyDocuments slug="fixture" codigo="TEST" documentos={[{ codigo: "F1", nombre: "Ficha", descripcion: "Documento", url: "/fixture.pdf" }]} />, button: "Liberar descargas" },
  { name: "interes-propiedad", component: <PropertyInterestForm slug="fixture" codigo="TEST" titulo="Casa" />, button: "Me interesa esta propiedad" },
];
beforeEach(() => push.mockReset());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function fillEvaluationFields(container: HTMLElement) {
  const zone = container.querySelector('input[name="zona"]');
  const type = container.querySelector('select[name="tipo"]');
  if (zone) fireEvent.change(zone, { target: { value: "Centro" } });
  if (type) fireEvent.change(type, { target: { value: "Casa" } });
}
const enabled = (component: React.ReactNode) => (
  <PublicFeaturesProvider publicLeadsEnabled>{component}</PublicFeaturesProvider>
);

test.each(variants)("$name SSR blocks every control before hydration and supplies an honest no-JS notice", ({ component }) => {
  const root = document.createElement("div");
  root.innerHTML = renderToStaticMarkup(enabled(component));
  const form = root.querySelector("form")!;
  expect(form.method).toBe("post");
  for (const control of form.querySelectorAll("input,select,textarea,button")) {
    expect(control.matches(":disabled")).toBe(true);
  }
  expect(root.querySelector("noscript")?.textContent).toMatch(/JavaScript/);
  expect(root.querySelector("a[download]")).toBeNull();
});

test.each(variants)("$name sends the actual honeypot and never acknowledges a rejected bot submission", async ({ component, button }) => {
  const persisted: unknown[] = [];
  let submitted: Record<string, unknown> | undefined;
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    expect(url).toBe("/api/leads");
    expect(options.method).toBe("POST");
    submitted = JSON.parse(options.body);
    try { persisted.push(parseLead(submitted)); }
    catch { return Response.json({ error: "Solicitud inválida" }, { status: 400 }); }
    return Response.json({ id: "persisted-ack" }, { status: 201 });
  }));
  const { container } = render(enabled(component));
  fireEvent.change(screen.getByLabelText("Nombre", { exact: true }), { target: { value: "Prueba" } });
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: "6641234567" } });
  fillEvaluationFields(container);
  const trap = container.querySelector<HTMLInputElement>('input[name="website"]');
  expect(trap).not.toBeNull();
  expect(trap!.tabIndex).toBe(-1);
  expect(trap!.autocomplete).toBe("off");
  fireEvent.change(trap!, { target: { value: "https://bot.invalid" } });
  fireEvent.click(screen.getByRole("button", { name: button }));
  await screen.findByRole("alert");
  expect(submitted?.website).toBe("https://bot.invalid");
  expect(persisted).toEqual([]);
  expect(container.querySelector("form")).not.toBeNull();
  expect(container.querySelector("a[download]")).toBeNull();
  expect(push).not.toHaveBeenCalled();
  expect((screen.getByLabelText("Nombre", { exact: true }) as HTMLInputElement).value).toBe("Prueba");
});

test.each(variants)("$name retains failed drafts and waits for ACK before success, navigation or download", async ({ component, button }) => {
  let acknowledge!: (response: Response) => void;
  const requests: Record<string, unknown>[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    expect(url).toBe("/api/leads");
    expect(options.method).toBe("POST");
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) return Response.json({ error: "No guardado" }, { status: 503 });
    return new Promise<Response>((resolve) => { acknowledge = resolve; });
  }));
  const { container } = render(enabled(component));
  fireEvent.change(screen.getByLabelText("Nombre", { exact: true }), { target: { value: "Borrador" } });
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: "6641234567" } });
  fillEvaluationFields(container);
  fireEvent.click(screen.getByRole("button", { name: button }));
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Nombre", { exact: true }) as HTMLInputElement).value).toBe("Borrador");
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[1]).toMatchObject({ nombre: "Borrador", telefono: "6641234567", website: "" });
  expect(container.querySelector("form")).not.toBeNull();
  expect(container.querySelector("a[download]")).toBeNull();
  expect(push).not.toHaveBeenCalled();
  acknowledge(Response.json({ id: "persisted-ack" }, { status: 201 }));
  await waitFor(() => expect(push.mock.calls.length || !container.querySelector("form")).toBeTruthy());
});
