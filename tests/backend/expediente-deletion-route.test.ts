
import {beforeEach,expect,it,vi} from "vitest";
import {createClient} from "@supabase/supabase-js";
import {ApiError} from "@/lib/backend/http";
const {requireStaff}=vi.hoisted(()=>({requireStaff:vi.fn()}));
vi.mock("@/lib/backend/auth",()=>({requireStaff}));
import {DELETE,PATCH} from "@/app/api/admin/expedientes/[id]/route";
import {GET} from "@/app/api/admin/expedientes/route";
const id="51000000-0000-4000-8000-000000000010";
const context={params:Promise.resolve({id})};
function request(method="DELETE",version:unknown=1,origin="https://panel.test"){
 return new Request("https://panel.test/api/admin/expedientes/"+id,{method,headers:{origin,"content-type":"application/json"},body:JSON.stringify({version})});
}
beforeEach(()=>{requireStaff.mockReset();});
it("requiere sesión para eliminar",async()=>{requireStaff.mockRejectedValue(new ApiError(401,"Inicia sesión"));expect((await DELETE(request(),context)).status).toBe(401);});
it("rechaza solicitudes de otro origen",async()=>{expect((await DELETE(request("DELETE",1,"https://otro.test"),context)).status).toBe(403);expect(requireStaff).not.toHaveBeenCalled();});
it("rechaza versión inválida antes de escribir",async()=>{requireStaff.mockResolvedValue({client:{}});expect((await DELETE(request("DELETE",0),context)).status).toBe(400);});
function clientFor(respond:(url:URL,body:Record<string,unknown>)=>Response){
 const client=createClient("https://db.test","fake-anon-key",{auth:{persistSession:false},global:{fetch:async(url,init)=>respond(new URL(String(url)),JSON.parse(String(init?.body??"{}")))}});
 requireStaff.mockResolvedValue({client,user:{id:"staff"}});
}
it("elimina sólo la versión activa indicada y devuelve el nuevo estado",async()=>{
 clientFor((url,body)=>{expect(url.pathname).toBe("/rest/v1/fortius_inmuebles_expedientes");expect(url.searchParams.get("id")).toBe("eq."+id);expect(url.searchParams.get("version")).toBe("eq.1");expect(url.searchParams.get("deleted_at")).toBe("is.null");expect(body.version).toBe(2);expect(body.deleted_at).toEqual(expect.any(String));return Response.json([{id,version:2,deleted_at:body.deleted_at}]);});
 const response=await DELETE(request(),context);expect(response.status).toBe(200);expect((await response.json()).expediente.version).toBe(2);
});
it("restaura sólo una versión eliminada",async()=>{
 clientFor((url,body)=>{expect(url.searchParams.get("deleted_at")).toBe("not.is.null");expect(body).toEqual({deleted_at:null,version:3});return Response.json([{id,version:3,deleted_at:null}]);});
 const response=await PATCH(request("PATCH",2),context);expect(response.status).toBe(200);expect((await response.json()).expediente.deleted_at).toBeNull();
});
it("no informa éxito si RLS oculta el expediente o la versión cambió",async()=>{clientFor(()=>Response.json([]));expect((await DELETE(request(),context)).status).toBe(409);});
it("separa expedientes activos y eliminados en la consulta",async()=>{
 const filters:string[]=[];clientFor(url=>{filters.push(url.searchParams.get("deleted_at")!);return Response.json([]);});
 expect((await GET(new Request("https://panel.test/api/admin/expedientes"))).status).toBe(200);
 expect((await GET(new Request("https://panel.test/api/admin/expedientes?estado=eliminados"))).status).toBe(200);
 expect(filters).toEqual(["is.null","not.is.null"]);
});
