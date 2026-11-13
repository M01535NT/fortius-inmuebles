import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const archivos = vi.hoisted(() => ({ descargarArchivo: vi.fn(), exigirExpediente: vi.fn() }));
const datos = vi.hoisted(() => ({ leerDatos: vi.fn(), guardarDatos: vi.fn() }));
vi.mock("@/lib/backend/expediente-archivos", () => archivos);
vi.mock("@/lib/backend/expediente-datos", () => datos);
import type { SupabaseClient } from "@supabase/supabase-js";
import { leerArchivoConIa, type Extractor } from "@/lib/backend/expediente-lectura";

/*
  BUG-C19: `lectura_estado: "leyendo"` se escribe pero nunca se revisa. Dos pulsaciones de «Leer datos»
  (o dos pestañas) sobre el mismo documento llaman dos veces al proveedor y cobran dos lecturas; con el
  gasto justo bajo el tope, N lecturas simultáneas lo superan. Mientras un documento se está leyendo,
  otra lectura debe rechazarse (409) sin llamar al proveedor ni anotar costo.
*/
const ARCHIVO = { id: "61000000-0000-4000-8000-000000000001", expediente_id: "51000000-0000-4000-8000-000000000010", titulo: "Escritura", mime: "application/pdf", deleted_at: null as string | null };
const respuesta = { tipoDocumento: "escritura", datos: [{ clave: "folioReal", valor: "1234567", pagina: 9, cita: "folio real 1234567", confianza: "alta" }] };

/** Base simulada con estado: lo que se marca en el archivo lo ve la siguiente lectura. */
function base() {
  const archivo: Record<string, unknown> = { ...ARCHIVO, lectura_estado: null, updated_at: new Date().toISOString() };
  const anotadas: Record<string, unknown>[] = [];
  const chain = (result: () => unknown) => {
    const c: Record<string, unknown> = {};
    for (const m of ["eq", "neq", "is", "not", "in", "or", "gte", "lt", "select", "order", "limit"]) c[m] = () => c;
    c.maybeSingle = async () => result();
    c.single = async () => result();
    c.then = (ok: (v: unknown) => void) => ok(result());
    return c;
  };
  const client = {
    from: (tabla: string) => ({
      select: (columnas: string) => columnas === "data" ? chain(() => ({ data: null, error: null })) : tabla === "fortius_inmuebles_ia_lecturas" ? chain(() => ({ data: [], error: null })) : chain(() => ({ data: archivo, error: null })),
      update: (patch: Record<string, unknown>) => chain(() => { Object.assign(archivo, patch, { updated_at: new Date().toISOString() }); return { data: archivo, error: null }; }),
      insert: async (row: Record<string, unknown>) => { anotadas.push(row); return { error: null }; },
    }),
  } as unknown as SupabaseClient;
  archivos.descargarArchivo.mockImplementation(async () => ({ archivo: { ...archivo }, bytes: Buffer.from("%PDF-1.7") }));
  return { client, anotadas };
}

beforeEach(() => {
  vi.resetAllMocks();
  datos.leerDatos.mockResolvedValue({ datos: {}, version: null });
  datos.guardarDatos.mockImplementation(async (_c, _u, _e, input) => input);
});

it("una segunda lectura del mismo documento mientras la primera sigue en curso se rechaza sin cobrar", async () => {
  const { client, anotadas } = base();
  const pendientes: Array<() => void> = [];
  const terminar = () => pendientes.splice(0).forEach(fin => fin());
  const extraer = vi.fn<Extractor>(() => new Promise(resolve => { pendientes.push(() => resolve({ respuesta, uso: { input_tokens: 20_000, output_tokens: 500 }, modelo: "claude-opus-5-5" })); }));
  const primera = leerArchivoConIa({} as SupabaseClient, client, "u1", ARCHIVO.id, extraer);
  await vi.waitFor(() => expect(extraer).toHaveBeenCalledTimes(1));
  const segunda = leerArchivoConIa({} as SupabaseClient, client, "u2", ARCHIVO.id, extraer).catch((e: unknown) => e);
  // Da tiempo a la segunda de llegar al proveedor si nada la detiene.
  await new Promise(resolve => setTimeout(resolve, 20));
  terminar();
  await primera;
  expect(await segunda).toMatchObject({ status: 409 });
  expect(extraer).toHaveBeenCalledTimes(1);
  expect(anotadas.filter(a => a.estado === "leido")).toHaveLength(1);
});
