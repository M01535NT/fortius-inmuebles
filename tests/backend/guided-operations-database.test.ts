import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

let db: PGlite;
const admin = "52000000-0000-4000-8000-000000000001";
const own = "52000000-0000-4000-8000-000000000002";
const other = "52000000-0000-4000-8000-000000000003";
const exp = "52000000-0000-4000-8000-000000000010";
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
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql") && !name.endsWith("_guided_operations.sql") && !name.endsWith("_operational_interviews.sql")).sort()) {
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
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('_guided_operations.sql')||f.endsWith('_operational_interviews.sql')))await db.exec(await readFile(new URL(file,dir),'utf8'));
});
afterAll(async () => { await db?.close(); });


it('blocks a sale-stage jump even when a client writes directly to PostgreSQL', async () => {
 await asUser(own, async () => {
  await expect(db.query("update public.fortius_inmuebles_expedientes set etapa='comercializacion',version=version+1 where id=$1",[exp])).rejects.toMatchObject({code:'PT409'});
 });
});
it('rejects publication of a new sale listing without a reviewed linked capture operation', async () => {
 const p={slug:'guided-private',codigo:'GUIDE-1',titulo:'Prueba ficticia privada',tipo:'casa',operacion:'venta',precio:{modalidad:'consulta'},zona:'Prueba',direccionAproximada:'Prueba',descripcion:['Prueba'],ficha:{},amenidades:[],galeria:[{src:'/hero/casa-playa.webp',alt:'Prueba'}],asesorId:'own',creditoDisponible:false,puntosDeInteres:[],destacada:false,estado:'disponible',publicadaEl:'2026-10-13',demo:true,publicada:true};
 await asUser(own, async () => {
  await expect(db.query("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,null)",[p.slug,JSON.stringify(p)])).rejects.toMatchObject({code:'PT409'});
 });
});

it('prevents bypassing sale controls by switching operation type and stage', async()=>{
 await asUser(own,async()=>{
  await expect(db.query("update public.fortius_inmuebles_expedientes set operacion='renta',etapa='cerrado',version=version+1 where id=$1",[exp])).rejects.toMatchObject({code:'PT409'});
 });
});

