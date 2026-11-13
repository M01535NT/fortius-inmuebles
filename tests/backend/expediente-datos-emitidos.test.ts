import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { SupabaseClient } from "@supabase/supabase-js";
import { aplicarDatos } from "@/lib/backend/expediente-datos";

/*
  BUG-C15: al confirmar datos del expediente, aplicarDatos llena celdas vacías y sube la versión de
  cualquier borrador, aunque su versión vigente ya tenga PDF emitido. «Emitido» se calcula como
  emisión de la versión vigente, así que la 02 emitida deja de contar, vuelve el candado de avance
  («Termina la entrevista inicial (02) y genera su PDF») y un 09 firmado deja de coincidir.
*/
type Draft = { id: string; formato_id: string; data: Record<string, unknown>; version: number };
function cliente(drafts: Draft[], emisiones: { draft_id: string; draft_version: number }[]) {
  const updates: string[] = [];
  // Consulta encadenable: cualquier filtro sobre la tabla devuelve sus filas.
  const query = (rows: unknown[]) => {
    const chain: Record<string, unknown> = {};
    for (const name of ["select", "eq", "in", "order", "limit", "is", "neq"]) chain[name] = () => chain;
    chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: rows, error: null });
    chain.maybeSingle = async () => ({ data: rows[0] ?? null, error: null });
    return chain;
  };
  const client = {
    from: (table: string) => {
      if (table === "fortius_inmuebles_formato_emissions") return query(emisiones);
      return {
        ...query(drafts),
        update: () => ({ eq: (_c: string, id: string) => ({ eq: () => ({ select: () => ({ maybeSingle: async () => { updates.push(id); return { data: { id }, error: null }; } }) }) }) }),
      };
    },
  } as unknown as SupabaseClient;
  return { client, updates };
}

it("no modifica un borrador cuya versión vigente ya tiene PDF emitido", async () => {
  const datos = { propietarioNombre: { valor: "María Ramírez", estado: "confirmado" as const } };
  const { client, updates } = cliente(
    [{ id: "d07-emitido", formato_id: "07", data: {}, version: 3 }, { id: "d07-borrador", formato_id: "07", data: {}, version: 1 }],
    [{ draft_id: "d07-emitido", draft_version: 3 }],
  );
  await aplicarDatos(client, "exp", datos);
  expect(updates).not.toContain("d07-emitido");
  expect(updates).toContain("d07-borrador");
});
