import { z } from "zod";
import { apiResponse,ApiError,assertSameOrigin,readJson,databaseError } from "@/lib/backend/http";
import { comercialDataSchema,validateComercialTransition } from "@/lib/comercial/schema";
import { checkCommercialReferences,requireCommercialAdmin } from "@/lib/comercial/server";
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){return apiResponse(async()=>{const {client}=await requireCommercialAdmin();const id=z.uuid().parse((await context.params).id);const version=new URL(request.url).searchParams.get("version");
 if(version!==null){const v=z.coerce.number().int().positive().parse(version);const r=await client.from("mnt_comercial_revisions").select("*").eq("book_id",id).eq("version",v).maybeSingle();if(r.error)databaseError(r.error);if(!r.data)throw new ApiError(404,"Revisión no encontrada");return {revision:r.data};}
 const r=await client.from("mnt_comercial_books").select("*").eq("id",id).maybeSingle();if(r.error)databaseError(r.error);if(!r.data)throw new ApiError(404,"Cartera no encontrada");
 const revisions=await client.from("mnt_comercial_revisions").select("version,created_by,created_at").eq("book_id",id).order("version",{ascending:false});if(revisions.error)databaseError(revisions.error);
 const emissions=await client.from("mnt_comercial_emissions").select("id,book_version,sha256,created_by,created_at").eq("book_id",id).order("created_at",{ascending:false});if(emissions.error)databaseError(emissions.error);return {cartera:r.data,revisiones:revisions.data??[],emisiones:emissions.data??[]};
 });}
export async function PUT(request:Request,context:Context){return apiResponse(async()=>{assertSameOrigin(request);const {client}=await requireCommercialAdmin();const id=z.uuid().parse((await context.params).id);const input=z.object({version:z.number().int().positive(),nombre:z.string().trim().min(1).max(160),data:comercialDataSchema}).strict().parse(await readJson(request,1048576));
 const old=await client.from("mnt_comercial_books").select("version,data").eq("id",id).maybeSingle();if(old.error)databaseError(old.error);if(!old.data)throw new ApiError(404,"Cartera no encontrada");if(old.data.version!==input.version)throw new ApiError(409,"La cartera cambió; conserva tus datos y recarga la versión guardada");
 const errors=validateComercialTransition(comercialDataSchema.parse(old.data.data),input.data);if(errors.length)throw new ApiError(409,errors.slice(0,3).join("; "));await checkCommercialReferences(client,input.data);
 const r=await client.from("mnt_comercial_books").update({nombre:input.nombre,data:input.data,version:input.version+1}).eq("id",id).eq("version",input.version).select("*").maybeSingle();if(r.error)databaseError(r.error);if(!r.data)throw new ApiError(409,"La cartera cambió mientras guardabas");return {cartera:r.data};
 });}
