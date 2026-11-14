import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { cumplirArranque } from "../helpers/arranque";

let db: PGlite;
const admin = "55000000-0000-4000-8000-000000000001";
const own = "55000000-0000-4000-8000-000000000002";
const other = "55000000-0000-4000-8000-000000000003";
const exp = "55000000-0000-4000-8000-000000000010";
async function asUser<T>(uid: string | null, action: () => Promise<T>) {
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? ""]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql") && name < "20261014033544_guided_operations.sql").sort()) {
    await db.exec(await readFile(new URL(file, dir), "utf8"));
  }
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente propio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}'),
    ('clientes','c-other','{"id":"c-other","nombre":"Cliente ajeno","telefono":"6641234567","tipo":"propietario","asesorId":"other","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('${exp}','c-own','own','EXP-OPERACION');`);

  await db.exec(`insert into public.fortius_inmuebles_records(collection,id,data) values
    ('propiedades','legacy-listed','{"slug":"legacy-listed","codigo":"LEGACY-PUB","tipo":"casa","operacion":"venta","asesorId":"own","publicada":true}'),
    ('propiedades','house-a','{"slug":"house-a","codigo":"HOUSE-A","tipo":"casa","operacion":"venta","asesorId":"own","publicada":false}'),
    ('propiedades','house-b','{"slug":"house-b","codigo":"HOUSE-B","tipo":"casa","operacion":"venta","asesorId":"own","publicada":false}');`);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f>='20261014033544_guided_operations.sql').sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
  // Estas pruebas recorren el flujo con el asesor marcando todo; que ciertas revisiones sean del
  // director (COR-23) se prueba aparte, en staff-scope-database.test.ts.
  await db.exec("alter table public.fortius_inmuebles_expedientes disable trigger fortius_02_guard_director_reviews");
});
afterAll(async () => { await db?.close(); });

const reviewKeys=['identificacion_pld','entrevista','titularidad','perfil','capacidad','privacidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion','opciones','comprador','visitas','oferta','revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo'];
const completeFlow=(): {version:number;ruta:string;estado:string;motivo:string;contraparteExterna:string;resolucion:{tipo:string;fecha:string;motivo:string;siguienteAccion:string;fechaSiguiente:string};requisitos:Record<string,Record<string,unknown>>} =>({version:1,ruta:'captacion',estado:'activa',motivo:'',contraparteExterna:'Contraparte ficticia externa. Documento de prueba v1.',resolucion:{tipo:'aceptada',fecha:'2026-10-14',motivo:'Admisión de prueba documentada',siguienteAccion:'Seguimiento de prueba',fechaSiguiente:'2030-12-31'},requisitos:Object.fromEntries(reviewKeys.map(k=>[k,{estado:'revisado',soporte:'Soporte ficticio v1 revisado para el ensayo',evidencia:{tipo:'externa',referencia:'Documento externo sintético · versión 1',fecha:'2026-10-14',responsable:'Revisor de ensayo',resultado:'Revisión dentro del alcance de prueba'},...(['factibilidad','revision_cierre'].includes(k)?{vigenteHasta:'2030-12-31'}:{})}]))});
async function fixture(flow:Record<string,unknown>=completeFlow(),slug='house-a') {
 const id=crypto.randomUUID();
 await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug,flujo) values($1,'c-own','own',$2,$3::jsonb)",[id,slug,JSON.stringify(flow)]);
 // SEG-M2: la operación completa ya tiene 02 y 04 emitidos y el checklist completo.
 await cumplirArranque(db,id,own);
 const task={id:'next-'+id,titulo:'Siguiente acción ficticia',categoria:'documentacion',estado:'pendiente',prioridad:'normal',pasos:[],asesorId:'own',clienteId:'c-own',propiedadSlug:slug,expedienteId:id,vence:'2030-12-31'};
 await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)",[task.id,JSON.stringify(task)]);
 return {id,task};
}
async function update(id:string,stage:string,flow:Record<string,unknown>|null=null,slug?:string) {
 const version=(await db.query<{version:number}>('select version from public.fortius_inmuebles_expedientes where id=$1',[id])).rows[0].version;
 return (await db.query<{r:Record<string,unknown>}>("select public.fortius_inmuebles_update_operation($1,$2,$3,null,'{}'::jsonb,$4::jsonb,$5,$6) r",[id,version,stage,flow?JSON.stringify(flow):null,slug??null,slug!==undefined])).rows[0].r;
}
const flowOf=async(id:string)=>(await db.query<{flujo:{requisitos:Record<string,{estado:string;evidencia?:unknown;soporte:string}>}}>("select flujo from public.fortius_inmuebles_expedientes where id=$1",[id])).rows[0].flujo;
async function clientFile(id:string){
 const file=crypto.randomUUID();
 await db.exec('reset role');
 await db.query("insert into public.fortius_inmuebles_expediente_archivos(id,expediente_id,titulo,nombre_original,mime,byte_length,sha256,path,uploaded_by) values($1,$2,'Contrato ficticio firmado','contrato.pdf','application/pdf',1000,$3,$4,$5)",[file,id,'a'.repeat(64),`${id}/cliente/${file}.pdf`,own]);
 await db.exec('set role authenticated');
 return file;
}
const signature=(archivo:string,patch:Record<string,unknown>={})=>({tipo:'intermediacion',fecha:'2026-11-10',firmantes:[{nombre:'Cliente propio',parte:'propietario'},{nombre:'Ana',parte:'fortius'}],archivo,completa:true,revisada:false,...patch});
async function asAdmin<T>(action:()=>Promise<T>){
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);
 try{return await action();}finally{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[own]);}
}
/** COR-10: el asesor registra la firma del contrato y el director la marca revisada. */
async function sign(id:string,stage:string){
 const firma=signature(await clientFile(id));
 await update(id,stage,{...completeFlow(),firmaContrato:firma});
 return asAdmin(()=>update(id,stage,{...completeFlow(),firmaContrato:{...firma,revisada:true}}));
}
async function draft(id:string,formato:string){
 const d=crypto.randomUUID();
 await db.query("insert into public.fortius_inmuebles_formato_drafts(id,expediente_id,formato_id,data) values($1,$2,$3,'{}')",[d,id,formato]);
 return d;
}
/** Como la ruta de emisión: la inserta el servidor con la cuenta de servicio, sin sesión de usuario. */
async function emit(id:string,d:string){
 const m=crypto.randomUUID();
 await db.exec('reset role');
 const sub=(await db.query<{s:string}>("select current_setting('request.jwt.claim.sub',true) s")).rows[0].s;
 await db.query("select set_config('request.jwt.claim.sub','',false)");await db.exec('set role service_role');
 try{
 const version=(await db.query<{v:number}>('select version v from public.fortius_inmuebles_formato_drafts where id=$1',[d])).rows[0].v;
 await db.query("insert into public.fortius_inmuebles_formato_emissions(id,draft_id,draft_version,snapshot,sha256,path,created_by) values($1,$2,$3,'{}',$4,$5,$6)",[m,d,version,'a'.repeat(64),`${id}/${m}.pdf`,own]);
  return {m,version};
 }finally{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[sub??'']);}
}
const bump=(d:string)=>db.query("update public.fortius_inmuebles_formato_drafts set version=version+1,data='{\"cambio\":true}' where id=$1",[d]);
const byEmission=(e:{m:string;version:number})=>({estado:'revisado',soporte:'Oferta revisada con el comprador',evidencia:{tipo:'emision',referencia:e.m,version:e.version}});

