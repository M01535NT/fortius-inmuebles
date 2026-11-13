import { expect, test } from "vitest";
import { FORMATOS } from "@/lib/formatos/catalog";
import { CAPTURA_POR_LISTA, NO_SABE, noSabeValor, parcheNoSabe, preguntasDeLista } from "@/lib/formatos/captura-lista";
import type { Zona } from "@/lib/formatos/documento/pdf";

const fieldsOf = (id: string) => new Map(FORMATOS.find(item => item.id === id)!.fields.map(field => [field.key, field]));
const zona = (keys: string[], y: number, page = 0): Zona => ({ page, x: 0, y, w: 100, h: 10, keys, label: keys.join(" ") });

test("la entrevista y los siete levantamientos se capturan por lista", () => {
  expect([...CAPTURA_POR_LISTA].sort()).toEqual(["02", "04A", "04B", "04C", "04D", "04E", "04F", "04G"]);
  for (const id of CAPTURA_POR_LISTA) expect(FORMATOS.some(item => item.id === id)).toBe(true);
});

test("«No sabe» usa la opción de la plantilla, el texto en preguntas abiertas y nada en cifras o fechas", () => {
  const entrevista = fieldsOf("02"), casa = fieldsOf("04B");
  expect(noSabeValor(entrevista.get("gravamen")!)).toBe("no_sabe");
  expect(noSabeValor(casa.get("ocupacion")!)).toBe("no_verificado");
  expect(noSabeValor(casa.get("usoSuelo")!)).toBe("no_sabe");
  expect(noSabeValor(entrevista.get("motivoVenta")!)).toBe(NO_SABE);
  expect(noSabeValor(casa.get("colonia")!)).toBe(NO_SABE);
  // Una elección real, cifras, fechas, importes y lo que llena la oficina no admiten «No sabe».
  expect(noSabeValor(entrevista.get("tipoPropietario")!)).toBeNull();
  expect(noSabeValor(entrevista.get("precioDeseado")!)).toBeNull();
  expect(noSabeValor(entrevista.get("fechaSeguimiento")!)).toBeNull();
  expect(noSabeValor(casa.get("recamaras")!)).toBeNull();
  expect(noSabeValor(casa.get("folio")!)).toBeNull();
  expect(noSabeValor(entrevista.get("asesor")!)).toBeNull();
});

test("«No sabe» solo escribe en los campos vacíos de la pregunta", () => {
  const casa = fieldsOf("04B");
  const campos = ["colonia", "codigoPostal", "superficieTerreno"].map(key => casa.get(key)!);
  expect(parcheNoSabe(campos, { colonia: "Otay", codigoPostal: "" })).toEqual({ codigoPostal: NO_SABE });
  expect(parcheNoSabe([casa.get("recamaras")!], {})).toEqual({});
});

test("una pregunta por celda, en el orden de la hoja, sin repetir y con lo pendiente al empezar", () => {
  const zonas = [zona(["inmueble"], 700), zona(["fotoPrincipalId", "fotoFecha"], 600), zona(["colonia"], 500), zona(["fotoPrincipalId", "fotoFecha"], 590), zona([], 400), zona(["recamaras"], 300, 1)];
  const values = { inmueble: "Casa en Otay", colonia: "Otay", recamaras: 3 };
  expect(preguntasDeLista(zonas, values, { soloPendiente: false }).map(item => item.keys.join(","))).toEqual(["inmueble", "fotoPrincipalId,fotoFecha", "colonia", "recamaras"]);
  expect(preguntasDeLista(zonas, values, { soloPendiente: true }).map(item => item.keys.join(","))).toEqual(["fotoPrincipalId,fotoFecha"]);
  // Lo marcado como faltante también entra aunque tenga algo escrito.
  expect(preguntasDeLista(zonas, values, { soloPendiente: true, faltantes: new Set(["colonia"]) }).map(item => item.keys.join(","))).toEqual(["fotoPrincipalId,fotoFecha", "colonia"]);
});
