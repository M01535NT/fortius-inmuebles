import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/admin/contactos" }));
import LeadDetailPage from "@/app/admin/leads/[id]/page";
import { ContactLog } from "@/components/admin/contacts/contact-log";
import { ContactPreview } from "@/components/admin/contacts/contact-preview";
import { PeriodReport } from "@/components/admin/workspace/period-report";
import { clearAdminCache, type Lead } from "@/lib/admin/store";
import type { ContactRow } from "@/lib/admin/contacts-view";
import { emptyComercialBook, newOpportunity, type ComercialBookData } from "@/lib/comercial/types";

const hoy = "2026-11-13";
const rec = (id: string, data: unknown, version = 1) => ({ id, data, version, createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z" });
const casa = { slug: "casa-a", codigo: "CASA-A", titulo: "Casa A de ensayo", tipo: "casa", operacion: "venta", zona: "Centro", direccionAproximada: "Centro", precio: { modalidad: "consulta" }, descripcion: [], ficha: {}, amenidades: [], galeria: [], asesorId: "a1", creditoDisponible: false, puntosDeInteres: [], estado: "disponible", publicada: true, publicadaEl: "2026-11-01" };
const prospecto = (over: Partial<Lead> = {}) => ({ id: "l1", nombre: "Prospecto de ensayo", telefono: "6640000000", origen: "contacto", estado: "contactado", asesorId: "a1", propiedadSlug: "casa-a", creadoEl: "2026-11-01T18:00:00.000Z", notas: [], ...over }) as unknown as Lead;

type Put = { coleccion: string; id: string; version: number | null; data: Record<string, unknown> };
let puts: Put[];
let colecciones: Record<string, ReturnType<typeof rec>[]>;
/** Respuesta de cada PUT; por omisión guarda y sube la versión. */
let alGuardar: (put: Put, n: number) => Response | null;

beforeEach(() => {
  clearAdminCache();
  puts = [];
  alGuardar = () => null;
  colecciones = {
    propiedades: [rec("casa-a", casa)],
    asesores: [rec("a1", { id: "a1", nombre: "Asesor de ensayo", activo: true })],
    leads: [rec("l1", prospecto())],
  };
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input).split("?")[0];
    const parts = url.split("/");
    if (init?.method === "PUT" && url.includes("/collections/")) {
      const body = JSON.parse(String(init.body));
      const put: Put = { coleccion: parts[parts.length - 2], id: decodeURIComponent(parts[parts.length - 1]), version: body.version, data: body.data };
      puts.push(put);
      const especial = alGuardar(put, puts.filter(p => p.coleccion === put.coleccion).length);
      if (especial) return especial;
      const lista = colecciones[put.coleccion] ?? (colecciones[put.coleccion] = []);
      const actual = lista.find(r => r.id === put.id);
      // Como el servidor: la versión enviada debe ser la vigente.
      if (actual && put.version !== null && put.version !== actual.version) return Response.json({ error: "Otra persona guardó este registro antes. Recarga para ver lo último." }, { status: 409 });
      const nuevo = rec(put.id, put.data, (actual?.version ?? 0) + 1);
      colecciones[put.coleccion] = [nuevo, ...lista.filter(r => r.id !== put.id)];
      return Response.json({ record: nuevo });
    }
    if (url === "/api/admin/comercial") return Response.json({ carteras: [{ id: "b1", nombre: "Cartera de ensayo" }] });
    if (url === "/api/admin/comercial/b1") return Response.json({ cartera: { id: "b1", nombre: "Cartera de ensayo", version: 1, data: cartera, created_at: "2026-10-01", updated_at: "2026-11-01" } });
    return Response.json({ records: colecciones[parts[parts.length - 1]] ?? [] });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); clearAdminCache(); });

/*
  BUG-C63: «Registrar contacto» guarda en escrituras separadas (contact-log.tsx:55-62): la visita en
  la agenda, luego la nota del prospecto y luego la tarea. Cada intento genera un `uid()` nuevo para
  la visita. Si la visita se guarda y la nota del prospecto falla, el asesor ve el error, vuelve a
  pulsar «Guardar» y la agenda queda con dos visitas del mismo contacto.
*/
test("reintentar «Registrar contacto» tras un error no duplica la visita ya guardada", async () => {
  alGuardar = (put, n) => put.coleccion === "leads" && n === 1 ? Response.json({ error: "Servicio temporalmente no disponible" }, { status: 503 }) : null;
  render(<ContactLog lead={prospecto()} today={hoy} />);
  fireEvent.click(screen.getByRole("button", { name: "Visitó" }));
  await screen.findByRole("option", { name: "Casa A de ensayo" });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await screen.findByText(/quedó registrado/);
  const visitas = new Set(puts.filter(p => p.coleccion === "eventos").map(p => p.id));
  expect(visitas.size, "visitas distintas escritas en la agenda").toBe(1);
});

