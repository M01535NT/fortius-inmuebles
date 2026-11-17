import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError } from "@/lib/backend/http";
import { publicationReadiness } from "@/lib/backend/publication-gate";
import { sharedPublicationBlockers, sharedPublicationWarnings } from "@/lib/admin/shared-property";
import type { PropertyAlly } from "@/lib/propiedad-seguimiento";
import { propiedadVisible } from "@/lib/backend/repository";
export async function GET(_request: Request,context:{params:Promise<{slug:string}>}) {
 return apiResponse(async()=>{
  const {client}=await requireStaff();const slug=z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/).parse((await context.params).slug);
  // A1: un inmueble ajeno se lee por la función de la base, ya recortado.
  const d=await propiedadVisible(client,slug);if(!d)throw new ApiError(404,"Inmueble no disponible");
  if(d.publicada===true)return {permitida:true,publicacionAnterior:true,faltantes:[]};
  // Un compartido sin la inmobiliaria no se publica; sin la autorización escrita, sí, con aviso (FLX-03).
  if(d.origen==="compartido"){const aliado=d.aliado as PropertyAlly|undefined,frenos=sharedPublicationBlockers(aliado);return {permitida:!frenos.length,publicacionAnterior:false,compartido:true,faltantes:frenos.length?frenos:sharedPublicationWarnings(aliado)};}
  const best=await publicationReadiness(client,slug,d.operacion);
  // FLX-03 (RP-100): un inmueble propio se publica aunque falte algo; lo que falta se muestra y queda anotado.
  return {permitida:true,publicacionAnterior:false,expedienteId:best.expedienteId,faltantes:best.faltantes};
 });
}
