import { expect, it } from "vitest";
import { requiredReviews } from "@/lib/formatos/operation-workflow";

it("starts investment diligence without requiring completed scenarios or a decision",()=>{
 expect(requiredReviews("inversion","comercializacion")).toEqual(["perfil","privacidad","criterios_inversion"]);
 expect(requiredReviews("inversion","negociacion")).toEqual(["perfil","privacidad","criterios_inversion","riesgos_inversion"]);
});
it("prepares an investment decision from reviewed scenarios and commits only after the decision",()=>{
 expect(requiredReviews("inversion","cierre")).toEqual(["perfil","privacidad","criterios_inversion","riesgos_inversion","escenarios_inversion","capacidad"]);
 expect(requiredReviews("inversion","entrega")).toContain("decision_inversion");
 expect(requiredReviews("inversion","entrega")).toContain("ejecucion_inversion");
});
