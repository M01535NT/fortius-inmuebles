import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { DELETE as quitarImagen, PATCH as restaurarImagen } from "@/app/api/admin/adjuntos/[id]/route";
import { DELETE as quitarCopia, PATCH as restaurarCopia } from "@/app/api/admin/copias-firmadas/[id]/route";
import { GET as listarAdjuntos } from "@/app/api/admin/formatos/[id]/adjuntos/route";
import { GET as listarCopias } from "@/app/api/admin/emisiones/[id]/firmado/route";
import { imagenesEnUso, sinColumnaDeRetiro } from "@/lib/backend/formatos-retiro";

const asset = "51000000-0000-4000-8000-000000000031";
const draft = "51000000-0000-4000-8000-000000000032";
const copy = "51000000-0000-4000-8000-000000000033";
const emission = "51000000-0000-4000-8000-000000000034";
const user = { id: "51000000-0000-4000-8000-000000000002" };
type R = { data: unknown; error: { code?: string; message?: string } | null };

/** Cliente simulado: cada tabla responde lo que se le da y anota los filtros y la escritura. */
function cliente(tablas: Record<string, R | ((llamadas: string[]) => R)>) {
  const llamadas: string[] = [];
  const escrito: Record<string, unknown>[] = [];
  return { llamadas, escrito, from: (tabla: string) => {
    const propias: string[] = [];
    const responder = () => { const t = tablas[tabla]; return typeof t === "function" ? t(propias) : t ?? { data: null, error: null }; };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "not", "in", "order"]) b[m] = (...args: unknown[]) => { const l = `${tabla}.${m}(${args.map(String).join(",")})`; llamadas.push(l); propias.push(l); return b; };
    b.update = (datos: Record<string, unknown>) => { escrito.push(datos); llamadas.push(`${tabla}.update`); return b; };
    b.maybeSingle = async () => responder();
    b.then = (ok: (v: unknown) => unknown) => ok(responder());
    return b;
  } };
}
const pedir = (ruta: string, method: string) => new Request(`https://panel.test${ruta}`, { method, headers: { origin: "https://panel.test" } });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { requireStaff.mockReset(); createServerClient.mockReset(); });

