import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { runIntegration, JOBS } from '@/lib/apps/integrations/server';
const auth=vi.hoisted(()=>({requireStaff:vi.fn(),createServerClient:vi.fn()}));
vi.mock('@/lib/backend/auth',()=>auth);
let db:PGlite;
const owner='91000000-0000-4000-8000-000000000001',sender='91000000-0000-4000-8000-000000000002';
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;create table public.fortius_inmuebles_staff(user_id uuid primary key,role text,active boolean default true);insert into public.fortius_inmuebles_staff values ('${owner}','editor',true),('${sender}','editor',true);create table public.fortius_inmuebles_expedientes(id uuid primary key);create function public.fortius_inmuebles_is_staff() returns boolean language sql stable as $$ select exists(select 1 from public.fortius_inmuebles_staff where user_id=auth.uid() and active) $$;create function public.fortius_inmuebles_is_admin() returns boolean language sql stable as $$ select false $$;create function public.fortius_inmuebles_can_access_expediente(p_id uuid) returns boolean language sql stable as $$ select false $$;grant select on public.fortius_inmuebles_staff to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 await db.exec(await readFile(new URL('../../supabase/migrations/20261014002229_fortius_apps_integrations.sql',import.meta.url),'utf8'));
});
afterAll(async()=>{await db?.close();});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.clearAllMocks();});

