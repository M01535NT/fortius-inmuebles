import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireStaff,createServerClient } from '@/lib/backend/auth';
import { ApiError,databaseError } from '@/lib/backend/http';
import type { AppContext,AppInput,AppResult } from '../types';
import { readAppUpload } from '../private-upload';
import { fileInput,integrationContext,integrationSlug,maximumCostCents,questionInput,readIntegrationConfig,routeInput,signatureInput,type IntegrationSlug,type SourcePage } from './core';
import { decodeDocument,downloadProviderPdf,performOcr,performQuestion,performRoute,providerJson,sha256 } from './providers';

export const JOBS='fortius_inmuebles_integration_jobs',PAGES='fortius_inmuebles_integration_pages',ARTIFACTS='fortius_inmuebles_integration_artifacts';
export type IntegrationJob={id:string;owner_id:string;slug:IntegrationSlug;expediente_id:string|null;context:AppContext;state:string;result:AppResult|null;provider_id:number|null;provider_kind:'template'|'submission'|null;provider_status:string|null;template_roles:string[]|null;created_at:string;reserved_cents:number;error_message:string|null};
export function publicJob(job:IntegrationJob){return {id:job.id,slug:job.slug,state:job.state,result:job.provider_kind==='submission'?signatureResult(job):job.result,providerId:job.provider_id,providerKind:job.provider_kind,signatureStatus:job.provider_status,createdAt:job.created_at,reservedMxn:job.reserved_cents/100,error:job.error_message};}
export async function checkContext(client:SupabaseClient,context:AppContext){
 if(context.expedienteId){const {data,error}=await client.from('fortius_inmuebles_expedientes').select('id,cliente_id,propiedad_slug').eq('id',context.expedienteId).is('deleted_at',null).maybeSingle();if(error)databaseError(error);if(!data)throw new ApiError(403,'Expediente no autorizado');if((context.clienteId&&data.cliente_id!==context.clienteId)||(context.inmuebleId&&data.propiedad_slug!==context.inmuebleId))throw new ApiError(400,'El contexto no corresponde al expediente');}
 for(const [collection,id] of [['clientes',context.clienteId],['propiedades',context.inmuebleId]])if(id){const {data,error}=await client.from('fortius_inmuebles_records').select('id').eq('collection',collection).eq('id',id).maybeSingle();if(error)databaseError(error);if(!data)throw new ApiError(403,'Registro de contexto no autorizado');}
}
export async function authorizedJob(client:SupabaseClient,id:string){
 z.uuid().parse(id);const {data,error}=await client.from(JOBS).select('*').eq('id',id).maybeSingle();if(error)databaseError(error);if(!data)throw new ApiError(404,'Trabajo no disponible');const job=data as IntegrationJob;await checkContext(client,job.context);return job;
}
async function updateJob(service:SupabaseClient,id:string,value:Record<string,unknown>){const result=await service.from(JOBS).update({...value,updated_at:new Date().toISOString()}).eq('id',id);if(result.error)databaseError(result.error);}
export async function preserveArtifact(service:SupabaseClient,jobId:string,kind:'original'|'signed'|'audit',name:string,mimeType:string,bytes:Uint8Array){
 const hash=sha256(bytes);const existing=await service.from(ARTIFACTS).select('id').eq('job_id',jobId).eq('kind',kind).eq('sha256',hash).maybeSingle();if(existing.error)databaseError(existing.error);if(existing.data)return existing.data.id as string;
 const path=`${jobId}/${kind}/${hash}`;const upload=await service.storage.from('fortius-app-integrations').upload(path,bytes,{contentType:mimeType,upsert:false});
 if(upload.error&&String(upload.error.statusCode)!=='409')databaseError(upload.error);
 const saved=await service.from(ARTIFACTS).upsert({job_id:jobId,kind,name,storage_path:path,sha256:hash,size_bytes:bytes.length,mime_type:mimeType},{onConflict:'job_id,kind,sha256',ignoreDuplicates:true}).select('id').maybeSingle();if(saved.error)databaseError(saved.error);return saved.data?.id as string|undefined;
}
function signatureResult(job:IntegrationJob):AppResult{return {title:'Solicitud de firma',summary:[{label:'Trabajo',value:job.id},{label:'Solicitud',value:String(job.provider_id??'Pendiente de conciliación')},{label:'Estado del proveedor',value:job.provider_status??'Sin confirmación'}],warnings:[...new Set(['La firma no cambia automáticamente la etapa del expediente. Descarga el documento firmado y su evidencia desde este trabajo.',...(job.result?.warnings??[])])]};}
export async function reconcileSignature(service:SupabaseClient,job:IntegrationJob){
 if(job.provider_kind!=='submission'||!job.provider_id)throw new ApiError(409,'La solicitud no tiene identificador confirmado; requiere conciliación administrativa');
 const raw=await providerJson(`https://api.docuseal.com/submissions/${job.provider_id}`,{headers:{'X-Auth-Token':process.env.DOCUSEAL_API_KEY!}});
 const snapshot=z.object({id:z.number().int(),status:z.string(),updated_at:z.iso.datetime({offset:true}),documents:z.array(z.object({name:z.string(),url:z.url()})).default([]),audit_log_url:z.url().nullable().optional()}).parse(raw);
 if(snapshot.id!==job.provider_id)throw new ApiError(502,'Identificador de firma incongruente');
 if(snapshot.status==='completed'){
  if(!snapshot.documents.length||!snapshot.audit_log_url)throw new ApiError(502,'El proveedor aún no entrega el documento firmado y la evidencia completa');
  for(const d of snapshot.documents)await preserveArtifact(service,job.id,'signed',d.name,'application/pdf',await downloadProviderPdf(d.url));
  await preserveArtifact(service,job.id,'audit','Evidencia de firma.pdf','application/pdf',await downloadProviderPdf(snapshot.audit_log_url));
 }
 const updated=await service.rpc('fortius_apps_signature_status',{p_job:job.id,p_status:snapshot.status,p_at:snapshot.updated_at});if(updated.error)databaseError(updated.error);
 const row=await service.from(JOBS).select('*').eq('id',job.id).single();if(row.error)databaseError(row.error);return row.data as IntegrationJob;
}
function canonical(value:unknown):string {if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value&&typeof value==='object')return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>`${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`;return JSON.stringify(value);}
export async function runIntegration(slugValue:unknown,input:AppInput,contextValue:AppContext,idempotencyKey:string){
 const slug=integrationSlug.parse(slugValue),context=integrationContext.parse(contextValue);z.uuid().parse(idempotencyKey);
 const {client,user}=await requireStaff();await checkContext(client,context);
 const data=slug==='ocr'?fileInput.parse(input):slug==='consulta-documental'?questionInput.parse(input):slug==='rutas'?routeInput.parse(input):signatureInput.parse(input);
 const config=readIntegrationConfig(slug);const service=createServerClient(undefined,true);
 if('storagePath' in data&&data.storagePath){
  const stored=await readAppUpload(client,service,user.id,data.storagePath,context.expedienteId);
  if(stored.size>20*1024*1024)throw new ApiError(413,'Máximo 20 MB por archivo');data.base64=Buffer.from(await stored.arrayBuffer()).toString('base64');
 }
 if(slug==='firmas'&&'action' in data&&data.action==='status'){
  const job=await authorizedJob(client,data.jobId);if(job.slug!=='firmas')throw new ApiError(400,'Trabajo de firma requerido');await reconcileSignature(service,job);const confirmed=await authorizedJob((await requireStaff()).client,job.id);return {job:publicJob(confirmed),result:signatureResult(confirmed)};
 }
 let document:Awaited<ReturnType<typeof decodeDocument>>|undefined;
 if(slug==='ocr'&&'mimeType' in data)document=await decodeDocument(data);
 if(slug==='firmas'&&'action' in data&&data.action==='template'){
  document=await decodeDocument({fileName:data.name,mimeType:'application/pdf',base64:data.base64});
  for(const field of data.fields)for(const area of field.areas){if(area.page>document.pages)throw new ApiError(400,'La página del campo no existe');const page=document.pdf!.getPage(area.page-1);if(!page||area.x+area.w>page.getWidth()||area.y+area.h>page.getHeight())throw new ApiError(400,'Un campo de firma sale de los límites de la página');}
  if(new Set(data.fields.map(f=>f.name)).size!==data.fields.length)throw new ApiError(400,'Los campos deben tener nombres únicos');
 }
 if(slug==='firmas'&&'action' in data&&data.action==='send'){
  const found=await client.from(JOBS).select('*').eq('slug','firmas').eq('provider_kind','template').eq('provider_id',data.templateId).eq('state','completed').maybeSingle();if(found.error)databaseError(found.error);if(!found.data)throw new ApiError(403,'Plantilla no autorizada');
  const template=found.data as IntegrationJob;await checkContext(client,template.context);
  if(canonical(template.context)!==canonical(context))throw new ApiError(403,'Usa el mismo contexto de la plantilla');
  if(new Set(data.signers.map(s=>s.role)).size!==data.signers.length||template.template_roles?.length!==data.signers.length||data.signers.some(s=>!template.template_roles?.includes(s.role)))throw new ApiError(400,'Asigna exactamente un firmante a cada rol de la plantilla');
 }
 const units=slug==='ocr'?document!.pages:slug==='firmas'&&'signers' in data?data.signers.length:1;
 const cost=maximumCostCents(config,units),hash=sha256(canonical({slug,input:data,context}));
 if(cost>config.budgetCents)throw new ApiError(429,'El costo máximo supera el presupuesto mensual');
 const reserved=await service.rpc('fortius_apps_reserve',{p_owner:user.id,p_slug:slug,p_key:idempotencyKey,p_hash:hash,p_expediente:context.expedienteId??null,p_cents:cost,p_limit:config.budgetCents,p_fixed:config.fixedCents,p_buffer:config.reserveCents,p_pricing:config});if(reserved.error)databaseError(reserved.error);
 const reservation=reserved.data as {job:IntegrationJob;reused:boolean;warning?:boolean};let job=reservation.job;
 if(reservation.reused){job=await authorizedJob(client,job.id);return {job:publicJob(job),result:publicJob(job).result};}
 let contacted=false;
 try{
  await updateJob(service,job.id,{context});
  if(document)await preserveArtifact(service,job.id,'original','fileName' in data?data.fileName:'name' in data?data.name:'Documento.pdf','mimeType' in data?data.mimeType:'application/pdf',document.bytes);
  // Revalidate current staff and context after preparation and immediately before a paid call.
  const current=await requireStaff();if(current.user.id!==user.id)throw new ApiError(403,'La sesión cambió');await checkContext(current.client,context);
  await updateJob(service,job.id,{state:'running'});
  let result:AppResult;
  if(slug==='ocr'&&'mimeType' in data){
   contacted=true;const pages=await performOcr(data,document!);const saved=await service.from(PAGES).insert(pages.map(p=>({...p,job_id:job.id,file_name:data.fileName,version:1})));if(saved.error)databaseError(saved.error);
   result={title:'Texto extraído',summary:[{label:'Archivo',value:data.fileName},{label:'Páginas',value:String(pages.length)},{label:'Huella SHA-256',value:document!.hash},{label:'Trabajo',value:job.id}],sections:pages.map(p=>({title:`Página ${p.page}`,text:p.text.slice(0,10000)})),warnings:['Texto OCR pendiente de cotejo con el original. Las correcciones crean una nueva versión.',...(pages.some(p=>!p.text.trim())?['Hay páginas sin texto reconocible; revisa el original.']:[]),...(pages.some(p=>p.text.length>10000)?['La vista previa se limita a 10,000 caracteres por página; abre las páginas del trabajo para el texto completo.']:[])]};
  }else if(slug==='rutas'&&'stops' in data){contacted=true;result=await performRoute(data);}
  else if(slug==='consulta-documental'&&'question' in data){const source=await current.client.rpc('fortius_apps_search_pages',{p_query:data.question,p_expediente:context.expedienteId??null});if(source.error)databaseError(source.error);const pages=source.data as SourcePage[];contacted=Boolean(pages.length);result=await performQuestion(data,pages);}
  else if('action' in data&&data.action==='template'){
   contacted=true;const raw=await providerJson('https://api.docuseal.com/templates/pdf',{method:'POST',headers:{'X-Auth-Token':process.env.DOCUSEAL_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({name:data.name,external_id:job.id,shared_link:false,documents:[{name:data.name,file:data.base64,fields:data.fields}]})});const template=z.object({id:z.number().int().positive()}).parse(raw);
   await updateJob(service,job.id,{provider_id:template.id,provider_kind:'template',template_roles:[...new Set(data.fields.map(f=>f.role))]});
   result={title:'Documento preparado para firma',summary:[{label:'Plantilla',value:String(template.id)},{label:'Trabajo',value:job.id},{label:'Roles',value:[...new Set(data.fields.map(f=>f.role))].join(', ')}],warnings:['Documento preparado. Revisa los campos y asigna los firmantes antes de enviar.']};
  }else if('action' in data&&data.action==='send'){
   contacted=true;const raw=await providerJson('https://api.docuseal.com/submissions',{method:'POST',headers:{'X-Auth-Token':process.env.DOCUSEAL_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({template_id:data.templateId,send_email:true,send_sms:false,order:'preserved',submitters:data.signers.map((s,i)=>({name:s.name,email:s.email,role:s.role,external_id:`${job.id}:${i}`,metadata:{fortius_job_id:job.id},fields:s.fields?.map(f=>({name:f.name,default_value:f.defaultValue,required:f.required}))}))})});
   const submissions=z.array(z.object({submission_id:z.number().int().positive()})).min(1).parse(raw);const id=submissions[0].submission_id;if(submissions.some(s=>s.submission_id!==id))throw new ApiError(502,'Identificadores de firma incongruentes');const bound=await service.rpc('fortius_apps_signature_bind',{p_job:job.id,p_provider:id});if(bound.error)databaseError(bound.error);job=bound.data as IntegrationJob;result=signatureResult(job);
  }else throw new ApiError(400,'Acción inválida');
  if(reservation.warning)result.warnings=[...(result.warnings??[]),'El consumo comprometido alcanzó el 80% del presupuesto mensual.'];
  // Charge the configured upper bound; no automatic refunds after ambiguous provider outcomes.
  await updateJob(service,job.id,{state:'completed',...('action' in data&&data.action==='send'?{}:{charged_cents:contacted?cost:0,settled_at:new Date().toISOString()}),result});
  const allowed=await authorizedJob((await requireStaff()).client,job.id);return {job:publicJob(allowed),result:publicJob(allowed).result};
 }catch(error){
  await updateJob(service,job.id,{state:contacted?'reconciliation':'cancelled',...(contacted?{}:{charged_cents:0}),error_message:contacted?'Respuesta pendiente de conciliación; no se repetirá el envío automáticamente.':'La preparación no llegó a contactar al proveedor.'});
  throw new ApiError(error instanceof ApiError?error.status:502,`No se completó el trabajo ${job.id}. ${contacted?'Consulta su estado antes de iniciar otro intento.':'Revisa los datos y la configuración.'}`);
 }
}
export async function executeIntegration(slug:IntegrationSlug,input:AppInput,context:AppContext):Promise<AppResult>{const {result}=await runIntegration(slug,input,context,randomUUID());if(!result)throw new ApiError(409,'El trabajo todavía no tiene resultado');return result;}
export async function getIntegrationJob(id:string){const {client}=await requireStaff();let job=await authorizedJob(client,id);if(['running','reserved'].includes(job.state)&&Date.now()-Date.parse(job.created_at)>10*60000){await updateJob(createServerClient(undefined,true),id,{state:'reconciliation',error_message:'El trabajo excedió el tiempo de respuesta; conserva su reserva y requiere conciliación.'});job=await authorizedJob(client,id);}const artifacts=await client.from(ARTIFACTS).select('id,kind,name,sha256,size_bytes').eq('job_id',id);if(artifacts.error)databaseError(artifacts.error);return {job:publicJob(job),artifacts:(artifacts.data??[]).map(a=>({...a,url:`/api/admin/apps/integrations/jobs/${id}/artifacts/${a.id}`}))};}
