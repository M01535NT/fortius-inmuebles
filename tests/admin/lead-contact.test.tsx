import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { contactAttempts, missedInARow, suggestedNext, withContact, RETRY_ACTION } from "@/lib/admin/lead-contact";
import { personTimeline } from "@/lib/admin/person-view";
import { nextStep } from "@/lib/admin/contacts-view";
import type { Lead } from "@/lib/domain/records";

const mocks = vi.hoisted(() => ({ upsert: vi.fn() }));
vi.mock("@/lib/admin/store", () => ({
  db: { leads: { version: () => 7, list: () => [] }, tareas: { version: () => null }, eventos: "eventos", propiedades: "propiedades" },
  useCollection: () => [{ slug: "casa-playas", titulo: "Casa en Playas" }],
  upsert: mocks.upsert, uid: (() => { let n = 0; return () => `id-${++n}`; })(), errorMessage: (e: Error) => e.message,
}));
import { ContactLog } from "@/components/admin/contacts/contact-log";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
// Prospecto ficticio de ensayo (COR-18).
const lead = (over: Partial<Lead> = {}): Lead => ({ id: "l1", nombre: "Interesada de ensayo", telefono: "6640000000", origen: "contacto", estado: "nuevo", creadoEl: "2026-11-10T10:00:00Z", notas: [], asesorId: "a1", perfil: { operacion: "comprar" }, ...over });
const missed = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `m${i}`, texto: "", fecha: `2026-11-1${i}T10:00:00Z`, contacto: "no_contesto" }));

it("registra el contacto con su siguiente paso y cuenta como primera atención", () => {
  const next = withContact(lead(), { kind: "llamada", nota: "Busca 3 recámaras", accion: "Enviarle opciones", fecha: "2026-11-14", id: "n1", at: "2026-11-12T18:00:00Z" });
  expect(next.estado).toBe("contactado");
  expect(next.firstContactedAt).toBe("2026-11-12T18:00:00Z");
  expect(next.perfil).toMatchObject({ operacion: "comprar", proximoContacto: "2026-11-14", proximaAccion: "Enviarle opciones" });
  expect(contactAttempts(next)).toHaveLength(1);
  expect(nextStep(next, "lead", [], [], "2026-11-12")?.text).toBe("Enviarle opciones");
  const { past } = personTimeline({ notes: next.notas, events: [], tasks: [], today: "2026-11-12" });
  expect(past[0]).toMatchObject({ kind: "Contacto", text: "Llamé · Busca 3 recámaras" });
  // Un segundo contacto no mueve la primera atención.
  expect(withContact(next, { kind: "whatsapp", accion: "x", fecha: "2026-11-15", id: "n2", at: "2026-11-13T10:00:00Z" }).firstContactedAt).toBe("2026-11-12T18:00:00Z");
});

it("cuenta los «No contestó» seguidos desde el último contacto logrado", () => {
  expect(missedInARow(lead({ notas: missed(3) as Lead["notas"] }))).toBe(3);
  expect(missedInARow(lead({ notas: [{ id: "ok", texto: "", fecha: "2026-11-19T10:00:00Z", contacto: "llamada" }, ...missed(3)] as Lead["notas"] }))).toBe(0);
  expect(suggestedNext("no_contesto", "2026-11-12")).toEqual({ accion: "Volver a llamar", fecha: "2026-11-14" });
});

it("en dos toques guarda el contacto; al tercer «No contestó» propone reintentar en 30 días", async () => {
  mocks.upsert.mockResolvedValue(undefined);
  render(<ContactLog lead={lead({ notas: missed(2) as Lead["notas"] })} today="2026-11-12" />);
  fireEvent.click(screen.getByRole("button", { name: "No contestó" }));
  expect((screen.getByLabelText("Siguiente paso") as HTMLInputElement).value).toBe(RETRY_ACTION);
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-12-12");
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(mocks.upsert).toHaveBeenCalledTimes(2));
  expect(mocks.upsert.mock.calls[0][1].notas[0]).toMatchObject({ contacto: "no_contesto" });
  expect(mocks.upsert.mock.calls[0][2]).toBe(7);
  // DEC-42: el siguiente paso queda como tarea con fecha, ligada al prospecto y sin operación.
  expect(mocks.upsert.mock.calls[1][1]).toMatchObject({ titulo: RETRY_ACTION, vence: "2026-12-12", categoria: "leads", estado: "pendiente", leadId: "l1", asesorId: "a1" });
  expect(mocks.upsert.mock.calls[1][1].expedienteId).toBeUndefined();
});

it("«Visitó» deja la visita en la agenda con el inmueble", async () => {
  mocks.upsert.mockResolvedValue(undefined);
  render(<ContactLog lead={lead({ propiedadSlug: "casa-playas" })} today="2026-11-12" />);
  fireEvent.click(screen.getByRole("button", { name: "Visitó" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(mocks.upsert).toHaveBeenCalledTimes(3));
  expect(mocks.upsert.mock.calls[0][1]).toMatchObject({ tipo: "visita", fecha: "2026-11-12", leadId: "l1", propiedadSlug: "casa-playas", titulo: "Visita de Interesada de ensayo a Casa en Playas" });
  expect(mocks.upsert.mock.calls[1][1].notas[0]).toMatchObject({ contacto: "visito" });
});
