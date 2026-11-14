import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { publicFilesBeforeSave, publicPaths, removeOrphanedPublicFiles, removedPaths } from "@/lib/backend/public-file-cleanup";

// Decisión del titular (13/11/2026): lo público que se quita de un inmueble se borra al guardar.
const base = "https://qkkirjzhviqwvuqjnmei.supabase.co/storage/v1/object/public/fortius-inmuebles-public/";
const url = (path: string) => `${base}${path}`;
const before = {
  titulo: "Casa de ejemplo",
  galeria: [{ src: url("inmuebles/casa/a.jpg") }, { src: url("inmuebles/casa/b.jpg") }, { src: url("inmuebles/casa/compartida.jpg") }, { src: url("inmuebles/casa/en-eliminados.jpg") }],
  documentos: [{ url: url("inmuebles/casa/ficha%20tecnica.pdf") }],
  videoUrl: "https://www.youtube.com/watch?v=ejemplo",
};
const after = { ...before, galeria: [{ src: url("inmuebles/casa/a.jpg") }], documentos: [] };

function service(options: { removeError?: boolean; listError?: boolean } = {}) {
  const remove = vi.fn(async () => ({ data: [], error: options.removeError ? { message: "falló" } : null }));
  const records = [
    { collection: "propiedades", id: "casa", data: before },
    { collection: "propiedades", id: "otra", data: { galeria: [{ src: url("inmuebles/casa/compartida.jpg") }] } },
  ];
  const trash = [{ snapshot: { portada: url("inmuebles/casa/en-eliminados.jpg") } }];
  const from = vi.fn((table: string) => {
    if (table === "fortius_inmuebles_records") return { select: (columns: string) => columns === "data"
      ? { eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { data: before }, error: null }) }) }) }
      : Promise.resolve(options.listError ? { data: null, error: { message: "x" } } : { data: records, error: null }) };
    return { select: () => ({ eq: () => ({ is: async () => ({ data: trash, error: null }) }) }) };
  });
  return { client: { from, storage: { from: () => ({ remove }) } } as never, remove };
}

describe("archivos públicos quitados de un inmueble", () => {
  it("reconoce solo direcciones del almacenamiento público", () => {
    expect([...publicPaths(before)].sort()).toEqual(["inmuebles/casa/a.jpg", "inmuebles/casa/b.jpg", "inmuebles/casa/compartida.jpg", "inmuebles/casa/en-eliminados.jpg", "inmuebles/casa/ficha tecnica.pdf"]);
    expect(removedPaths(before, before)).toEqual([]);
  });

  it("borra lo quitado que nadie más usa y respeta lo compartido y lo que está en Eliminados", async () => {
    const { client, remove } = service();
    expect(await removeOrphanedPublicFiles(await publicFilesBeforeSave("casa", client), "casa", after)).toBe(2);
    expect(remove).toHaveBeenCalledWith(["inmuebles/casa/b.jpg", "inmuebles/casa/ficha tecnica.pdf"]);
  });

  it("no borra nada si no se quitó nada, no se leyó el antes o no se pudo revisar quién lo usa", async () => {
    const quiet = service();
    expect(await removeOrphanedPublicFiles(await publicFilesBeforeSave("casa", quiet.client), "casa", before)).toBe(0);
    expect(await removeOrphanedPublicFiles(null, "casa", after)).toBe(0);
    expect(await publicFilesBeforeSave("casa", { from: () => { throw new Error("sin servicio"); } } as never)).toBeNull();
    expect(quiet.remove).not.toHaveBeenCalled();
    const blind = service({ listError: true });
    expect(await removeOrphanedPublicFiles(await publicFilesBeforeSave("casa", blind.client), "casa", after)).toBe(0);
    expect(blind.remove).not.toHaveBeenCalled();
  });

  it("si el borrado falla, el guardado no se rompe", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = service({ removeError: true });
    await expect(removeOrphanedPublicFiles(await publicFilesBeforeSave("casa", client), "casa", after)).resolves.toBe(0);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
