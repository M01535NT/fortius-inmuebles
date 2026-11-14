import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { publicFilesBeforeSave, publicPaths, removedPaths, syncPublicFiles } from "@/lib/backend/public-file-cleanup";

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
  const records = [
    { collection: "propiedades", id: "casa", data: before },
    { collection: "propiedades", id: "otra", data: { galeria: [{ src: url("inmuebles/casa/compartida.jpg") }] } },
  ];
  const trash = [{ snapshot: { portada: url("inmuebles/casa/en-eliminados.jpg") } }];
  const from = vi.fn((table: string) => {
    if (table === "fortius_inmuebles_records") return { select: (columns: string) => columns === "data"
      ? { eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: options.stored === null ? null : { data: options.stored ?? before }, error: null }) }) }) }
      : Promise.resolve(options.listError ? { data: null, error: { message: "x" } } : { data: records, error: null }) };
    return { select: () => ({ eq: () => ({ is: async () => ({ data: trash, error: null }) }) }) };
  });
  const storage = { from: (bucket: string) => ({
    remove,
    move: async (fromPath: string, toPath: string, opts?: { destinationBucket?: string }) => {
      moves.push({ bucket, from: fromPath, to: toPath, destination: opts?.destinationBucket });
      return { data: null, error: options.moveError || bucket === "fortius-inmuebles-private" && !fromPath.endsWith("vuelve.jpg") ? { message: "Object not found" } : null };
    },
  }) };
  return { client: { from, storage } as never, moves, remove };
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

  it("si mover falla, el guardado no se rompe y queda anotado", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = service({ moveError: true });
    await expect(syncPublicFiles(await publicFilesBeforeSave("casa", client), "casa", after)).resolves.toEqual({ retired: 0, restored: 0 });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
