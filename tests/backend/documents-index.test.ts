import { afterEach, expect, test, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
const staff=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/backend/auth",()=>({requireStaff:staff}));
import { GET } from "@/app/api/admin/documentos/route";
afterEach(()=>vi.resetAllMocks());
function fixture(data:unknown[],count=1,error:unknown=null){
  const query={select:vi.fn(),is:vi.fn(),eq:vi.fn(),ilike:vi.fn(),order:vi.fn(),range:vi.fn(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data,count,error}))};
  for(const name of ["select","is","eq","ilike","order","range"] as const)query[name].mockReturnValue(query);
  staff.mockResolvedValue({client:{from:()=>query}}); return query;
}
test("document index returns bounded authorized metadata and never document bodies",async()=>{
  const query=fixture([{id:"d",expediente_id:"e",formato_id:"18",version:2,updated_at:"2026-10-13",data:{private:"secret body"},expediente:{folio:"EXP-1"}}]);
  const response=await GET(new Request("https://example.test/api/admin/documentos?limit=40"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({documentos:[{id:"d",expedienteId:"e",folio:"EXP-1",formatoId:"18",version:2,actualizadoEl:"2026-10-13"}],total:1,nextOffset:null});
  expect(query.range).toHaveBeenCalledWith(0,39);
  expect(query.is).toHaveBeenCalledWith("expediente.deleted_at",null);
  expect(query.select.mock.calls[0][0]).not.toMatch(/\bdata\b/);
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
