import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, databaseError } from "@/lib/backend/http";
import { operationWorkflowSchema, publicationBlockers, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { operationalDate } from "@/lib/admin/operational-date";
export async function GET(_request: Request,context:{params:Promise<{slug:string}>}) {
 return apiResponse(async()=>{
  const {client}=await requireStaff();const slug=z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/).parse((await context.params).slug);
  const property=await client.from("fortius_inmuebles_records").select("data").eq("collection","propiedades").eq("id",slug).maybeSingle();
  if(property.error)databaseError(property.error);if(!property.data)throw new ApiError(404,"Inmueble no disponible");
  const d=property.data.data;
  if(d.publicada===true)return {permitida:true,publicacionAnterior:true,faltantes:[]};
  if(d.operacion!=="venta"||!["casa","departamento"].includes(d.tipo))return {permitida:true,publicacionAnterior:false,faltantes:[]};
  const {data,error}=await client.from("fortius_inmuebles_expedientes").select("id,etapa,flujo").eq("propiedad_slug",slug).is("deleted_at",null).eq("operacion","venta");
  if(error)databaseError(error);
  const candidates=(data??[]).filter(e=>e.flujo?.ruta==="captacion").map(e=>{
   const parsed=operationWorkflowSchema.safeParse(e.flujo);
   return {id:e.id,faltantes:publicationBlockers(parsed.success?parsed.data:null,e.etapa as WorkflowStage,operationalDate())};
  }).sort((a,b)=>a.faltantes.length-b.faltantes.length);
  const best=candidates[0];return {permitida:!!best&&!best.faltantes.length,publicacionAnterior:false,expedienteId:best?.id,faltantes:best?.faltantes??["Abrir una operación de captación vinculada y completar sus revisiones y autorización."]};
 });
}
