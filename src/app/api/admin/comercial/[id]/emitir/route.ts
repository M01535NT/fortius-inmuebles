import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createServerClient } from "@/lib/backend/auth";
import { apiResponse,ApiError,assertSameOrigin,readJson,databaseError } from "@/lib/backend/http";
import { requireCommercialAdmin } from "@/lib/comercial/server";
import { comercialDataSchema } from "@/lib/comercial/schema";
import { createComercialPdf } from "@/lib/comercial/pdf";
export const runtime="nodejs";
export async function POST(request:Request,context:{params:Promise<{id:string}>}){return apiResponse(async()=>{
 assertSameOrigin(request);const {client,user}=await requireCommercialAdmin();const id=z.uuid().parse((await context.params).id);const {version}=z.object({version:z.number().int().positive()}).strict().parse(await readJson(request));
 const revision=await client.from("fortius_inmuebles_comercial_revisions").select("nombre,version,data").eq("book_id",id).eq("version",version).maybeSingle();if(revision.error)databaseError(revision.error);if(!revision.data)throw new ApiError(404,"Revisión guardada no encontrada");
 const data=comercialDataSchema.parse(revision.data.data);const emission=await createComercialPdf(revision.data.nombre,version,data);
 const emissionId=randomUUID(),path=`${id}/${emissionId}.pdf`,server=createServerClient(undefined,true),storage=server.storage.from("fortius-inmuebles-comercial");
 const uploaded=await storage.upload(path,Buffer.from(emission.bytes),{contentType:"application/pdf",upsert:false});if(uploaded.error)databaseError(uploaded.error);
 const saved=await server.from("fortius_inmuebles_comercial_emissions").insert({id:emissionId,book_id:id,book_version:version,snapshot:{nombre:revision.data.nombre,version,data,result:emission.result},sha256:emission.sha256,path,created_by:user.id}).select("id,book_version,sha256,created_at").single();
 if(saved.error){await storage.remove([path]);databaseError(saved.error);}return {emision:saved.data};
 },201);}
