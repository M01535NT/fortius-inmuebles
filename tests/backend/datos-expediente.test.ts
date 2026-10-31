import { describe, expect, it } from "vitest";
import { FORMATOS } from "@/lib/formatos/catalog";
import { DATOS_EXPEDIENTE, datosAutomaticos, datosGuardados, fechasDeHoy, llenarDesdeDatos, mezclarDatos, sinAutomaticosIguales, type DatosGuardados } from "@/lib/formatos/datos-expediente";

/* Datos automáticos con dueño (CSR-02): la ficha de la persona manda; las medidas de la del inmueble entran por confirmar. */
describe("datos automáticos", () => {
  const AHORA = "2026-10-31T12:00:00.000Z";
  it("toma de la ficha de la persona lo confirmado y de la del inmueble lo que queda por confirmar", () => {
    const datos = datosAutomaticos({ persona: { nombre: " María Ramírez ", telefono: "6641234567", curp: "RAMM800512MBCRRR09", fechaNacimiento: "1980-05-12", email: "" }, inmueble: { tipo: "casa", ficha: { terrenoM2: 160, construccionM2: 210, recamaras: 3, banos: 2.5 } }, ahora: AHORA });
    expect(datos.propietarioNombre).toEqual({ valor: "María Ramírez", estado: "confirmado", fuente: { documento: "Ficha de la persona" }, actualizadoEl: AHORA });
    expect(datos.propietarioCurp?.valor).toBe("RAMM800512MBCRRR09");
    expect(datos.propietarioNacimiento?.valor).toBe("1980-05-12");
    expect(datos.propietarioCorreo).toBeUndefined();
    expect(datos.inmuebleTipo).toMatchObject({ valor: "casa", estado: "confirmado" });
    expect(datos.superficieTerreno).toMatchObject({ valor: 160, estado: "propuesto", fuente: { documento: "Ficha del inmueble" } });
    expect(datos.banos?.valor).toBe(2);
    expect(datos.mediosBanos?.valor).toBe(1);
  });
  it("lo guardado en el expediente gana, y al guardar se omite lo automático que no cambió", () => {
    const auto = datosAutomaticos({ persona: { nombre: "María" }, ahora: AHORA });
    const guardado: DatosGuardados = { propietarioNombre: { valor: "María Ramírez López", estado: "confirmado" } };
    expect(mezclarDatos(auto, guardado).propietarioNombre.valor).toBe("María Ramírez López");
    expect(sinAutomaticosIguales({ ...auto, folioReal: { valor: "1", estado: "confirmado" } }, auto)).toEqual({ folioReal: { valor: "1", estado: "confirmado" } });
    expect(sinAutomaticosIguales(guardado, auto)).toEqual(guardado);
  });
  it("un formato nace con las fechas que son hoy, sin tocar plazos ni lo ya escrito", () => {
    expect(fechasDeHoy("05", {}, "2026-10-31")).toEqual({ fechaCorte: "2026-10-31" });
    expect(fechasDeHoy("05", { fechaCorte: "2026-10-01" }, "2026-10-31")).toEqual({});
    expect(fechasDeHoy("14", {}, "2026-10-31")).not.toHaveProperty("fechaLimitePropuesta");
  });
});

/* Datos del expediente (titular, 29/10/2026): se confirman una vez y llenan todos los formatos. */
const confirmado = (valor: string | number) => ({ valor, estado: "confirmado" as const });

describe("diccionario de datos del expediente", () => {
  it("cada destino existe en su formato y nunca es un consentimiento, una firma o una decisión", () => {
    const ids = new Set(FORMATOS.map(f => f.id));
    for (const dato of DATOS_EXPEDIENTE) for (const destino of dato.destinos) {
      const formatos = destino.formato === "04" ? FORMATOS.filter(f => /^04[A-G]$/.test(f.id)) : FORMATOS.filter(f => f.id === destino.formato);
      expect(ids.has(destino.formato) || destino.formato === "04", `${dato.clave} → ${destino.formato}`).toBe(true);
      expect(formatos.some(f => f.fields.some(field => field.key === destino.key)), `${dato.clave} → ${destino.formato}.${destino.key}`).toBe(true);
      expect(destino.key).not.toMatch(/consentimiento|transferencia|publicidad|acuse|firma|decision|autoriza|conclusion|resultado|aprob/i);
    }
  });

  it("el nombre confirmado llena el propietario en todos los formatos que lo piden, aunque cada uno lo llame distinto", () => {
    const datos: DatosGuardados = { propietarioNombre: confirmado("María Ramírez") };
    expect(llenarDesdeDatos("01", {}, datos).patch).toEqual({ titular: "María Ramírez" });
    expect(llenarDesdeDatos("07", {}, datos).patch).toEqual({ propietario: "María Ramírez" });
    expect(llenarDesdeDatos("15", {}, datos).patch).toEqual({ vendedor: "María Ramírez" });
  });

  it("las superficies llegan a los levantamientos, al 07 y al 10 con el nombre de cada uno", () => {
    const datos: DatosGuardados = { superficieTerreno: confirmado(160), superficieConstruccion: confirmado(210) };
    expect(llenarDesdeDatos("04B", {}, datos).patch).toMatchObject({ superficieTerreno: 160, superficieConstruccion: 210 });
    expect(llenarDesdeDatos("04A", {}, datos).patch).toMatchObject({ superficieTerreno: 160, superficieConstrucciones: 210 });
    expect(llenarDesdeDatos("07", {}, datos).patch).toMatchObject({ terreno: 160, construccion: 210 });
    expect(llenarDesdeDatos("10", {}, datos).patch).toMatchObject({ terreno: 160, construccion: 210 });
  });

  it("lo propuesto no llena nada; solo lo confirmado", () => {
    expect(llenarDesdeDatos("07", {}, { propietarioNombre: { valor: "María", estado: "propuesto" } }).patch).toEqual({});
  });

  it("respeta lo escrito a mano: no lo cambia y avisa si es distinto", () => {
    const datos: DatosGuardados = { propietarioNombre: confirmado("María Ramírez López"), folioReal: confirmado("123") };
    const r = llenarDesdeDatos("10", { propietario: "María Ramírez", folioReal: "123" }, datos);
    expect(r.patch).toEqual({});
    expect(r.conflictos).toEqual([{ clave: "propietarioNombre", etiqueta: "Nombre del propietario o razón social", key: "propietario", actual: "María Ramírez", propuesto: "María Ramírez López" }]);
  });

  it("en un menú elige la opción que corresponde (por su valor o su texto) y si no encaja, no la inventa", () => {
    expect(llenarDesdeDatos("10", {}, { regimenPropiedad: confirmado("Condominio"), inmuebleTipo: confirmado("casa") }).patch).toEqual({ regimen: "condominio", tipoInmueble: "casa" });
    expect(llenarDesdeDatos("07", {}, { inmuebleTipo: confirmado("casa") }).patch).toEqual({ tipoInmueble: "Casa" });
    expect(llenarDesdeDatos("10", {}, { regimenPropiedad: confirmado("Ejidal") }).patch).toEqual({});
  });

  it("solo guarda datos del diccionario, con el tipo correcto", () => {
    expect(datosGuardados.safeParse({ superficieTerreno: confirmado(160) }).success).toBe(true);
    expect(datosGuardados.safeParse({ superficieTerreno: confirmado("mucho") }).success).toBe(false);
    expect(datosGuardados.safeParse({ consentimientoPatrimonial: confirmado("si") }).success).toBe(false);
    expect(datosGuardados.safeParse({ propietarioNacimiento: confirmado("15/03/1980") }).success).toBe(false);
  });
});
