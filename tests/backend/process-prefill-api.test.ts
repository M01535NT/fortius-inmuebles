import { beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ inserted: {} as Record<string, unknown>, valuation: {} as Record<string, unknown> }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff: async () => ({ client: { from(table: string) {
  let kind = "", payload: Record<string, unknown> | undefined;
  const exp = { id: "77000000-0000-4000-8000-000000000001", cliente_id: "person", asesor_id: "adviser", propiedad_slug: "property", folio: "EXP-ENSAYO", operacion: "venta", unidad: "Domicilio corregido", flujo: { ruta: "captacion" } };
  const interview = { id: "77000000-0000-4000-8000-000000000002", version: 3, intencion: "vender", estado: "completada", respuestas: { fecha: "2026-10-14", relacion: "representante", objetivo: "Vender en seis meses", zona: "Tijuana", tipoInmueble: "casa", presupuestoEstado: "conocido", importe: "8000000", moneda: "MXN", privacidad: "presentado", siguienteAccion: "Aclarar facultades", siguienteFecha: "2030-12-31", origenContacto: "referido" } };
  const records: Record<string, unknown> = { clientes: { nombre: "Persona actual", telefono: "6641234567", email: "persona@example.invalid" }, asesores: { nombre: "Asesor responsable" }, propiedades: { direccionAproximada: "Domicilio anterior", precio: { modalidad: "publico", monto: 8500000, moneda: "MXN" } } };
  const response = () => table === "fortius_inmuebles_expedientes" ? exp : table === "fortius_inmuebles_interviews" ? [interview] : table === "fortius_inmuebles_records" ? { data: records[kind] } : payload ? { id: "77000000-0000-4000-8000-000000000003", ...payload, version: 1 } : fixture.valuation;
  const chain = { select: () => chain, eq: (field: string,value: string) => { if(field === "collection") kind=value; return chain; }, is: () => chain, order: () => chain, limit: () => chain, insert: (value: Record<string, unknown>) => { fixture.inserted=value; payload=value; return chain; }, maybeSingle: async () => ({data:response(),error:null}), single: async () => ({data:response(),error:null}), then: (resolve: (value: unknown) => void) => resolve({data:response(),error:null}) };
  return chain;
} } }) }));
import { POST } from "@/app/api/admin/expedientes/[id]/formatos/route";
import { completeValorSample } from "./fixtures/valor";
beforeEach(()=>{ fixture.inserted={}; fixture.valuation={id:"77000000-0000-4000-8000-000000000099",expediente_id:"77000000-0000-4000-8000-000000000001",formato_id:"07",version:4,data:completeValorSample()}; });
async function create(formatoId: string, data: Record<string, unknown> = {}, valorReferencia?: {id:string;version:number}) {
  const response = await POST(new Request("http://localhost/api/admin/expedientes/77000000-0000-4000-8000-000000000001/formatos", { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost" }, body: JSON.stringify({formatoId,data,...(valorReferencia?{valorReferencia}:{})}) }), {params:Promise.resolve({id:"77000000-0000-4000-8000-000000000001"})});
  expect(response.status).toBe(201);
  return (await response.json()).documento.data;
}
it("prefills the interview with current identity, latest address and declared expectation without inventing ownership", async () => {
  const data = await create("02");
  expect(data).toMatchObject({ folio: "EXP-ENSAYO", entrevistado: "Persona actual", inmueble: "Domicilio corregido", precioDeseado: 8000000, monedaPrecio: "MXN", origenContacto: "referido", relacion: "representante" });
  expect(data.propietario).toBeUndefined();
  expect(data.origenDatos).toContain("77000000-0000-4000-8000-000000000002");
});
it("preserves deliberate draft values and does not treat presenting privacy notice as consent", async () => {
  const data = await create("01", { titular: "Identidad indicada por el usuario", consentimientoPatrimonial: "pendiente" });
  expect(data.titular).toBe("Identidad indicada por el usuario");
  expect(data.folio).toBe("EXP-ENSAYO");
  expect(data.consentimientoPatrimonial).toBe("pendiente");
  expect(data.acuseEstado).not.toBe("firmado_fuera");
});
it("transfers only an explicitly selected reviewed opinion to the net estimate without agreeing a sale price", async () => {
 const data=await create("08",{}, {id:String(fixture.valuation.id),version:4});
 expect(data.precioSugerido07).toBe(1703000);
 expect(data.precioAcordado).toBeUndefined();
 expect(data.referencia07).toContain("versión 4");
 expect(data.moneda).toBe("MXN");
});
