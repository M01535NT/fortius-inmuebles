import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CommercialEditor } from "@/components/admin/apps/commercial-editor";
import { getCommercialDefaults } from "@/lib/apps/commercial";
import { clearAdminCache } from "@/lib/admin/store";
import type { AppContext, AppInput, AppResult } from "@/lib/apps/types";
const property = { slug: "casa-uno", codigo: "F-1", titulo: "Casa disponible", tipo: "casa", operacion: "venta", precio: { modalidad: "publico", monto: 1000000, moneda: "MXN" }, zona: "Centro", direccionAproximada: "Zona centro", descripcion: ["Descripción comercial"], ficha: { construccionM2: 100 }, amenidades: ["Patio"], galeria: [{ src: "https://example.com/casa.jpg", alt: "Fachada" }], asesorId: "a1", creditoDisponible: true, puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-10-01", publicada: true, demo: false, notas: "NOTA PRIVADA" };
const expedienteId = "11111111-1111-4111-8111-111111111111";
let activityCreatedAt = "2026-10-03T10:00:00Z";
let savedInput: AppInput, result: AppResult | null, writes: unknown[];
function Harness({ slug, initial, context = {} }: { slug: string; initial?: AppInput; context?: AppContext }) { const [input, setInput] = React.useState(initial ?? getCommercialDefaults(slug)); return <CommercialEditor slug={slug} input={input} context={context} onChange={value => { savedInput = value; setInput(value); }} onResult={value => { result = value; }} />; }
beforeEach(() => { activityCreatedAt = "2026-10-03T10:00:00Z"; clearAdminCache(); result = null; savedInput = {}; writes = []; vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
  if (init?.method === "PUT") { const body = JSON.parse(String(init.body)); writes.push(body); return Response.json({ record: { id: body.data.id, data: body.data, version: 1 } }); }
  if (url.endsWith("/capacidades")) return Response.json({ expedienteLinks: true });
  if (url.endsWith("/expedientes")) return Response.json({ expedientes: [{ id: expedienteId, folio: "EXP-1", cliente_id: "c1", asesor_id: "a1", propiedad_slug: "casa-uno" }] });
  if (url.endsWith("/actividad")) return Response.json({ actividad: [{ id: "act-1", tipo: "nota", descripcion: "Actividad registrada", created_at: activityCreatedAt }] });
  return Response.json({ records: url.endsWith("/propiedades") ? [{ id: property.slug, data: property, version: 1 }] : [] });
})); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearAdminCache(); });
test.each([['ficha-comercial', 'Título comercial'], ['comparables', 'Interpretación del asesor'], ['ofertas', 'Recomendación del asesor'], ['informe-propietario', 'Destinatario'], ['cotizador', 'Cliente / destinatario'], ['revisor-expediente', 'Versión de la lista']])("%s muestra captura especializada", async (slug, label) => { await act(async () => { render(<Harness slug={slug} />); }); expect(screen.getByLabelText(label)).toBeTruthy(); expect(screen.getByRole("button", { name: "Generar vista previa" })).toBeTruthy(); expect(screen.queryByLabelText(/JSON/)).toBeNull(); });
test("editar partidas conserva datos ajenos y genera total redondeado", async () => {
  await act(async () => { render(<Harness slug="cotizador" initial={{ ...getCommercialDefaults("cotizador"), custom: "preservar", client: "Cliente", issuedAt: "2026-10-13", validUntil: "2026-10-20", items: [{ concept: "Servicio", category: "honorarios", quantity: 2, unitPrice: 1000, discountPct: 10, taxPct: 16 }] }} />); });
  fireEvent.change(screen.getByLabelText("Concepto 1"), { target: { value: "Asesoría" } });
  expect(savedInput.custom).toBe("preservar");
  fireEvent.click(screen.getByRole("button", { name: "Generar vista previa" }));
  expect(JSON.stringify(result)).toContain("2,088.00 MXN");
});
test("CSV inválido se previsualiza y no se incorpora; válido exige aceptar", async () => {
  await act(async () => { render(<Harness slug="comparables" />); });
  fireEvent.change(screen.getByLabelText("Contenido CSV"), { target: { value: "label,price\nCasa,200" } });
  expect(screen.getByRole("button", { name: /Incorporar comparables/ }).hasAttribute("disabled")).toBe(true);
  const csv = "label,type,operation,source,date,currency,areaBasis,area,price,evidence,adjustmentPct,adjustmentReason\nCasa,casa,venta,Fuente,2026-10-13,MXN,construccion,100,2000000,oferta,0,";
  fireEvent.change(screen.getByLabelText("Contenido CSV"), { target: { value: csv } });
  expect(savedInput.rows).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: /Incorporar comparables/ }));
  expect(savedInput.rows).toHaveLength(1);
});
test("ficha importa datos públicos mediante selección sin notas privadas", async () => {
  await act(async () => { render(<Harness slug="ficha-comercial" />); });
  fireEvent.change(screen.getByLabelText("Inmueble del inventario"), { target: { value: property.slug } });
  fireEvent.click(screen.getByRole("button", { name: "Usar datos publicables" }));
  expect(savedInput.title).toBe("Casa disponible"); expect(savedInput.photoUrls).toEqual(["https://example.com/casa.jpg"]);
  expect(JSON.stringify(savedInput)).not.toContain("NOTA PRIVADA");
});
test("actividad del expediente requiere selección y se identifica como registrada", async () => {
  await act(async () => { render(<Harness slug="informe-propietario" context={{ expedienteId }} />); });
  fireEvent.click(screen.getByRole("button", { name: "Consultar actividad de la operación" }));
  const check = await screen.findByLabelText("Incluir actividad 1"); expect(savedInput.rows).toEqual([]);
  fireEvent.click(check); fireEvent.click(screen.getByRole("button", { name: "Incorporar actividades seleccionadas" }));
  expect(savedInput.rows).toEqual([expect.objectContaining({ detail: "Actividad registrada", origin: "registrado", sourceExpedienteId: expedienteId })]);
});
test("revisor exige confirmación y crea una tarea con vínculos actuales del expediente", async () => {
  await act(async () => { render(<Harness slug="revisor-expediente" context={{ expedienteId }} />); });
  fireEvent.click(screen.getByRole("button", { name: "Preparar tarea de pendientes" }));
  const confirm = await screen.findByLabelText("Confirmo crear esta tarea en la operación");
  expect(writes).toEqual([]); expect(screen.getByRole("button", { name: "Crear tarea en la operación" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(confirm); fireEvent.click(screen.getByRole("button", { name: "Crear tarea en la operación" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ version: null, data: { expedienteId, clienteId: "c1", asesorId: "a1", propiedadSlug: "casa-uno", estado: "pendiente", categoria: "documentacion" } });
  expect(await screen.findByText("Tarea creada en la operación.")).toBeTruthy();
});

test("F3 importa actividad con fecha de Tijuana y la incluye en su periodo local", async () => {
  activityCreatedAt = "2026-10-01T01:00:00Z";
  await act(async () => { render(<Harness slug="informe-propietario" context={{ expedienteId }} initial={{ ...getCommercialDefaults("informe-propietario"), ownerLabel: "Propietario", from: "2026-09-30", to: "2026-09-30", nextSteps: "Seguimiento" }} />); });
  fireEvent.click(screen.getByRole("button", { name: "Consultar actividad de la operación" }));
  fireEvent.click(await screen.findByLabelText("Incluir actividad 1"));
  fireEvent.click(screen.getByRole("button", { name: "Incorporar actividades seleccionadas" }));
  expect(savedInput.rows).toEqual([expect.objectContaining({ date: "2026-09-30" })]);
  fireEvent.click(screen.getByRole("button", { name: "Generar vista previa" }));
  expect(result?.summary).toContainEqual({ label: "Actividades incluidas", value: "1" });
});
test("F3 comparable conserva fecha de calendario o convierte instante del inventario a Tijuana", async () => {
  const original = property.publicadaEl;
  try {
    property.publicadaEl = "2026-10-01T01:00:00Z";
    await act(async () => { render(<Harness slug="comparables" />); });
    fireEvent.change(screen.getByLabelText("Inmueble del inventario"), { target: { value: property.slug } });
    fireEvent.click(screen.getByRole("button", { name: "Añadir comparable del inventario" }));
    expect(savedInput.rows).toEqual([expect.objectContaining({ date: "2026-09-30" })]);
  } finally { property.publicadaEl = original; }
});
test("F4 el editor muestra error y conserva toda la captura inválida en vez de filtrar filas", async () => {
  const initial = { ...getCommercialDefaults("informe-propietario"), ownerLabel: "Propietario", rows: [{ date: "2026-10-02", kind: "visita", detail: "Visita", origin: "manual" }, null] };
  const onChange = vi.fn();
  await act(async () => { render(<CommercialEditor slug="informe-propietario" context={{}} input={initial} onChange={onChange} onResult={vi.fn()} />); });
  expect(screen.getByRole("alert").textContent).toMatch(/fila 2/i);
  expect(screen.queryByRole("button", { name: "Generar vista previa" })).toBeNull();
  expect(onChange).not.toHaveBeenCalled(); expect(initial.rows[1]).toBeNull();
});
