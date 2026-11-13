import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError } from "@/lib/backend/http";
import { publicationReadiness } from "@/lib/backend/publication-gate";
import { sharedPublicationBlockers } from "@/lib/admin/shared-property";
import type { PropertyAlly } from "@/lib/propiedad-seguimiento";
import { propiedadVisible } from "@/lib/backend/repository";
export async function GET(_request: Request,context:{params:Promise<{slug:string}>}) {
 return apiResponse(async()=>{
  const {client}=await requireStaff();const slug=z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/).parse((await context.params).slug);
  // A1: un inmueble ajeno se lee por la función de la base, ya recortado.
  const d=await propiedadVisible(client,slug);if(!d)throw new ApiError(404,"Inmueble no disponible");
  if(d.publicada===true)return {permitida:true,publicacionAnterior:true,faltantes:[]};
  if(d.origen==="compartido"){const faltantes=sharedPublicationBlockers(d.aliado as PropertyAlly|undefined);return {permitida:!faltantes.length,publicacionAnterior:false,compartido:true,faltantes};}
  const best=await publicationReadiness(client,slug,d.operacion);
  return {permitida:!best.faltantes.length,publicacionAnterior:false,expedienteId:best.expedienteId,faltantes:best.faltantes};
 });
}
