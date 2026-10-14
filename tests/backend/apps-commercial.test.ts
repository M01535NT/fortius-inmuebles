import { describe, expect, test, vi } from "vitest";
import { calculateCommercial, commercialRows, getCommercialDefaults, parseComparablesCsv, publicPropertyInput } from "@/lib/apps/commercial";
import type { Property } from "@/data/propiedades";
const comp = { label: "Casa A", type: "casa", operation: "venta", source: "Expediente fuente", date: "2026-10-13", currency: "MXN", areaBasis: "construccion", area: 100, price: 2000000, evidence: "oferta", adjustmentPct: 10, adjustmentReason: "Estado de conservación inferior" };
const serialized = (slug: string, input: Record<string, unknown>) => JSON.stringify(calculateCommercial(slug, input));
describe("comparables", () => {
  test("aplica ajuste explícito al unitario y separa divisas, bases, operaciones y evidencia", () => {
    const result = calculateCommercial("comparables", { rows: [comp, { ...comp, currency: "USD", price: 100000 }, { ...comp, evidence: "cierre" }, { ...comp, areaBasis: "terreno" }, { ...comp, operation: "renta" }] });
    expect(result.sections?.filter(s => s.title.startsWith("Muestra:")).length).toBe(5);
    expect(JSON.stringify(result)).toContain("22,000.00 MXN/m²");
    expect(JSON.stringify(result)).toContain("1,100.00 USD/m²");
  });
  test.each([{ area: 0 }, { price: -5 }, { adjustmentPct: -100 }, { adjustmentReason: "" }, { date: "2026-02-30" }, { currency: "EUR" }])("rechaza comparable inválido %j", invalid => {
    expect(() => calculateCommercial("comparables", { rows: [{ ...comp, ...invalid }] })).toThrow();
  });
  test("CSV preserva comas y comillas escapadas y permite vista previa sin aceptar filas inválidas", () => {
    const header = "label,type,operation,source,date,currency,areaBasis,area,price,evidence,adjustmentPct,adjustmentReason";
    const valid = parseComparablesCsv(header + '\n"Casa, A",casa,venta,"Ficha ""A""",2026-10-13,MXN,construccion,100,2000000,oferta,0,');
    expect(valid.errors).toEqual([]); expect(valid.rows[0]).toMatchObject({ label: "Casa, A", source: 'Ficha "A"', area: 100 });
    const invalid = parseComparablesCsv(header + "\nCasa,casa,venta,Fuente,2026-10-13,MXN,construccion,0,2000000,oferta,0,");
    expect(invalid.errors[0]).toContain("Fila 2");
  });
  test("CSV rechaza columnas faltantes, comillas sin cerrar y límites de tamaño", () => {
    expect(parseComparablesCsv("label,price\nCasa,5").errors.length).toBeGreaterThan(0);
    expect(parseComparablesCsv('"sin cerrar').errors.length).toBeGreaterThan(0);
    expect(parseComparablesCsv("x".repeat(1_000_001)).errors.length).toBeGreaterThan(0);
  });
});
test("cotizador descuenta antes de impuesto y redondea por partida", () => {
  const result = serialized("cotizador", { client: "Cliente", currency: "MXN", issuedAt: "2026-10-13", validUntil: "2026-10-20", items: [{ concept: "Servicio", category: "honorarios", quantity: 2, unitPrice: 1000, discountPct: 10, taxPct: 16 }, { concept: "Gasto", category: "gastos", quantity: 1, unitPrice: 50, discountPct: 0, taxPct: 0 }] });
  expect(result).toContain("2,138.00 MXN"); expect(result).toContain("288.00 MXN"); expect(result).toContain("200.00 MXN");
});
test("cotizador rechaza descuento mayor a cien y vigencia anterior a emisión", () => {
  const input = { client: "Cliente", currency: "MXN", issuedAt: "2026-10-13", validUntil: "2026-10-20", items: [{ concept: "Servicio", category: "honorarios", quantity: 1, unitPrice: 1000, discountPct: 101, taxPct: 16 }] };
  expect(() => calculateCommercial("cotizador", input)).toThrow();
  expect(() => calculateCommercial("cotizador", { ...input, validUntil: "2026-10-12" })).toThrow();
});
test("ofertas calcula neto conocido y conserva desconocido, plazos y recomendación humana", () => {
  const offer = { name: "A", price: 1000000, currency: "MXN", expenses: 100000, creditBalance: 200000, deposit: 10000, days: 30, financing: "Contado", conditions: "Inspección", paymentSchedule: "Saldo a firma" };
  const result = serialized("ofertas", { rows: [offer, { ...offer, name: "B", expenses: "" }], recommendation: "Revisar contingencia de inspección" });
  expect(result).toContain("700,000.00 MXN"); expect(result).toContain("Pendiente"); expect(result).toContain("Revisar contingencia de inspección"); expect(result).not.toContain("Ganadora");
});
test("ficha sólo importa campos publicables y fotos de inmuebles publicados reales", () => {
  const property = { slug: "casa", titulo: "Casa", publicada: true, demo: false, tipo: "casa", operacion: "venta", zona: "Zona", direccionAproximada: "Colonia", descripcion: ["Descripción pública"], precio: { modalidad: "publico", monto: 1500000, moneda: "MXN" }, ficha: { construccionM2: 100 }, galeria: [{ src: "https://example.com/casa.jpg", alt: "Casa" }], amenidades: ["Patio"], owner: "SECRETO", notas: "PRIVADO" } as unknown as Property;
  const input = publicPropertyInput(property);
  expect(JSON.stringify(input)).not.toMatch(/SECRETO|PRIVADO/); expect(input.photoUrls).toEqual(["https://example.com/casa.jpg"]);
  expect(publicPropertyInput({ ...property, publicada: false }).photoUrls).toEqual([]);
  expect(publicPropertyInput({ ...property, demo: true }).photoUrls).toEqual([]);
});
test("informe filtra al periodo, identifica origen y no cuenta registros como visitas", () => {
  const result = serialized("informe-propietario", { ownerLabel: "Propietario", from: "2026-10-01", to: "2026-10-13", rows: [{ date: "2026-10-02", kind: "visita", detail: "Visita realizada", origin: "manual" }, { date: "2026-10-03", kind: "actividad", detail: "Cambio de etapa", origin: "registrado" }, { date: "2026-09-30", kind: "oferta", detail: "Anterior", origin: "manual" }], nextSteps: "Seguimiento" });
  expect(result).toContain("Visita realizada"); expect(result).toContain("registrado"); expect(result).toContain("manual"); expect(result).not.toContain("Anterior");
});
test("revisor distingue faltante, recibido sin revisar, vencido y hallazgos; no certifica", () => {
  const result = serialized("revisor-expediente", { checklistVersion: "1", asOf: "2026-10-13", operation: "venta", propertyType: "casa", rows: [{ name: "Identidad", required: true, fileRef: "", reviewed: false, expires: "", finding: "" }, { name: "Título", required: true, fileRef: "Doc 1", reviewed: false, expires: "", finding: "" }, { name: "Constancia", required: true, fileRef: "Doc 2", reviewed: true, expires: "2026-10-12", finding: "Conciliar superficie" }] });
  expect(result).toContain("Faltante"); expect(result).toContain("Sin revisar"); expect(result).toContain("Vencido"); expect(result).toContain("Conciliar superficie"); expect(result).toContain("revisión humana");
});
test("defaults no fabrican clientes ni evidencia y cada llamada es independiente", () => {
  const first = getCommercialDefaults("cotizador"); const second = getCommercialDefaults("cotizador");
  expect(first.client).toBe(""); expect(first.items).not.toBe(second.items);
  expect(() => calculateCommercial("no-existe", {})).toThrow();
});
test("ficha excluye referencias privadas, enlaces firmados y esquemas ejecutables aun en galería publicada", () => {
  const property = { slug: "casa", titulo: "Casa", publicada: true, demo: false, tipo: "casa", operacion: "venta", zona: "Zona", direccionAproximada: "Colonia", descripcion: ["Descripción"], precio: { modalidad: "consulta" }, ficha: {}, galeria: [{ src: "/api/admin/files?id=x", alt: "privado" }, { src: "https://host/storage/v1/object/sign/bucket/doc?token=secret", alt: "firmado" }, { src: "javascript:alert(1)", alt: "inválido" }, { src: "/api%2fadmin%2ffiles", alt: "codificado" }, { src: "/images/fachada.jpg", alt: "publicado" }], amenidades: [] } as unknown as Property;
  expect(publicPropertyInput(property).photoUrls).toEqual(["/images/fachada.jpg"]);
});
test("cotizador no pierde centavos al representar montos grandes", () => {
  const result = serialized("cotizador", { client: "Cliente", currency: "MXN", issuedAt: "2026-10-13", validUntil: "2026-10-20", items: [{ concept: "Volumen", category: "servicios", quantity: 1000000, unitPrice: "999999999.99", discountPct: 0, taxPct: 0 }, { concept: "Ajuste", category: "gastos", quantity: 1, unitPrice: 0.01, discountPct: 0, taxPct: 0 }] });
  expect(result).toContain("999,999,999,990,000.01 MXN");
});
test("rechaza filas malformadas sin omitirlas silenciosamente", () => {
  expect(() => calculateCommercial("comparables", { rows: [comp, null] })).toThrow();
});

