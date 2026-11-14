import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { publicFilesBeforeSave, publicPaths, purgeRetiredPublicFiles, removedPaths, syncPublicFiles } from "@/lib/backend/public-file-cleanup";

// Decisión del titular (13/11/2026): lo público que se quita de un inmueble deja su dirección pública al guardar,
// pero se conserva en el almacenamiento privado para poder recuperarlo.
const base = "https://qkkirjzhviqwvuqjnmei.supabase.co/storage/v1/object/public/fortius-inmuebles-public/";
const url = (path: string) => `${base}${path}`;
const before = {
  titulo: "Casa de ejemplo",
  galeria: [{ src: url("inmuebles/casa/a.jpg") }, { src: url("inmuebles/casa/b.jpg") }, { src: url("inmuebles/casa/compartida.jpg") }, { src: url("inmuebles/casa/en-eliminados.jpg") }],
  documentos: [{ url: url("inmuebles/casa/ficha%20tecnica.pdf") }],
  videoUrl: "https://www.youtube.com/watch?v=ejemplo",
};
const after = { ...before, galeria: [{ src: url("inmuebles/casa/a.jpg") }], documentos: [] };

function service(options: { moveError?: boolean; listError?: boolean; stored?: unknown } = {}) {
  const moves: { bucket: string; from: string; to: string; destination?: string }[] = [];
  const remove = vi.fn();
  // La base responde qué rutas siguen en uso: la compartida con otro inmueble y la que está en Eliminados.
  const inUse = ["fortius-inmuebles-public/inmuebles/casa/compartida.jpg", "fortius-inmuebles-public/inmuebles/casa/en-eliminados.jpg"];
  const rpc = vi.fn(async (_name: string, args: { p_needles: string[] }) => options.listError ? { data: null, error: { message: "x" } } : { data: args.p_needles.filter(n => inUse.includes(n)), error: null });
  const from = vi.fn((table: string) => {
    if (table !== "fortius_inmuebles_records") throw new Error(table);
    return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: options.stored === null ? null : { data: options.stored ?? before }, error: null }) }) }) }) };
  });
  const storage = { from: (bucket: string) => ({
    remove,
    move: async (fromPath: string, toPath: string, opts?: { destinationBucket?: string }) => {
      moves.push({ bucket, from: fromPath, to: toPath, destination: opts?.destinationBucket });
      return { data: null, error: options.moveError || bucket === "fortius-inmuebles-private" && !fromPath.endsWith("vuelve.jpg") ? { message: "Object not found" } : null };
    },
  }) };
  return { client: { from, storage, rpc } as never, moves, remove, rpc };
}

