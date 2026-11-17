import { afterEach, describe, expect, it, vi } from "vitest";

import { devolver, quitarAdjunto, quitarFirmado, restaurarAdjunto, restaurarFirmado, sinImagen } from "@/lib/panel/datos/formatos-adjuntos";
import { constructorDeVoz, crearReconocedor, mensajeDeDictado, textoDictado, unirDictado } from "@/lib/panel/datos/formatos-dictado";
import { aplicar } from "@/lib/panel/datos/formatos";

afterEach(() => vi.unstubAllGlobals());

describe("PN-06 quitar una imagen de la hoja", () => {
  it("saca la imagen de la foto principal o del croquis y la hoja queda sin ese espacio", () => {
    const datos = { fotoPrincipalId: "a", croquisId: "b", fotoFecha: "2026-11-10" };
    expect(sinImagen(datos, "a")).toEqual({ fotoPrincipalId: undefined });
    expect(aplicar(datos, sinImagen(datos, "a"))).toEqual({ croquisId: "b", fotoFecha: "2026-11-10" });
    expect(sinImagen(datos, "zzz")).toEqual({});
  });

  it("en el 07 deja el renglón y su texto, solo sin la fotografía", () => {
    const datos = { fotografias: [{ assetId: "a", descripcion: "Sala" }, { assetId: "b", descripcion: "Cocina" }] };
    expect(sinImagen(datos, "a")).toEqual({ fotografias: [{ descripcion: "Sala" }, { assetId: "b", descripcion: "Cocina" }] });
  });

  it("Deshacer devuelve el elemento a su lugar por fecha, sin repetirlo", () => {
    const xs = [{ id: "1", created_at: "2026-11-01" }, { id: "3", created_at: "2026-11-03" }];
    expect(devolver(xs, { id: "2", created_at: "2026-11-02" }, false).map((x) => x.id)).toEqual(["1", "2", "3"]);
    expect(devolver(xs, { id: "2", created_at: "2026-11-02" }, true).map((x) => x.id)).toEqual(["3", "2", "1"]);
    expect(devolver(xs, { id: "1", created_at: "2026-11-01" }, false)).toHaveLength(2);
  });

  it("quitar es DELETE y restaurar es PATCH, con la sesión y el error del servidor tal cual", async () => {
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "DELETE" && url.includes("adjuntos")) return Response.json({ error: "La imagen sigue en la hoja. Quítala de su espacio y vuelve a intentarlo." }, { status: 409 });
      return Response.json({ adjunto: { id: "a" }, copia: { id: "c" } });
    });
    vi.stubGlobal("fetch", fetch);
    await expect(quitarAdjunto("a")).rejects.toThrow("sigue en la hoja");
    expect((await restaurarAdjunto("a")).id).toBe("a");
    expect((await quitarFirmado("c")).id).toBe("c");
    expect((await restaurarFirmado("c")).id).toBe("c");
    expect(fetch.mock.calls.map(([u, i]) => `${i?.method} ${u}`)).toEqual([
      "DELETE /api/admin/adjuntos/a", "PATCH /api/admin/adjuntos/a", "DELETE /api/admin/copias-firmadas/c", "PATCH /api/admin/copias-firmadas/c",
    ]);
    expect(fetch.mock.calls.every(([, i]) => i?.credentials === "same-origin")).toBe(true);
  });
});

describe("PN-06 dictado", () => {
  it("sin la API del navegador no hay dictado (el botón no aparece)", () => {
    expect(constructorDeVoz({})).toBeNull();
    expect(constructorDeVoz(undefined)).toBeNull();
    const Voz = function () {} as unknown as never;
    expect(constructorDeVoz({ webkitSpeechRecognition: Voz })).toBe(Voz);
  });

  it("se prepara en español de México y pide reconocer en el equipo si el navegador puede", async () => {
    class Voz { lang = ""; interimResults = true; continuous = true; maxAlternatives = 3; processLocally?: boolean; static available = vi.fn(async () => "available"); }
    const r = await crearReconocedor(Voz as never);
    expect(r).toMatchObject({ lang: "es-MX", interimResults: false, continuous: false, maxAlternatives: 1, processLocally: true });
    expect(Voz.available).toHaveBeenCalledWith({ langs: ["es-MX"], processLocally: true });
    class SinLocal { lang = ""; processLocally?: boolean; static available = async () => "unavailable"; }
    expect((await crearReconocedor(SinLocal as never)).processLocally).toBeUndefined();
    class Viejo { lang = ""; static available = async () => { throw new Error("no"); }; }
    expect((await crearReconocedor(Viejo as never)).lang).toBe("es-MX");
  });

  it("suma lo dictado a lo escrito, con mayúscula si estaba vacío", () => {
    expect(unirDictado(undefined, "casa de dos plantas")).toBe("Casa de dos plantas");
    expect(unirDictado("Casa", "de dos plantas")).toBe("Casa de dos plantas");
    expect(unirDictado("Casa ", "de dos plantas")).toBe("Casa de dos plantas");
    expect(unirDictado("Casa", "  ")).toBe("Casa");
  });

  it("toma solo lo final del evento y explica los errores que importan", () => {
    const fin = (t: string, isFinal = true) => Object.assign([{ transcript: t }], { isFinal });
    expect(textoDictado({ resultIndex: 0, results: [fin(" hola "), fin("borrador", false), fin("mundo")] })).toBe("hola mundo");
    expect(mensajeDeDictado("aborted")).toBeNull();
    expect(mensajeDeDictado("not-allowed")).toContain("micrófono");
    expect(mensajeDeDictado("algo-raro")).toContain("No se pudo dictar");
  });
});
