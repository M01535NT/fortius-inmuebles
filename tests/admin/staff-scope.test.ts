import { describe, expect, it } from "vitest";
import { propertyScope } from "@/lib/admin/staff-scope";

// COR-23 / DEC-43: lo que la pantalla muestra; la base lo hace valer (staff-scope-database.test.ts).
describe("propertyScope", () => {
  it("el director puede todo", () => {
    expect(propertyScope("admin", null, { asesorId: "otro" })).toEqual({ edit: true, publish: true, feature: true, reassign: true });
  });
  it("el asesor edita lo suyo y da de alta a su nombre, sin publicar, destacar ni reasignar", () => {
    expect(propertyScope("editor", "ana", { asesorId: "ana" })).toEqual({ edit: true, publish: false, feature: false, reassign: false });
    expect(propertyScope("editor", "ana")).toMatchObject({ edit: true });
  });
  it("el asesor no edita inmuebles ajenos ni sin asesor, ni sin cuenta ligada", () => {
    expect(propertyScope("editor", "ana", { asesorId: "luis" }).edit).toBe(false);
    expect(propertyScope("editor", "ana", {}).edit).toBe(false);
    expect(propertyScope("editor", null, { asesorId: "ana" }).edit).toBe(false);
    expect(propertyScope("editor", undefined).edit).toBe(false);
  });
});
