import { expect, test } from "vitest";
import { bulkSummary, failedOf, mergeRetry, runBulk, toCsv } from "@/lib/admin/bulk";
import { AdminApiError } from "@/lib/admin/store";

/* RP-12 (UX-03): cada registro informa su resultado; reintentar no repite los ya aplicados. */
const targets = [{ id: "a", label: "Pedir el predial" }, { id: "b", label: "Confirmar visita" }, { id: "c", label: "Revisar escritura" }];

test("un fallo no detiene a los demás y se informa con su motivo", async () => {
  const calls: string[] = [];
  const results = await runBulk(targets, async id => { calls.push(id); if (id === "b") throw new AdminApiError(409, "cambió"); return id === "c" ? "sin-cambio" : "aplicado"; });
  expect(calls).toEqual(["a", "b", "c"]);
  expect(results.map(r => r.status)).toEqual(["aplicado", "fallo", "sin-cambio"]);
  expect(results[1].reason).toContain("Alguien la cambió mientras tanto");
  expect(bulkSummary(results, "Se reasignaron")).toBe("Se reasignaron 1 de 3; 1 ya estaba así. Una no se aplicó.");
});

test("reintentar solo toca los que fallaron y conserva lo ya aplicado", async () => {
  const first = await runBulk(targets, async id => { if (id !== "a") throw new AdminApiError(403, "no"); return "aplicado"; });
  const calls: string[] = [];
  const retried = await runBulk(failedOf(first), async id => { calls.push(id); return "aplicado"; });
  expect(calls).toEqual(["b", "c"]);
  const merged = mergeRetry(first, retried);
  expect(merged.map(r => r.status)).toEqual(["aplicado", "aplicado", "aplicado"]);
  expect(bulkSummary(merged, "Se reasignaron")).toBe("Se reasignaron 3 de 3.");
  expect(first[1].reason).toBe("No tienes permiso para cambiarla.");
});

test("si todo ya estaba así lo dice sin contar cambios", async () => {
  const results = await runBulk(targets.slice(0, 2), async () => "sin-cambio");
  expect(bulkSummary(results, "Se reasignaron")).toBe("Ya estaban así; no hubo nada que cambiar.");
});

test("el CSV escapa comillas y comas y neutraliza fórmulas", () => {
  const csv = toCsv(["Título", "Responsable"], [["Llamar, \"urgente\"", "=HYPERLINK(x)"]]);
  expect(csv.startsWith("﻿")).toBe(true);
  expect(csv).toContain('"Llamar, ""urgente"""');
  expect(csv).toContain("'=HYPERLINK(x)");
});
