import { createHash, randomUUID } from 'node:crypto';
import { requireStaff, createServerClient } from '@/lib/backend/auth';
import { ApiError, apiResponse, databaseError } from '@/lib/backend/http';
import { registerUpload } from '@/lib/backend/files';
import { findRun } from '@/lib/apps/repository';
import { resultToCsv } from '@/lib/apps/contracts';
import { buildAppPdf } from '@/lib/apps/pdf';
import { loadPdfImage } from '@/lib/backend/pdf-images';
export const maxDuration=300;
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 let response:Response|undefined;
 const failure=await apiResponse(async()=>{
  const {client,user}=await requireStaff(),run=await findRun(client,(await params).id);
  if(!run.result)throw new ApiError(400,'Genera y guarda un resultado primero');
  const format=new URL(request.url).searchParams.get('format')??'pdf';
  if(!['pdf','csv'].includes(format))throw new ApiError(400,'Formato no disponible');
  const csv=format==='csv',photos:Uint8Array[]=[];
  if(!csv&&run.slug==='ficha-comercial'&&Array.isArray(run.input.photoUrls)&&run.input.photoUrls.length){
   const propertyId=run.context.inmuebleId??run.input.propertySlug;
   if(typeof propertyId!=='string'||run.input.photoUrls.length>20)throw new ApiError(400,'Selecciona hasta 20 fotografías del inmueble');
   const property=await client.from('fortius_inmuebles_records').select('data').eq('collection','propiedades').eq('id',propertyId).maybeSingle();if(property.error)databaseError(property.error);
   const data=property.data?.data;
   if(!data?.publicada||data.demo)throw new ApiError(400,'Las fotografías requieren un inmueble publicado');
   const allowed=new Set<string>((Array.isArray(data.galeria)?data.galeria.map((p:{src?:string})=>p.src):[]).filter((v:unknown):v is string=>typeof v==='string'));
   for(const url of run.input.photoUrls){if(typeof url!=='string'||!allowed.has(url))throw new ApiError(400,'Una fotografía ya no pertenece a la galería publicada');const bytes=await loadPdfImage(url);if(!bytes)throw new ApiError(503,'No se pudo recuperar una fotografía. Reintenta la exportación.');photos.push(bytes);}
  }
  const body=csv?resultToCsv(run.result):new Uint8Array(await buildAppPdf(run.result,photos));
  // Large PDFs go through private Storage to respect the hosting response limit.
  if(body instanceof Uint8Array&&body.byteLength>20*1024*1024)throw new ApiError(413,"El PDF supera 20 MB. Reduce las fotografías seleccionadas.");
  if(body instanceof Uint8Array&&body.byteLength>4_000_000){
   const current=await requireStaff();if(current.user.id!==user.id)throw new ApiError(403,'La sesión cambió');await findRun(current.client,run.id);
   const service=createServerClient(undefined,true),path=`${user.id}/${randomUUID()}.pdf`,name=`fortius-${run.slug}.pdf`;
   const uploaded=await service.storage.from('fortius-inmuebles-private').upload(path,body,{contentType:'application/pdf',upsert:false});if(uploaded.error)databaseError(uploaded.error);
   await registerUpload(service,user.id,'fortius-inmuebles-private',path);
   const claim=await current.client.rpc('fortius_apps_claim_upload',{p_path:path,p_expediente:run.context.expedienteId??null});if(claim.error)databaseError(claim.error);
   const saved=await service.from('fortius_inmuebles_app_files').insert({owner_id:user.id,expediente_id:run.context.expedienteId??null,name,path,mime:'application/pdf',size_bytes:body.byteLength,sha256:createHash('sha256').update(body).digest('hex')});if(saved.error)databaseError(saved.error);
   const signed=await service.storage.from('fortius-inmuebles-private').createSignedUrl(path,60,{download:name});if(signed.error)databaseError(signed.error);
   response=new Response(null,{status:303,headers:{Location:signed.data.signedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});return{};
  }
  response=new Response(body,{headers:{'Content-Type':csv?'text/csv; charset=utf-8':'application/pdf','Content-Disposition':`attachment; filename="fortius-${run.slug}.${format}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});return{};
 });return response??failure;
}
