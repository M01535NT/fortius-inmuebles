import { createHash } from "node:crypto";
import { z } from "zod";
import { createServerClient } from "@/lib/backend/auth";
import { apiResponse,ApiError,databaseError } from "@/lib/backend/http";
import { requireCommercialAdmin } from "@/lib/comercial/server";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 try{const {client}=await requireCommercialAdmin();const id=z.uuid().parse((await context.params).id);const r=await client.from("mnt_comercial_emissions").select("path,sha256,book_version").eq("id",id).maybeSingle();if(r.error)databaseError(r.error);if(!r.data)throw new ApiError(404,"Emisión no encontrada");
 const file=await createServerClient(undefined,true).storage.from("mnt-comercial").download(r.data.path);if(file.error || !file.data)throw new ApiError(503,"Archivo no disponible");const bytes=Buffer.from(await file.data.arrayBuffer());if(bytes.length>20971520 || createHash("sha256").update(bytes).digest("hex")!==r.data.sha256)throw new ApiError(503,"El PDF no superó la comprobación de integridad");
 return new Response(bytes,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="control-comercial-v${r.data.book_version}.pdf"`,"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"}});
 }catch(error){return apiResponse(async()=>{throw error;});}
}
