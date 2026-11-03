import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, databaseError } from "@/lib/backend/http";
import { publicationReadiness } from "@/lib/backend/publication-gate";
export async function GET(_request: Request,context:{params:Promise<{slug:string}>}) {
 return apiResponse(async()=>{
  const {client}=await requireStaff();const slug=z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/).parse((await context.params).slug);
  const property=await client.from("fortius_inmuebles_records").select("data").eq("collection","propiedades").eq("id",slug).maybeSingle();
  if(property.error)databaseError(property.error);if(!property.data)throw new ApiError(404,"Inmueble no disponible");
  const d=property.data.data;
  if(d.publicada===true)return {permitida:true,publicacionAnterior:true,faltantes:[]};
  const best=await publicationReadiness(client,slug,d.operacion);
  return {permitida:!best.faltantes.length,publicacionAnterior:false,expedienteId:best.expedienteId,faltantes:best.faltantes};
 });
}
