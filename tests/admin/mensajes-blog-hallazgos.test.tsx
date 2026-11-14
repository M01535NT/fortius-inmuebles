const confirmAction = vi.hoisted(() => vi.fn().mockResolvedValue(false));
vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction, confirmDelete: vi.fn().mockResolvedValue(false) }));
import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import BlogAdminPage from "@/app/admin/blog/page";
import { ReadyMessages } from "@/components/admin/contacts/ready-messages";
import { clearAdminCache, type Lead } from "@/lib/admin/store";

const hoy = "2026-11-13";
const rec = (id: string, data: unknown) => ({ id, data, version: 1, createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z" });
const casa = (slug: string, titulo: string) => ({ slug, codigo: slug.toUpperCase(), titulo, tipo: "casa", operacion: "venta", zona: "Centro", direccionAproximada: "Centro", precio: { modalidad: "consulta" }, descripcion: [], ficha: {}, amenidades: [], galeria: [], asesorId: "a1", creditoDisponible: false, puntosDeInteres: [], estado: "disponible", publicada: true, publicadaEl: "2026-11-01" });
const post = { id: "post-1", slug: "guia-existente", titulo: "Guía existente", resumen: "Resumen", contenido: "Contenido", estado: "borrador", actualizadoEl: "2026-11-01T12:00:00.000Z" };
const colecciones: Record<string, unknown[]> = {
  propiedades: [rec("casa-a", casa("casa-a", "Casa A de ensayo")), rec("casa-b", casa("casa-b", "Casa B de ensayo"))],
  // La única visita próxima del prospecto es a otro inmueble.
  eventos: [rec("e1", { id: "e1", titulo: "Visita a Casa B", fecha: "2026-11-14", hora: "11:00", tipo: "visita", leadId: "l1", propiedadSlug: "casa-b" })],
  posts: [rec(post.id, post)],
};

beforeEach(() => {
  clearAdminCache();
  confirmAction.mockClear();
  vi.stubGlobal("fetch", vi.fn(async (input: string) => {
    const name = String(input).split("?")[0].split("/").pop() ?? "";
    return Response.json({ records: colecciones[name] ?? [] });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/*
  BUG-C61: «Mensajes listos» toma la próxima visita del prospecto sin mirar el inmueble
  (ready-messages.tsx: filtra solo por leadId). Con interés en Casa A y una visita agendada a Casa B,
  «Confirmar la visita» dice «Te confirmo la visita a Casa A… el sábado 14 de noviembre a las 11:00».
*/
test("«Confirmar la visita» no usa la fecha de una visita a otro inmueble", async () => {
  const lead = { id: "l1", nombre: "Prospecto de ensayo", telefono: "6640000000", origen: "contacto", estado: "contactado", asesorId: "a1", propiedadSlug: "casa-a", creadoEl: "2026-11-01T18:00:00.000Z", notas: [] } as unknown as Lead;
  render(<ReadyMessages lead={lead} today={hoy} onSent={() => {}} />);
  await waitFor(() => expect((screen.getByRole("combobox", { name: /Mensaje/ }) as HTMLSelectElement).querySelector('option[value="confirmar-visita"]:not([disabled])')).not.toBeNull());
  fireEvent.change(screen.getByRole("combobox", { name: /Mensaje/ }), { target: { value: "confirmar-visita" } });
  const texto = (screen.getByLabelText("Texto del mensaje") as HTMLTextAreaElement).value;
  expect(texto).toContain("Casa A de ensayo");
  expect(texto).not.toMatch(/14 de noviembre|11:00/);
});

/*
  BUG-C62: el editor del blog lleva `key={editando}`. Con una entrada nueva a medio escribir, pulsar
  «Editar» en otra entrada remonta el editor y borra lo escrito sin preguntar.
*/
test("cambiar de entrada con cambios sin guardar pregunta antes de perderlos", async () => {
  render(<BlogAdminPage />);
  const editar = await screen.findByRole("button", { name: "Editar Guía existente" });
  fireEvent.click(screen.getByRole("button", { name: "Nueva entrada" }));
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Borrador a medio escribir" } });
  fireEvent.click(editar);
  await new Promise(resolve => setTimeout(resolve, 20));
  // Si el asesor no confirma, lo escrito sigue en pantalla.
  expect(screen.queryByDisplayValue("Borrador a medio escribir")).not.toBeNull();
});
