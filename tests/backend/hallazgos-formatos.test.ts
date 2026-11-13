import { expect, test } from "vitest";
import { promesaDocumento } from "@/lib/formatos/documento/oferta-promesa";
import { calcularValor } from "@/lib/formatos/valor";
import { lastOwnerReport, ownerReportStatus } from "@/lib/formatos/operation-workflow";
import { importeEnLetra } from "@/lib/formatos/letras";

// BUG-C10: la vista en vivo de la promesa 15 deja todo en blanco si falta una fecha o la moneda,
// porque day()/rowDay()/letters() lanzan y el catch reemplaza todos los marcadores.
test("la promesa en vivo imprime vendedor y comprador aunque falten otras fechas", () => {
  const doc = promesaDocumento({ vendedor: "JUAN PEREZ VENDEDOR", comprador: "ANA COMPRADORA", lugar: "Tijuana", fecha: "2026-11-12", moneda: "MXN", precio: 2500000 });
  const texto = JSON.stringify(doc.blocks);
  expect(texto).toContain("JUAN PEREZ VENDEDOR");
  expect(texto).toContain("ANA COMPRADORA");
});

// BUG-C11: un comparable en USD sin tipo de cambio se descarta sin aviso; el panel y el Excel
// (que lo cuenta como 0) dan medias distintas. docs/formatos-admin-status.md: el 07 «rechaza… monedas sin conversión».
test("la opinión 07 avisa cuando un comparable en dólares no tiene tipo de cambio", () => {
  const comp = (precio: number, moneda = "MXN") => ({ precio, superficie: 100, moneda });
  const r = calcularValor({ baseMercado: "Construcción", construccion: 100, pesoMercado: 100, pesoIngresos: 0, pesoFisico: 0, comparablesConstruccion: [comp(2000000), comp(2100000), comp(2200000), comp(50000, "USD")] });
  expect(r.pendientes.length).toBeGreaterThan(0);
});

// BUG-C12: el informe mensual preparado se fecha con updated_at en UTC; después de las 16-17 h en Tijuana cae al día siguiente.
test("el informe al propietario preparado de tarde en Tijuana se fecha el mismo día local", () => {
  const preparado = "2026-11-13T02:15:00.123+00:00"; // 12/11/2026 18:15 en Tijuana
  const last = lastOwnerReport({ entregasInforme: [] } as never, preparado);
  expect(last).toBe("2026-11-12");
  expect(ownerReportStatus(last, "2026-12-13")).toMatchObject({ estado: "vencido" });
});

// BUG-C13: «UN PESOS» en singular.
test("el importe en letra de un peso va en singular", () => {
  expect(importeEnLetra(1)).toMatch(/^UN PESO\b(?!S)/);
});
