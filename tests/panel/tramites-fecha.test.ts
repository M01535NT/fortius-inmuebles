import { describe, expect, it } from "vitest";

import { esPendienteFecha, fechaDePendiente, fecharPendiente } from "@/lib/panel/datos/tramites";
import { nuevoTramite } from "@/lib/tramites";

const t = { ...nuevoTramite({ id: "t1", acreedor: "infonavit", titulo: "Casa", clienteId: "c1", asesorId: "a1" }), pasoActual: 1 };
const pendiente = () => t.pasos[1].pendientes.find((p) => esPendienteFecha(p.texto))!;

describe("pendiente con fecha", () => {
  it("«Fecha del último pago» se captura como fecha", () => {
    expect(pendiente().texto).toBe("Fecha del último pago");
    expect(esPendienteFecha("Saldo en cero confirmado")).toBe(false);
  });
  it("guardar la fecha la anota y marca hecho; borrarla lo deja por hacer", () => {
    const con = fecharPendiente(t, pendiente().id, "2026-11-10");
    const p = con.pasos[1].pendientes.find((x) => x.id === pendiente().id)!;
    expect(p).toMatchObject({ texto: "Fecha del último pago: 2026-11-10", hecho: true });
    expect(fechaDePendiente(p.texto)).toBe("2026-11-10");
    const sin = fecharPendiente(con, p.id, "");
    expect(sin.pasos[1].pendientes.find((x) => x.id === p.id)).toMatchObject({ texto: "Fecha del último pago", hecho: false });
  });
  it("una fecha mal escrita no marca hecho y no toca otros pendientes", () => {
    const r = fecharPendiente(t, pendiente().id, "ayer");
    expect(r.pasos[1].pendientes.every((x) => !x.hecho)).toBe(true);
    expect(fecharPendiente(t, "otro", "2026-11-10")).toEqual(t);
  });
});
