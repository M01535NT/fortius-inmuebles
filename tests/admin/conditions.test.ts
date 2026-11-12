import { expect, test } from "vitest";
import { conditionLookup } from "@/lib/admin/conditions";
import { conditionOf } from "@/lib/intake/condition";

test("CAP-05: la condición se busca por operación y por persona; gana la más reciente", () => {
  expect(conditionOf({ problema: "ninguno" })).toBeNull();
  expect(conditionOf({ problema: "herencia", detalleAlertas: " Falta la sucesión. " })).toEqual({ text: "Herencia sin resolver", detail: "Falta la sucesión." });
  const lookup = conditionLookup([
    { expedienteId: "op1", clienteId: "c1", leadId: null, text: "Ocupado sin permiso" },
    { expedienteId: "op0", clienteId: "c1", leadId: "l1", text: "Con adeudos" },
  ]);
  expect(lookup.ofOperation("op1")?.text).toBe("Ocupado sin permiso");
  expect(lookup.ofPerson("cliente", "c1")?.text).toBe("Ocupado sin permiso");
  expect(lookup.ofPerson("lead", "l1")?.text).toBe("Con adeudos");
  expect(lookup.ofOperation(undefined)).toBeUndefined();
});
