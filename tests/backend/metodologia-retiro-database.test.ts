import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { cumplirArranque } from "../helpers/arranque";

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
  // Estas pruebas recorren el flujo con el asesor marcando todo; que ciertas revisiones sean del
  // director (COR-23) se prueba aparte, en staff-scope-database.test.ts.
  await db.exec("alter table public.fortius_inmuebles_expedientes disable trigger fortius_02_guard_director_reviews");
});
afterAll(async () => { await db?.close(); });

const reviewKeys=['entrevista','titularidad','perfil','capacidad','privacidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion','opciones','comprador','visitas','oferta','revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo'];
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
const listing=(slug:string,extra:Record<string,unknown>={})=>({slug,codigo:slug.toUpperCase(),titulo:'Casa ficticia de ensayo',tipo:'casa',operacion:'venta',precio:{modalidad:'consulta'},zona:'Prueba',direccionAproximada:'Prueba',descripcion:['Prueba'],ficha:{},amenidades:[],galeria:[{src:'/hero/casa-playa.webp',alt:'Prueba'}],asesorId:'own',creditoDisponible:false,puntosDeInteres:[],destacada:false,estado:'disponible',publicadaEl:'2026-10-13',demo:true,publicada:true,...extra});
async function putListing(slug:string,data:Record<string,unknown>){
 const version=(await db.query<{version:number}>("select version from public.fortius_inmuebles_records where collection='propiedades' and id=$1",[slug])).rows[0]?.version??null;
 return db.query("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3)",[slug,JSON.stringify(data),version]);
}
/** Cambia de usuario sin salir del rol `authenticated`. */
const actAs=(uid:string)=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
const published=async(slug:string)=>(await db.query<{p:boolean}>("select (data->>'publicada')::boolean p from public.fortius_inmuebles_records where collection='propiedades' and id=$1",[slug])).rows[0].p;

/*
  Metodología (M-01, M-02): el inmueble publicado sale del sitio cuando la captación deja de
  autorizarlo. Ya pasaba al pausar, descartar o retirar una revisión; faltaba cuando el contrato de
  intermediación termina o se corrige (vuelve a «por revisar») y cuando la operación se regresa a
  una etapa anterior a la publicación.
*/
const flowOf=async(id:string)=>(await db.query<{flujo:{firmaContrato:Record<string,unknown>}&Record<string,unknown>}>("select flujo from public.fortius_inmuebles_expedientes where id=$1",[id])).rows[0].flujo;
async function publishedOperation(slug:string){
 await db.exec('reset role');
 await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values('propiedades',$1,$2::jsonb)",[slug,JSON.stringify({slug,codigo:slug.toUpperCase(),tipo:'casa',operacion:'venta',asesorId:'own',publicada:false})]);
 await db.exec('set role authenticated');
 const f=await fixture(completeFlow(),slug);
 await update(f.id,'documentacion');await sign(f.id,'documentacion');await update(f.id,'comercializacion');
 await actAs(admin);await putListing(slug,listing(slug));await actAs(own);
 await update(f.id,'negociacion');
 expect(await published(slug)).toBe(true);
 return f.id;
}
it('withdraws the listing when the intermediation contract ends (M-01)',async()=>{
 await asUser(own,async()=>{
  const id=await publishedOperation('m01-terminado');
  const flujo=await flowOf(id);
  await update(id,'negociacion',{...flujo,firmaContrato:{...flujo.firmaContrato,terminacion:{fecha:'2026-11-13',motivo:'El propietario revocó la intermediación'}}});
  expect(await published('m01-terminado')).toBe(false);
 });
});
it('withdraws the listing when the signed contract is corrected and awaits review again (M-01)',async()=>{
 await asUser(own,async()=>{
  const id=await publishedOperation('m01-corregido');
  const flujo=await flowOf(id);
  await update(id,'negociacion',{...flujo,firmaContrato:{...flujo.firmaContrato,fecha:'2026-11-11'}});
  expect((await flowOf(id)).firmaContrato.revisada).toBe(false);
  expect(await published('m01-corregido')).toBe(false);
 });
});
it('withdraws the listing when the operation goes back before publication (M-02)',async()=>{
 await asUser(own,async()=>{
  const id=await publishedOperation('m02-retroceso');
  await update(id,'documentacion',{...(await flowOf(id)),motivo:'Corregir el precio con el propietario'});
  expect(await published('m02-retroceso')).toBe(false);
 });
});
it('keeps the listing when the operation moves between publication stages (M-02)',async()=>{
 await asUser(own,async()=>{
  const id=await publishedOperation('m02-sigue');
  await update(id,'comercializacion',{...(await flowOf(id)),motivo:'La oferta se cayó; seguimos promoviendo'});
  expect(await published('m02-sigue')).toBe(true);
 });
});
