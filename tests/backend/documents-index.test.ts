import { afterEach, expect, test, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
const staff=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/backend/auth",()=>({requireStaff:staff}));
import { GET } from "@/app/api/admin/documentos/route";
afterEach(()=>vi.resetAllMocks());
function fixture(data:unknown[],count=1,error:unknown=null,emissions:unknown[]=[]){
  const query={select:vi.fn(),is:vi.fn(),eq:vi.fn(),ilike:vi.fn(),order:vi.fn(),range:vi.fn(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data,count,error}))};
  for(const name of ["select","is","eq","ilike","order","range"] as const)query[name].mockReturnValue(query);
  const emitted={select:vi.fn(),in:vi.fn(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data:emissions,error:null}))};
  for(const name of ["select","in"] as const)emitted[name].mockReturnValue(emitted);
  staff.mockResolvedValue({client:{from:(table:string)=>table==="fortius_inmuebles_formato_emissions"?emitted:query}}); return query;
}
test("document index returns bounded authorized metadata and never document bodies",async()=>{
  const query=fixture([{id:"d",expediente_id:"e",formato_id:"18",version:2,updated_at:"2026-10-13",data:{private:"secret body"},expediente:{folio:"EXP-1"}}]);
  const response=await GET(new Request("https://example.test/api/admin/documentos?limit=40"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({documentos:[{id:"d",expedienteId:"e",folio:"EXP-1",formatoId:"18",version:2,actualizadoEl:"2026-10-13",emitido:false}],total:1,nextOffset:null});
  expect(query.range).toHaveBeenCalledWith(0,39);
  expect(query.is).toHaveBeenCalledWith("expediente.deleted_at",null);
  expect(query.select.mock.calls[0][0]).not.toMatch(/\bdata\b/);
});
test("marks a document as issued only when its current version has a PDF (COR-03)",async()=>{
  fixture([
    {id:"a",expediente_id:"e",formato_id:"02",version:3,updated_at:"2026-10-13",expediente:{folio:"EXP-1"}},
    {id:"b",expediente_id:"e",formato_id:"04B",version:2,updated_at:"2026-10-12",expediente:{folio:"EXP-1"}},
  ],2,null,[{draft_id:"a",draft_version:3},{draft_id:"b",draft_version:1}]);
  const {documentos}=await(await GET(new Request("https://example.test/api/admin/documentos"))).json();
  expect(documentos.map((d:{id:string;emitido:boolean})=>[d.id,d.emitido])).toEqual([["a",true],["b",false]]);
});
test("cursor advances only by rows actually returned, without skipping remaining documents",async()=>{
  fixture([{id:"d",expediente_id:"e",formato_id:"18",version:1,updated_at:"2026-10-13",expediente:{folio:"EXP-1"}}],81);
  const response=await GET(new Request("https://example.test/api/admin/documentos?offset=40"));
  expect((await response.json()).nextOffset).toBe(41);
});
test("supports a nested relation array and detects a page invalidated by deletions",async()=>{
  fixture([{id:"d",expediente_id:"e",formato_id:"18",version:1,updated_at:"2026-10-13",expediente:[{folio:"EXP-1"}]}]);
  expect((await(await GET(new Request("https://example.test/api/admin/documentos"))).json()).documentos[0].folio).toBe("EXP-1");
  fixture([],21);
  expect((await GET(new Request("https://example.test/api/admin/documentos?offset=40"))).status).toBe(409);
});
test("index requires staff and rejects invalid pagination rather than broadening it",async()=>{
  staff.mockRejectedValue(new ApiError(401,"Sesión requerida"));
  expect((await GET(new Request("https://example.test/api/admin/documentos"))).status).toBe(401);
  const query=fixture([]);
  expect((await GET(new Request("https://example.test/api/admin/documentos?limit=9999"))).status).toBe(400);
  expect(query.range).not.toHaveBeenCalled();
});
test("folio and format filters are explicit, escaped and applied before pagination",async()=>{
  const query=fixture([{id:"d",expediente_id:"e",formato_id:"18",version:1,updated_at:"2026-10-13",expediente:{folio:"EXP%_"}}],41);
  const response=await GET(new Request("https://example.test/api/admin/documentos?folio=EXP%25_&formato=18&offset=40"));
  expect(response.status).toBe(200);
  expect(query.ilike).toHaveBeenCalledWith("expediente.folio","%EXP\\%\\_%");
  expect(query.eq).toHaveBeenCalledWith("formato_id","18");
  expect(query.range).toHaveBeenCalledWith(40,79);
});