// Only adapts the Supabase transport surface. Mutations and RPC logic run in real PostgreSQL.
function databaseClient(){
 const serialize=(v:unknown)=>v!==null&&typeof v==='object'?JSON.stringify(v):v;
 return {
  rpc:async(fn:string,args:Record<string,unknown>)=>{
   if(!['fortius_apps_reserve','fortius_apps_signature_bind'].includes(fn))throw new Error(`RPC inesperada: ${fn}`);
   const entries=Object.entries(args);
   try{const q=await db.query<{result:unknown}>(`select public.${fn}(${entries.map(([key],i)=>`${key}=>$${i+1}`).join(',')}) as result`,entries.map(([,v])=>serialize(v)));return {data:q.rows[0].result,error:null};}
   catch(error){return {data:null,error};}
  },
  from:(table:string)=>{
   if(table!==JOBS)throw new Error(`Tabla inesperada: ${table}`);
   const filters:[string,unknown][]=[];let mutation:Record<string,unknown>|undefined;
   const execute=async(single=false)=>{
    const entries=mutation?Object.entries(mutation):[];
    const values=[...entries.map(([,v])=>serialize(v)),...filters.map(([,v])=>serialize(v))];
    const where=filters.length?` where ${filters.map(([key],i)=>`"${key}"=$${entries.length+i+1}`).join(' and ')}`:'';
    const query=mutation?`update public.${JOBS} set ${entries.map(([key],i)=>`"${key}"=$${i+1}`).join(',')}${where} returning *`:`select * from public.${JOBS}${where}`;
    try{const q=await db.query(query,values);return {data:single?q.rows[0]??null:q.rows,error:null};}catch(error){return {data:null,error};}
   };
   const chain={select:()=>chain,eq:(key:string,value:unknown)=>{filters.push([key,value]);return chain;},update:(value:Record<string,unknown>)=>{mutation=value;return chain;},maybeSingle:()=>execute(true),single:()=>execute(true),then:(resolve:(value:unknown)=>unknown,reject?:(reason:unknown)=>unknown)=>execute().then(resolve,reject)};
   return chain;
  }
 };
}
it('el envío no revierte completed ni presenta pending si el webhook termina antes de su respuesta HTTP',async()=>{
 for(const [key,value] of Object.entries({FORTIUS_APPS_ENABLED:'true',FORTIUS_APPS_BUDGET_MXN:'2000',FORTIUS_APPS_FIXED_MONTHLY_MXN:'0',FORTIUS_APPS_RESERVE_MXN:'0',FORTIUS_APPS_USD_MXN:'20',FORTIUS_APPS_TAX_RATE:'0.16',FORTIUS_APPS_PRICE_VERIFIED_AT:'2026-10-13',FORTIUS_APPS_SIGNATURE_MAX_USD:'0.7',DOCUSEAL_API_KEY:'test',DOCUSEAL_WEBHOOK_SECRET:'test',DOCUSEAL_ARTIFACT_HOSTS:'docuseal.com'}))vi.stubEnv(key,value);
 await db.query(`insert into public.${JOBS}(owner_id,slug,idempotency_key,input_hash,reserved_cents,charged_cents,pricing,provider_kind,provider_id,template_roles,state) values($1,'firmas',gen_random_uuid(),repeat('a',64),0,0,'{}','template',101,array['Cliente'],'completed')`,[sender]);
 const client=databaseClient();auth.requireStaff.mockResolvedValue({client,user:{id:sender}});auth.createServerClient.mockReturnValue(client);
 vi.stubGlobal('fetch',vi.fn(async()=>{
  const row=(await db.query<{id:string}>(`select id from public.${JOBS} where owner_id=$1 and state='running'`,[sender])).rows[0];
  // Real writes that the authenticated webhook performs while the send response is in flight.
  await db.query(`update public.${JOBS} set provider_kind='submission',provider_id=987 where id=$1`,[row.id]);
  await db.query("select public.fortius_apps_signature_status($1,'completed','2026-10-13T18:00:00Z')",[row.id]);
  return Response.json([{submission_id:987}]);
 }));
 const result=await runIntegration('firmas',{action:'send',templateId:101,sendEmail:true,signers:[{name:'Prueba',email:'test@example.invalid',role:'Cliente'}]},{},'92000000-0000-4000-8000-000000000001');
 const row=(await db.query<{provider_status:string;charged_cents:number;reserved_cents:number;settled:boolean}>(`select provider_status,charged_cents,reserved_cents,settled_at is not null as settled from public.${JOBS} where id=$1`,[result.job.id])).rows[0];
 expect(row.provider_status).toBe('completed');expect(row.charged_cents).toBe(row.reserved_cents);expect(row.settled).toBe(true);
 expect(result.job.signatureStatus).toBe('completed');
 expect(result.result?.summary.find(s=>s.label==='Estado del proveedor')?.value).toBe('completed');
 expect(result.job.result?.summary.find(s=>s.label==='Estado del proveedor')?.value).toBe('completed');
});
it('la vinculación inicial es idempotente, conserva estado final y rechaza cambiar la solicitud',async()=>{
 const id='93000000-0000-4000-8000-000000000001';
 await db.query(`insert into public.${JOBS}(id,owner_id,slug,idempotency_key,input_hash,reserved_cents,pricing,state) values($1,$2,'firmas',gen_random_uuid(),repeat('b',64),500,'{}','running')`,[id,owner]);
 const first=await db.query<{result:{provider_status:string}}>('select public.fortius_apps_signature_bind($1,123) as result',[id]);expect(first.rows[0].result.provider_status).toBe('pending');
 await db.query("select public.fortius_apps_signature_status($1,'completed','2026-10-13T18:00:00Z')",[id]);
 const second=await db.query<{result:{provider_status:string}}>('select public.fortius_apps_signature_bind($1,123) as result',[id]);expect(second.rows[0].result.provider_status).toBe('completed');
 await expect(db.query('select public.fortius_apps_signature_bind($1,456)',[id])).rejects.toMatchObject({code:'PT409'});
 await db.exec('set role authenticated');
 try{await expect(db.query('select public.fortius_apps_signature_bind($1,123)',[id])).rejects.toMatchObject({code:'42501'});}finally{await db.exec('reset role');}
});
it('los fragmentos contienen coincidencias al inicio, medio y cola y preservan documento, versión y página',async()=>{
 const id='93000000-0000-4000-8000-000000000002';
 await db.query(`insert into public.${JOBS}(id,owner_id,slug,idempotency_key,input_hash,reserved_cents,pricing) values($1,$2,'ocr',gen_random_uuid(),repeat('c',64),0,'{}')`,[id,owner]);
 const cases=[{page:1,query:'linderos',quote:'Los linderos fueron cotejados.',text:`Los linderos fueron cotejados. ${'Relleno neutral. '.repeat(400)}`},{page:2,query:'superficie',quote:'La superficie es 200 m².',text:`${'Relleno neutral. '.repeat(200)}La superficie es 200 m². ${'Relleno neutral. '.repeat(200)}`},{page:3,query:'gravamen',quote:'Gravamen no verificado.',text:`${'Relleno neutral. '.repeat(400)}Gravamen no verificado.`}];
 for(const c of cases)await db.query('insert into public.fortius_inmuebles_integration_pages(job_id,file_name,version,page,text) values($1,$2,4,$3,$4)',[id,'Extenso.pdf',c.page,c.text]);
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 try{for(const c of cases){const result=await db.query<{id:string;job_id:string;file_name:string;version:number;page:number;text:string}>('select * from public.fortius_apps_search_pages($1,null)',[c.query]);expect(result.rows.length).toBeGreaterThan(0);expect(result.rows.some(r=>r.text.includes(c.quote))).toBe(true);for(const row of result.rows){expect(row).toMatchObject({job_id:id,file_name:'Extenso.pdf',version:4,page:c.page});expect(row.text.length).toBeLessThanOrEqual(2000);expect(c.text).toContain(row.text);}}}finally{await db.exec('reset role');}
});
it('prioriza todos los términos: terreno repetido no oculta el precio pactado de la cola',async()=>{
 const id='93000000-0000-4000-8000-000000000003';
 const quote='El precio pactado del terreno es 950000 pesos.';
 const source='Terreno: descripción inicial y antecedentes generales. '.repeat(100)+quote;
 await db.query(`insert into public.${JOBS}(id,owner_id,slug,idempotency_key,input_hash,reserved_cents,pricing) values($1,$2,'ocr',gen_random_uuid(),repeat('d',64),0,'{}')`,[id,owner]);
 await db.query('insert into public.fortius_inmuebles_integration_pages(job_id,file_name,version,page,text) values($1,$2,2,5,$3)',[id,'Precio.pdf',source]);
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 try{for(const query of ['precio','precio terreno']){
  const result=await db.query<{job_id:string;file_name:string;version:number;page:number;text:string}>('select * from public.fortius_apps_search_pages($1,null)',[query]);
  expect(result.rows[0]?.text).toContain(quote);
  for(const row of result.rows){expect(row).toMatchObject({job_id:id,file_name:'Precio.pdf',version:2,page:5});expect(source).toContain(row.text);expect(row.text.length).toBeLessThanOrEqual(2000);}
 }}finally{await db.exec('reset role');}
});
it('diversifica los fragmentos para recuperar hechos distantes sin gastar los tres en la misma zona',async()=>{
 const id='93000000-0000-4000-8000-000000000004';
 const first='El avalúo comercial del lote es 800000 pesos.';
 const last='El avalúo comercial actualizado del lote es 920000 pesos.';
 const source=first+' Antecedentes generales del lote. '.repeat(180)+last;
 await db.query(`insert into public.${JOBS}(id,owner_id,slug,idempotency_key,input_hash,reserved_cents,pricing) values($1,$2,'ocr',gen_random_uuid(),repeat('e',64),0,'{}')`,[id,owner]);
 await db.query('insert into public.fortius_inmuebles_integration_pages(job_id,file_name,version,page,text) values($1,$2,3,6,$3)',[id,'Avaluos.pdf',source]);
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 try{
  const result=await db.query<{text:string}>('select * from public.fortius_apps_search_pages($1,null)',['avalúo comercial lote']);
  expect(result.rows.some(row=>row.text.includes(first))).toBe(true);
  expect(result.rows.some(row=>row.text.includes(last))).toBe(true);
  expect(result.rows.filter(row=>row.text.includes(last))).toHaveLength(1);
  expect(result.rows.length).toBeLessThanOrEqual(3);
  for(const row of result.rows)expect(source).toContain(row.text);
 }finally{await db.exec('reset role');}
});
