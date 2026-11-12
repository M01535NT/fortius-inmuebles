import { beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ inserted: {} as Record<string, unknown>, valuation: {} as Record<string, unknown>, flujo: { ruta: "captacion" } as Record<string, unknown>, archivo: null as Record<string, unknown> | null }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff: async () => ({ client: { from(table: string) {
  let kind = "", payload: Record<string, unknown> | undefined;
  const exp = { id: "77000000-0000-4000-8000-000000000001", cliente_id: "person", asesor_id: "adviser", propiedad_slug: "property", folio: "EXP-ENSAYO", operacion: "venta", unidad: "Domicilio corregido", flujo: fixture.flujo };
  const interview = { id: "77000000-0000-4000-8000-000000000002", version: 3, intencion: "vender", estado: "completada", respuestas: { fecha: "2026-10-14", relacion: "representante", objetivo: "Vender en seis meses", zona: "Tijuana", tipoInmueble: "casa", presupuestoEstado: "conocido", importe: "8000000", moneda: "MXN", privacidad: "presentado", siguienteAccion: "Aclarar facultades", siguienteFecha: "2030-12-31", origenContacto: "referido" } };
  const records: Record<string, unknown> = { clientes: { nombre: "Persona actual", telefono: "6641234567", email: "persona@example.invalid" }, asesores: { nombre: "Asesor responsable" }, propiedades: { direccionAproximada: "Domicilio anterior", precio: { modalidad: "publico", monto: 8500000, moneda: "MXN" } } };
  const response = () => table === "fortius_inmuebles_expedientes" ? exp : table === "fortius_inmuebles_expediente_archivos" ? fixture.archivo : table === "fortius_inmuebles_interviews" ? [interview] : table === "fortius_inmuebles_records" ? { data: records[kind] } : payload ? { id: "77000000-0000-4000-8000-000000000003", ...payload, version: 1 } : fixture.valuation;
  const chain = { select: () => chain, eq: (field: string,value: string) => { if(field === "collection") kind=value; return chain; }, is: () => chain, order: () => chain, limit: () => chain, insert: (value: Record<string, unknown>) => { fixture.inserted=value; payload=value; return chain; }, maybeSingle: async () => ({data:response(),error:null}), single: async () => ({data:response(),error:null}), then: (resolve: (value: unknown) => void) => resolve({data:response(),error:null}) };
  return chain;
} } }) }));
import { POST } from "@/app/api/admin/expedientes/[id]/formatos/route";
import { completeValorSample } from "./fixtures/valor";
beforeEach(()=>{ fixture.inserted={}; fixture.flujo={ruta:"captacion"}; fixture.archivo=null; fixture.valuation={id:"77000000-0000-4000-8000-000000000099",expediente_id:"77000000-0000-4000-8000-000000000001",formato_id:"07",version:4,data:completeValorSample()}; });
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
/** COR-17: sin 07, el 08 toma el valor del avalúo vigente del propietario, con su fuente. */
const appraisalFile="77000000-0000-4000-8000-0000000000aa";
const appraisalFlow=(vigenteHasta:string)=>({version:1,ruta:"captacion",estado:"activa",motivo:"",requisitos:{valor:{estado:"revisado",soporte:"Avalúo revisado",evidencia:{tipo:"cliente",referencia:appraisalFile,fecha:"2026-11-01",responsable:"Asesor responsable",resultado:"Valor del avalúo"}}},avaluo:{archivo:appraisalFile,perito:"Perito de ensayo",fecha:"2026-11-01",valor:2500000,vigenteHasta}});
const post=(body:Record<string,unknown>)=>POST(new Request("http://localhost/api/admin/expedientes/77000000-0000-4000-8000-000000000001/formatos",{method:"POST",headers:{"Content-Type":"application/json",origin:"http://localhost"},body:JSON.stringify(body)}),{params:Promise.resolve({id:"77000000-0000-4000-8000-000000000001"})});
it("seeds the net estimate from the owner's current appraisal and refuses an expired one (COR-17)", async () => {
 fixture.flujo=appraisalFlow("2030-12-31"); fixture.archivo={titulo:"Avalúo ficticio de ensayo"};
 const response=await post({formatoId:"08",data:{},avaluo:true});
 expect(response.status).toBe(201);
 const data=(await response.json()).documento.data;
 expect(data).toMatchObject({precioSugerido07:2500000,fecha07:"2026-11-01",precioBase:"sugerido07",moneda:"MXN"});
 expect(data.referencia07).toBe("Avalúo del propietario · Perito de ensayo · Avalúo ficticio de ensayo");
 expect(data.precioAcordado).toBeUndefined();
 fixture.flujo=appraisalFlow("2025-01-31");
 expect((await post({formatoId:"08",data:{},avaluo:true})).status).toBe(409);
 fixture.flujo=appraisalFlow("2030-12-31"); fixture.archivo=null;
 expect((await post({formatoId:"08",data:{},avaluo:true})).status).toBe(409);
 expect((await post({formatoId:"10",data:{},avaluo:true})).status).toBe(400);
});
it("transfers only an explicitly selected reviewed opinion to the net estimate without agreeing a sale price", async () => {
 const data=await create("08",{}, {id:String(fixture.valuation.id),version:4});
 expect(data.precioSugerido07).toBe(1703000);
 expect(data.precioAcordado).toBeUndefined();
 expect(data.referencia07).toContain("versión 4");
 expect(data.moneda).toBe("MXN");
});