const reviewKeys=['entrevista','titularidad','perfil','capacidad','privacidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion','opciones','comprador','visitas','oferta','revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo'];
const completeFlow=(): {version:number;ruta:string;estado:string;motivo:string;contraparteExterna:string;requisitos:Record<string,Record<string,string>>} =>({version:1,ruta:'captacion',estado:'activa',motivo:'',contraparteExterna:'Contraparte ficticia externa. Documento de prueba v1.',requisitos:Object.fromEntries(reviewKeys.map(k=>[k,{estado:'revisado',soporte:'Soporte ficticio v1 revisado para el ensayo',...(['factibilidad','revision_cierre'].includes(k)?{vigenteHasta:'2030-12-31'}:{})}]))});
async function fixture(flow:Record<string,unknown>=completeFlow(),slug='house-a') {
 const id=crypto.randomUUID();
 await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug,flujo) values($1,'c-own','own',$2,$3::jsonb)",[id,slug,JSON.stringify(flow)]);
 const task={id:'next-'+id,titulo:'Siguiente acción ficticia',categoria:'documentacion',estado:'pendiente',prioridad:'normal',pasos:[],asesorId:'own',clienteId:'c-own',propiedadSlug:slug,expedienteId:id,vence:'2030-12-31'};
 await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)",[task.id,JSON.stringify(task)]);
 return {id,task};
}
async function update(id:string,stage:string,flow:Record<string,unknown>|null=null,slug?:string) {
 const version=(await db.query<{version:number}>('select version from public.fortius_inmuebles_expedientes where id=$1',[id])).rows[0].version;
 return (await db.query<{r:Record<string,unknown>}>("select public.fortius_inmuebles_update_operation($1,$2,$3,null,'{}'::jsonb,$4::jsonb,$5,$6) r",[id,version,stage,flow?JSON.stringify(flow):null,slug??null,slug!==undefined])).rows[0].r;
}
it('walks signature/payment, delivery and post-sale separately and archives without inventing an action',async()=>{
 await asUser(own,async()=>{
  const f=await fixture();for(const stage of ['documentacion','comercializacion','negociacion','cierre','entrega','postventa'])expect((await update(f.id,stage)).etapa).toBe(stage);
  await expect(update(f.id,'cerrado')).rejects.toMatchObject({code:'PT409'});
  await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,1)",[f.task.id,JSON.stringify({...f.task,estado:'completada'})]);
  expect((await update(f.id,'cerrado')).etapa).toBe('cerrado');
 });
});
it('does not treat received documents as reviewed evidence and requires an assigned dated action',async()=>{
 await asUser(own,async()=>{
  const flow=completeFlow();flow.requisitos.entrevista.estado='recibido';const f=await fixture(flow);
  await expect(update(f.id,'documentacion')).rejects.toMatchObject({code:'PT409'});
  await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,1)",[f.task.id,JSON.stringify({...f.task,vence:''})]);
  await expect(update(f.id,'documentacion',completeFlow())).rejects.toMatchObject({code:'PT409'});
 });
});
it('rejects expired feasibility before commercialization and expired closing review before signing',async()=>{
 await asUser(own,async()=>{
  const flow=completeFlow();flow.requisitos.factibilidad.vigenteHasta='2020-01-01';const f=await fixture(flow);
  await update(f.id,'documentacion');await expect(update(f.id,'comercializacion')).rejects.toMatchObject({code:'PT409'});
  await update(f.id,'comercializacion',completeFlow());await update(f.id,'negociacion');
  const expired=completeFlow();expired.requisitos.revision_cierre.vigenteHasta='2020-01-01';await expect(update(f.id,'cierre',expired)).rejects.toMatchObject({code:'PT409'});
 });
});
it('reconciles task context and reserves prior review evidence and version history when the property changes',async()=>{
 await asUser(own,async()=>{
  const f=await fixture();const changed=await update(f.id,'captacion',completeFlow(),'house-b');
  expect((changed.flujo as ReturnType<typeof completeFlow>).requisitos.entrevista.estado).toBe('recibido');
  const task=(await db.query<{data:{propiedadSlug:string};version:number}>("select data,version from public.fortius_inmuebles_records where collection='tareas' and id=$1",[f.task.id])).rows[0];
  expect(task).toMatchObject({data:{propiedadSlug:'house-b'},version:2});
  const history=(await db.query<{detalle:{anterior:{propiedad_slug:string;flujo:ReturnType<typeof completeFlow>}}}>('select detalle from public.fortius_inmuebles_expediente_actividad where expediente_id=$1 order by created_at desc',[f.id])).rows[0];
  expect(history.detalle.anterior.propiedad_slug).toBe('house-a');expect(history.detalle.anterior.flujo.requisitos.entrevista.estado).toBe('revisado');
 });
});
it('adopts an incomplete guide without silently withdrawing a historical publication',async()=>{
 await asUser(own,async()=>{
  const id=crypto.randomUUID();await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug) values($1,'c-own','own','legacy-listed')",[id]);
  await update(id,'captacion',{version:1,ruta:'captacion',estado:'activa',motivo:'',requisitos:{}});
  expect((await db.query<{p:boolean}>("select (data->>'publicada')::boolean p from public.fortius_inmuebles_records where collection='propiedades' and id='legacy-listed'")).rows[0].p).toBe(true);
 });
});
it('replaces a supplied recording actor with the authenticated user and does not drop existing observations',async()=>{
 await asUser(own,async()=>{
  const flow=completeFlow();flow.requisitos.entrevista.registradoPor=other;const f=await fixture(flow);
  const saved=(await db.query<{flujo:{requisitos:{entrevista:{registradoPor:string}}}}>('select flujo from public.fortius_inmuebles_expedientes where id=$1',[f.id])).rows[0].flujo;
  expect(saved.requisitos.entrevista.registradoPor).toBe(own);
  const observed=completeFlow();observed.requisitos.archivo.estado='observado';await update(f.id,'captacion',observed);
  await update(f.id,'captacion',{version:1,ruta:'captacion',estado:'activa',motivo:'',requisitos:{}});
  await expect(update(f.id,'documentacion')).rejects.toMatchObject({code:'PT409'});
 });
});
it.each([{version:'1'},{motivo:123},{contraparteExterna:123},{estado:true}])('rejects direct guide data incompatible with the visible schema: %j',async(patch)=>{
 await asUser(own,async()=>{const f=await fixture();await expect(update(f.id,'captacion',{...completeFlow(),...patch})).rejects.toMatchObject({code:'PT400'});});
});
