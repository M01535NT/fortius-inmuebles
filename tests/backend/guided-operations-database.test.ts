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
const completeFlow=(): {version:number;ruta:string;estado:string;motivo:string;contraparteExterna:string;resolucion:{tipo:string;fecha:string;motivo:string;siguienteAccion:string;fechaSiguiente:string};requisitos:Record<string,Record<string,unknown>>} =>({version:1,ruta:'captacion',estado:'activa',motivo:'',contraparteExterna:'Contraparte ficticia externa. Documento de prueba v1.',resolucion:{tipo:'aceptada',fecha:'2026-10-14',motivo:'Admisión de prueba documentada',siguienteAccion:'Seguimiento de prueba',fechaSiguiente:'2030-12-31'},requisitos:Object.fromEntries(reviewKeys.map(k=>[k,{estado:'revisado',soporte:'Soporte ficticio v1 revisado para el ensayo',evidencia:{tipo:'externa',referencia:'Documento externo sintético · versión 1',fecha:'2026-10-14',responsable:'Revisor de ensayo',resultado:'Revisión dentro del alcance de prueba'},...(['factibilidad','revision_cierre'].includes(k)?{vigenteHasta:'2030-12-31'}:{})}]))});
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
/** Sube a los documentos del cliente un contrato ficticio de la operación (como superusuario de la prueba). */
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
/** COR-17: el avalúo que trae el propietario respalda el valor mientras está vigente. */
const appraisal=(archivo:string,patch:Record<string,unknown>={})=>({archivo,perito:'Perito ficticio de prueba',fecha:'2026-11-01',valor:2500000,vigenteHasta:'2030-12-31',...patch});
function appraisalFlow(file:string,avaluo:Record<string,unknown>|undefined,evidenceFile=file){
 const flow=completeFlow() as Record<string,unknown>&ReturnType<typeof completeFlow>;
 flow.requisitos.valor={estado:'revisado',soporte:'Avalúo del propietario revisado en el ensayo',evidencia:{tipo:'cliente',referencia:evidenceFile,fecha:'2026-11-01',responsable:'Ana',resultado:'Valor según avalúo de prueba'}};
 if(avaluo)flow.avaluo=avaluo;
 return flow;
}
it('accepts the owner appraisal as value evidence only while it is current (COR-17, RP-96)',async()=>{
 await asUser(own,async()=>{
  const f=await fixture();await update(f.id,'documentacion');
  const file=await clientFile(f.id);
  for(const bad of [appraisal(file,{perito:'AB'}),appraisal(file,{valor:0}),appraisal(file,{valor:'2500000'}),appraisal(file,{vigenteHasta:'2026-10-01'}),appraisal(file,{fecha:'01/11/2026'}),appraisal(file,{nota:'x'}),appraisal(crypto.randomUUID())])
   await expect(update(f.id,'documentacion',appraisalFlow(file,bad))).rejects.toMatchObject({code:'PT400'});
  // El archivo de otra operación no respalda ni el avalúo ni el requisito.
  const other=await fixture();const foreign=await clientFile(other.id);
  await expect(update(f.id,'documentacion',appraisalFlow(file,appraisal(foreign)))).rejects.toMatchObject({code:'PT400'});
  await expect(update(f.id,'documentacion',appraisalFlow(foreign,appraisal(file)))).rejects.toMatchObject({code:'PT403'});
  const saved=(await update(f.id,'documentacion',{...appraisalFlow(file,appraisal(file,{registradoPor:other.id}))})).flujo as {avaluo:Record<string,unknown>};
  expect(saved.avaluo).toMatchObject({archivo:file,valor:2500000,registradoPor:own});
  const firma=signature(await clientFile(f.id));
  await update(f.id,'documentacion',{...appraisalFlow(file,appraisal(file)),firmaContrato:firma});
  await asAdmin(()=>update(f.id,'documentacion',{...appraisalFlow(file,appraisal(file)),firmaContrato:{...firma,revisada:true}}));
  expect((await update(f.id,'comercializacion')).etapa).toBe('comercializacion');
  // Vencido, o sin el avalúo que lo respalda, el valor vuelve a faltar.
  const late=await fixture();await update(late.id,'documentacion');
  const lateFile=await clientFile(late.id),lateSign=signature(await clientFile(late.id));
  const expired=appraisalFlow(lateFile,appraisal(lateFile,{fecha:'2025-01-10',vigenteHasta:'2025-07-10'}));
  await update(late.id,'documentacion',{...expired,firmaContrato:lateSign});
  await asAdmin(()=>update(late.id,'documentacion',{...expired,firmaContrato:{...lateSign,revisada:true}}));
  await expect(update(late.id,'comercializacion')).rejects.toMatchObject({code:'PT409'});
  const withoutAppraisal=appraisalFlow(lateFile,undefined);
  await update(late.id,'documentacion',{...withoutAppraisal,firmaContrato:{...lateSign,revisada:true}});
  await expect(update(late.id,'comercializacion')).rejects.toMatchObject({code:'PT409'});
 });
});
/** COR-22: el cierre guarda quién captó y quién vendió, y el inmueble vendido sigue en el sitio como vendido. */
const listing=(slug:string,extra:Record<string,unknown>={})=>({slug,codigo:slug.toUpperCase(),titulo:'Casa ficticia de ensayo',tipo:'casa',operacion:'venta',precio:{modalidad:'consulta'},zona:'Prueba',direccionAproximada:'Prueba',descripcion:['Prueba'],ficha:{},amenidades:[],galeria:[{src:'/hero/casa-playa.webp',alt:'Prueba'}],asesorId:'own',creditoDisponible:false,puntosDeInteres:[],destacada:false,estado:'disponible',publicadaEl:'2026-10-13',demo:true,publicada:true,...extra});
async function putListing(slug:string,data:Record<string,unknown>){
 const version=(await db.query<{version:number}>("select version from public.fortius_inmuebles_records where collection='propiedades' and id=$1",[slug])).rows[0]?.version??null;
 return db.query("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3)",[slug,JSON.stringify(data),version]);
}
const published=async(slug:string)=>(await db.query<{p:boolean}>("select (data->>'publicada')::boolean p from public.fortius_inmuebles_records where collection='propiedades' and id=$1",[slug])).rows[0].p;
it('records who captured and who sold, and keeps a sold listing visible as sold (COR-22, RP-99)',async()=>{
 await db.exec(`insert into public.fortius_inmuebles_records(collection,id,data) values
  ('propiedades','house-sold','{"slug":"house-sold","codigo":"HOUSE-SOLD","tipo":"casa","operacion":"venta","asesorId":"own","publicada":false}'),
  ('propiedades','house-left','{"slug":"house-left","codigo":"HOUSE-LEFT","tipo":"casa","operacion":"venta","asesorId":"own","publicada":false}')`);
 await asUser(own,async()=>{
  const ops:Record<string,string>={};
  for(const slug of ['house-sold','house-left']){
   const f=await fixture(completeFlow(),slug);ops[slug]=f.id;
   await update(f.id,'documentacion');await sign(f.id,'documentacion');await update(f.id,'comercializacion');
   await putListing(slug,listing(slug));
   for(const stage of ['negociacion','cierre'])await update(f.id,stage);
  }
  // Asesores que no existen o registro incompleto.
  for(const bad of [{capto:'own'},{capto:'own',vendio:'nadie'},{capto:'own',vendio:'other',comisionEstimada:-1},{capto:'own',vendio:'other',nota:'x'}])
   await expect(update(ops['house-sold'],'cierre',{...completeFlow(),cierre:bad})).rejects.toMatchObject({code:'PT400'});
  const saved=(await update(ops['house-sold'],'cierre',{...completeFlow(),cierre:{capto:'own',vendio:'other',comisionEstimada:150000,fuente:'Contrato de intermediación',registradoPor:admin}})).flujo as {cierre:Record<string,unknown>};
  expect(saved.cierre).toMatchObject({capto:'own',vendio:'other',comisionEstimada:150000,registradoPor:own});
  // Vendido: al pasar a entrega sigue en el sitio. Sin marcarlo, se retira como antes.
  await putListing('house-sold',listing('house-sold',{estado:'vendida'}));
  await update(ops['house-sold'],'entrega');await update(ops['house-left'],'entrega');
  expect(await published('house-sold')).toBe(true);
  expect(await published('house-left')).toBe(false);
  // Con la operación ya cerrada se puede volver a mostrar como vendido, nunca como disponible.
  await expect(putListing('house-left',listing('house-left'))).rejects.toMatchObject({code:'PT409'});
  await putListing('house-left',listing('house-left',{estado:'vendida'}));
  expect(await published('house-left')).toBe(true);
 });
});
it('walks signature/payment, delivery and post-sale separately and archives without inventing an action',async()=>{
 await asUser(own,async()=>{
  const f=await fixture();await update(f.id,'documentacion');await sign(f.id,'documentacion');
  for(const stage of ['comercializacion','negociacion','cierre','entrega','postventa'])expect((await update(f.id,stage)).etapa).toBe(stage);
  await expect(update(f.id,'cerrado')).rejects.toMatchObject({code:'PT409'});
  await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,1)",[f.task.id,JSON.stringify({...f.task,estado:'completada'})]);
  // COR-22: sin quién captó y quién vendió no se archiva.
  await expect(update(f.id,'cerrado')).rejects.toMatchObject({code:'PT409'});
  await update(f.id,'postventa',{...completeFlow(),cierre:{capto:'own',vendio:'other'}});
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
  await update(f.id,'documentacion');await sign(f.id,'documentacion');await expect(update(f.id,'comercializacion',flow)).rejects.toMatchObject({code:'PT409'});
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

it('registers owner report deliveries in the guide and rejects malformed ones (COR-08)',async()=>{
 await asUser(own,async()=>{
  const f=await fixture();
  const entrega={fecha:'2026-10-20',canal:'whatsapp',responsable:'Ana',registradoEl:'2026-10-20T18:00:00Z'};
  const saved=await update(f.id,'documentacion',{...completeFlow(),entregasInforme:[entrega]});
  expect((saved.flujo as {entregasInforme:unknown[]}).entregasInforme).toEqual([entrega]);
  for(const bad of [[{...entrega,canal:'fax'}],[{...entrega,responsable:' '}],[{...entrega,fecha:'20/10/2026'}],[{...entrega,nota:'x'}],{fecha:'2026-10-20'}])
   await expect(update(f.id,'documentacion',{...completeFlow(),entregasInforme:bad})).rejects.toMatchObject({code:'PT400'});
 });
});

it('requires the reviewed contract signature to reach publication and keeps its record (COR-10, RP-90, RP-97)',async()=>{
 await asUser(own,async()=>{
  const f=await fixture();await update(f.id,'documentacion');
  await expect(update(f.id,'comercializacion')).rejects.toMatchObject({code:'PT409'});
  const file=await clientFile(f.id);
  // Forma inválida, archivo ajeno o inexistente, e incompleta sin decir quién falta.
  for(const bad of [{...signature(file),tipo:'otro'},{...signature(file),fecha:'10/11/2026'},{...signature(file),firmantes:[]},{...signature(file),firmantes:[{nombre:'A',parte:'propietario'}]},{...signature(file),nota:'x'},signature(crypto.randomUUID()),signature(file,{completa:false})])
   await expect(update(f.id,'documentacion',{...completeFlow(),firmaContrato:bad})).rejects.toMatchObject({code:'PT400'});
  const other=await fixture();await expect(update(other.id,'captacion',{...completeFlow(),firmaContrato:signature(file)})).rejects.toMatchObject({code:'PT400'});
  // Registrada pero incompleta: no se revisa ni se avanza.
  const partial=signature(file,{completa:false,faltan:'Falta la firma de la copropietaria'});
  const saved=(await update(f.id,'documentacion',{...completeFlow(),firmaContrato:{...partial,registradoPor:other.id,revisada:true}})).flujo as {firmaContrato:Record<string,unknown>};
  expect(saved.firmaContrato).toMatchObject({registradoPor:own,revisada:false,completa:false});
  await expect(asAdmin(()=>update(f.id,'documentacion',{...completeFlow(),firmaContrato:{...partial,revisada:true}}))).rejects.toMatchObject({code:'PT409'});
  // Completa: el asesor no la revisa; el director sí.
  const full=signature(file);await update(f.id,'documentacion',{...completeFlow(),firmaContrato:full});
  await expect(update(f.id,'documentacion',{...completeFlow(),firmaContrato:{...full,revisada:true}})).rejects.toMatchObject({code:'PT403'});
  await expect(update(f.id,'comercializacion')).rejects.toMatchObject({code:'PT409'});
  const reviewed=(await asAdmin(()=>update(f.id,'documentacion',{...completeFlow(),firmaContrato:{...full,revisada:true}}))).flujo as {firmaContrato:Record<string,unknown>};
  expect(reviewed.firmaContrato).toMatchObject({revisada:true,revisadoPor:admin});
  // Guardar la guía sin la firma no la borra; corregir la firma borra su revisión.
  expect(((await update(f.id,'documentacion',completeFlow())).flujo as {firmaContrato?:unknown}).firmaContrato).toMatchObject({revisada:true});
  const corrected=(await update(f.id,'documentacion',{...completeFlow(),firmaContrato:{...full,fecha:'2026-11-11',revisada:true}})).flujo as {firmaContrato:Record<string,unknown>};
  expect(corrected.firmaContrato).toMatchObject({fecha:'2026-11-11',revisada:false});expect(corrected.firmaContrato.revisadoPor).toBeUndefined();
  await expect(update(f.id,'comercializacion')).rejects.toMatchObject({code:'PT409'});
  await asAdmin(()=>update(f.id,'documentacion',{...completeFlow(),firmaContrato:{...full,fecha:'2026-11-11',revisada:true}}));
  expect((await update(f.id,'comercializacion')).etapa).toBe('comercializacion');
  // Un contrato terminado ya no autoriza avanzar.
  await expect(update(f.id,'comercializacion',{...completeFlow(),firmaContrato:{...full,fecha:'2026-11-11',revisada:true,terminacion:{fecha:'2026-11-12',motivo:''}}})).rejects.toMatchObject({code:'PT400'});
  const ended=(await update(f.id,'comercializacion',{...completeFlow(),firmaContrato:{...full,fecha:'2026-11-11',revisada:true,terminacion:{fecha:'2026-11-12',motivo:'Rescisión de prueba'}}})).flujo as {firmaContrato:Record<string,unknown>};
  expect(ended.firmaContrato).toMatchObject({revisada:true,terminacion:{motivo:'Rescisión de prueba'}});
  await expect(update(f.id,'negociacion')).rejects.toMatchObject({code:'PT409'});
 });
});