/*
  Metodología M-07 (decisión del titular, 14/11/2026): si se emite una versión nueva del documento
  que respalda una revisión (otra versión del mismo borrador u otro borrador del mismo formato en la
  operación), esa revisión vuelve a «Lo tengo» hasta revisar la nueva. Así nadie firma con
  condiciones viejas, por ejemplo una oferta que cambió de crédito bancario a Infonavit.
*/
it('sends a review back to «Lo tengo» when a newer version of its document is issued',async()=>{
 const {id}=await asUser(own,()=>fixture());
 const d=await draft(id,'14');const first=await emit(id,d);
 await asUser(own,()=>update(id,'captacion',{...completeFlow(),requisitos:{...completeFlow().requisitos,oferta:byEmission(first)}}));
 expect((await flowOf(id)).requisitos.oferta.estado).toBe('revisado');
 // Volver a emitir la misma versión no cambia nada.
 await emit(id,d);
 expect((await flowOf(id)).requisitos.oferta.estado).toBe('revisado');
 // Otro formato tampoco.
 await emit(id,await draft(id,'15'));
 expect((await flowOf(id)).requisitos.oferta.estado).toBe('revisado');
 // Una versión nueva de la oferta sí.
 await bump(d);await emit(id,d);
 const flujo=await flowOf(id);
 expect(flujo.requisitos.oferta.estado).toBe('recibido');
 expect(flujo.requisitos.oferta.evidencia).toBeUndefined();
 expect(flujo.requisitos.titularidad.estado).toBe('revisado');
 const nota=(await db.query<{d:string}>("select descripcion d from public.fortius_inmuebles_expediente_actividad where expediente_id=$1 and tipo='nota' order by created_at desc limit 1",[id])).rows[0]?.d;
 expect(nota).toMatch(/versión nueva/);
});
it('also counts a new draft of the same document in the operation',async()=>{
 const {id}=await asUser(own,()=>fixture());
 const first=await emit(id,await draft(id,'14'));
 await asUser(own,()=>update(id,'captacion',{...completeFlow(),requisitos:{...completeFlow().requisitos,oferta:byEmission(first)}}));
 await emit(id,await draft(id,'14'));
 expect((await flowOf(id)).requisitos.oferta.estado).toBe('recibido');
});
it('still issues the document when the operation is already closing, and keeps the stage',async()=>{
 const {id}=await asUser(own,()=>fixture());
 const d=await draft(id,'14');const first=await emit(id,d);
 await asUser(own,async()=>{
  const conOferta=()=>({...completeFlow(),requisitos:{...completeFlow().requisitos,oferta:byEmission(first)}});
  await update(id,'documentacion',conOferta());await sign(id,'documentacion');
  const firmaContrato=(await db.query<{f:unknown}>("select flujo->'firmaContrato' f from public.fortius_inmuebles_expedientes where id=$1",[id])).rows[0].f;
  await update(id,'comercializacion',{...conOferta(),firmaContrato});await update(id,'negociacion');await update(id,'cierre');
 });
 await bump(d);
 await emit(id,d);
 const row=(await db.query<{etapa:string;flujo:{requisitos:Record<string,{estado:string}>}}>('select etapa,flujo from public.fortius_inmuebles_expedientes where id=$1',[id])).rows[0];
 expect(row.etapa).toBe('cierre');
 expect(row.flujo.requisitos.oferta.estado).toBe('recibido');
});
it('ignores a new issue of an older draft of the same document',async()=>{
 const {id}=await asUser(own,()=>fixture());
 const older=await draft(id,'14');await emit(id,older);
 const newer=await emit(id,await draft(id,'14'));
 await asUser(own,()=>update(id,'captacion',{...completeFlow(),requisitos:{...completeFlow().requisitos,oferta:byEmission(newer)}}));
 await bump(older);await emit(id,older);
 expect((await flowOf(id)).requisitos.oferta.estado).toBe('revisado');
});
