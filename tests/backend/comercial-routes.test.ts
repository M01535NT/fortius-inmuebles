import { beforeEach,expect,it,vi } from "vitest";
const {requireStaff,privileged,pdf}=vi.hoisted(()=>({requireStaff:vi.fn(),privileged:vi.fn(),pdf:vi.fn()}));
vi.mock("@/lib/backend/auth",()=>({requireStaff,createServerClient:privileged}));
vi.mock("@/lib/comercial/pdf",()=>({createComercialPdf:pdf}));
import { GET,POST } from "@/app/api/admin/comercial/route";
import { PUT } from "@/app/api/admin/comercial/[id]/route";
import { POST as emit } from "@/app/api/admin/comercial/[id]/emitir/route";
import { GET as download } from "@/app/api/admin/comercial/emisiones/[id]/route";
import { emptyComercialBook,newOpportunity } from "@/lib/comercial/types";
import { createHash } from "node:crypto";
const id="61000000-0000-4000-8000-000000000003",context={params:Promise.resolve({id})};
const request=(body:object)=>new Request(`https://panel.test/api/admin/comercial/${id}`,{method:"POST",headers:{origin:"https://panel.test","content-type":"application/json"},body:JSON.stringify(body)});
function clientFor(results:unknown[]) { const chain:Record<string,unknown>={};for(const k of ["select","eq","in","order","insert","update"])chain[k]=vi.fn(()=>chain);chain.maybeSingle=vi.fn(async()=>results.shift());chain.single=vi.fn(async()=>results.shift());chain.then=(resolve:(v:unknown)=>unknown)=>Promise.resolve(results.shift()).then(resolve);return {from:vi.fn(()=>chain)}; }
beforeEach(()=>{vi.clearAllMocks();requireStaff.mockResolvedValue({user:{id,role:"editor"},client:{from:vi.fn()}});});
it("rechaza editor antes de consultar cualquier cartera o emisión",async()=>{expect((await GET()).status).toBe(403);expect((await POST(request({nombre:"Nueva",data:emptyComercialBook()}))).status).toBe(403);expect((await PUT(request({version:1,nombre:"Nueva",data:emptyComercialBook()}),context)).status).toBe(403);expect((await emit(request({version:1}),context)).status).toBe(403);expect((await download(request({}),context)).status).toBe(403);expect((await requireStaff.mock.results[0].value).client.from).not.toHaveBeenCalled();});
it("rechaza origen ajeno y conserva conflicto de versión",async()=>{
 expect((await POST(new Request("https://panel.test/api/admin/comercial",{method:"POST",headers:{origin:"https://otro.test"}}))).status).toBe(403);
 requireStaff.mockResolvedValue({user:{id,role:"admin"},client:clientFor([{data:{version:2},error:null}])});expect((await PUT(request({version:1,nombre:"Nueva",data:emptyComercialBook()}),context)).status).toBe(409);
});
it("rechaza expediente inexistente antes de guardar",async()=>{const b=emptyComercialBook();b.oportunidades=[newOpportunity("I1","Inmueble")];b.oportunidades[0].gestion.expediente=id;requireStaff.mockResolvedValue({user:{id,role:"admin"},client:clientFor([{data:[],error:null}])});expect((await POST(request({nombre:"Nueva",data:b}))).status).toBe(400);});
it("emite exactamente revisión pedida, aunque el libro ya cambió; revierte archivo si falla el archivo SQL",async()=>{
 const data=emptyComercialBook(); const client=clientFor([{data:{nombre:"Original",version:1,data},error:null}]); requireStaff.mockResolvedValue({user:{id,role:"admin"},client});const bytes=Buffer.from("%PDF prueba");pdf.mockResolvedValue({bytes,sha256:createHash("sha256").update(bytes).digest("hex"),result:{corte:"2026-10-04"}});
 const storage={upload:vi.fn(async()=>({error:null})),remove:vi.fn(async()=>({error:null}))};const server=clientFor([{data:null,error:{code:"23503"}}]);privileged.mockReturnValue({...server,storage:{from:()=>storage}});
 expect((await emit(request({version:1}),context)).status).toBe(409);expect(pdf).toHaveBeenCalledWith("Original",1,data);expect(storage.remove).toHaveBeenCalledTimes(1);
});
it("descarga comprueba hash antes de devolver bytes",async()=>{
 const client=clientFor([{data:{path:`${id}/${id}.pdf`,sha256:"a".repeat(64),book_version:1},error:null}]);requireStaff.mockResolvedValue({user:{id,role:"admin"},client});privileged.mockReturnValue({storage:{from:()=>({download:async()=>({data:new Blob(["alterado"]),error:null})})}});expect((await download(request({}),context)).status).toBe(503);
});