/*
  BUG-C64: la ficha del prospecto congela en `noteDraft` el prospecto y su versión al empezar a
  escribir la nota ([id]/page.tsx:161-162) y guarda la nota sobre esa copia (page.tsx:106-107).
  Si mientras tanto se guarda otro cambio de la ficha (aquí, el asesor responsable), la versión sube,
  la nota sale con la versión vieja y el servidor responde 409; `noteDraft` nunca se renueva, así que
  cada reintento vuelve a fallar (y, de pasar, reescribiría el cambio anterior con la copia vieja).
*/
test("tras otro guardado de la ficha, la nota se guarda sobre la versión vigente", async () => {
  await act(async () => { render(<React.Suspense fallback={<p>Cargando</p>}><LeadDetailPage params={Promise.resolve({ id: "l1" })} /></React.Suspense>); });
  const nota = await screen.findByLabelText("Nueva nota");
  fireEvent.focus(nota);
  fireEvent.change(nota, { target: { value: "Nota de ensayo" } });
  await screen.findByRole("option", { name: "Asesor de ensayo" });
  fireEvent.change(screen.getByLabelText("Asesor responsable"), { target: { value: "" } });
  await waitFor(() => expect(colecciones.leads[0].version).toBe(2));
  fireEvent.click(screen.getByRole("button", { name: "Agregar nota" }));
  await waitFor(() => expect(puts.filter(p => p.coleccion === "leads")).toHaveLength(2));
  await new Promise(resolve => setTimeout(resolve, 20));
  const notaPut = puts.filter(p => p.coleccion === "leads")[1];
  expect(notaPut.version, "versión enviada al guardar la nota").toBe(2);
  const guardado = colecciones.leads[0].data as Lead;
  expect(guardado.notas.map(n => n.texto)).toContain("Nota de ensayo");
  expect(guardado.asesorId, "el cambio de asesor guardado antes se conserva").toBeUndefined();
});

/*
  BUG-C65: la vista previa de Contactos fecha cada nota con `note.fecha.slice(0, 10)`
  (contact-preview.tsx:78), es decir, el día en UTC. Una nota del 12/11 a las 20:00 en Tijuana
  (2026-11-13T04:00:00Z) sale como «13 nov». El resto del panel usa `operationalDate` (America/Tijuana).
*/
test("la fecha de una nota en la vista previa es la de Tijuana", () => {
  const conNota = prospecto({ notas: [{ id: "n1", texto: "Nota de ensayo", fecha: "2026-11-13T04:00:00.000Z" }] } as Partial<Lead>);
  const row = { id: "l1", kind: "lead", href: "/admin/leads/l1", name: "Prospecto de ensayo", phone: "6640000000", wants: "", zone: "", budget: null, step: "", when: null, late: false, sort: "" } as ContactRow;
  render(<ContactPreview row={row} lead={conNota} tasks={[]} events={[]} today={hoy} />);
  const fila = screen.getByText("Nota de ensayo").parentElement!;
  expect(fila.textContent).toContain("12 nov");
});

/*
  BUG-C66: Reportes → «Ofertas y cierres» valida los eventos con `calculateComercial(book.data, to)`
  (period-report.tsx:50), pero con la cartera en corte «Fijo» el cálculo ignora `to` y usa
  `config.fechaCorte` (calculate.ts:9). Todo evento posterior a ese corte recibe el control «Fecha
  posterior al corte» (calculate.ts:46) y el filtro `!c.controles.length` (period-report.tsx:53) lo
  descarta, aunque caiga dentro del periodo del reporte. Con corte fijo el 31/10, una oferta completa
  del 5/11 no cuenta en el reporte de noviembre.
*/
const cartera: ComercialBookData = (() => {
  const book = emptyComercialBook();
  book.config.modoCorte = "Fijo";
  book.config.fechaCorte = "2026-10-31";
  const o = newOpportunity("o1", "Comprador");
  o.nombre = "Comprador de ensayo";
  book.oportunidades = [o];
  book.eventos = [{ id: "ev1", oportunidad: "o1", fecha: "2026-11-05", actividad: "Oferta", detalle: "Oferta de ensayo", importe: 1000000, moneda: "MXN", estado: "Registrado", responsable: "Asesor de ensayo", evidencia: "", base: "Declarado", anterior: "" }];
  return book;
})();
test("con corte «Fijo», una oferta dentro del periodo cuenta en «Ofertas y cierres»", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T20:00:00.000Z"));
  render(<PeriodReport />);
  await screen.findByRole("option", { name: "Cartera de ensayo" });
  fireEvent.change(screen.getByLabelText("Cartera"), { target: { value: "b1" } });
  const etiqueta = await screen.findByText("Ofertas", { exact: true });
  expect(etiqueta.nextElementSibling?.textContent, "ofertas contadas en el periodo").toBe("1");
});
