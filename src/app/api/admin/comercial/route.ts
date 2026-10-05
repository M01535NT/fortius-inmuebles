import { z } from "zod";
import { apiResponse,assertSameOrigin,readJson,databaseError } from "@/lib/backend/http";
import { comercialDataSchema } from "@/lib/comercial/schema";
import { checkCommercialReferences,requireCommercialAdmin } from "@/lib/comercial/server";
export async function GET(){return apiResponse(async()=>{const {client}=await requireCommercialAdmin();const r=await client.from("mnt_comercial_books").select("id,nombre,version,created_at,updated_at").order("updated_at",{ascending:false});if(r.error)databaseError(r.error);return {carteras:r.data??[]};});}
export async function POST(request:Request){return apiResponse(async()=>{assertSameOrigin(request);const {client,user}=await requireCommercialAdmin();const input=z.object({nombre:z.string().trim().min(1).max(160),data:comercialDataSchema}).strict().parse(await readJson(request,1048576));await checkCommercialReferences(client,input.data);const r=await client.from("mnt_comercial_books").insert({nombre:input.nombre,data:input.data,created_by:user.id}).select("*").single();if(r.error)databaseError(r.error);return {cartera:r.data};},201);}
