import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { SupabaseClient } from "@supabase/supabase-js";
import { cambiarArchivo } from "@/lib/backend/expediente-archivos";

/* C-18: renombrar o mandar a Eliminados un documento del cliente compara con lo que vio quien lo cambia. */
const ARCHIVO = { id: "61000000-0000-4000-8000-000000000001", expediente_id: "51000000-0000-4000-8000-000000000010", titulo: "Escritura", deleted_at: null, path: "x" };
function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const name of ["select", "eq", "is", "not", "update"]) c[name] = (...args: unknown[]) => { calls.push([name, ...args]); return c; };
  c.maybeSingle = async () => result;
  return c;
}
let calls: unknown[][] = [];
function clientes(actual: typeof ARCHIVO, guardado: unknown) {
  calls = [];
  const sesion = { from: (tabla: string) => chain(tabla === "fortius_inmuebles_expedientes" ? { data: { id: actual.expediente_id }, error: null } : { data: actual, error: null }) } as unknown as SupabaseClient;
  const privilegiado = { from: () => chain({ data: guardado, error: null }) } as unknown as SupabaseClient;
  return { sesion, privilegiado };
}

it("cambia solo si el documento sigue como lo vio quien lo cambia", async () => {
  const { sesion, privilegiado } = clientes(ARCHIVO, { ...ARCHIVO, titulo: "Escritura pública" });
  const r = await cambiarArchivo(sesion, privilegiado, "u1", ARCHIVO.id, { titulo: "Escritura pública", esperado: { titulo: "Escritura", eliminado: false } });
  expect(r.titulo).toBe("Escritura pública");
  expect(calls).toContainEqual(["eq", "titulo", "Escritura"]);
  expect(calls).toContainEqual(["is", "deleted_at", null]);
});

it("si otra persona lo cambió antes, responde 409 sin pisarlo", async () => {
  const visto = { titulo: "Escritura", eliminado: false };
  const otro = clientes({ ...ARCHIVO, titulo: "Otro nombre" }, null);
  await expect(cambiarArchivo(otro.sesion, otro.privilegiado, "u1", ARCHIVO.id, { papelera: true, esperado: visto })).rejects.toMatchObject({ status: 409 });
  // Cambió entre la lectura y la escritura: la actualización condicionada no encuentra la fila.
  const carrera = clientes(ARCHIVO, null);
  await expect(cambiarArchivo(carrera.sesion, carrera.privilegiado, "u1", ARCHIVO.id, { papelera: true, esperado: visto })).rejects.toMatchObject({ status: 409 });
  await expect(cambiarArchivo(carrera.sesion, carrera.privilegiado, "u1", ARCHIVO.id, { papelera: true })).rejects.toThrow();
});
