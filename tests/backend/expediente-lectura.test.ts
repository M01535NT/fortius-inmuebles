import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const archivos = vi.hoisted(() => ({ descargarArchivo: vi.fn(), exigirExpediente: vi.fn() }));
const datos = vi.hoisted(() => ({ leerDatos: vi.fn(), guardarDatos: vi.fn() }));
vi.mock("@/lib/backend/expediente-archivos", () => archivos);
vi.mock("@/lib/backend/expediente-datos", () => datos);
import type { SupabaseClient } from "@supabase/supabase-js";
import { leerArchivoConIa, type Extractor } from "@/lib/backend/expediente-lectura";
import { ApiError } from "@/lib/backend/http";

/* Lectura con IA en el servidor (IA-01): el proveedor siempre es simulado. */
const ARCHIVO = { id: "61000000-0000-4000-8000-000000000001", expediente_id: "51000000-0000-4000-8000-000000000010", titulo: "Escritura", mime: "application/pdf", deleted_at: null };
const respuesta = { tipoDocumento: "escritura", datos: [{ clave: "folioReal", valor: "1234567", pagina: 9, cita: "folio real 1234567", confianza: "alta" }] };
const uso = { input_tokens: 20_000, output_tokens: 500 };

function privilegiado(gasto = 0) {
  const marcas: Record<string, unknown>[] = [], anotadas: Record<string, unknown>[] = [];
  const client = {
    from: (tabla: string) => ({
      select: () => ({ gte: async () => ({ data: gasto ? [{ costo_usd: gasto }] : [], error: null }) }),
      update: (patch: Record<string, unknown>) => ({ eq: async () => { expect(tabla).toBe("fortius_inmuebles_expediente_archivos"); marcas.push(patch); return { error: null }; } }),
      insert: async (row: Record<string, unknown>) => { expect(tabla).toBe("fortius_inmuebles_ia_lecturas"); anotadas.push(row); return { error: null }; },
    }),
  } as unknown as SupabaseClient;
  return { client, marcas, anotadas };
}
const sesion = {} as SupabaseClient;

beforeEach(() => {
  vi.resetAllMocks();
  archivos.descargarArchivo.mockResolvedValue({ archivo: ARCHIVO, bytes: Buffer.from("%PDF-1.7") });
  datos.leerDatos.mockResolvedValue({ datos: {}, version: null });
  datos.guardarDatos.mockImplementation(async (_c, _u, _e, input) => input);
});

describe("leer un documento del cliente con IA", () => {
  it("guarda lo leído como propuesta con su fuente, marca el archivo y anota el costo", async () => {
    const { client, marcas, anotadas } = privilegiado();
    const extraer = vi.fn<Extractor>(async () => ({ respuesta, uso, modelo: "claude-opus-5-5" }));
    const lectura = await leerArchivoConIa(sesion, client, "u1", ARCHIVO.id, extraer);
    expect(extraer).toHaveBeenCalledWith({ bytes: Buffer.from("%PDF-1.7"), mime: "application/pdf", titulo: "Escritura" });
    expect(lectura).toEqual({ tipoDocumento: "escritura", propuestos: ["folioReal"], distintos: [], costoUsd: 0.09 });
    const [, , expediente, input] = datos.guardarDatos.mock.calls[0];
    expect(expediente).toBe(ARCHIVO.expediente_id);
    expect(input.datos.folioReal).toMatchObject({ valor: "1234567", estado: "propuesto", fuente: { archivoId: ARCHIVO.id, documento: "Escritura", pagina: 9 } });
    expect(marcas.map(m => m.lectura_estado)).toEqual(["leyendo", "leido"]);
    expect(marcas[1]).toMatchObject({ tipo_documento: "escritura" });
    expect(anotadas).toEqual([expect.objectContaining({ estado: "leido", modelo: "claude-opus-5-5", input_tokens: 20_000, output_tokens: 500, costo_usd: 0.09, datos_propuestos: 1, requested_by: "u1" })]);
  });

  it("una respuesta mal formada no toca los datos: el archivo queda con error para volver a leerlo", async () => {
    const { client, marcas, anotadas } = privilegiado();
    const extraer: Extractor = async () => ({ respuesta: { tipoDocumento: "escritura" }, uso, modelo: "claude-opus-5-5" });
    await expect(leerArchivoConIa(sesion, client, "u1", ARCHIVO.id, extraer)).rejects.toMatchObject({ status: 502 });
    expect(datos.guardarDatos).not.toHaveBeenCalled();
    expect(marcas.at(-1)).toMatchObject({ lectura_estado: "error" });
    expect(anotadas[0]).toMatchObject({ estado: "error", costo_usd: 0.09 });
  });

  it("si el proveedor falla, avisa con su mensaje y no cobra nada", async () => {
    const { client, anotadas } = privilegiado();
    const extraer: Extractor = async () => { throw new ApiError(503, "El servicio de lectura está saturado; inténtalo en unos minutos"); };
    await expect(leerArchivoConIa(sesion, client, "u1", ARCHIVO.id, extraer)).rejects.toThrow("saturado");
    expect(anotadas[0]).toMatchObject({ estado: "error", costo_usd: 0 });
  });

  it("al llegar al tope del mes se pausa sin llamar al proveedor", async () => {
    const { client } = privilegiado(25);
    const extraer = vi.fn<Extractor>();
    await expect(leerArchivoConIa(sesion, client, "u1", ARCHIVO.id, extraer)).rejects.toMatchObject({ status: 429 });
    expect(extraer).not.toHaveBeenCalled();
  });

  it("si otra persona guardó los datos en ese momento, vuelve a unir y guarda sin pisar", async () => {
    const { client } = privilegiado();
    datos.leerDatos.mockResolvedValueOnce({ datos: {}, version: 1 }).mockResolvedValueOnce({ datos: { recamaras: { valor: 3, estado: "confirmado" } }, version: 2 });
    datos.guardarDatos.mockRejectedValueOnce(new ApiError(409, "Otra persona guardó los datos; recarga antes de continuar"));
    const lectura = await leerArchivoConIa(sesion, client, "u1", ARCHIVO.id, async () => ({ respuesta, uso, modelo: "claude-opus-5-5" }));
    expect(lectura.propuestos).toEqual(["folioReal"]);
    const [, , , segundo] = datos.guardarDatos.mock.calls[1];
    expect(segundo.version).toBe(2);
    expect(segundo.datos.recamaras).toEqual({ valor: 3, estado: "confirmado" });
  });

  it("un documento en la papelera no se lee", async () => {
    archivos.descargarArchivo.mockResolvedValue({ archivo: { ...ARCHIVO, deleted_at: "2026-10-29T12:00:00Z" }, bytes: Buffer.from("x") });
    await expect(leerArchivoConIa(sesion, privilegiado().client, "u1", ARCHIVO.id, vi.fn<Extractor>())).rejects.toMatchObject({ status: 409 });
  });
});