describe("quitar una imagen del formato", () => {
  it("sin sesión no usa la llave privilegiada", async () => {
    requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
    const r = await quitarImagen(pedir(`/api/admin/adjuntos/${asset}`, "DELETE"), ctx(asset));
    expect(r.status).toBe(401);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("rechaza otro origen antes de leer la sesión", async () => {
    const r = await quitarImagen(new Request(`https://panel.test/api/admin/adjuntos/${asset}`, { method: "DELETE", headers: { origin: "https://otro.test" } }), ctx(asset));
    expect(r.status).toBe(403);
    expect(requireStaff).not.toHaveBeenCalled();
  });

  it("404 si la sesión no ve la imagen (RLS del borrador)", async () => {
    requireStaff.mockResolvedValue({ client: cliente({}), user });
    const r = await quitarImagen(pedir(`/api/admin/adjuntos/${asset}`, "DELETE"), ctx(asset));
    expect(r.status).toBe(404);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("409 si la hoja todavía la usa (foto principal o una fotografía del 07)", async () => {
    for (const data of [{ fotoPrincipalId: asset }, { fotografias: [{ assetId: asset, descripcion: "Sala" }] }]) {
      requireStaff.mockResolvedValue({ client: cliente({
        fortius_inmuebles_formato_assets: { data: { id: asset, draft_id: draft }, error: null },
        fortius_inmuebles_formato_drafts: { data: { id: draft, data }, error: null },
      }), user });
      const r = await quitarImagen(pedir(`/api/admin/adjuntos/${asset}`, "DELETE"), ctx(asset));
      expect(r.status).toBe(409);
      expect((await r.json()).error).toContain("sigue en la hoja");
    }
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("la marca como quitada sin borrar bytes y solo si estaba activa", async () => {
    requireStaff.mockResolvedValue({ client: cliente({
      fortius_inmuebles_formato_assets: { data: { id: asset, draft_id: draft }, error: null },
      fortius_inmuebles_formato_drafts: { data: { id: draft, data: { croquisId: "otro" } }, error: null },
    }), user });
    const privilegiado = cliente({ fortius_inmuebles_formato_assets: { data: { id: asset, draft_id: draft, kind: "foto" }, error: null } });
    const remove = vi.fn();
    createServerClient.mockReturnValue({ ...privilegiado, storage: { from: () => ({ remove }) } });
    const r = await quitarImagen(pedir(`/api/admin/adjuntos/${asset}`, "DELETE"), ctx(asset));
    expect(r.status).toBe(200);
    expect((await r.json()).adjunto.id).toBe(asset);
    expect(privilegiado.escrito[0]).toEqual({ deleted_at: expect.any(String), deleted_by: user.id });
    expect(privilegiado.llamadas).toContain("fortius_inmuebles_formato_assets.is(deleted_at,null)");
    expect(remove).not.toHaveBeenCalled();
  });

  it("409 si ya se quitó (otra pestaña) y 503 claro si falta la migración", async () => {
    const lectura = () => cliente({
      fortius_inmuebles_formato_assets: { data: { id: asset, draft_id: draft }, error: null },
      fortius_inmuebles_formato_drafts: { data: { id: draft, data: {} }, error: null },
    });
    requireStaff.mockResolvedValue({ client: lectura(), user });
    createServerClient.mockReturnValue(cliente({ fortius_inmuebles_formato_assets: { data: null, error: null } }));
    expect((await quitarImagen(pedir(`/api/admin/adjuntos/${asset}`, "DELETE"), ctx(asset))).status).toBe(409);
    requireStaff.mockResolvedValue({ client: lectura(), user });
    createServerClient.mockReturnValue(cliente({ fortius_inmuebles_formato_assets: { data: null, error: { code: "PGRST204", message: "Could not find the 'deleted_at' column" } } }));
    const r = await quitarImagen(pedir(`/api/admin/adjuntos/${asset}`, "DELETE"), ctx(asset));
    expect(r.status).toBe(503);
    expect((await r.json()).error).toContain("todavía no está disponible");
  });

  it("Deshacer la restaura solo si estaba quitada", async () => {
    requireStaff.mockResolvedValue({ client: cliente({ fortius_inmuebles_formato_assets: { data: { id: asset, draft_id: draft }, error: null } }), user });
    const privilegiado = cliente({ fortius_inmuebles_formato_assets: { data: { id: asset, draft_id: draft }, error: null } });
    createServerClient.mockReturnValue(privilegiado);
    const r = await restaurarImagen(pedir(`/api/admin/adjuntos/${asset}`, "PATCH"), ctx(asset));
    expect(r.status).toBe(200);
    expect(privilegiado.escrito[0]).toEqual({ deleted_at: null, deleted_by: null });
    expect(privilegiado.llamadas).toContain("fortius_inmuebles_formato_assets.not(deleted_at,is,null)");
  });

  it("la lista del documento deja fuera las quitadas, y antes de la migración lista todo", async () => {
    const conColumna = cliente({
      fortius_inmuebles_formato_drafts: { data: { id: draft }, error: null },
      fortius_inmuebles_formato_assets: (l) => ({ data: l.some((x) => x.includes(".is(deleted_at")) ? [{ id: "activa" }] : [{ id: "activa" }, { id: "quitada" }], error: null }),
    });
    requireStaff.mockResolvedValue({ client: conColumna, user });
    expect((await (await listarAdjuntos(pedir(`/api/admin/formatos/${draft}/adjuntos`, "GET"), ctx(draft))).json()).adjuntos).toEqual([{ id: "activa" }]);
    const sinColumna = cliente({
      fortius_inmuebles_formato_drafts: { data: { id: draft }, error: null },
      fortius_inmuebles_formato_assets: (l) => (l.some((x) => x.includes(".is(deleted_at"))
        ? { data: null, error: { code: "42703", message: "column fortius_inmuebles_formato_assets.deleted_at does not exist" } }
        : { data: [{ id: "a" }, { id: "b" }], error: null }),
    });
    requireStaff.mockResolvedValue({ client: sinColumna, user });
    const r = await listarAdjuntos(pedir(`/api/admin/formatos/${draft}/adjuntos`, "GET"), ctx(draft));
    expect(r.status).toBe(200);
    expect((await r.json()).adjuntos).toHaveLength(2);
  });
});

describe("quitar una copia firmada", () => {
  it("sin sesión no usa la llave privilegiada", async () => {
    requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
    expect((await quitarCopia(pedir(`/api/admin/copias-firmadas/${copy}`, "DELETE"), ctx(copy))).status).toBe(401);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("404 si la sesión no ve el PDF emitido", async () => {
    requireStaff.mockResolvedValue({ client: cliente({}), user });
    expect((await quitarCopia(pedir(`/api/admin/copias-firmadas/${copy}`, "DELETE"), ctx(copy))).status).toBe(404);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("la quita y la restaura con su marca, sin tocar Storage", async () => {
    requireStaff.mockResolvedValue({ client: cliente({ fortius_inmuebles_signed_copies: { data: { id: copy, emission_id: emission }, error: null } }), user });
    const privilegiado = cliente({ fortius_inmuebles_signed_copies: { data: { id: copy, emission_id: emission, created_at: "2026-11-16T10:00:00Z" }, error: null } });
    createServerClient.mockReturnValue(privilegiado);
    const r = await quitarCopia(pedir(`/api/admin/copias-firmadas/${copy}`, "DELETE"), ctx(copy));
    expect(r.status).toBe(200);
    expect((await r.json()).copia.id).toBe(copy);
    expect(privilegiado.escrito[0]).toEqual({ deleted_at: expect.any(String), deleted_by: user.id });
    const d = await restaurarCopia(pedir(`/api/admin/copias-firmadas/${copy}`, "PATCH"), ctx(copy));
    expect(d.status).toBe(200);
    expect(privilegiado.escrito[1]).toEqual({ deleted_at: null, deleted_by: null });
  });

  it("409 si ya estaba quitada", async () => {
    requireStaff.mockResolvedValue({ client: cliente({ fortius_inmuebles_signed_copies: { data: { id: copy, emission_id: emission }, error: null } }), user });
    createServerClient.mockReturnValue(cliente({ fortius_inmuebles_signed_copies: { data: null, error: null } }));
    expect((await quitarCopia(pedir(`/api/admin/copias-firmadas/${copy}`, "DELETE"), ctx(copy))).status).toBe(409);
  });

  it("la lista del PDF deja fuera las quitadas", async () => {
    requireStaff.mockResolvedValue({ client: cliente({
      fortius_inmuebles_formato_emissions: { data: { id: emission }, error: null },
      fortius_inmuebles_signed_copies: (l) => ({ data: l.some((x) => x.includes(".is(deleted_at")) ? [{ id: copy }] : [{ id: copy }, { id: "quitada" }], error: null }),
    }), user });
    expect((await (await listarCopias(pedir(`/api/admin/emisiones/${emission}/firmado`, "GET"), ctx(emission))).json()).copias).toEqual([{ id: copy }]);
  });
});

describe("ayudas del retiro", () => {
  it("reconoce la columna que falta y las imágenes en uso", () => {
    expect(sinColumnaDeRetiro({ code: "42703" })).toBe(true);
    expect(sinColumnaDeRetiro({ code: "23505", message: "duplicate" })).toBe(false);
    expect([...imagenesEnUso({ fotoPrincipalId: "a", croquisId: "", fotografias: [{ assetId: "b" }, null, { assetId: "a" }] })]).toEqual(["a", "b"]);
    expect(imagenesEnUso(null).size).toBe(0);
  });
});
