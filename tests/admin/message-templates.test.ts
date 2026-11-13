import { expect, test } from "vitest";
import { blanks, fillTemplate, messagesFor, suggestedTemplate } from "@/lib/admin/message-templates";

/* Mensajes listos (RP-22): textos aprobados el 12/11/2026, llenos con datos de ejemplo. */
const property = (over: Record<string, unknown> = {}) => ({ slug: "casa-ejemplo", titulo: "Casa de ejemplo", zona: "Playas de Tijuana", precio: { modalidad: "publico" as const, monto: 4_000_000, moneda: "MXN" as const }, estado: "disponible" as const, publicada: true, ...over });
const ctx = { nombre: "Laura Méndez", asesor: "Ana Ejemplo", origin: "https://fortius.test" };
const byId = (list: ReturnType<typeof messagesFor>, id: string) => list.find(m => m.id === id)!;

test("se llena con el primer nombre, el asesor, el inmueble, el precio y la liga a la ficha", () => {
  const opcion = byId(messagesFor({ ...ctx, property: property() }), "opcion");
  expect(opcion.available).toBe(true);
  expect(opcion.text).toContain("Laura, te comparto Casa de ejemplo, en Playas de Tijuana, con precio de");
  expect(opcion.text).toContain("https://fortius.test/inventario/casa-ejemplo");
  expect(byId(messagesFor({ ...ctx, property: property() }), "primera-inmueble").text).toMatch(/^Hola, Laura\. Soy Ana Ejemplo, de Fortius Inmuebles\./);
});

test("«a consulta» quita la frase del precio sin dejar huecos", () => {
  const opcion = byId(messagesFor({ ...ctx, property: property({ precio: { modalidad: "consulta" } }) }), "opcion");
  expect(opcion.text).toContain("te comparto Casa de ejemplo, en Playas de Tijuana. Pensé en ti");
  expect(opcion.text).not.toContain("precio");
});

test("un inmueble sin publicar o no disponible no se ofrece ni lleva liga (RP-91)", () => {
  for (const over of [{ publicada: false }, { estado: "apartada" }]) {
    const list = messagesFor({ ...ctx, property: property(over) });
    expect(byId(list, "opcion").available).toBe(false);
    expect(byId(list, "proponer-visita").available).toBe(false);
    expect(byId(list, "primera-inmueble").text).not.toContain("inventario");
  }
  expect(byId(messagesFor(ctx), "opcion")).toMatchObject({ available: false, reason: "Necesita un inmueble publicado y disponible." });
});

test("«Ya se vendió» solo aplica a un inmueble vendido o rentado y dice cuál de los dos", () => {
  expect(byId(messagesFor({ ...ctx, property: property() }), "ya-vendido").available).toBe(false);
  const rented = byId(messagesFor({ ...ctx, property: property({ estado: "rentada" }) }), "ya-vendido");
  expect(rented).toMatchObject({ available: true });
  expect(rented.text).toContain("ya se rentó");
});

test("lo que escribe el asesor queda entre corchetes y se detecta antes de enviar", () => {
  const visita = byId(messagesFor({ ...ctx, property: property() }), "confirmar-visita");
  expect(blanks(visita.text)).toEqual(["dia", "hora", "punto de encuentro"]);
  const conVisita = byId(messagesFor({ ...ctx, property: property(), visit: { dia: "jueves 14 de noviembre", hora: "11:00" } }), "confirmar-visita");
  expect(blanks(conVisita.text)).toEqual(["punto de encuentro"]);
  expect(fillTemplate("Hola, {nombre}⟨ de {zona}⟩.", { nombre: "Ana" })).toBe("Hola, Ana.");
});

test("el mensaje sugerido sigue el momento de la persona", () => {
  expect(suggestedTemplate({ unattended: true, hasProperty: true })).toBe("primera-inmueble");
  expect(suggestedTemplate({ unattended: true, hasProperty: false })).toBe("primera-busqueda");
  expect(suggestedTemplate({ unattended: false, hasProperty: true, lastContact: "no_contesto" })).toBe("no-contesto");
  expect(suggestedTemplate({ unattended: false, hasProperty: true, retry: true })).toBe("reintento");
  expect(suggestedTemplate({ unattended: false, hasProperty: true, visited: true })).toBe("despues-visita");
  expect(suggestedTemplate({ unattended: false, hasProperty: true, propertyClosed: true })).toBe("ya-vendido");
});