describe("archivos públicos quitados de un inmueble", () => {
  it("reconoce solo direcciones del almacenamiento público", () => {
    expect([...publicPaths(before)].sort()).toEqual(["inmuebles/casa/a.jpg", "inmuebles/casa/b.jpg", "inmuebles/casa/compartida.jpg", "inmuebles/casa/en-eliminados.jpg", "inmuebles/casa/ficha tecnica.pdf"]);
    expect(removedPaths(before, before)).toEqual([]);
  });

  it("pasa al almacenamiento privado lo quitado que nadie más usa, sin borrarlo, y respeta lo compartido y lo que está en Eliminados", async () => {
    const { client, moves, remove } = service();
    expect(await syncPublicFiles(await publicFilesBeforeSave("casa", client), "casa", after)).toEqual({ retired: 2, restored: 0 });
    expect(moves).toEqual([
      { bucket: "fortius-inmuebles-public", from: "inmuebles/casa/b.jpg", to: "retirados/inmuebles/casa/b.jpg", destination: "fortius-inmuebles-private" },
      { bucket: "fortius-inmuebles-public", from: "inmuebles/casa/ficha tecnica.pdf", to: "retirados/inmuebles/casa/ficha tecnica.pdf", destination: "fortius-inmuebles-private" },
    ]);
    expect(remove).not.toHaveBeenCalled();
  });

  it("una dirección retirada que vuelve al inmueble regresa a su lugar público", async () => {
    const { client, moves } = service();
    const back = { ...before, galeria: [...before.galeria, { src: url("inmuebles/casa/vuelve.jpg") }] };
    expect(await syncPublicFiles(await publicFilesBeforeSave("casa", client), "casa", back)).toEqual({ retired: 0, restored: 1 });
    expect(moves).toEqual([{ bucket: "fortius-inmuebles-private", from: "retirados/inmuebles/casa/vuelve.jpg", to: "inmuebles/casa/vuelve.jpg", destination: "fortius-inmuebles-public" }]);
  });

  it("no mueve nada si no se quitó nada, no se leyó el antes o no se pudo revisar quién lo usa", async () => {
    const quiet = service();
    expect(await syncPublicFiles(await publicFilesBeforeSave("casa", quiet.client), "casa", before)).toEqual({ retired: 0, restored: 0 });
    expect(quiet.moves).toEqual([]);
    expect(await syncPublicFiles(null, "casa", after)).toEqual({ retired: 0, restored: 0 });
    expect(await publicFilesBeforeSave("casa", { from: () => { throw new Error("sin servicio"); } } as never)).toBeNull();
    const blind = service({ listError: true });
    expect(await syncPublicFiles(await publicFilesBeforeSave("casa", blind.client), "casa", after)).toEqual({ retired: 0, restored: 0 });
    expect(blind.moves).toEqual([]);
  });

  it("si otro registro empieza a usar la dirección mientras se retira, regresa a público", async () => {
    const moves: { bucket: string; from: string; to: string }[] = [];
    let checks = 0;
    // Primera revisión: nadie usa b.jpg. Segunda (después de moverlo): otro inmueble ya la guardó.
    const rpc = vi.fn(async (_name: string, args: { p_needles: string[] }) => {
      checks += 1;
      return { data: checks === 1 ? [] : args.p_needles.filter(n => n.endsWith("casa/b.jpg")), error: null };
    });
    const storage = { from: (bucket: string) => ({ move: async (fromPath: string, toPath: string) => { moves.push({ bucket, from: fromPath, to: toPath }); return { data: null, error: null }; } }) };
    const client = { from: vi.fn(), storage, rpc } as never;
    const small = { galeria: [{ src: url("inmuebles/casa/a.jpg") }, { src: url("inmuebles/casa/b.jpg") }] };
    expect(await syncPublicFiles({ service: client, data: small }, "casa", { galeria: [{ src: url("inmuebles/casa/a.jpg") }] })).toEqual({ retired: 0, restored: 1 });
    expect(moves.at(-1)).toEqual({ bucket: "fortius-inmuebles-private", from: "retirados/inmuebles/casa/b.jpg", to: "inmuebles/casa/b.jpg" });
  });

  it("si mover falla, el guardado no se rompe y queda anotado", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = service({ moveError: true });
    await expect(syncPublicFiles(await publicFilesBeforeSave("casa", client), "casa", after)).resolves.toEqual({ retired: 0, restored: 0 });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("a los 30 días borra lo retirado y regresa a público lo que volvió a usarse", async () => {
    const moves: string[] = [];
    const remove = vi.fn(async () => ({ data: [], error: null }));
    const rpc = vi.fn(async (name: string, args: { p_needles?: string[]; p_property_id?: string | null }) => name === "fortius_inmuebles_retired_public_files_due"
      ? { data: ["retirados/inmuebles/casa/vencida.jpg", "retirados/inmuebles/casa/otra-vez.jpg"], error: null }
      : { data: (args.p_needles ?? []).filter(n => n.endsWith("otra-vez.jpg")), error: args.p_property_id === null ? null : { message: "debe revisar todos los inmuebles" } });
    const client = { rpc, from: vi.fn(), storage: { from: (bucket: string) => ({ remove, move: async (from: string, to: string) => { moves.push(`${bucket}:${from}->${to}`); return { data: null, error: null }; } }) } } as never;
    expect(await purgeRetiredPublicFiles(client)).toEqual({ purged: 1, restored: 1 });
    expect(remove).toHaveBeenCalledWith(["retirados/inmuebles/casa/vencida.jpg"]);
    expect(moves).toEqual(["fortius-inmuebles-private:retirados/inmuebles/casa/otra-vez.jpg->inmuebles/casa/otra-vez.jpg"]);
  });
});
