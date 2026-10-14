import 'server-only';
import { z } from 'zod';
import { createServerClient,requireStaff } from '@/lib/backend/auth';
import { ApiError,databaseError } from '@/lib/backend/http';
import { authorizedJob,ARTIFACTS,JOBS,PAGES,reconcileSignature } from './server';
import { readIntegrationConfig,verifyWebhook } from './core';
import { sha256 } from './providers';

export async function handleSignatureWebhook(raw:Uint8Array,signature:string|null){
 readIntegrationConfig('firmas');const secret=process.env.DOCUSEAL_WEBHOOK_SECRET!;
 if(!verifyWebhook(raw,signature,secret))throw new ApiError(401,'Firma de evento inválida o vencida');
 let input:unknown;try{input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}catch{throw new ApiError(400,'Evento inválido');}
 const event=z.object({event_type:z.string(),timestamp:z.iso.datetime({offset:true}),data:z.object({id:z.number().int().positive(),submitters:z.array(z.object({external_id:z.string().nullable().optional()})).optional()})}).parse(input);
 if(!event.event_type.startsWith('submission.'))return {ok:true,ignored:true};
 const service=createServerClient(undefined,true);let row=await service.from(JOBS).select('*').eq('provider_kind','submission').eq('provider_id',event.data.id).maybeSingle();if(row.error)databaseError(row.error);
 // A signed callback can reconcile the accepted request whose HTTP response was lost.
 if(!row.data){const externalIds=event.data.submitters?.map(s=>s.external_id)??[];const ids=externalIds.map(v=>/^([a-f0-9-]{36}):\d+$/.exec(v??'')?.[1]);const jobId=ids[0];if(!jobId||ids.some(id=>id!==jobId))throw new ApiError(409,'Solicitud aún no vinculada; el proveedor debe reintentar');z.uuid().parse(jobId);
  const update=await service.from(JOBS).update({provider_kind:'submission',provider_id:event.data.id}).eq('id',jobId).eq('slug','firmas').is('provider_id',null).in('state',['running','reconciliation']).select('*').maybeSingle();if(update.error)databaseError(update.error);row=update;
 }
 if(!row.data)throw new ApiError(409,'Solicitud aún no vinculada; el proveedor debe reintentar');
 const hash=sha256(raw);const recorded=await service.from('fortius_inmuebles_signature_events').upsert({hash,job_id:row.data.id,event_type:event.event_type,event_at:event.timestamp},{onConflict:'hash',ignoreDuplicates:true});if(recorded.error)databaseError(recorded.error);
 const existing=await service.from('fortius_inmuebles_signature_events').select('processed_at').eq('hash',hash).single();if(existing.error)databaseError(existing.error);if(existing.data.processed_at)return {ok:true,replayed:true};
 // Never consume status, document URLs or signed bytes from the webhook payload itself.
 await reconcileSignature(service,row.data);
 const done=await service.from('fortius_inmuebles_signature_events').update({processed_at:new Date().toISOString()}).eq('hash',hash);if(done.error)databaseError(done.error);return {ok:true};
}
export async function getOcrPages(id:string,offset=0){z.number().int().min(0).max(100).parse(offset);const {client}=await requireStaff();const job=await authorizedJob(client,id);if(job.slug!=='ocr')throw new ApiError(400,'Trabajo OCR requerido');const rows=await client.from(PAGES).select('id,file_name,version,page,text,corrected').eq('job_id',id).order('version',{ascending:false}).order('page');if(rows.error)databaseError(rows.error);const version=rows.data?.[0]?.version??0;const pages=(rows.data??[]).filter(p=>p.version===version);return {version,pages:pages.slice(offset,offset+10),pageCount:pages.length,nextOffset:offset+10<pages.length?offset+10:null};}
export async function correctOcrPages(id:string,input:unknown){
 const data=z.object({version:z.number().int().positive(),pages:z.array(z.object({page:z.number().int().min(1).max(100),text:z.string().max(100000)}).strict()).min(1).max(100)}).strict().parse(input);
 const {client}=await requireStaff();const job=await authorizedJob(client,id);if(job.slug!=='ocr')throw new ApiError(400,'Trabajo OCR requerido');
 const updated=await createServerClient(undefined,true).rpc('fortius_apps_correct_pages',{p_job:id,p_version:data.version,p_pages:data.pages});if(updated.error)databaseError(updated.error);return getOcrPages(id);
}
export async function downloadIntegrationArtifact(jobId:string,artifactId:string){
 z.uuid().parse(artifactId);const {client}=await requireStaff();await authorizedJob(client,jobId);
 const artifact=await client.from(ARTIFACTS).select('*').eq('id',artifactId).eq('job_id',jobId).maybeSingle();if(artifact.error)databaseError(artifact.error);if(!artifact.data)throw new ApiError(404,'Archivo no disponible');
 const a=artifact.data;await authorizedJob((await requireStaff()).client,jobId);
 const signed=await createServerClient(undefined,true).storage.from('fortius-app-integrations').createSignedUrl(a.storage_path,60,{download:a.name});if(signed.error)databaseError(signed.error);
 return new Response(null,{status:302,headers:{Location:signed.data.signedUrl,'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
}
