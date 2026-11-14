import { expect, it } from "vitest";
import { checklistFor, municipioDe } from "@/lib/formatos/checklist-documentos";
import { recentOfferOf } from "@/lib/admin/operation-view";

/*
  Hallazgos de Operaciones (C-92 y C-93). Datos ficticios de ensayo.
*/

/*
  BUG-C92: el municipio del domicilio se toma del primer nombre de la lista rosarito → ensenada →
  tecate → tijuana que aparezca en el texto (src/lib/formatos/checklist-documentos.ts:27-30), no del
  municipio del domicilio. Un inmueble de Playas de Tijuana sobre la «Carretera Escénica
  Tijuana-Ensenada» sale como Ensenada, y la lista le pide la constancia de la CESPE en vez de la CESPT.
*/
it("BUG-C92: un domicilio de Tijuana sobre la carretera Tijuana-Ensenada pide la constancia de la CESPT", () => {
  const domicilio = "Carretera Escénica Tijuana-Ensenada km 19.5, Fracc. de ensayo, Tijuana, B.C.";
  expect(municipioDe(domicilio), "el domicilio dice Tijuana como municipio").toBe("tijuana");
  const agua = checklistFor({ inmueble: domicilio, tipoInmueble: "casa" }).find(item => item.id === "D07");
  expect(agua?.texto, "agua de Tijuana: CESPT").toContain("CESPT");
});
it("BUG-C92: un domicilio de Tijuana sobre el bulevar Tijuana-Tecate no se toma como Tecate", () => {
  expect(municipioDe("Blvd. Tijuana-Tecate 1200, Col. de ensayo, Tijuana, Baja California")).toBe("tijuana");
});

/*
  BUG-C93: «Oferta nueva» (últimos 3 días) compara el día UTC del instante (updatedAt.slice(0, 10)) con
  el día de Tijuana (src/lib/admin/operation-view.ts:165). Una oferta del 9 nov a las 19:00 de Tijuana
  (2026-11-10T03:00Z) cuenta el 13 nov como «de los últimos 3 días» aunque ya pasaron 4 días.
*/
it("BUG-C93: una oferta registrada hace 4 días en la noche de Tijuana ya no es «Oferta nueva»", () => {
  const offers = [{ updatedAt: "2026-11-10T03:00:00.000Z", context: { expedienteId: "op-ensayo" } }];
  expect(recentOfferOf("op-ensayo", offers, "2026-11-13"), "9 nov en Tijuana queda fuera de 10–13 nov").toBeUndefined();
});
