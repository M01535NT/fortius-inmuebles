import { describe, expect, it } from "vitest";
import { prefillFormato } from "@/lib/formatos/intake-prefill";
import { TIPOS_INMUEBLE } from "@/lib/formatos/valor-fields";

const context = (respuestas: Record<string, string>, intencion = "vender") => ({
  expediente: { folio: "EXP-ENSAYO", operacion: "venta", flujo: { ruta: "captacion" } },
  persona: { nombre: "Persona de ensayo" },
  entrevista: { id: "77000000-0000-4000-8000-000000000002", version: 1, intencion, respuestas },
}) as Parameters<typeof prefillFormato>[1];

describe("COR-01 · nombre del propietario", () => {
  it.each(["07", "08", "10"])("un prospecto propietario nuevo llega con su nombre al %s, marcado por confirmar", formato => {
    const data = prefillFormato(formato, context({ relacion: "por_aclarar" }));
    expect(data.propietario).toBe("Persona de ensayo");
    expect(JSON.parse(String(data.origenDatos)).porConfirmar).toEqual(["propietario"]);
  });
  it("la relación aclarada como propietario no queda por confirmar", () => {
    const data = prefillFormato("08", context({ relacion: "propietario" }));
    expect(data.propietario).toBe("Persona de ensayo");
    expect(JSON.parse(String(data.origenDatos)).porConfirmar).toBeUndefined();
  });
  it("no copia el nombre de un representante ni de quien compra", () => {
    expect(prefillFormato("08", context({ relacion: "representante" })).propietario).toBeUndefined();
    expect(prefillFormato("08", context({ relacion: "por_aclarar" }, "comprar")).propietario).toBeUndefined();
  });
});

describe("COR-02 · tipo de inmueble al 07", () => {
  it.each([
    ["casa", "Casa"], ["departamento", "Departamento"], ["terreno", "Terreno"],
    ["local", "Local"], ["oficina", "Oficina"], ["nave-industrial", "Nave o bodega"],
  ])("«%s» de la entrevista llega al 07 como «%s»", (entrevista, plantilla) => {
    expect(TIPOS_INMUEBLE).toContain(plantilla);
    expect(prefillFormato("07", context({ tipoInmueble: entrevista })).tipoInmueble).toBe(plantilla);
  });
  it("«por definir» deja el tipo vacío en el 07", () => {
    expect(prefillFormato("07", context({ tipoInmueble: "por_definir" })).tipoInmueble).toBeUndefined();
  });
});
