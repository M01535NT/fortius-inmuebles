import { describe, expect, it } from "vitest";

import { guardadosEnOrden } from "@/lib/panel/en-orden";
import { cambioDeOperacion } from "@/lib/panel/inmuebles/operacion";

describe("Cambiar la operación de un inmueble", () => {
  it("un Rentado que pasa a venta queda Libre, sigue en el sitio y se puede deshacer", () => {
    const r = cambioDeOperacion({ operacion: "renta", estado: "rentado", publicado: true }, "venta");
    expect(r.cambio).toEqual({ operacion: "venta", estado: "libre" });
    expect(r.antes).toEqual({ operacion: "renta", estado: "rentado" });
    expect(r.aviso).toMatch(/sigue en el sitio/);
  });

  it("si el estado sirve para la nueva operación, no se toca", () => {
    expect(cambioDeOperacion({ operacion: "renta", estado: "apartado", publicado: true }, "venta").cambio).toEqual({ operacion: "venta" });
  });

  it("quitar la operación de un publicado avisa que deja de verse", () => {
    expect(cambioDeOperacion({ operacion: "venta", estado: "libre", publicado: true }, null).aviso).toMatch(/no se ve en el sitio/);
  });
});

describe("Guardados en fila de la ficha", () => {
  type Ficha = { version: number; ficha: Record<string, number> };
  const servidor = () => {
    let fila: Ficha = { version: 1, ficha: {} };
    return {
      mandar: async (vista: Ficha, cambio: Partial<Ficha>) => {
        await Promise.resolve();
        if (vista.version !== fila.version) throw Object.assign(new Error("Otra persona guardó"), { estado: 409 });
        fila = { ...fila, ...cambio, version: fila.version + 1 };
        return fila;
      },
      ver: () => fila,
      cambiarPorOtro: () => { fila = { ...fila, version: fila.version + 1 }; },
    };
  };

  it("dos guardados seguidos no chocan y no se pierde ninguno", async () => {
    const s = servidor();
    let actual: Ficha | null = s.ver();
    const guardar = guardadosEnOrden<Ficha>(() => actual, (x) => { actual = x; });
    const fallas: unknown[] = [];
    await Promise.all([
      guardar((x) => ({ ficha: { ...x.ficha, recamaras: 3 } }), s.mandar, (e) => { fallas.push(e); }),
      guardar((x) => ({ ficha: { ...x.ficha, banos: 2 } }), s.mandar, (e) => { fallas.push(e); }),
    ]);
    expect(fallas).toEqual([]);
    expect(s.ver()).toEqual({ version: 3, ficha: { recamaras: 3, banos: 2 } });
  });

  it("con un 409 avisa y no manda lo que esperaba detrás", async () => {
    const s = servidor();
    let actual: Ficha | null = s.ver();
    const guardar = guardadosEnOrden<Ficha>(() => actual, (x) => { actual = x; });
    s.cambiarPorOtro();
    const fallas: unknown[] = [];
    const [a, b] = await Promise.all([
      guardar(() => ({ ficha: { recamaras: 3 } }), s.mandar, (e) => { fallas.push(e); }),
      guardar(() => ({ ficha: { banos: 2 } }), s.mandar, (e) => { fallas.push(e); }),
    ]);
    expect([a, b]).toEqual([false, false]);
    expect(fallas).toHaveLength(1);
    expect(s.ver().ficha).toEqual({});
  });
});
