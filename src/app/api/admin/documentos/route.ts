import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, databaseError } from "@/lib/backend/http";
import { FORMATOS } from "@/lib/formatos/catalog";

export async function GET(request: Request) {
  return apiResponse(async()=>{
    const {client}=await requireStaff();
    const params=new URL(request.url).searchParams;
    const limit=z.coerce.number().int().min(1).max(100).parse(params.get("limit")??40);
    const offset=z.coerce.number().int().min(0).max(100000).parse(params.get("offset")??0);
    const folio=z.string().trim().max(80).parse(params.get("folio")??"");
    const formato=z.string().max(20).refine(value=>!value||FORMATOS.some(item=>item.id===value)).parse(params.get("formato")??"");
    // User-scoped client and inner join preserve the existing dossier/document RLS.
    // This endpoint deliberately omits document bodies, snapshots and storage paths.
    let query=client.from("fortius_inmuebles_formato_drafts")
      .select("id,expediente_id,formato_id,version,updated_at,expediente:fortius_inmuebles_expedientes!inner(folio,deleted_at)",{count:"exact"})
      .is("expediente.deleted_at",null);
    if(folio)query=query.ilike("expediente.folio",`%${folio.replace(/[\\%_]/g,"\\$&")}%`);
    if(formato)query=query.eq("formato_id",formato);
    const {data,error,count}=await query.order("updated_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+limit-1);
    if(error)databaseError(error);
    const rows=data??[];
    const total=count??offset+rows.length;
    if(!rows.length&&offset>0)throw new ApiError(409,"La lista cambió; vuelve al inicio de los documentos");
    // «emitido»: la versión actual del borrador ya tiene su PDF (misma regla que los candados de arranque, operation-gates.ts).
    let emitted=new Set<string>();
    if(rows.length){
      const emissions=await client.from("fortius_inmuebles_formato_emissions").select("draft_id,draft_version").in("draft_id",rows.map(row=>row.id));
      if(emissions.error)databaseError(emissions.error);
      emitted=new Set((emissions.data??[]).map(e=>`${e.draft_id}:${e.draft_version}`));
    }
    return {
      documentos:rows.map(row=>{
        const relation=row.expediente as unknown as {folio:string}|{folio:string}[];
        const parent=Array.isArray(relation)?relation[0]:relation;
        if(typeof parent?.folio!=="string")throw new ApiError(503,"No se pudo consultar el contexto de los documentos");
        return {id:row.id,expedienteId:row.expediente_id,folio:parent.folio,formatoId:row.formato_id,version:row.version,actualizadoEl:row.updated_at,emitido:emitted.has(`${row.id}:${row.version}`)};
      }),
      total,nextOffset:offset+rows.length<total ? offset+rows.length : null,
    };
  });
}
