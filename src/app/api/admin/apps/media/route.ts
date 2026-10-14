import { createHash, randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { z } from "zod";
import { requireStaff, createServerClient } from "@/lib/backend/auth";
import { ApiError, apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { readAppUpload } from "@/lib/apps/private-upload";
import { inspectFormatoImage } from "@/lib/formatos/assets";
export async function POST(request:Request){return apiResponse(async()=>{
 assertSameOrigin(request);const {client,user}=await requireStaff();
 const input=z.object({name:z.string().min(1).max(160),mime:z.enum(['application/pdf','image/jpeg','image/png']),storagePath:z.string().regex(/^[a-f0-9-]+\/[a-f0-9-]+\.(pdf|jpg|png)$/),expedienteId:z.uuid().optional()}).strict().parse(await readJson(request));
 if(input.expedienteId){const e=await client.from('fortius_inmuebles_expedientes').select('id').eq('id',input.expedienteId).is('deleted_at',null).maybeSingle();if(e.error)databaseError(e.error);if(!e.data)throw new ApiError(403,'Expediente no disponible');}
 const server=createServerClient(undefined,true);
 const original=await readAppUpload(client,server,user.id,input.storagePath,input.expedienteId);const bytes=new Uint8Array(await original.arrayBuffer());
 if(input.mime==='application/pdf'){let doc;try{doc=await PDFDocument.load(bytes);}catch{throw new ApiError(400,'PDF inválido o cifrado');}if(doc.getPageCount()>100)throw new ApiError(400,'Máximo 100 páginas');}else await inspectFormatoImage(new File([bytes],input.name,{type:input.mime}));
 const prior=await client.from("fortius_inmuebles_app_files").select("id,name,mime,sha256,expediente_id").eq("path",input.storagePath).maybeSingle();if(prior.error)databaseError(prior.error);if(prior.data){if(prior.data.expediente_id!==(input.expedienteId??null))throw new ApiError(409,"El archivo pertenece a otro contexto");return {file:{...prior.data,url:`/api/admin/apps/media?id=${prior.data.id}`}};}
 const id=randomUUID();const row={id,owner_id:user.id,expediente_id:input.expedienteId??null,name:input.name,path:input.storagePath,mime:input.mime,size_bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};const inserted=await server.from('fortius_inmuebles_app_files').insert(row);if(inserted.error)databaseError(inserted.error);
 return{file:{id,name:input.name,mime:input.mime,sha256:row.sha256,url:`/api/admin/apps/media?id=${id}`}};
},201);}
export async function GET(request:Request){let response:Response|undefined;const failure=await apiResponse(async()=>{
 const {client}=await requireStaff();const id=new URL(request.url).searchParams.get('id');
 if(!id){const rows=await client.from('fortius_inmuebles_app_files').select('id,name,mime,sha256,created_at').order('created_at',{ascending:false}).limit(100);if(rows.error)databaseError(rows.error);return{files:rows.data};}
 z.uuid().parse(id);const row=await client.from('fortius_inmuebles_app_files').select('*').eq('id',id).maybeSingle();if(row.error)databaseError(row.error);if(!row.data)throw new ApiError(404,'Archivo no disponible');const signed=await createServerClient(undefined,true).storage.from('fortius-inmuebles-private').createSignedUrl(row.data.path,60,{download:row.data.name});if(signed.error)databaseError(signed.error);
 response=new Response(null,{status:303,headers:{Location:signed.data.signedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});return{};
 });return response??failure;}