test.each([0.005, "0.001", "12.345"])("F2 cotizador rechaza fracciones de centavo en el precio unitario %s", unitPrice => {
  const input = { client: "Cliente", currency: "MXN", issuedAt: "2026-10-13", validUntil: "2026-10-20", items: [{ concept: "Servicio", category: "servicios", quantity: 1000, unitPrice, discountPct: 0, taxPct: 0 }] };
  expect(() => calculateCommercial("cotizador", input)).toThrow(/dos decimales|fracciones de centavo/);
  expect(input.items[0].unitPrice).toBe(unitPrice);
});
test.each([["2026-10-01T01:00:00Z", "2026-09-30", "2026-09-01"], ["2026-01-01T07:30:00Z", "2025-12-31", "2025-12-01"]])("F3 fechas por defecto usan el calendario de Tijuana para %s", (instant, localDate, monthStart) => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date(instant));
    expect(getCommercialDefaults("cotizador").issuedAt).toBe(localDate);
    expect(getCommercialDefaults("revisor-expediente").asOf).toBe(localDate);
    expect(getCommercialDefaults("informe-propietario")).toMatchObject({ from: monthStart, to: localDate });
  } finally { vi.useRealTimers(); }
});
test.each([null, [], 1, "dato"].map(invalid => ({ invalid })))("F4 informe rechaza una fila inválida $invalid sin mutar la captura", ({ invalid }) => {
  const rows = [{ date: "2026-10-02", kind: "visita", detail: "Visita", origin: "manual" }, invalid];
  const input = { ownerLabel: "Propietario", from: "2026-10-01", to: "2026-10-13", rows, nextSteps: "Seguimiento" };
  expect(() => calculateCommercial("informe-propietario", input)).toThrow(/fila 2/i);
  expect(input.rows).toBe(rows); expect(input.rows[1]).toBe(invalid);
});
test.each([null, "no-lista", {}, undefined])("F4 informe rechaza colección no válida %j", rows => {
  expect(() => calculateCommercial("informe-propietario", { ownerLabel: "Propietario", from: "2026-10-01", to: "2026-10-13", rows, nextSteps: "Seguimiento" })).toThrow();
});
test("F4 informe permite una lista explícitamente vacía y limita el tamaño", () => {
  const input = { ownerLabel: "Propietario", from: "2026-10-01", to: "2026-10-13", rows: [], nextSteps: "Seguimiento" };
  expect(calculateCommercial("informe-propietario", input).summary).toContainEqual({ label: "Actividades incluidas", value: "0" });
  const rows = Array.from({ length: 201 }, () => ({ date: "2026-10-02", kind: "visita", detail: "Visita", origin: "manual" }));
  expect(() => calculateCommercial("informe-propietario", { ...input, rows })).toThrow();
});
test.each(["rows", "items", "activityCandidates"])("F4 el lector de colección %s no omite filas inválidas", key => {
  const values = [{ detail: "Conservar" }, null];
  expect(() => commercialRows({ [key]: values }, key)).toThrow(/fila 2/i);
  expect(values).toHaveLength(2);
});
