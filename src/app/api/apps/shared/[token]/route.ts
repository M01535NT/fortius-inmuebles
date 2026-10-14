import { createHash } from "node:crypto";
import { createServerClient } from "@/lib/backend/auth";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow"};
 const missing=()=>new Response("Enlace no disponible o vencido",{status:404,headers});
 const {token}=await params;if(!/^[\w-]{43}$/.test(token))return missing();
 try{
 const client=createServerClient(undefined,true);
 const share=await client.from("fortius_inmuebles_app_shares").select("file_id,owner_id").eq("token_hash",createHash("sha256").update(token).digest("hex")).eq("revoked",false).gt("expires_at",new Date().toISOString()).maybeSingle();if(!share.data||share.error)return missing();
 const staff=await client.from("fortius_inmuebles_staff").select("role,active").eq("user_id",share.data.owner_id).maybeSingle();if(!staff.data?.active||staff.error)return missing();
 const file=await client.from("fortius_inmuebles_app_files").select("*").eq("id",share.data.file_id).maybeSingle();if(!file.data||file.error)return missing();
 if(file.data.expediente_id){
 const dossier=await client.from("fortius_inmuebles_expedientes").select("id,asesor_id,cliente_id").eq("id",file.data.expediente_id).is("deleted_at",null).maybeSingle();if(!dossier.data||dossier.error)return missing();
 if(staff.data.role!=="admin"){
 const account=await client.from("fortius_inmuebles_adviser_accounts").select("asesor_id").eq("user_id",share.data.owner_id).maybeSingle();if(!account.data?.asesor_id||account.error||account.data.asesor_id!==dossier.data.asesor_id)return missing();
 const customer=await client.from("fortius_inmuebles_records").select("data").eq("collection","clientes").eq("id",dossier.data.cliente_id).maybeSingle();if(customer.error||customer.data?.data?.asesorId!==account.data.asesor_id)return missing();
 }}else if(file.data.owner_id!==share.data.owner_id&&staff.data.role!=="admin")return missing();
 const signed=await client.storage.from("fortius-inmuebles-private").createSignedUrl(file.data.path,60,{download:file.data.name});if(signed.error||!signed.data?.signedUrl)return missing();
 return new Response(null,{status:303,headers:{...headers,Location:signed.data.signedUrl}});
 }catch{return missing();}
}
